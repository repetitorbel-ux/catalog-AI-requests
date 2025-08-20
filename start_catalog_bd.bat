@echo off
cd /d %~dp0
echo Activating Conda environment...
call C:\ProgramData\miniconda3\Scripts\activate.bat catalog_env
if errorlevel 1 (
    echo Failed to activate Conda environment. Please check if 'catalog_env' exists.
    pause
    exit /b %errorlevel%
)
echo Starting Flask server...
start "" http://127.0.0.1:5000
timeout /t 1 >nul
python app.py
if errorlevel 1 (
    echo Failed to start Flask server. Please check app.py for errors.
    pause
    exit /b %errorlevel%
)
pause