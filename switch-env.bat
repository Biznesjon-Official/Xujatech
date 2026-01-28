@echo off
echo 🔄 XujaTech POS Environment Switcher
echo.

if "%1"=="dev" goto :dev
if "%1"=="prod" goto :prod
if "%1"=="development" goto :dev
if "%1"=="production" goto :prod

:help
echo Usage: switch-env.bat [dev/prod]
echo.
echo Examples:
echo   switch-env.bat dev     - Switch to development
echo   switch-env.bat prod    - Switch to production
echo.
goto :end

:dev
echo 🛠️ Switching to DEVELOPMENT environment...
echo.

echo Backend .env (Development):
copy /Y backend\.env.example backend\.env.temp
(
echo # Server Configuration
echo NODE_ENV=development
echo PORT=3005
echo ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
echo.
echo # MongoDB Configuration
echo MONGODB_URI=mongodb+srv://gulsararustamova4_db_user:jS1Gb9KOZ7eNJyBB@cluster0.iomwq8y.mongodb.net/xujatech_pos_dev?retryWrites=true^&w=majority^&appName=Cluster0
echo.
echo # JWT Configuration
echo JWT_SECRET=xujatech-pos-secret-key-2024-dev
echo JWT_REFRESH_SECRET=xujatech-pos-refresh-secret-key-2024-dev
echo.
echo # Telegram Bot Configuration ^(development - optional^)
echo TELEGRAM_SELLER_BOT_TOKEN=
echo TELEGRAM_CHAT_ID=
echo TELEGRAM_CUSTOMER_BOT_TOKEN=
echo.
echo # Logging
echo LOG_LEVEL=debug
echo.
echo # File Upload
echo MAX_FILE_SIZE=10mb
echo.
echo # Rate Limiting
echo RATE_LIMIT_WINDOW_MS=60000
echo RATE_LIMIT_MAX_REQUESTS=1000
) > backend\.env

echo Desktop .env (Development):
(
echo VITE_API_URL=http://localhost:3005
echo VITE_STORE_NAME=XUJATECh Store ^(Dev^)
echo VITE_VERSION=1.0.0-dev
) > desktop\.env

echo ✅ Switched to DEVELOPMENT environment
echo 📍 Backend: http://localhost:3005
echo 📍 Frontend: http://localhost:3000
echo.
echo To start development:
echo   dev-start.bat
goto :end

:prod
echo 🚀 Switching to PRODUCTION environment...
echo.

echo Backend .env (Production):
(
echo # Server Configuration
echo NODE_ENV=production
echo PORT=3000
echo ALLOWED_ORIGINS=https://xujatech.biznesjon.uz
echo.
echo # MongoDB Configuration
echo MONGODB_URI=mongodb+srv://gulsararustamova4_db_user:jS1Gb9KOZ7eNJyBB@cluster0.iomwq8y.mongodb.net/xujatech_pos?retryWrites=true^&w=majority^&appName=Cluster0
echo.
echo # JWT Configuration
echo JWT_SECRET=xujatech-pos-secret-key-2024
echo JWT_REFRESH_SECRET=xujatech-pos-refresh-secret-key-2024
echo.
echo # Telegram Bot Configuration
echo TELEGRAM_SELLER_BOT_TOKEN=8320937316:AAFI-gAgJmmm9g-YW0yw3bRUewo3jHD6Qag
echo TELEGRAM_CHAT_ID=7306278572
echo TELEGRAM_CUSTOMER_BOT_TOKEN=8413236851:AAGxfERORlsDOuV9y9mpUlyqdcbM20uYy3c
echo.
echo # Logging
echo LOG_LEVEL=info
echo.
echo # File Upload
echo MAX_FILE_SIZE=10mb
echo.
echo # Rate Limiting
echo RATE_LIMIT_WINDOW_MS=60000
echo RATE_LIMIT_MAX_REQUESTS=100
) > backend\.env

echo Desktop .env (Production):
(
echo VITE_API_URL=https://xujatech.biznesjon.uz/api
echo VITE_STORE_NAME=XUJATECh Store
echo VITE_VERSION=1.0.0
) > desktop\.env

echo ✅ Switched to PRODUCTION environment
echo 📍 API: https://xujatech.biznesjon.uz/api
echo 📍 Frontend: https://xujatech.biznesjon.uz
echo.
echo To deploy to production:
echo   deploy-production.sh
goto :end

:end
echo.
pause