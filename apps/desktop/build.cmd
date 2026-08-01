@echo off
chcp 65001 >nul 2>&1
title MarkMate - Build Production Installer

echo ============================================
echo   MarkMate - Production Build
echo ============================================
echo.

:: Check if node_modules exists
if not exist node_modules (
    echo [WARN] node_modules not found. Running setup first...
    echo.
    call setup.cmd
    if %errorlevel% neq 0 exit /b 1
)

:: Set mirrors for faster downloads in China
set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
set ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/

:: Use a temp directory outside the project to avoid IDE file watcher locks
set "BUILD_TEMP=%TEMP%\markmate-build-%RANDOM%"
echo [INFO] Build output (temp): %BUILD_TEMP%
echo.

:: Clean previous local release dir
echo [INFO] Cleaning previous build artifacts...
if exist dist rmdir /s /q dist
if exist dist-electron rmdir /s /q dist-electron
echo [OK] Cleaned dist/dist-electron
echo.

echo ============================================
echo   Step 1/3: Type checking
echo ============================================
call npx tsc --noEmit
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] TypeScript type checking failed.
    echo Please fix the type errors above before building.
    pause
    exit /b 1
)
echo [OK] Type checking passed
echo.

echo ============================================
echo   Step 2/3: Building renderer and electron
echo ============================================
call npx vite build
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Vite build failed.
    pause
    exit /b 1
)
echo [OK] Build completed
echo.

echo ============================================
echo   Step 3/3: Packaging with electron-builder
echo ============================================
echo [INFO] Building NSIS installer for Windows x64...
echo.

call npx electron-builder --win --x64 --config.directories.output="%BUILD_TEMP%"

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] electron-builder packaging failed.
    echo.
    echo Troubleshooting:
    echo   1. Run this script as Administrator (right-click ^> Run as administrator).
    echo   2. Enable Windows Developer Mode (Settings -^> Update ^& Security -^> For developers).
    echo   3. Temporarily disable antivirus real-time protection.
    echo   4. Close any running MarkMate instances.
    echo.
    pause
    exit /b 1
)

:: Copy results back to release directory
echo.
echo [INFO] Copying artifacts to release directory...
if exist release rmdir /s /q release
mkdir release
xcopy "%BUILD_TEMP%\*.exe" "release\" /Y /Q >nul 2>&1
xcopy "%BUILD_TEMP%\win-unpacked" "release\win-unpacked\" /E /I /Y /Q >nul 2>&1
echo [OK] Artifacts copied to release\
echo.

:: Clean temp build directory
rmdir /s /q "%BUILD_TEMP%" 2>nul

echo ============================================
echo   Build Complete!
echo ============================================
echo.
echo Installer location:
echo   %~dp0release\MarkMate-Setup-0.1.0.exe
echo.

:: Open release folder in Explorer
explorer "%~dp0release"

echo.
pause
