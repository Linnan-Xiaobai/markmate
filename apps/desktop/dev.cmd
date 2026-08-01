@echo off
chcp 65001 >nul 2>&1
title MarkMate - Development Mode

echo ============================================
echo   MarkMate - Development Mode
echo ============================================
echo.

:: Check if node_modules exists
if not exist node_modules (
    echo [WARN] node_modules not found. Running setup first...
    echo.
    call setup.cmd
    if %errorlevel% neq 0 exit /b 1
)

:: Set Electron mirror
set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
set ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/

echo [INFO] Starting Vite dev server + Electron...
echo [INFO] Press Ctrl+C to stop
echo.
echo ============================================
echo.

call npm run dev

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Dev server failed to start.
    echo.
    echo Troubleshooting:
    echo   1. Run setup.cmd to reinstall dependencies
    echo   2. Check if port 5173 is already in use
    echo   3. Try: npm cache clean --force
    echo.
    pause
    exit /b 1
)
