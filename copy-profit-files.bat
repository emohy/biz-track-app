@echo off
echo ========================================
echo Copying Profit Tracking Files
echo ========================================
echo.

cd C:\Users\Ken\.antigravity\Businessapp

echo Copying SalesForm.jsx...
copy /Y "C:\Users\Ken\.gemini\antigravity\scratch\biz-track-app\src\components\SalesForm.jsx" "src\components\SalesForm.jsx"

echo Copying SalesForm.css...
copy /Y "C:\Users\Ken\.gemini\antigravity\scratch\biz-track-app\src\components\SalesForm.css" "src\components\SalesForm.css"

echo Copying Sales.jsx...
copy /Y "C:\Users\Ken\.gemini\antigravity\scratch\biz-track-app\src\pages\Sales.jsx" "src\pages\Sales.jsx"

echo Copying Sales.css...
copy /Y "C:\Users\Ken\.gemini\antigravity\scratch\biz-track-app\src\pages\Sales.css" "src\pages\Sales.css"

echo Copying Dashboard.jsx...
copy /Y "C:\Users\Ken\.gemini\antigravity\scratch\biz-track-app\src\pages\Dashboard.jsx" "src\pages\Dashboard.jsx"

echo Copying Dashboard.css...
copy /Y "C:\Users\Ken\.gemini\antigravity\scratch\biz-track-app\src\pages\Dashboard.css" "src\pages\Dashboard.css"

echo.
echo ========================================
echo All files copied successfully!
echo ========================================
echo.
echo Next steps:
echo 1. git add .
echo 2. git commit -m "Add profit tracking system"
echo 3. git push origin main
echo.
pause
