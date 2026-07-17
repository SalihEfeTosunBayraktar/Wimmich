"""Media Service - Upload, Thumbnail, EXIF processing"""
import asyncio
import os
import uuid
import shutil
import mimetypes
from datetime import datetime
from pathlib import Path
from typing import Optional, Tuple

import config
from utils.hash_utils import compute_file_hash, get_file_size
from utils.log import warn
from services.media_processing import _process_image, _process_video


def get_file_type(filename: str) -> Optional[str]:
    """Determine if file is IMAGE or VIDEO based on extension."""
    ext = Path(filename).suffix.lower()
    if ext in config.IMAGE_EXTENSIONS or ext in config.RAW_EXTENSIONS:
        return "IMAGE"
    elif ext in config.VIDEO_EXTENSIONS:
        return "VIDEO"
    return None


def get_mime_type(filename: str) -> str:
    """Get MIME type from filename."""
    mime, _ = mimetypes.guess_type(filename)
    return mime or "application/octet-stream"


async def process_upload(
    file_data: bytes,
    original_filename: str,
    user_id: str,
    fallback_taken_at: Optional[datetime] = None,
) -> dict:
    """
    Process an uploaded file:
    1. Save to disk
    2. Compute hash
    3. Extract EXIF/metadata
    4. Generate thumbnails

    `fallback_taken_at` is used when the file has no EXIF/embedded date (very
    common for images that passed through WhatsApp/Telegram, which strip
    metadata) - typically the browser File API's lastModified date, or the
    filesystem mtime for locally-imported files. Without it, such files would
    silently sort by upload time instead of something closer to their actual
    date.

    Returns a dict of asset attributes.
    """
    file_type = get_file_type(original_filename)
    if not file_type:
        raise ValueError(f"Unsupported file type: {original_filename}")

    # Generate unique filename
    ext = Path(original_filename).suffix.lower()
    unique_name = f"{uuid.uuid4().hex}{ext}"
    
    # Create user directory
    user_upload_dir = config.UPLOAD_DIR / user_id
    user_upload_dir.mkdir(parents=True, exist_ok=True)
    
    # Date-based subdirectory
    now = datetime.now()
    date_dir = user_upload_dir / str(now.year) / f"{now.month:02d}"
    date_dir.mkdir(parents=True, exist_ok=True)
    
    file_path = date_dir / unique_name

    # Save file in thread
    def save_file():
        with open(file_path, "wb") as f:
            f.write(file_data)
    await asyncio.to_thread(save_file)

    # Compute hash and stats in thread
    checksum = await asyncio.to_thread(compute_file_hash, str(file_path))
    file_size = await asyncio.to_thread(get_file_size, str(file_path))
    mime_type = get_mime_type(original_filename)

    result = {
        "file_path": str(file_path),
        "file_name": unique_name,
        "original_file_name": original_filename,
        "file_type": file_type,
        "mime_type": mime_type,
        "file_size": file_size,
        "checksum": checksum,
        "width": None,
        "height": None,
        "duration_seconds": None,
        "taken_at": None,
        "latitude": None,
        "longitude": None,
        "city": None,
        "country": None,
        "exif_data": None,
        "thumb_small_path": None,
        "thumb_medium_path": None,
        "thumb_large_path": None,
    }

    # Process based on file type in thread pool
    if file_type == "IMAGE":
        result = await asyncio.to_thread(_process_image, result, str(file_path), unique_name, user_id)
    elif file_type == "VIDEO":
        result = await asyncio.to_thread(_process_video, result, str(file_path), unique_name, user_id)

    if result["taken_at"] is None and fallback_taken_at is not None:
        result["taken_at"] = fallback_taken_at

    return result


def delete_asset_files(asset) -> None:
    """Delete all files associated with an asset."""
    paths_to_delete = [
        asset.file_path,
        asset.thumb_small_path,
        asset.thumb_medium_path,
        asset.thumb_large_path,
        asset.encoded_video_path,
        asset.clip_embedding_path,
    ]
    
    for path in paths_to_delete:
        if path:
            try:
                p = Path(path)
                if p.exists():
                    p.unlink()
            except Exception as e:
                warn("MEDIA", f"Failed to delete file {path}: {e}")


def scan_external_directory(directory: str, user_id: str) -> list:
    """
    Scan an external directory for media files.
    Returns list of file paths found.
    """
    found = []
    dir_path = Path(directory)
    if not dir_path.exists() or not dir_path.is_dir():
        return found
    
    for ext in config.ALL_EXTENSIONS:
        found.extend([str(f) for f in dir_path.rglob(f"*{ext}")])
        found.extend([str(f) for f in dir_path.rglob(f"*{ext.upper()}")])
    
    return list(set(found))
