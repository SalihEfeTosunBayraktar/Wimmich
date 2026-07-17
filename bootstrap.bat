@echo off
cls
title Wimmich - Quick Install

echo.
echo   ====================================
echo    Wimmich - Quick Install
echo   ====================================
echo.

REM Plain top-level "if ... goto" throughout this file on purpose - see
REM start.bat/install_full.bat for why: exit/goto inside a parenthesized
REM if-block has repeatedly corrupted cmd.exe's boundary tracking here.
where python >nul 2>nul
if not errorlevel 1 goto :have_python
where py >nul 2>nul
if not errorlevel 1 goto :have_py_launcher
goto :no_python

:have_python
set "PYTHON_CMD=python"
goto :fetch_bootstrap

:have_py_launcher
set "PYTHON_CMD=py"
goto :fetch_bootstrap

:no_python
echo   Python was not found on your PATH.
echo.
echo   Install it from https://www.python.org/downloads/ first
echo   (check the "Add python.exe to PATH" box during setup),
echo   then run this file again.
echo.
pause
exit /b 1

:fetch_bootstrap
REM bootstrap.py itself is fetched fresh every run rather than embedded
REM here - lets the actual installer logic keep being fixed/improved on
REM GitHub without needing a new release of this wrapper each time.
set "BOOTSTRAP_PY=%TEMP%\wimmich_bootstrap.py"
set "BOOTSTRAP_URL=https://raw.githubusercontent.com/SalihEfeTosunBayraktar/Wimmich/main/bootstrap.py"

echo   Fetching the installer...
where curl >nul 2>nul
if errorlevel 1 goto :download_powershell

curl -fsSL "%BOOTSTRAP_URL%" -o "%BOOTSTRAP_PY%"
if not errorlevel 1 goto :run_bootstrap

:download_powershell
powershell -NoProfile -Command "try { Invoke-WebRequest -Uri '%BOOTSTRAP_URL%' -OutFile '%BOOTSTRAP_PY%' -UseBasicParsing } catch { exit 1 }"
if errorlevel 1 goto :download_failed

:run_bootstrap
echo   Starting the installer - your browser will open automatically...
echo   (leave this window open - it's running the local installer server)
echo.
%PYTHON_CMD% "%BOOTSTRAP_PY%"
pause
goto :eof

:download_failed
echo.
echo   Could not download the installer. Check your internet connection
echo   and try again.
echo.
pause
exit /b 1
