@echo off
chcp 65001 >nul 2>&1
title MarkMate - PyInstaller Build Script

echo ============================================
echo   MarkMate - PyInstaller Build
echo ============================================
echo.

:: Store current directory
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

:: Configuration
set PYTHON_SRC_DIR=python
set SPEC_FILE=build\pyinstaller.spec
set DIST_DIR=dist-python
set BUILD_DIR=build\pyinstaller-build

:: Check if Python is available
echo [INFO] Checking Python environment...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found. Please install Python 3.8+ and add it to PATH.
    echo.
    echo You can download Python from: https://www.python.org/downloads/
    pause
    exit /b 1
)
for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PYTHON_VERSION=%%i
echo [OK] Python version: %PYTHON_VERSION%
echo.

:: Check/setup virtual environment (optional but recommended)
if not exist venv (
    echo [INFO] Virtual environment not found. Creating venv...
    python -m venv venv
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to create virtual environment.
        pause
        exit /b 1
    )
    echo [OK] Virtual environment created.
    echo.
)

:: Activate virtual environment
echo [INFO] Activating virtual environment...
call venv\Scripts\activate.bat
if %errorlevel% neq 0 (
    echo [WARN] Failed to activate venv, using system Python.
)
echo.

:: Upgrade pip
echo [INFO] Upgrading pip...
python -m pip install --upgrade pip -q
echo.

:: Install PyInstaller if not present
echo [INFO] Checking PyInstaller installation...
pip show pyinstaller >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Installing PyInstaller...
    pip install pyinstaller
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install PyInstaller.
        pause
        exit /b 1
    )
    echo [OK] PyInstaller installed.
) else (
    echo [OK] PyInstaller is already installed.
)
echo.

:: Install requirements if requirements.txt exists
if exist requirements.txt (
    echo [INFO] Installing Python dependencies from requirements.txt...
    pip install -r requirements.txt
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies.
        pause
        exit /b 1
    )
    echo [OK] Dependencies installed.
    echo.
)

:: Check if Python source directory exists
if not exist "%PYTHON_SRC_DIR%" (
    echo [WARN] Python source directory '%PYTHON_SRC_DIR%' not found.
    echo [INFO] Creating template directory structure...
    mkdir "%PYTHON_SRC_DIR%" 2>nul
    echo # MarkMate Python Backend > "%PYTHON_SRC_DIR%\main.py"
    echo # Add your Python backend code here >> "%PYTHON_SRC_DIR%\main.py"
    echo. >> "%PYTHON_SRC_DIR%\main.py"
    echo def main(): >> "%PYTHON_SRC_DIR%\main.py"
    echo     print("MarkMate Backend") >> "%PYTHON_SRC_DIR%\main.py"
    echo. >> "%PYTHON_SRC_DIR%\main.py"
    echo if __name__ == "__main__": >> "%PYTHON_SRC_DIR%\main.py"
    echo     main() >> "%PYTHON_SRC_DIR%\main.py"
    echo [OK] Template created. Please add your Python code to %PYTHON_SRC_DIR%\
    echo.
    pause
)

:: Check entry point
if not exist "%PYTHON_SRC_DIR%\main.py" (
    echo [ERROR] Entry point not found: %PYTHON_SRC_DIR%\main.py
    pause
    exit /b 1
)

:: Clean previous builds
echo [INFO] Cleaning previous build artifacts...
if exist "%DIST_DIR%" rmdir /s /q "%DIST_DIR%"
if exist "%BUILD_DIR%" rmdir /s /q "%BUILD_DIR%"
echo [OK] Cleaned
echo.

:: Run PyInstaller
echo ============================================
echo   Building with PyInstaller...
echo ============================================
echo.

pyinstaller "%SPEC_FILE%" --clean --noconfirm ^
    --distpath "%DIST_DIR%" ^
    --workpath "%BUILD_DIR%"

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] PyInstaller build failed.
    echo.
    echo Troubleshooting:
    echo   1. Check for syntax errors in your Python code
    echo   2. Ensure all dependencies are installed
    echo   3. Add missing hidden imports to the spec file
    echo   4. Add missing data files/directories to datas in spec file
    echo   5. Run with console=True in spec for debug output
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================
echo   PyInstaller Build Complete!
echo ============================================
echo.
echo Output directory:
echo   %SCRIPT_DIR%%DIST_DIR%
echo.

:: Open dist folder
explorer "%SCRIPT_DIR%%DIST_DIR%"

echo.
pause
