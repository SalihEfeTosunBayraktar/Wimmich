"""Video Processing Utilities (FFmpeg)"""
import subprocess
import json
import re
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


def create_video_thumbnail(
    video_path: str,
    output_path: str,
    max_size: int = 600,
    time_offset: str = "00:00:01",
) -> bool:
    """
    Extract a frame from video and save as thumbnail.
    """
    try:
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
        result = subprocess.run(cmd, capture_output=True, timeout=30)
        return result.returncode == 0 and Path(output_path).exists()

    except (subprocess.TimeoutExpired, FileNotFoundError):
        return False


def transcode_video(
    input_path: str,
    output_path: str,
    max_height: int = 720,
    crf: int = 28,
) -> bool:
    """
    Transcode video to H.264 MP4.
    """
    try:
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
        result = subprocess.run(cmd, capture_output=True, timeout=3600)  # 1hr timeout
        return result.returncode == 0 and Path(output_path).exists()

    except (subprocess.TimeoutExpired, FileNotFoundError):
        return False


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
