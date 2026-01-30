@echo off
echo ========================================
echo Copying Premium UI Update Files
echo ========================================
echo.

cd C:\Users\Ken\.antigravity\Businessapp

echo Copying index.css...
copy /Y "C:\Users\Ken\.gemini\antigravity\scratch\biz-track-app\src\index.css" "src\index.css"

echo Copying Components...
copy /Y "C:\Users\Ken\.gemini\antigravity\scratch\biz-track-app\src\components\ProductCard.jsx" "src\components\ProductCard.jsx"
copy /Y "C:\Users\Ken\.gemini\antigravity\scratch\biz-track-app\src\components\ProductCard.css" "src\components\ProductCard.css"

echo Copying Pages...
copy /Y "C:\Users\Ken\.gemini\antigravity\scratch\biz-track-app\src\pages\Inventory.css" "src\pages\Inventory.css"
copy /Y "C:\Users\Ken\.gemini\antigravity\scratch\biz-track-app\src\pages\Expenses.jsx" "src\pages\Expenses.jsx"
copy /Y "C:\Users\Ken\.gemini\antigravity\scratch\biz-track-app\src\pages\Expenses.css" "src\pages\Expenses.css"
copy /Y "C:\Users\Ken\.gemini\antigravity\scratch\biz-track-app\src\pages\Sales.css" "src\pages\Sales.css"
copy /Y "C:\Users\Ken\.gemini\antigravity\scratch\biz-track-app\src\pages\Customers.jsx" "src\pages\Customers.jsx"
copy /Y "C:\Users\Ken\.gemini\antigravity\scratch\biz-track-app\src\pages\Customers.css" "src\pages\Customers.css"

echo.
echo ========================================
echo All UI files copied successfully!
echo ========================================
echo.
echo Next steps:
echo 1. git add .
echo 2. git commit -m "Premium UI Overhaul: Facelift for all internal pages"
echo 3. git push origin main
echo.
pause
