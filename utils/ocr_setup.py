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
import tempfile
import urllib.request
from pathlib import Path

from utils.log import info, warn, error

_CANDIDATE_PATHS = [
    r"C:\Program Files\Tesseract-OCR\tesseract.exe",
    r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
]

# UB-Mannheim's Windows build - the same one bootstrap.py fetches. Duplicated
# there rather than imported from here on purpose: bootstrap.py runs BEFORE
# this repository exists on the machine and may not import from it (see its
# docstring), so the two copies are a deliberate constraint, not an oversight.
TESSERACT_INSTALLER_URL = (
    "https://github.com/UB-Mannheim/tesseract/releases/download/"
    "v5.4.0.20240606/tesseract-ocr-w64-setup-5.4.0.20240606.exe"
)

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


def check_and_install_tesseract() -> bool:
    """Install-time counterpart to check_tesseract_available(), mirroring
    utils/ffmpeg_setup.check_and_download_ffmpeg(): called once by the
    installer scripts so OCR search works out of the box.

    NOT called at runtime, deliberately. This runs an installer that writes
    to Program Files - a reasonable thing to do while the user is watching
    an install they started, and a bad surprise to trigger from a server
    that happens to be handling a request.

    Best-effort throughout: every failure path leaves OCR disabled and
    returns False rather than raising, because a missing OCR binary must
    never be the reason a whole install fails.
    """
    if check_tesseract_available():
        info("OCR", "Tesseract already installed - skipping.")
        return True

    info("OCR", "Downloading Tesseract OCR installer (~50 MB)...")
    try:
        req = urllib.request.Request(
            TESSERACT_INSTALLER_URL, headers={"User-Agent": "Wimmich-Setup"}
        )
        with urllib.request.urlopen(req, timeout=180) as resp:
            data = resp.read()
    except Exception as e:
        warn("OCR", f"Download failed ({e}) - OCR text search stays disabled. "
                    "Install later from https://github.com/UB-Mannheim/tesseract/releases")
        return False

    installer = Path(tempfile.gettempdir()) / "wimmich_tesseract_setup.exe"
    try:
        installer.write_bytes(data)
        info("OCR", "Installing Tesseract OCR (silent)...")
        # /S = silent (NSIS convention). No /D= override: left at its own
        # default (Program Files) so _CANDIDATE_PATHS above finds it with no
        # extra configuration.
        result = subprocess.run([str(installer), "/S"], timeout=300)
        if result.returncode != 0:
            warn("OCR", f"Tesseract installer exited with code {result.returncode}.")
            return False
    except Exception as e:
        error("OCR", f"Tesseract install failed: {e}")
        return False
    finally:
        try:
            installer.unlink(missing_ok=True)
        except Exception:
            pass

    return check_tesseract_available()
