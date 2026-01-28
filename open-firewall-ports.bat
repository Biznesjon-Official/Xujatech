@echo off
echo Opening firewall ports for development...
echo.

netsh advfirewall firewall add rule name="Vite Dev Server" dir=in action=allow protocol=TCP localport=3002
netsh advfirewall firewall add rule name="Backend API Server" dir=in action=allow protocol=TCP localport=3006

echo.
echo Firewall ports opened successfully!
echo Frontend: http://192.168.1.8:3002
echo Backend: http://192.168.1.8:3006
echo.
pause
