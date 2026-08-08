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

REM Catch a missing or too-old interpreter here, in one line, instead of
REM letting it surface as a venv failure or a wall of pip resolution errors
REM several minutes into the install. Two separate checks so "not installed"
REM and "installed but too old" don't produce the same misleading message.
where python >nul 2>nul
if errorlevel 1 goto :no_python
python -c "import sys; sys.exit(0 if sys.version_info >= (3, 10) else 1)" >nul 2>nul
if errorlevel 1 goto :old_python

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

REM Fetched here instead of left to its usual lazy on-demand download (see
REM utils/ffmpeg_setup.py) specifically so start.bat opens instantly every
REM time afterwards - all the "not found, downloading..." activity happens
REM during install, where the user already expects downloads, not on a
REM later "just open the server" run. Optional/best-effort: video support
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
set /p GPU_CHOICE="  Do you have an Cuda Supported GPU (CUDA)? [Y/n]: "
if /i "%GPU_CHOICE%"=="n" goto :install_cpu_torch

REM Each CUDA build tag (cuXXX) stops publishing wheels for newer Python
REM versions well before PyTorch itself drops support, so a single pinned
REM tag (this used to just be cu121) goes stale and hard-fails as soon as
REM Python moves on. Trying a small chain of recent tags, newest first,
REM and only falling back to a CPU-only build if none of them have a
REM matching wheel for this Python version.
echo   Installing CUDA-accelerated PyTorch (trying recent CUDA builds)...
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu130
if not errorlevel 1 goto :after_torch

pip install torch torchvision --index-url https://download.pytorch.org/whl/cu126
if not errorlevel 1 goto :after_torch

pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
if not errorlevel 1 goto :after_torch

echo   None of the CUDA builds had a wheel for this Python version -
echo   falling back to the CPU-only build (ML features still work, just
echo   slower). See https://pytorch.org/get-started/locally/ for the
echo   current recommended command if you want to install CUDA support
echo   manually afterwards.
pip install torch torchvision
goto :after_torch

:install_cpu_torch
echo   Installing CPU-only PyTorch (this works everywhere, but ML features run slower)...
pip install torch torchvision

:after_torch
if errorlevel 1 goto :torch_failed

echo   Installing CLIP (semantic search)...
REM transformers isn't a hard dependency of open_clip_torch itself, but the
REM specific checkpoint this app uses (config.ML_CLIP_MODEL, an XLM-RoBERTa
REM text tower for multilingual search) is loaded through HuggingFace under
REM the hood and fails at runtime ("pip install transformers to use
REM pre-trained HuggingFace models") without it - not optional here.
pip install open_clip_torch transformers

REM --no-deps only on facenet-pytorch itself (it pins old torch/numpy/Pillow
REM versions that conflict with what CLIP above needs) - requests is
REM installed as a normal, separate command so ITS OWN dependencies
REM (urllib3, certifi, charset_normalizer) actually get installed too.
REM Putting requests on the same --no-deps line as facenet-pytorch (as
REM this used to do) silently skipped those and broke the import with
REM "No module named 'urllib3'" - face recognition would report as
REM completely unavailable despite installing without any visible error.
echo   Installing face recognition...
pip install facenet-pytorch --no-deps
pip install requests
pip install scikit-learn

REM Fetched here, not left to its usual lazy on-demand download (see
REM services/clip_service.py's _load_clip), for the same reason as the
REM FFmpeg step above: without this, the first CLIP/FACE scan a user ever
REM runs stalls for however long it takes to pull this ~4-5GB multilingual
REM checkpoint, with no warning that it's coming - all the "this is a big
REM download" expectation-setting happens here, during install, instead.
echo.
echo   Downloading CLIP model weights (multilingual semantic search, ~4-5GB)...
python -c "from services.clip_service import _load_clip; _load_clip()"

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
