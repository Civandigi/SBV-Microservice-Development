@echo off
echo ========================================
echo SBV Professional V2 - Demo Server
echo ========================================
echo.
echo Starting backend server...
start /B npm run dev
echo.
echo Waiting for server to start...
timeout /t 5 /nobreak > nul
echo.
echo Opening browser...
start http://localhost:3001
echo.
echo ========================================
echo Demo server is running!
echo.
echo Test-Logins:
echo - Admin: admin@sbv-demo.ch / test123
echo - User: user@sbv-demo.ch / test123
echo.
echo Press Ctrl+C to stop the server
echo ========================================
pause