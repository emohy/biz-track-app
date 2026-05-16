$iconSource = "src/assets/branding/app-icon.png"
$splashSource = "src/assets/branding/splash-logo.png"

# Update Icons
Get-ChildItem -Path android/app/src/main/res -Filter "ic_launcher*.png" -Recurse | ForEach-Object {
    Write-Host "Replacing icon: $($_.FullName)"
    Copy-Item $iconSource -Destination $_.FullName -Force
}

# Update Splash Screens
Get-ChildItem -Path android/app/src/main/res -Filter "splash.png" -Recurse | ForEach-Object {
    Write-Host "Replacing splash: $($_.FullName)"
    Copy-Item $splashSource -Destination $_.FullName -Force
}

Write-Host "Native Android assets updated!"
