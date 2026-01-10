# PowerShell script to place uploaded images into correct story folders
# Instructions: Save the 10 uploaded images to a temp folder, then run this script

# Story ID to Title mapping
$storyMapping = @{
    "002" = "Užupis Art Incubator"
    "003" = "Property Tax Exemption"
    "004" = "Funding Transitory Uses"
    "005" = "Spółdzielnia"
    "006" = "ADULM"
    "007" = "Gardens of Sports Palace"
    "008" = "Borgo San Lorenzo"
    "009" = "Slatina"
    "010" = "Huecos Urbanos"
    "011" = "Temporary Urban Gardens"
}

Write-Host "Image Placement Script`n"
Write-Host "Please provide the path to the folder containing the 10 uploaded images:"
$sourceFolder = Read-Host "Enter folder path"

if (-not (Test-Path $sourceFolder)) {
    Write-Host "Error: Folder not found!" -ForegroundColor Red
    exit 1
}

$images = Get-ChildItem -Path $sourceFolder -Filter *.jpg,*.jpeg,*.png,*.webp | Sort-Object Name

if ($images.Count -lt 10) {
    Write-Host "Warning: Found only $($images.Count) images. Expected 10." -ForegroundColor Yellow
}

Write-Host "`nFound $($images.Count) images. Please match them to stories:`n"

$baseDir = Join-Path $PSScriptRoot "public\images\stories"
$matches = @()

# Display images and let user match them
foreach ($img in $images) {
    Write-Host "Image: $($img.Name)" -ForegroundColor Cyan
    Write-Host "  Size: $([math]::Round($img.Length/1KB, 1)) KB"
    Write-Host "`nAvailable stories:"
    $storyMapping.GetEnumerator() | ForEach-Object { Write-Host "  $($_.Key): $($_.Value)" }
    
    $storyId = Read-Host "`nEnter story ID (002-011) for this image, or 'skip' to skip"
    
    if ($storyId -ne "skip" -and $storyMapping.ContainsKey($storyId)) {
        $matches += @{
            Image = $img
            StoryId = $storyId
        }
        Write-Host "  Matched to story $storyId`n" -ForegroundColor Green
    } else {
        Write-Host "  Skipped`n"
    }
}

# Copy images to correct locations
Write-Host "`nCopying images to story folders...`n"

foreach ($match in $matches) {
    $targetDir = Join-Path $baseDir $match.StoryId
    $targetFile = Join-Path $targetDir "cover.jpg"
    
    if (-not (Test-Path $targetDir)) {
        New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    }
    
    Copy-Item -Path $match.Image.FullName -Destination $targetFile -Force
    Write-Host "  ✓ Story $($match.StoryId): $($match.Image.Name) -> cover.jpg" -ForegroundColor Green
}

Write-Host "`nDone! Now run: node update-mdx-images.js" -ForegroundColor Green
