@echo off
chcp 65001 >nul 2>&1
title MarkMate - Inno Setup Installer Builder

echo ============================================
echo   MarkMate - Inno Setup Installer Build
echo ============================================
echo.

:: Store script directory
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

:: Configuration
set ISS_SCRIPT=build\markmate-minimal.iss
set ISS_SCRIPT_FULL=build\markmate.iss
set UNPACKED_DIR=release\win-unpacked
set OUTPUT_DIR=release

:: Auto-detect Inno Setup installation path
set ISCC_PATH=
if exist "C:\Program Files (x86)\Inno Setup 6\ISCC.exe" (
    set ISCC_PATH=C:\Program Files (x86)\Inno Setup 6\ISCC.exe
) else if exist "C:\Program Files\Inno Setup 6\ISCC.exe" (
    set ISCC_PATH=C:\Program Files\Inno Setup 6\ISCC.exe
) else (
    :: Try to find ISCC in PATH
    where ISCC.exe >nul 2>&1
    if %errorlevel% equ 0 (
        set ISCC_PATH=ISCC.exe
    )
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
    pause
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

:: Check if unpacked directory exists
if not exist "%UNPACKED_DIR%" (
    echo [INFO] win-unpacked directory not found. Building Electron app first...
    echo.
    
    echo ============================================
    echo   Step 1/3: Type checking
    echo ============================================
    call npx tsc --noEmit
    if %errorlevel% neq 0 (
        echo.
        echo [ERROR] TypeScript type checking failed.
        pause
        exit /b 1
    )
    echo [OK] Type checking passed
    echo.
    
    echo ============================================
    echo   Step 2/3: Building renderer and electron
    echo ============================================
    set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
    set ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/
    call npx vite build
    if %errorlevel% neq 0 (
        echo [ERROR] Vite build failed.
        pause
        exit /b 1
    )
    echo [OK] Build completed
    echo.
    
    echo ============================================
    echo   Step 3/3: Creating unpacked directory
    echo ============================================
    call npx electron-builder --dir --x64
    if %errorlevel% neq 0 (
        echo [ERROR] electron-builder --dir failed.
        echo.
        echo Troubleshooting:
        echo   1. Run as Administrator or enable Windows Developer Mode
        echo   2. Clear electron-builder cache: %%LOCALAPPDATA%%\electron-builder\Cache
        echo.
        pause
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
    pause
    exit /b 1
)
echo [OK] MarkMate.exe found.
echo.

:: Check for Python backend (optional)
set PYTHON_BACKEND=dist-python\MarkMate-Backend
if exist "%PYTHON_BACKEND%" (
    echo [INFO] Python backend found at: %PYTHON_BACKEND%
    echo        It will be included in the installer.
    echo.
) else (
    echo [INFO] Python backend not found (optional - skipping).
    echo        Run build-pyinstaller.cmd first to include Python backend.
    echo.
)

:: Choose which ISS script to use
set SELECTED_SCRIPT=%ISS_SCRIPT%
if exist "build\icon.ico" (
    if exist "build\WizardImage.bmp" (
        if exist "build\WizardSmallImage.bmp" (
            echo [INFO] Custom icons/images found - using full version.
            set SELECTED_SCRIPT=%ISS_SCRIPT_FULL%
        )
    )
)
echo [INFO] Using script: %SELECTED_SCRIPT%
echo.

:: Compile installer with Inno Setup
echo ============================================
echo   Compiling Inno Setup installer...
echo ============================================
echo.

"%ISCC_PATH%" "%SELECTED_SCRIPT%"

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Inno Setup compilation failed!
    echo.
    echo Troubleshooting:
    echo   1. Check that all source files exist in %UNPACKED_DIR%
    echo   2. Close any running MarkMate or Explorer windows in release\
    echo   3. Make sure you have write permissions to %OUTPUT_DIR%
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================
echo   Inno Setup Build Complete!
echo ============================================
echo.
echo Installer location:
echo   %SCRIPT_DIR%%OUTPUT_DIR%
echo.

:: List generated files
echo Generated files:
dir /b "%OUTPUT_DIR%\MarkMate-Inno-Setup-*.exe" 2>nul
if %errorlevel% neq 0 (
    dir /b "%OUTPUT_DIR%\*.exe" 2>nul
)
echo.

:: Open release folder
explorer "%SCRIPT_DIR%%OUTPUT_DIR%"

echo.
pause
