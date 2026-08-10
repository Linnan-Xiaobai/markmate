@echo off
chcp 65001 >nul 2>&1
title MarkMate - Build Portable Version

:: Usage: build-portable.cmd [--ci]
::   --ci    headless mode: skip pause and explorer, exit with code only
set "CI_MODE=0"
if /i "%~1"=="--ci" set "CI_MODE=1"

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

:: Read version from package.json (single source of truth)
for /f %%v in ('powershell -NoProfile -Command "(Get-Content package.json -Raw | ConvertFrom-Json).version"') do set "APP_VERSION=%%v"
if not defined APP_VERSION (
    echo [ERROR] Failed to read version from package.json
    exit /b 1
)
echo [INFO] App version: %APP_VERSION%

set "BUILD_TEMP=%TEMP%\markmate-portable-%RANDOM%%RANDOM%"
echo [INFO] Build output (temp): %BUILD_TEMP%
echo.

echo [INFO] Cleaning previous builds...
call npm run clean
if %errorlevel% neq 0 exit /b 1
echo.

echo ============================================
echo   Build: typecheck + renderer + main + portable
echo ============================================
echo.
call npm run build:portable -- --config.directories.output="%BUILD_TEMP%"

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Portable build failed.
    rmdir /s /q "%BUILD_TEMP%" 2>nul
    if "%CI_MODE%"=="0" pause
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
echo Output: %~dp0release\MarkMate-Portable-%APP_VERSION%.exe
echo.

if "%CI_MODE%"=="0" (
    explorer "%~dp0release"
    pause
)
