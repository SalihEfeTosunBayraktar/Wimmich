"""FFmpeg/ffprobe auto-download for Windows (portable binaries, no install needed)."""
import subprocess
import urllib.request
import zipfile
import io
from pathlib import Path

import config
from utils.log import info, success, error

FFBINARIES_URLS = {
    "ffmpeg": "https://github.com/ffbinaries/ffbinaries-prebuilt/releases/download/v4.4.1/ffmpeg-4.4.1-win-64.zip",
    "ffprobe": "https://github.com/ffbinaries/ffbinaries-prebuilt/releases/download/v4.4.1/ffprobe-4.4.1-win-64.zip",
}


def check_and_download_ffmpeg() -> bool:
    """Verify if FFmpeg exists in system path or download it locally on Windows."""
    bin_dir = config.BASE_DIR / "data" / "bin"
    bin_dir.mkdir(parents=True, exist_ok=True)

    local_ffmpeg = bin_dir / "ffmpeg.exe"
    local_ffprobe = bin_dir / "ffprobe.exe"

    if local_ffmpeg.exists() and local_ffprobe.exists():
        config.FFMPEG_PATH = str(local_ffmpeg)
        config.FFPROBE_PATH = str(local_ffprobe)
        return True

    # Check if system ffmpeg works first
    try:
        if subprocess.run(["ffmpeg", "-version"], capture_output=True, timeout=2).returncode == 0:
            return True
    except Exception:
        pass

    info("FFMPEG", "FFmpeg not found. Auto-downloading portable Windows binaries...")
    headers = {"User-Agent": "Mozilla/5.0"}

    for name, url in FFBINARIES_URLS.items():
        dest = bin_dir / f"{name}.exe"
        if dest.exists():
            continue
        try:
            info("FFMPEG", f"Downloading {name}...")
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req) as resp:
                zip_data = resp.read()
            with zipfile.ZipFile(io.BytesIO(zip_data)) as z:
                for member in z.namelist():
                    if member.endswith(".exe"):
                        with open(bin_dir / member, "wb") as f_out:
                            f_out.write(z.read(member))
            success("FFMPEG", f"{name} downloaded successfully.")
        except Exception as e:
            error("FFMPEG", f"Failed to download {name}: {e}")

    if local_ffmpeg.exists():
        config.FFMPEG_PATH = str(local_ffmpeg)
    if local_ffprobe.exists():
        config.FFPROBE_PATH = str(local_ffprobe)
    return local_ffmpeg.exists()
