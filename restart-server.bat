@echo off
echo.
echo ========================================
echo   RESTARTING SBV SERVER WITH TEMPLATES
echo ========================================
echo.

REM Kill any existing Node processes
echo Stopping existing server...
taskkill /f /im node.exe >nul 2>&1

echo Waiting for cleanup...
timeout /t 2 /nobreak >nul

echo Starting server with new template routes...
npm run dev

pause