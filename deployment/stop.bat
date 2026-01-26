@echo off
REM ====================================================
REM  BQOM - Boutique Order Management System
REM  STOP SCRIPT (Windows)
REM ====================================================

echo.
echo ==========================================
echo   BQOM - Stopping Application
echo ==========================================
echo.

REM Change to the script directory
cd /d "%~dp0"

REM Check if Docker is running
docker info > nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not running!
    echo The application may already be stopped.
    echo.
    pause
    exit /b 1
)

echo [INFO] Stopping BQOM services...
echo.

REM Stop all services
docker compose down

if %errorlevel% equ 0 (
    echo.
    echo ==========================================
    echo   BQOM Stopped Successfully!
    echo ==========================================
    echo.
    echo   Note: Your data is safely preserved.
    echo   Run start.bat to start the application again.
    echo.
    echo ==========================================
) else (
    echo.
    echo [ERROR] Failed to stop BQOM services.
    echo Please check the error messages above.
    echo.
)

echo.
pause
