@echo off
chcp 65001 >nul 2>&1
title MarkMate - Setup Dependencies

:: NOTE: apps/desktop intentionally uses npm (NOT pnpm), although the repo
:: root is a pnpm workspace. Do NOT add "@markmate/*": "workspace:*"
:: dependencies to package.json - npm cannot resolve the workspace protocol.
:: See build/README.md for details.

echo ============================================
echo   MarkMate - Dependency Setup
echo ============================================
echo.

:: Check if Node.js is installed
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed.
    echo Please download and install Node.js from https://nodejs.org/
    echo Recommended version: 18.x or 20.x LTS
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
echo [OK] Node.js version: %NODE_VER%

where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm is not available.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm -v') do set NPM_VER=%%i
echo [OK] npm version: %NPM_VER%
echo.

:: Set Electron mirror for faster downloads in China
set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
set ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/
echo [INFO] Using China mirror for Electron download
echo.

:: Check if node_modules exists
if exist node_modules (
    echo [INFO] node_modules already exists, running npm install to check updates...
) else (
    echo [INFO] Installing dependencies for the first time...
)

echo.
echo ============================================
echo   Installing dependencies...
echo ============================================
echo.

call npm install --registry=https://registry.npmmirror.com

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] npm install failed. Trying without mirror...
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo [ERROR] Dependency installation failed. Please check your network connection.
        pause
        exit /b 1
    )
)

echo.
echo ============================================
echo   Setup Complete!
echo ============================================
echo.
echo Next steps:
echo   - Double-click dev.cmd to start development mode
echo   - Double-click build.cmd to build production installer
echo.
pause
