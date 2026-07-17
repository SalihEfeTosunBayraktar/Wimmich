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


def _verify_binary(path: Path) -> bool:
    """Runs the downloaded .exe, not just checks it exists - a truncated
    download, wrong-architecture binary, or one an antivirus product has
    quarantined/neutered in place all still pass an exists() check but
    fail to actually run, and previously stayed "installed" forever since
    nothing ever re-checked them after the initial extraction."""
    try:
        return subprocess.run([str(path), "-version"], capture_output=True, timeout=5).returncode == 0
    except Exception:
        return False


def check_and_download_ffmpeg() -> bool:
    """Verify if FFmpeg exists in system path or download it locally on Windows."""
    bin_dir = config.BASE_DIR / "data" / "bin"
    bin_dir.mkdir(parents=True, exist_ok=True)

    local_ffmpeg = bin_dir / "ffmpeg.exe"
    local_ffprobe = bin_dir / "ffprobe.exe"

    if local_ffmpeg.exists() and local_ffprobe.exists():
        if _verify_binary(local_ffmpeg) and _verify_binary(local_ffprobe):
            config.FFMPEG_PATH = str(local_ffmpeg)
            config.FFPROBE_PATH = str(local_ffprobe)
            return True
        # One or both exist but don't actually run (truncated download,
        # wrong architecture, antivirus tampering) - remove the bad file(s)
        # so the download loop below retries them instead of leaving a
        # permanently-broken "installed" copy that only ever surfaces as
        # opaque per-video failures with no link back to this.
        error("FFMPEG", "Existing local FFmpeg binaries failed to run - re-downloading.")
        for bad in (local_ffmpeg, local_ffprobe):
            if bad.exists() and not _verify_binary(bad):
                bad.unlink(missing_ok=True)

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
            with urllib.request.urlopen(req, timeout=15) as resp:
                zip_data = resp.read()
            with zipfile.ZipFile(io.BytesIO(zip_data)) as z:
                for member in z.namelist():
                    if member.endswith(".exe"):
                        with open(bin_dir / member, "wb") as f_out:
                            f_out.write(z.read(member))
            if _verify_binary(dest):
                success("FFMPEG", f"{name} downloaded successfully.")
            else:
                error("FFMPEG", f"{name} downloaded but failed to run - discarding (will retry next time).")
                dest.unlink(missing_ok=True)
        except Exception as e:
            error("FFMPEG", f"Failed to download {name}: {e}")

    if local_ffmpeg.exists():
        config.FFMPEG_PATH = str(local_ffmpeg)
    else:
        error("FFMPEG", "ffmpeg.exe is still unavailable - video thumbnails/transcoding will be disabled.")
    if local_ffprobe.exists():
        config.FFPROBE_PATH = str(local_ffprobe)
    else:
        error("FFMPEG", "ffprobe.exe is still unavailable - video metadata (duration/resolution) will be disabled.")
    return local_ffmpeg.exists()
