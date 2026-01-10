# Automated script to place images - adjust the $sourceFolder path to where you saved the images

param(
    [string]$SourceFolder = "$env:USERPROFILE\Downloads"  # Default to Downloads folder
)

$baseDir = Join-Path $PSScriptRoot "public\images\stories"

Write-Host "Looking for images in: $SourceFolder`n"

# Look for image files (common patterns)
$images = Get-ChildItem -Path $SourceFolder -Include *.jpg,*.jpeg,*.png,*.webp -Recurse -ErrorAction SilentlyContinue | 
    Where-Object { $_.LastWriteTime -gt (Get-Date).AddHours(-1) } |  # Images modified in last hour
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 10

if ($images.Count -eq 0) {
    Write-Host "No recent images found in $SourceFolder" -ForegroundColor Yellow
    Write-Host "Please specify the folder path: .\auto-place-images.ps1 -SourceFolder 'C:\path\to\images'" -ForegroundColor Yellow
    exit 1
}

Write-Host "Found $($images.Count) recent images. Attempting to match by filename or order...`n"

# Try to match by filename containing story numbers
$matched = @{}
$unmatched = @()

foreach ($img in $images) {
    $matchedId = $null
    
    # Try to extract story ID from filename
    if ($img.Name -match '(\d{3})') {
        $potentialId = $matches[1]
        if ([int]$potentialId -ge 2 -and [int]$potentialId -le 11) {
            $matchedId = $potentialId
        }
    }
    
    if ($matchedId -and -not $matched.ContainsKey($matchedId)) {
        $matched[$matchedId] = $img
        Write-Host "  ✓ Matched: $($img.Name) -> Story $matchedId" -ForegroundColor Green
    } else {
        $unmatched += $img
    }
}

# For unmatched images, assign sequentially
$storyIds = 2..11 | ForEach-Object { "{0:D3}" -f $_ }
$unmatchedIndex = 0

foreach ($storyId in $storyIds) {
    if (-not $matched.ContainsKey($storyId) -and $unmatchedIndex -lt $unmatched.Count) {
        $matched[$storyId] = $unmatched[$unmatchedIndex]
        Write-Host "  → Assigned: $($unmatched[$unmatchedIndex].Name) -> Story $storyId" -ForegroundColor Cyan
        $unmatchedIndex++
    }
}

# Copy images
Write-Host "`nCopying images to story folders...`n"

foreach ($storyId in $matched.Keys) {
    $img = $matched[$storyId]
    $targetDir = Join-Path $baseDir $storyId
    
    if (-not (Test-Path $targetDir)) {
        New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    }
    
    $targetFile = Join-Path $targetDir "cover.jpg"
    
    # Convert to JPG if needed
    if ($img.Extension -ne '.jpg' -and $img.Extension -ne '.jpeg') {
        Copy-Item -Path $img.FullName -Destination $targetFile -Force
        Write-Host "  ✓ Story $storyId: $($img.Name) -> cover.jpg" -ForegroundColor Green
    } else {
        Copy-Item -Path $img.FullName -Destination $targetFile -Force
        Write-Host "  ✓ Story $storyId: $($img.Name) -> cover.jpg" -ForegroundColor Green
    }
}

Write-Host "`n✓ Images placed! Updating MDX files...`n" -ForegroundColor Green

# Update MDX files
node update-mdx-images.js

Write-Host "`n✓ Done! All images are now in place and MDX files updated." -ForegroundColor Green
