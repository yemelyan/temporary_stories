# PowerShell script to download Unsplash images
# This script uses the Unsplash Source API format which works with photo slugs

$stories = @(
    @{Id='002'; Url='https://unsplash.com/photos/a-city-with-many-buildings-HdofToH0dQg'; Photographer='Julia Karnavusha'},
    @{Id='003'; Url='https://unsplash.com/photos/a-group-of-colorful-buildings-8f4RsRuR9Ww'; Photographer='Zhu Yunxiao'},
    @{Id='004'; Url='https://unsplash.com/photos/historic-italian-piazza-with-tall-brick-tower-and-buildings-pXUgFj6DFA0'; Photographer='Cyril @cyrilczl'},
    @{Id='005'; Url='https://unsplash.com/photos/people-towards-white-building-uVsYF9OIAjo'; Photographer='Malgorzata Twardo'},
    @{Id='006'; Url='https://unsplash.com/photos/group-of-people-having-a-meeting-VBLHICVh-lI'; Photographer='Mario Gogh'},
    @{Id='007'; Url='https://unsplash.com/photos/raised-garden-beds-surround-a-gazebo-in-a-park-3Z2Z7yMlOpQ'; Photographer='Leonie Clough'},
    @{Id='008'; Url='https://unsplash.com/photos/people-walk-down-a-sunny-street-with-vintage-car-iTzCvGlOoEk'; Photographer='Noemi Szasz'},
    @{Id='009'; Url='https://unsplash.com/photos/an-outdoor-market-with-lots-of-fruits-and-vegetables-S7g1fKnojwc'; Photographer='Annie Spratt'},
    @{Id='010'; Url='https://unsplash.com/photos/a-park-with-a-bench-and-a-tree-7qX-s6JmUtU'; Photographer='Valentin Lacoste'},
    @{Id='011'; Url='https://unsplash.com/photos/green-plant-on-brown-soil-lFYObzPtisg'; Photographer='Eduardo Casajus Gorostiaga'}
)

function Extract-PhotoId {
    param([string]$Url)
    if ($Url -match '/photos/([^/?]+)') {
        return $matches[1]
    }
    return $null
}

function Download-ImageFromUnsplash {
    param(
        [string]$PhotoId,
        [string]$Destination,
        [string]$Photographer
    )
    
    Write-Host "  Photo ID: $PhotoId"
    
    # Try multiple Unsplash image URL formats
    $urls = @(
        "https://images.unsplash.com/photo-$PhotoId?w=1600&q=80&fit=crop&auto=format",
        "https://images.unsplash.com/photo-$PhotoId?w=1200&q=80&fit=crop",
        "https://source.unsplash.com/$PhotoId/1600x1200",
        "https://source.unsplash.com/$PhotoId/1200x800"
    )
    
    foreach ($imageUrl in $urls) {
        try {
            Write-Host "  Trying: $imageUrl"
            $response = Invoke-WebRequest -Uri $imageUrl -Method Get -MaximumRedirection 5 -ErrorAction Stop -UseBasicParsing
            
            if ($response.StatusCode -eq 200 -and $response.Content.Length -gt 1000) {
                # Check if it's actually an image (not HTML error page)
                $contentType = $response.Headers['Content-Type']
                if ($contentType -like 'image/*') {
                    [System.IO.File]::WriteAllBytes($Destination, $response.Content)
                    $size = (Get-Item $Destination).Length / 1KB
                    Write-Host "  [OK] Downloaded successfully ($([math]::Round($size, 1)) KB) - $Photographer" -ForegroundColor Green
                    return $true
                }
            }
        }
        catch {
            # Continue to next URL
            Write-Host "  Failed: $($_.Exception.Message)"
        }
    }
    
    return $false
}

# Create base directory
$baseDir = Join-Path $PSScriptRoot "public\images\stories"
if (-not (Test-Path $baseDir)) {
    New-Item -ItemType Directory -Path $baseDir -Force | Out-Null
}

Write-Host "`nDownloading $($stories.Count) images from Unsplash...`n"

foreach ($story in $stories) {
    Write-Host "Story $($story.Id) ($($story.Photographer)):"
    
    $storyDir = Join-Path $baseDir $story.Id
    if (-not (Test-Path $storyDir)) {
        New-Item -ItemType Directory -Path $storyDir -Force | Out-Null
    }
    
    $destination = Join-Path $storyDir "cover.jpg"
    
    # Skip if already exists and has content
    if (Test-Path $destination) {
        $file = Get-Item $destination
        if ($file.Length -gt 1000) {
            $size = $file.Length / 1KB
            Write-Host "  [SKIP] Already exists ($([math]::Round($size, 1)) KB), skipping...`n" -ForegroundColor Yellow
            continue
        }
    }
    
    $photoId = Extract-PhotoId -Url $story.Url
    if (-not $photoId) {
        Write-Host "  [ERROR] Could not extract photo ID from URL`n" -ForegroundColor Red
        continue
    }
    
    $success = Download-ImageFromUnsplash -PhotoId $photoId -Destination $destination -Photographer $story.Photographer
    
    if (-not $success) {
        Write-Host "  [ERROR] Failed to download image. You may need to download manually from: $($story.Url)`n" -ForegroundColor Red
    } else {
        Write-Host ""
    }
}

Write-Host "`nDownload complete!`n"
