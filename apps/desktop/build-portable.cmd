@echo off
chcp 65001 >nul 2>&1
title MarkMate - Build Portable Version

echo ============================================
echo   MarkMate - Portable Build
echo ============================================
echo.

if not exist node_modules (
    echo [WARN] node_modules not found. Running setup first...
    call setup.cmd
    if %errorlevel% neq 0 exit /b 1
)

set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
set ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/

set "BUILD_TEMP=%TEMP%\markmate-portable-%RANDOM%"

echo [INFO] Cleaning previous builds...
if exist dist rmdir /s /q dist
if exist dist-electron rmdir /s /q dist-electron
echo [OK] Cleaned
echo.

echo [INFO] Type checking...
call npx tsc --noEmit
if %errorlevel% neq 0 (
    echo [ERROR] Type checking failed.
    pause
    exit /b 1
)
echo [OK] Type checking passed
echo.

echo [INFO] Building...
call npx vite build
if %errorlevel% neq 0 (
    echo [ERROR] Build failed.
    pause
    exit /b 1
)
echo [OK] Build completed
echo.

echo [INFO] Building portable executable...
call npx electron-builder --win portable --x64 --config.directories.output="%BUILD_TEMP%"

if %errorlevel% neq 0 (
    echo [ERROR] Portable build failed.
    pause
    exit /b 1
)

if exist release rmdir /s /q release
mkdir release
xcopy "%BUILD_TEMP%\*.exe" "release\" /Y /Q >nul 2>&1
rmdir /s /q "%BUILD_TEMP%" 2>nul

echo.
echo ============================================
echo   Portable Build Complete!
echo ============================================
echo.
echo Output: %~dp0release\
echo.
explorer "%~dp0release"
pause
