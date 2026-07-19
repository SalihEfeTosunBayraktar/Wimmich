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
from utils.hash_utils import compute_bytes_hash
from utils.log import warn
from services.media_processing import _process_image, _process_video


class UploadIntegrityError(ValueError):
    """A transfer/write completeness check failed (checksum mismatch or a
    truncated write) - distinct from other process_upload() failures
    (unsupported format, corrupt-enough-to-fail-processing) so callers can
    tell a caller-visible client to retry apart from a permanent rejection."""


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
    dest_dir: Optional[Path] = None,
    expected_checksum: Optional[str] = None,
) -> dict:
    """
    Process an uploaded file:
    1. Compute hash, optionally verify it
    2. Save to disk, verify the write landed completely
    3. Extract EXIF/metadata
    4. Generate thumbnails

    `fallback_taken_at` is used when the file has no EXIF/embedded date (very
    common for images that passed through WhatsApp/Telegram, which strip
    metadata) - typically the browser File API's lastModified date, or the
    filesystem mtime for locally-imported files. Without it, such files would
    silently sort by upload time instead of something closer to their actual
    date.

    `dest_dir` overrides where the file is stored (config.UPLOAD_DIR by
    default) - only Folder Import's copy mode ever passes this, to let a
    copy land on a different drive than the app's default storage; the
    regular browser Upload button always omits it.

    `expected_checksum` (SHA-256 hex, optional): only the browser/mobile
    upload flow passes this - a hash the client computed from the same bytes
    before sending. A mismatch here means the transfer "completed" at the
    HTTP layer but silently delivered truncated/corrupted bytes (seen on
    some flaky mobile networks/carrier proxies), caught before anything is
    written to disk rather than only surfacing later as an EXIF/thumbnail
    processing failure - or not surfacing at all, for a truncation subtle
    enough that the file still opens. Raises ValueError on mismatch so the
    caller's existing per-file error handling can report it and the client
    can retry.

    Returns a dict of asset attributes.
    """
    file_type = get_file_type(original_filename)
    if not file_type:
        raise ValueError(f"Unsupported file type: {original_filename}")

    # Hashed from the in-memory bytes rather than reading the file back from
    # disk after writing (the old approach) - one fewer full-file disk read,
    # and lets a checksum mismatch be caught before writing anything at all.
    checksum = await asyncio.to_thread(compute_bytes_hash, file_data)
    if expected_checksum and checksum != expected_checksum:
        raise UploadIntegrityError(
            f"{original_filename}: yükleme eksik veya bozuk geldi (checksum uyuşmadı) - lütfen tekrar deneyin"
        )

    # Generate unique filename
    ext = Path(original_filename).suffix.lower()
    unique_name = f"{uuid.uuid4().hex}{ext}"

    # Create user directory
    user_upload_dir = (dest_dir or config.UPLOAD_DIR) / user_id
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

    # Confirms the write actually landed completely - catches a destination-
    # disk problem (full, disconnected mid-write, permission hiccup) during
    # a regular upload or a Folder Import copy, both of which write through
    # this same save_file(). Cheap (a stat() call, not a re-read+re-hash)
    # and applies regardless of whether expected_checksum was given at all.
    file_size = await asyncio.to_thread(lambda: file_path.stat().st_size)
    if file_size != len(file_data):
        raise UploadIntegrityError(
            f"{original_filename}: dosya diske yazılırken eksik kaldı ({file_size}/{len(file_data)} bayt) - lütfen tekrar deneyin"
        )

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

    # Process based on file type in thread pool. Bounded so one pathological
    # file (huge/corrupt image, decompression-bomb-scale panorama) can't
    # hang forever - see config.MEDIA_PROCESSING_TIMEOUT_SECONDS. Note
    # asyncio.to_thread can't be force-cancelled: on timeout the abandoned
    # OS thread keeps running in the background (harmless here, its return
    # value is simply discarded), but control returns so the caller's
    # existing per-file try/except can log this file and move on to the
    # next one instead of the whole batch/job stalling on it.
    try:
        if file_type == "IMAGE":
            result = await asyncio.wait_for(
                asyncio.to_thread(_process_image, result, str(file_path), unique_name, user_id),
                timeout=config.MEDIA_PROCESSING_TIMEOUT_SECONDS,
            )
        elif file_type == "VIDEO":
            result = await asyncio.wait_for(
                asyncio.to_thread(_process_video, result, str(file_path), unique_name, user_id),
                timeout=config.MEDIA_PROCESSING_TIMEOUT_SECONDS,
            )
    except asyncio.TimeoutError:
        raise TimeoutError(
            f"{original_filename}: medya işleme {config.MEDIA_PROCESSING_TIMEOUT_SECONDS} saniye içinde "
            f"tamamlanamadı (muhtemelen bozuk veya aşırı büyük bir dosya)"
        )

    if result["taken_at"] is None and fallback_taken_at is not None:
        result["taken_at"] = fallback_taken_at

    return result


def delete_asset_files(asset, delete_reference_source: bool = False) -> None:
    """Delete all files associated with an asset.

    is_external assets (the "Reference" import mode, and external-library
    scans) point file_path directly at the user's own original file outside
    Wimmich's data directory instead of an app-owned copy. delete_reference_source
    controls whether that original is included:

    - False (default): never touch it - used by anything that's just
      disconnecting/reorganizing (e.g. remove_reference_root un-linking a
      whole folder, which explicitly leaves the files themselves alone so
      the folder can be re-imported later).
    - True: delete it too - used only by genuine, explicit permanent-delete
      flows (delete_permanently, bulk delete_permanent, trash-retention
      cleanup, account deletion), where "permanently delete this photo"
      is understood to mean everywhere, not just Wimmich's own copy.
      Explicitly requested: the earlier default (never delete) was itself
      a fix for the previous behavior silently erasing source files on
      every permanent delete with no way to opt out either direction -
      this reintroduces it as an explicit choice at each call site instead.

    Everything else (thumbnails, encoded video, CLIP embedding) is an
    app-owned derivative and always safe to remove regardless."""
    paths_to_delete = [
        asset.thumb_small_path,
        asset.thumb_medium_path,
        asset.thumb_large_path,
        asset.encoded_video_path,
        asset.clip_embedding_path,
    ]
    if not asset.is_external or delete_reference_source:
        paths_to_delete.append(asset.file_path)

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
