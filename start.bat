@echo off


REM Without this, colored cells left over in the console screen buffer from
REM a previous run can show through as stray stripes past the edge of this
REM run's actual output - the banner file itself is fine, every line is a
REM clean, consistent 150 characters wide - cls just guarantees a blank
REM slate under it.
cls

cd /d "%~dp0"

REM Pre-rendered ANSI-art logo, per-character color codes, not something to
REM hand-write - "type" dumps it straight to the console as raw bytes with
REM no batch parsing at all. That matters here: the art uses "%%" as one of
REM its pixel-density characters, and echo would treat that as a variable
REM reference and mangle the output.
if exist "banner.ans" type "banner.ans"

REM Stop any previous Wimmich server/tunnel still running, so double-clicking
REM this file never ends up with orphaned python.exe processes piling up -
REM each one holds its own copy of the ML models in memory/VRAM.
REM
REM Scoped to THIS install's own venv/data folder, not just "any python.exe
REM running main.py" or "any cloudflared.exe" - those match every Wimmich
REM install on the machine, so the old blanket match killed a second
REM install's server/tunnel too even when it was running on a different
REM port. Each install has its own venv and its own data\cloudflared.exe,
REM so matching on the full executable path tells them apart.

echo Stopping any previous Wimmich instances...
powershell -NoProfile -Command "$py = '%~dp0venv\Scripts\python.exe'; Get-CimInstance Win32_Process -Filter \"Name='python.exe'\" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like '*main.py*' -and $_.ExecutablePath -eq $py } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"
powershell -NoProfile -Command "$cf = '%~dp0data\cloudflared.exe'; Get-CimInstance Win32_Process -Filter \"Name='cloudflared.exe'\" -ErrorAction SilentlyContinue | Where-Object { $_.ExecutablePath -eq $cf } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"

REM No venv yet means this is a first run - point at the two explicit
REM installers instead of silently picking one. install_full.bat pulls in
REM the AI/ML stack - CLIP search, face recognition, a few GB, much faster
REM with an NVIDIA GPU - install_minimal.bat skips all of that for a
REM faster, smaller setup with everything except those two features.
REM
REM A plain top-level "if ... goto" instead of a parenthesized if/else block
REM on purpose - cmd.exe's multi-line if/else parsing has repeatedly proven
REM fragile here: exit/goto inside the block corrupts its boundary tracking,
REM and the else-binding itself can silently detach and let both branches
REM fire. goto with top-level labels sidesteps that whole category of bug.
if not exist "venv" goto :noenv

call venv\Scripts\activate.bat

REM :run_server / RESTART_EXIT_CODE loop for the admin panel's "Update Now"
REM button - after pulling + reinstalling, main.py exits with code 42 to
REM ask to be relaunched instead of just ending here. Plain top-level goto,
REM same reasoning as the if/else comment above - no parens, so nothing
REM here can trip that same parser trap.
:run_server
echo.
echo Starting server...
echo.
python main.py
set "WIMMICH_EXIT_CODE=%errorlevel%"
if "%WIMMICH_EXIT_CODE%"=="42" goto :restart_server
pause
goto :eof

:restart_server
echo.
echo Update applied - restarting...
echo.
goto :run_server

:noenv
echo   No virtual environment found yet - this looks like a first run.
echo.
echo   Run one of these first, then start.bat again:
echo     install_full.bat     - everything, including AI features
echo     install_minimal.bat  - everything except AI features (smaller, faster)
echo.
pause
