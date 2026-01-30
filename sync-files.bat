@echo off
echo Syncing files from local development to deployed version...
echo.

xcopy "C:\Users\Ken\.gemini\antigravity\scratch\biz-track-app\src\pages\*" "C:\Users\Ken\.antigravity\Businessapp\src\pages\" /E /Y
xcopy "C:\Users\Ken\.gemini\antigravity\scratch\biz-track-app\src\components\*" "C:\Users\Ken\.antigravity\Businessapp\src\components\" /E /Y
copy "C:\Users\Ken\.gemini\antigravity\scratch\biz-track-app\src\index.css" "C:\Users\Ken\.antigravity\Businessapp\src\index.css" /Y

echo.
echo ========================================
echo All files copied successfully!
echo ========================================
echo.
echo Next steps:
echo 1. cd C:\Users\Ken\.antigravity\Businessapp
echo 2. git add .
echo 3. git commit -m "Sync all features from local development"
echo 4. git push origin main
echo.
pause
