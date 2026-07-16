"""Per-file-type media processing: EXIF/video metadata extraction, thumbnails."""
import json
from datetime import datetime
from pathlib import Path

import config
from utils.exif_utils import extract_exif
from utils.geocoding_utils import lookup_city_country
from utils.image_utils import create_thumbnail
from utils.video_utils import get_video_info, create_video_thumbnail, is_ffmpeg_available


def _process_image(result: dict, file_path: str, unique_name: str, user_id: str) -> dict:
    """Process image: extract EXIF, create thumbnails."""
    exif = extract_exif(file_path)
    result["width"] = exif.get("width")
    result["height"] = exif.get("height")
    result["latitude"] = exif.get("latitude")
    result["longitude"] = exif.get("longitude")

    if result["latitude"] is not None and result["longitude"] is not None:
        result["city"], result["country"] = lookup_city_country(result["latitude"], result["longitude"])

    if exif.get("taken_at"):
        try:
            result["taken_at"] = datetime.fromisoformat(exif["taken_at"])
        except (ValueError, TypeError):
            pass

    # Store EXIF data (exclude raw for space savings)
    exif_clean = {k: v for k, v in exif.items() if k != "raw" and v is not None}
    result["exif_data"] = json.dumps(exif_clean)

    thumb_base = config.THUMB_DIR / user_id
    thumb_base.mkdir(parents=True, exist_ok=True)
    stem = Path(unique_name).stem

    for size_name, size_px in config.THUMB_SIZES.items():
        thumb_path = thumb_base / f"{stem}_{size_name}.webp"
        if create_thumbnail(file_path, str(thumb_path), max_size=size_px):
            result[f"thumb_{size_name}_path"] = str(thumb_path)

    return result


def _process_video(result: dict, file_path: str, unique_name: str, user_id: str) -> dict:
    """Process video: extract metadata, create thumbnail."""
    if not is_ffmpeg_available():
        return result

    info = get_video_info(file_path)
    result["width"] = info.get("width")
    result["height"] = info.get("height")
    result["duration_seconds"] = info.get("duration")

    if info.get("taken_at"):
        try:
            result["taken_at"] = datetime.fromisoformat(info["taken_at"])
        except (ValueError, TypeError):
            pass

    thumb_base = config.THUMB_DIR / user_id
    thumb_base.mkdir(parents=True, exist_ok=True)
    stem = Path(unique_name).stem

    for size_name, size_px in config.THUMB_SIZES.items():
        thumb_path = thumb_base / f"{stem}_{size_name}.jpg"
        if create_video_thumbnail(file_path, str(thumb_path), max_size=size_px):
            result[f"thumb_{size_name}_path"] = str(thumb_path)

    return result
