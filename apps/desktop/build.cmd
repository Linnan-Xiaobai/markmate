@echo off
chcp 65001 >nul 2>&1
title MarkMate - Build Production Installer

:: Usage: build.cmd [--ci]
::   --ci    headless mode: skip pause and explorer, exit with code only
set "CI_MODE=0"
if /i "%~1"=="--ci" set "CI_MODE=1"

echo ============================================
echo   MarkMate - Production Build (NSIS)
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

:: Read version from package.json (single source of truth)
for /f %%v in ('powershell -NoProfile -Command "(Get-Content package.json -Raw | ConvertFrom-Json).version"') do set "APP_VERSION=%%v"
if not defined APP_VERSION (
    echo [ERROR] Failed to read version from package.json
    exit /b 1
)
echo [INFO] App version: %APP_VERSION%

:: Use a temp directory outside the project to avoid IDE file watcher locks
set "BUILD_TEMP=%TEMP%\markmate-build-%RANDOM%%RANDOM%"
echo [INFO] Build output (temp): %BUILD_TEMP%
echo.

:: Clean previous build artifacts (dist/dist-electron/release/vite cache)
echo [INFO] Cleaning previous build artifacts...
call npm run clean
if %errorlevel% neq 0 exit /b 1
echo.

echo ============================================
echo   Build: typecheck + renderer + main + NSIS
echo ============================================
echo.
call npm run build:win -- --config.directories.output="%BUILD_TEMP%"

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Build failed.
    echo.
    echo Troubleshooting:
    echo   1. Run this script as Administrator ^(right-click -^> Run as administrator^).
    echo   2. Enable Windows Developer Mode ^(Settings -^> Update ^& Security -^> For developers^).
    echo   3. Temporarily disable antivirus real-time protection.
    echo   4. Close any running MarkMate instances.
    echo.
    rmdir /s /q "%BUILD_TEMP%" 2>nul
    if "%CI_MODE%"=="0" pause
    exit /b 1
)

:: Copy results back to release directory.
:: robocopy /MIR mirrors temp -> release (deletes stale files) and retries
:: locked files, which survives transient locks from antivirus/IDE indexing.
echo.
echo [INFO] Copying artifacts to release directory...
robocopy "%BUILD_TEMP%" "release" /MIR /R:3 /W:2 /NFL /NDL /NJH /NJS
if %errorlevel% geq 8 goto copy_failed
goto copy_done

:copy_failed
echo.
echo [ERROR] Copying artifacts failed ^(robocopy exit code %errorlevel%^).
echo A file in release\ is locked by another process ^(MarkMate running, antivirus scan^).
echo Close it and run this script again.
rmdir /s /q "%BUILD_TEMP%" 2>nul
if "%CI_MODE%"=="0" pause
exit /b 1

:copy_done
rmdir /s /q "%BUILD_TEMP%" 2>nul
echo [OK] Artifacts copied to release\
echo.

echo ============================================
echo   Build Complete!
echo ============================================
echo.
echo Installer location:
echo   %~dp0release\MarkMate-Setup-%APP_VERSION%.exe
echo.

if "%CI_MODE%"=="0" (
    explorer "%~dp0release"
    pause
)
