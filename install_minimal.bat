@echo off
title Wimmich - Minimal Setup (no AI features)
cls
cd /d "%~dp0"
if exist "banner.ans" type "banner.ans"

echo.
echo   ====================================
echo    Minimal setup (no AI features)
echo   ====================================
echo.
echo   Installs everything except semantic search and face recognition.
echo   You can add AI features later by running install_full.bat.
echo.

REM Plain top-level "if ... goto" - see start.bat for why: exit/goto inside
REM a parenthesized if-block corrupts cmd.exe's boundary tracking for the
REM rest of the file.
if not exist "venv" goto :create_venv
echo   A "venv" folder already exists here.
echo   Delete it first if you want a clean reinstall.
echo.
pause
goto :eof

:create_venv
echo   Creating virtual environment...
python -m venv venv
if errorlevel 1 goto :venv_failed
call venv\Scripts\activate.bat

echo   Installing dependencies...
pip install -r requirements.txt
if errorlevel 1 goto :pip_failed

echo.
echo   ====================================
echo    Done! Run start.bat to launch Wimmich.
echo   ====================================
echo.
pause
goto :eof

:venv_failed
echo   Failed to create the virtual environment - is Python installed and on PATH?
pause
exit /b 1

:pip_failed
echo   pip install failed - see the errors above.
pause
exit /b 1
