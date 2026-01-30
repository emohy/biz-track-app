# BizTrack - Sync Local to Deployed Version
# This script copies all updated files from your local development to the deployed directory

$source = "C:\Users\Ken\.gemini\antigravity\scratch\biz-track-app\src"
$dest = "C:\Users\Ken\.antigravity\Businessapp\src"

Write-Host "Syncing files from local development to deployed version..." -ForegroundColor Cyan

# Copy all pages (including Settings)
Write-Host "`nCopying pages..." -ForegroundColor Yellow
Copy-Item "$source\pages\*" -Destination "$dest\pages\" -Recurse -Force

# Copy all components (including new ones)
Write-Host "Copying components..." -ForegroundColor Yellow
Copy-Item "$source\components\*" -Destination "$dest\components\" -Recurse -Force

# Copy index.css
Write-Host "Copying index.css..." -ForegroundColor Yellow
Copy-Item "$source\index.css" -Destination "$dest\index.css" -Force

Write-Host "`n✓ All files copied successfully!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Run: cd C:\Users\Ken\.antigravity\Businessapp"
Write-Host "2. Run: git add ."
Write-Host "3. Run: git commit -m 'Sync all features from local development'"
Write-Host "4. Run: git push origin main"
Write-Host "`nVercel will automatically deploy your changes!" -ForegroundColor Green
