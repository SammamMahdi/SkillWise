@echo off
echo ========================================
echo SkillWise SSL Certificate Setup
echo ========================================
echo.

echo Checking if mkcert is installed...
mkcert -version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ mkcert is not installed!
    echo.
    echo Please install mkcert first:
    echo 1. Download from: https://github.com/FiloSottile/mkcert/releases
    echo 2. Or use chocolatey: choco install mkcert
    echo.
    pause
    exit /b 1
)

echo ✅ mkcert is installed
echo.

echo Installing root certificate...
mkcert -install
if %errorlevel% neq 0 (
    echo ❌ Failed to install root certificate
    pause
    exit /b 1
)

echo ✅ Root certificate installed
echo.

echo Creating SSL certificates for localhost...
mkcert localhost 127.0.0.1 ::1
if %errorlevel% neq 0 (
    echo ❌ Failed to create SSL certificates
    pause
    exit /b 1
)

echo ✅ SSL certificates created successfully!
echo.
echo Certificate files created:
echo - localhost+2.pem (certificate)
echo - localhost+2-key.pem (private key)
echo.
echo You can now start the server with: npm run dev
echo.
pause
