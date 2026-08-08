@echo off
title Wimmich - Uninstall
cls
cd /d "%~dp0"

echo.
echo   ====================================
echo    Wimmich - Uninstall
echo   ====================================
echo.

REM Plain top-level "if ... goto" throughout, same as the installers - see
REM start.bat for why: exit/goto inside a parenthesized if-block corrupts
REM cmd.exe's boundary tracking for the rest of the file.

REM The whole point of this script is telling the user WHERE their photos
REM actually are before anything gets deleted. WIMMICH_DATA_DIR can point
REM the library at a different drive entirely, in which case deleting this
REM folder would leave gigabytes behind with no hint they existed - and
REM someone who assumes "delete the folder" removed everything is exactly
REM the person who then wipes that drive.
set "DATA_DIR=%~dp0data"
if not "%WIMMICH_DATA_DIR%"=="" set "DATA_DIR=%WIMMICH_DATA_DIR%"

echo   This will remove:
echo     - the Python environment      %~dp0venv
echo.
echo   Your library is at:
echo     %DATA_DIR%
echo.
echo   Photos, videos, albums and accounts all live in that folder. This
echo   script does NOT touch it - delete it yourself once you're sure you
echo   have a copy of anything you want to keep.
echo.

REM Stopping first: a running server holds the venv's python.exe open, so
REM the rmdir below would half-delete and leave an unusable folder behind.
REM Scoped to THIS install's own executable, same as start.bat, so a second
REM Wimmich install on the machine keeps running.
echo   Stopping this install's server if it's running...
powershell -NoProfile -Command "$py = '%~dp0venv\Scripts\python.exe'; Get-CimInstance Win32_Process -Filter \"Name='python.exe'\" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like '*main.py*' -and $_.ExecutablePath -eq $py } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"
powershell -NoProfile -Command "$cf = '%~dp0data\cloudflared.exe'; Get-CimInstance Win32_Process -Filter \"Name='cloudflared.exe'\" -ErrorAction SilentlyContinue | Where-Object { $_.ExecutablePath -eq $cf } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"

echo.
set /p CONFIRM="  Remove the Python environment now? (y/N): "
if /i not "%CONFIRM%"=="y" goto :cancelled

if not exist "venv" goto :no_venv
echo   Removing venv...
rmdir /s /q "venv"
if exist "venv" goto :venv_locked
echo   Done.
goto :finished

:no_venv
echo   No venv folder here - nothing to remove.

:finished
echo.
echo   ====================================
echo    Wimmich's environment is gone.
echo   ====================================
echo.
echo   Still on disk, on purpose:
echo     %DATA_DIR%    ^<- your photos and database
echo     %~dp0                     ^<- the app files
echo.
echo   Tesseract OCR and any Python you installed are separate programs -
echo   remove them from Windows "Apps ^& features" if you want them gone.
echo.
pause
goto :eof

:venv_locked
echo.
echo   Could not fully remove the venv - something still has a file open.
echo   Close any terminal or editor using this folder and run this again.
echo.
pause
exit /b 1

:cancelled
echo.
echo   Cancelled - nothing was removed.
echo.
pause
