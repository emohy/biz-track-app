@echo off
echo ========================================
echo Checking Git Status
echo ========================================
echo.

cd C:\Users\Ken\.antigravity\Businessapp

echo Current directory:
cd
echo.

echo Git status:
git status
echo.

echo Last commit:
git log -1 --oneline
echo.

echo Remote URL:
git remote -v
echo.

echo ========================================
echo If you see uncommitted changes above,
echo you need to run:
echo   git add .
echo   git commit -m "Sync all features"
echo   git push origin main
echo ========================================
echo.
pause
