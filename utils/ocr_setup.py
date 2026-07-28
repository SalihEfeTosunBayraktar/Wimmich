"""Tesseract OCR binary detection for Windows.

Unlike ffmpeg (utils/ffmpeg_setup.py), Tesseract has no simple portable zip
release to auto-download - the official Windows builds (UB-Mannheim) are a
proper installer that writes to Program Files and registers an uninstaller,
not something safe to silently fetch and run. Detection only: find an
existing install (PATH or the installer's default locations), verify it
actually runs, and point pytesseract at it. If none is found, OCR features
disable themselves rather than blocking startup - the same "optional,
degrades gracefully" treatment as the CLIP/face-recognition ML stack.
"""
import shutil
import subprocess
from pathlib import Path

from utils.log import info, warn

_CANDIDATE_PATHS = [
    r"C:\Program Files\Tesseract-OCR\tesseract.exe",
    r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
]

OCR_AVAILABLE = False
TESSERACT_CMD = None


def _verify_binary(path: str) -> bool:
    try:
        return subprocess.run([path, "--version"], capture_output=True, timeout=5).returncode == 0
    except Exception:
        return False


def check_tesseract_available() -> bool:
    """Detects an installed Tesseract binary and wires pytesseract to use
    it. Safe to call multiple times (e.g. re-checked after the admin
    installs Tesseract without restarting the server) - re-runs detection
    from scratch rather than trusting a cached negative result forever."""
    global OCR_AVAILABLE, TESSERACT_CMD

    on_path = shutil.which("tesseract")
    candidates = ([on_path] if on_path else []) + _CANDIDATE_PATHS

    for candidate in candidates:
        if candidate and _verify_binary(candidate):
            try:
                import pytesseract
                pytesseract.pytesseract.tesseract_cmd = candidate
            except ImportError:
                OCR_AVAILABLE = False
                TESSERACT_CMD = None
                return False
            TESSERACT_CMD = candidate
            OCR_AVAILABLE = True
            info("OCR", f"Tesseract found at {candidate}")
            return True

    OCR_AVAILABLE = False
    TESSERACT_CMD = None
    warn("OCR", "Tesseract not found - OCR text search disabled (install from https://github.com/UB-Mannheim/tesseract/releases)")
    return False
