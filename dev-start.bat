@echo off
echo 🚀 XujaTech POS Development Environment
echo.

echo 📦 Installing dependencies...
call npm install
cd backend && call npm install
cd ../desktop && call npm install
cd ..

echo.
echo 🔧 Starting development servers...
echo.

echo Backend: http://localhost:3005
echo Frontend: http://localhost:3000
echo.

start "Backend Server" cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak >nul
start "Frontend Server" cmd /k "cd desktop && npm run dev"

echo ✅ Development servers started!
echo Backend: http://localhost:3005
echo Frontend: http://localhost:3000
pause