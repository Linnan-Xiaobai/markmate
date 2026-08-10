@echo off
chcp 65001 >nul 2>&1
title MarkMate - Inno Setup Installer Builder

:: Usage: build-inno.cmd [--ci]
::   --ci    headless mode: skip pause and explorer, exit with code only
set "CI_MODE=0"
if /i "%~1"=="--ci" set "CI_MODE=1"

echo ============================================
echo   MarkMate - Inno Setup Installer Build
echo ============================================
echo.

:: Store script directory
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

:: Configuration
set ISS_SCRIPT=build\markmate.iss
set UNPACKED_DIR=release\win-unpacked
set OUTPUT_DIR=release

:: Auto-detect Inno Setup installation path (6.x and 7.x, admin and
:: per-user installs). NOTE: single-line form on purpose - any block
:: containing ")" from "C:\Program Files (x86)" would break cmd parsing.
set ISCC_PATH=
if exist "C:\Program Files\Inno Setup 7\ISCC.exe" set "ISCC_PATH=C:\Program Files\Inno Setup 7\ISCC.exe"
if not defined ISCC_PATH if exist "C:\Program Files (x86)\Inno Setup 7\ISCC.exe" set "ISCC_PATH=C:\Program Files (x86)\Inno Setup 7\ISCC.exe"
if not defined ISCC_PATH if exist "%LOCALAPPDATA%\Programs\Inno Setup 7\ISCC.exe" set "ISCC_PATH=%LOCALAPPDATA%\Programs\Inno Setup 7\ISCC.exe"
if not defined ISCC_PATH if exist "C:\Program Files\Inno Setup 6\ISCC.exe" set "ISCC_PATH=C:\Program Files\Inno Setup 6\ISCC.exe"
if not defined ISCC_PATH if exist "C:\Program Files (x86)\Inno Setup 6\ISCC.exe" set "ISCC_PATH=C:\Program Files (x86)\Inno Setup 6\ISCC.exe"
if not defined ISCC_PATH if exist "%LOCALAPPDATA%\Programs\Inno Setup 6\ISCC.exe" set "ISCC_PATH=%LOCALAPPDATA%\Programs\Inno Setup 6\ISCC.exe"
if not defined ISCC_PATH (
    where ISCC.exe >nul 2>&1 && set ISCC_PATH=ISCC.exe
)

:: Check if Inno Setup is installed
if "%ISCC_PATH%"=="" (
    echo [ERROR] Inno Setup 6 not found!
    echo.
    echo Please download and install Inno Setup 6 from:
    echo   https://jrsoftware.org/isdl.php
    echo.
    echo After installation, make sure ISCC.exe is in your PATH or
    echo installed to the default location:
    echo   C:\Program Files ^(x86^)\Inno Setup 6\
    echo.
    if "%CI_MODE%"=="0" pause
    exit /b 1
)
echo [OK] Found Inno Setup compiler: %ISCC_PATH%
echo.

:: Check if Node.js dependencies are installed
if not exist node_modules (
    echo [WARN] node_modules not found. Running setup first...
    echo.
    call setup.cmd
    if %errorlevel% neq 0 exit /b 1
)

:: Read version from package.json (single source of truth)
for /f %%v in ('powershell -NoProfile -Command "(Get-Content package.json -Raw | ConvertFrom-Json).version"') do set "APP_VERSION=%%v"
if not defined APP_VERSION (
    echo [ERROR] Failed to read version from package.json
    exit /b 1
)
echo [INFO] App version: %APP_VERSION%
echo.

:: Check if unpacked directory exists
if not exist "%UNPACKED_DIR%" (
    echo [INFO] win-unpacked directory not found. Building Electron app first...
    echo.

    set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
    set ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/

    echo ============================================
    echo   Build: typecheck + renderer + main + unpack
    echo ============================================
    call npm run build:unpack
    if %errorlevel% neq 0 (
        echo [ERROR] electron-builder --dir failed.
        echo.
        echo Troubleshooting:
        echo   1. Run as Administrator or enable Windows Developer Mode
        echo   2. Clear electron-builder cache: %%LOCALAPPDATA%%\electron-builder\Cache
        echo.
        if "%CI_MODE%"=="0" pause
        exit /b 1
    )
    echo [OK] Unpacked directory created
    echo.
) else (
    echo [OK] Found existing win-unpacked directory.
    echo.
)

:: Verify unpacked directory has MarkMate.exe
if not exist "%UNPACKED_DIR%\MarkMate.exe" (
    echo [ERROR] MarkMate.exe not found in %UNPACKED_DIR%!
    echo The unpacked directory may be corrupted.
    echo Try deleting release\ directory and running this script again.
    if "%CI_MODE%"=="0" pause
    exit /b 1
)
echo [OK] MarkMate.exe found.
echo.

:: Compile installer with Inno Setup (version injected from package.json)
echo ============================================
echo   Compiling Inno Setup installer...
echo ============================================
echo.

"%ISCC_PATH%" /DMyAppVersion=%APP_VERSION% "%ISS_SCRIPT%"

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Inno Setup compilation failed!
    echo.
    echo Troubleshooting:
    echo   1. Check that all source files exist in %UNPACKED_DIR%
    echo   2. Close any running MarkMate or Explorer windows in release\
    echo   3. Make sure you have write permissions to %OUTPUT_DIR%
    echo.
    if "%CI_MODE%"=="0" pause
    exit /b 1
)

echo.
echo ============================================
echo   Inno Setup Build Complete!
echo ============================================
echo.
echo Installer location:
echo   %SCRIPT_DIR%%OUTPUT_DIR%\MarkMate-Inno-Setup-%APP_VERSION%.exe
echo.

:: List generated files
echo Generated files:
dir /b "%OUTPUT_DIR%\MarkMate-Inno-Setup-*.exe" 2>nul
echo.

if "%CI_MODE%"=="0" (
    explorer "%SCRIPT_DIR%%OUTPUT_DIR%"
    pause
)
