"""Video Processing Utilities (FFmpeg)"""
import subprocess
import json
import re
import threading
import time
from pathlib import Path
from typing import Optional, Dict, Any
import config


def _run_ffprobe(file_path: str) -> Optional[Dict[str, Any]]:
    """Run ffprobe and return video metadata as dict."""
    try:
        cmd = [
            config.FFPROBE_PATH or config.FFMPEG_PATH.replace("ffmpeg", "ffprobe"),
            "-v", "quiet",
            "-print_format", "json",
            "-show_format",
            "-show_streams",
            str(file_path),
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if result.returncode == 0:
            return json.loads(result.stdout)
    except (subprocess.TimeoutExpired, FileNotFoundError, json.JSONDecodeError):
        pass
    return None


def get_video_info(file_path: str) -> Dict[str, Any]:
    """
    Get video metadata using ffprobe.
    Returns dict with duration, width, height, codec, etc.
    """
    info = {
        "duration": None,
        "width": None,
        "height": None,
        "codec": None,
        "bitrate": None,
        "fps": None,
        "taken_at": None,
    }

    probe = _run_ffprobe(file_path)
    if not probe:
        return info

    # Get video stream
    for stream in probe.get("streams", []):
        if stream.get("codec_type") == "video":
            info["width"] = stream.get("width")
            info["height"] = stream.get("height")
            info["codec"] = stream.get("codec_name")

            # FPS
            fps_str = stream.get("r_frame_rate", "0/1")
            try:
                num, den = fps_str.split("/")
                info["fps"] = round(float(num) / float(den), 2)
            except (ValueError, ZeroDivisionError):
                pass

            break

    # Format info
    fmt = probe.get("format", {})
    try:
        info["duration"] = float(fmt.get("duration", 0))
    except (ValueError, TypeError):
        pass

    try:
        info["bitrate"] = int(fmt.get("bit_rate", 0))
    except (ValueError, TypeError):
        pass

    # Recording date, when the camera/phone embedded one (e.g. QuickTime/MP4
    # "creation_time" tag). Falls back to per-stream tags if the format-level
    # tag is missing.
    creation_time = fmt.get("tags", {}).get("creation_time")
    if not creation_time:
        for stream in probe.get("streams", []):
            creation_time = stream.get("tags", {}).get("creation_time")
            if creation_time:
                break
    if creation_time:
        from datetime import datetime
        for fmt_str in ("%Y-%m-%dT%H:%M:%S.%fZ", "%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%d %H:%M:%S"):
            try:
                info["taken_at"] = datetime.strptime(creation_time, fmt_str).isoformat()
                break
            except ValueError:
                continue

    return info


def _run_ffmpeg_killable(
    cmd: list,
    cancel_event: Optional[threading.Event] = None,
    timeout: float = 30,
    log_prefix: str = "FFMPEG",
) -> bool:
    """Runs an ffmpeg command via Popen and polls it instead of a single
    blocking subprocess.run(..., timeout=...) - the older approach blocked
    the calling worker thread until ffmpeg exited on its own with no way
    to react to cancel_event, so cancelling a job mid-encode never
    actually stopped ffmpeg (it kept burning CPU/RAM until done) and the
    job worker itself stayed stuck on that same call, unable to start the
    next queued job, until that same completion. Polling lets a cancelled
    job kill ffmpeg within about a second instead. Also logs stderr on a
    non-zero exit - a bare True/False return gave no way to tell why a
    failure happened.
    """
    try:
        proc = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
    except FileNotFoundError:
        return False

    start = time.monotonic()
    while True:
        try:
            proc.wait(timeout=0.5)
            break
        except subprocess.TimeoutExpired:
            pass

        if cancel_event is not None and cancel_event.is_set():
            _terminate(proc)
            return False
        if time.monotonic() - start > timeout:
            print(f"[{log_prefix}] Timed out after {timeout}s")
            _terminate(proc)
            return False

    if proc.returncode != 0:
        stderr = (proc.stderr.read() or b"").decode(errors="replace")[-800:] if proc.stderr else ""
        print(f"[{log_prefix}] Failed (exit {proc.returncode}): {stderr.strip()}")
        return False

    return True


def _terminate(proc: subprocess.Popen) -> None:
    """Force-kill ffmpeg and its whole process tree, then confirm it's
    actually gone. Plain proc.kill() only kills the exact process the
    Popen handle points at - if that's ever a wrapper/shim rather than
    ffmpeg.exe directly, a child it spawned survives as an orphan still
    burning CPU/RAM, so this tree-kills via PID instead."""
    try:
        subprocess.run(
            ["taskkill", "/T", "/F", "/PID", str(proc.pid)],
            capture_output=True, timeout=10,
        )
    except Exception:
        pass
    try:
        proc.wait(timeout=5)
    except subprocess.TimeoutExpired:
        proc.kill()
        proc.wait()


def create_video_thumbnail(
    video_path: str,
    output_path: str,
    max_size: int = 600,
    time_offset: str = "00:00:01",
    cancel_event: Optional[threading.Event] = None,
) -> bool:
    """Extract a frame from video and save as thumbnail."""
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)

    cmd = [
        config.FFMPEG_PATH,
        "-y",
        "-i", str(video_path),
        "-ss", time_offset,
        "-vframes", "1",
        "-vf", f"scale={max_size}:-1",
        "-q:v", "3",
        str(output_path),
    ]
    if not _run_ffmpeg_killable(cmd, cancel_event=cancel_event, timeout=30, log_prefix="FFMPEG-thumb"):
        return False
    return Path(output_path).exists()


def transcode_video(
    input_path: str,
    output_path: str,
    max_height: int = 720,
    crf: int = 28,
    cancel_event: Optional[threading.Event] = None,
    timeout: float = 3600,  # 1hr ceiling
) -> bool:
    """Transcode video to H.264 MP4."""
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)

    cmd = [
        config.FFMPEG_PATH,
        "-y",
        "-i", str(input_path),
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", str(crf),
        "-vf", f"scale=-2:min({max_height}\\,ih)",
        "-c:a", "aac",
        "-b:a", "128k",
        "-movflags", "+faststart",
        str(output_path),
    ]
    if not _run_ffmpeg_killable(cmd, cancel_event=cancel_event, timeout=timeout, log_prefix="FFMPEG-transcode"):
        return False
    return Path(output_path).exists()


def is_ffmpeg_available() -> bool:
    """Check if FFmpeg is installed and accessible."""
    from utils.ffmpeg_setup import check_and_download_ffmpeg

    if check_and_download_ffmpeg():
        return True
    try:
        result = subprocess.run(
            [config.FFMPEG_PATH, "-version"],
            capture_output=True, timeout=5,
        )
        return result.returncode == 0
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return False
