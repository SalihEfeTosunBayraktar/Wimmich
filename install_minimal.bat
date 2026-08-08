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

REM Catch a missing or too-old interpreter here, in one line, instead of
REM letting it surface as a venv failure or a wall of pip resolution errors
REM several minutes into the install. Two separate checks so "not installed"
REM and "installed but too old" don't produce the same misleading message.
where python >nul 2>nul
if errorlevel 1 goto :no_python
python -c "import sys; sys.exit(0 if sys.version_info >= (3, 10) else 1)" >nul 2>nul
if errorlevel 1 goto :old_python

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

REM Fetched here instead of left to its usual lazy on-demand download (see
REM utils/ffmpeg_setup.py) so start.bat opens instantly afterwards instead
REM of downloading on its first run. Optional/best-effort: video support
REM just runs limited if this fails, same as it always has.
echo   Checking for FFmpeg (needed for video thumbnails/playback)...
python -c "from utils.ffmpeg_setup import check_and_download_ffmpeg; check_and_download_ffmpeg()"

REM Same treatment as FFmpeg above, and for the same reason: the web
REM installer (bootstrap.py) already sets Tesseract up, so without this the
REM manual .bat route silently ended up with OCR text search disabled while
REM the feature itself worked fine. Best-effort - a failure here only leaves
REM OCR off, it never fails the install.
echo   Checking for Tesseract OCR (needed for text search in screenshots/documents)...
python -c "from utils.ocr_setup import check_and_install_tesseract; check_and_install_tesseract()"


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

:no_python
echo.
echo   Python was not found on your PATH.
echo   Install it from https://www.python.org/downloads/
echo   (tick "Add python.exe to PATH" during setup), then run this again.
echo.
pause
exit /b 1

:old_python
echo.
echo   Wimmich needs Python 3.10 or newer. The version on your PATH is older:
python --version
echo.
echo   Install a newer one from https://www.python.org/downloads/
echo   (tick "Add python.exe to PATH"), then run this again.
echo.
pause
exit /b 1
