@echo off
REM ====================================================
REM  BQOM - Boutique Order Management System
REM  RESTART SCRIPT (Windows)
REM ====================================================

echo.
echo ==========================================
echo   BQOM - Restarting Application
echo ==========================================
echo.

REM Change to the script directory
cd /d "%~dp0"

REM Check if Docker is running
docker info > nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not running!
    echo.
    echo Please start Docker Desktop and try again.
    echo.
    pause
    exit /b 1
)

echo [INFO] Stopping BQOM services...
docker compose down

echo.
echo [INFO] Starting BQOM services...
docker compose up -d

if %errorlevel% equ 0 (
    echo.
    echo ==========================================
    echo   BQOM Restarted Successfully!
    echo ==========================================
    echo.
    echo   Please wait 1-2 minutes for all services to be ready.
    echo.
    echo   Access the application at:
    echo   --^> http://localhost
    echo.
    echo   Backend API available at:
    echo   --^> http://localhost:8080
    echo.
    echo ==========================================
) else (
    echo.
    echo [ERROR] Failed to restart BQOM services.
    echo Please check the error messages above.
    echo.
)

echo.
pause
