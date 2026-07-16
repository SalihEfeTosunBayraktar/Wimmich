@echo off
title Wimmich - Full Setup (with AI features)
cls
cd /d "%~dp0"
if exist "banner.ans" type "banner.ans"

echo.
echo   ====================================
echo    Full setup (with AI features)
echo   ====================================
echo.
echo   Installs everything, including semantic (CLIP) search and face
echo   recognition. These pull a few GB of ML packages/model weights and
echo   are much faster with an NVIDIA GPU (CUDA), though they also work
echo   on CPU-only machines, just slower.
echo.

REM Plain top-level "if ... goto" throughout this file on purpose - see
REM start.bat for why: exit/goto inside a parenthesized if-block corrupts
REM cmd.exe's boundary tracking for the rest of the file. goto with
REM top-level labels sidesteps that whole category of parser bug.
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

echo   Installing base dependencies...
pip install -r requirements.txt
if errorlevel 1 goto :pip_failed

echo.
set /p GPU_CHOICE="  Do you have an Cuda Supported GPU (CUDA)? [Y/n]: "
if /i "%GPU_CHOICE%"=="n" goto :install_cpu_torch

echo   Installing CUDA-accelerated PyTorch (cu121)...
echo   If this fails, your GPU/driver may need a different CUDA version -
echo   see https://pytorch.org/get-started/locally/ for the right command.
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
goto :after_torch

:install_cpu_torch
echo   Installing CPU-only PyTorch (this works everywhere, but ML features run slower)...
pip install torch torchvision

:after_torch
if errorlevel 1 goto :torch_failed

echo   Installing CLIP (semantic search)...
pip install open_clip_torch

echo   Installing face recognition...
pip install facenet-pytorch requests --no-deps
pip install scikit-learn

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

:torch_failed
echo   PyTorch install failed - see the errors above.
pause
exit /b 1
