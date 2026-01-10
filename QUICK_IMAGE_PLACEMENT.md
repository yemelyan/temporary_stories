# Quick Image Placement Guide

Since I can see you uploaded 10 images but I cannot directly save them from the chat interface, here's the fastest way to place them:

## Option 1: Manual Placement (Fastest)

1. **Save the 10 uploaded images** to a temporary folder (e.g., `C:\temp\story-images\`)

2. **Rename them based on story titles:**
   - Story 002 (Užupis Art Incubator) → save as `002.jpg`
   - Story 003 (Property Tax Exemption) → save as `003.jpg`
   - Story 004 (Funding Transitory Uses) → save as `004.jpg`
   - Story 005 (Spółdzielnia / Cooperative) → save as `005.jpg`
   - Story 006 (ADULM) → save as `006.jpg`
   - Story 007 (Gardens of Sports Palace) → save as `007.jpg`
   - Story 008 (Borgo San Lorenzo) → save as `008.jpg`
   - Story 009 (Slatina) → save as `009.jpg`
   - Story 010 (Huecos Urbanos) → save as `010.jpg`
   - Story 011 (Temporary Urban Gardens) → save as `011.jpg`

3. **Run this PowerShell command:**
   ```powershell
   cd "C:\Users\jazep\OneDrive\Documents\temporary practices\temporary_stories"
   
   # Copy images to correct folders
   $base = "public\images\stories"
   for ($i = 2; $i -le 11; $i++) {
       $id = "{0:D3}" -f $i
       $src = "C:\temp\story-images\$id.jpg"  # Adjust path to where you saved images
       $dst = "$base\$id\cover.jpg"
       if (Test-Path $src) {
           Copy-Item $src $dst -Force
           Write-Host "Copied $id"
       }
   }
   
   # Update MDX files
   node update-mdx-images.js
   ```

## Option 2: Use Interactive Script

Run the PowerShell script that will guide you:
```powershell
cd "C:\Users\jazep\OneDrive\Documents\temporary practices\temporary_stories"
powershell -ExecutionPolicy Bypass -File "place-images.ps1"
```

## Option 3: Tell me where you saved them

If you've already saved the images somewhere, tell me the folder path and I can create a script to copy them to the correct locations automatically.

## Story Titles Reference:
- **002**: Užupis Art Incubator – Squat‑Led Revival
- **003**: Property Tax Exemption for Social Housing in Priority Neighbourhood  
- **004**: Funding Transitory Uses with Structural Funds Synergies
- **005**: Spółdzielnia / Cooperative – Warsaw's Civic Sharing Platform
- **006**: ADULM: Strategic Actor to Harmonize Public Policy
- **007**: Gardens of Sports Palace Urban Community Gardening
- **008**: Regulation for Temporary Uses in Borgo San Lorenzo, Tuscany
- **009**: Slatina Temporary Use Contracts for Public Spaces
- **010**: Huecos Urbanos (Urban Spaces)
- **011**: Temporary Urban Gardens in Las Palmas
