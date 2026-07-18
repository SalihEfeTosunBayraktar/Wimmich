"""File-serving logic for asset thumbnails/originals - shared between the
authenticated endpoints (asset_media_router.py) and the public share-scoped
endpoints (share_router.py) so the RAW/encoded-video/thumbnail-fallback
handling can't drift between the two."""
from pathlib import Path
from fastapi import HTTPException
from fastapi.responses import FileResponse

import config
from models import Asset
from utils.image_utils import RAW_EXTENSIONS
from utils.path_utils import resolve_data_path


def build_thumbnail_response(asset: Asset, size: str) -> FileResponse:
    stored_thumb_path = getattr(asset, f"thumb_{size}_path", None)
    thumb_path = resolve_data_path(stored_thumb_path, config.THUMB_DIR)
    if not thumb_path or not thumb_path.exists():
        # Fallback to original for images
        file_path = resolve_data_path(asset.file_path, config.UPLOAD_DIR)
        if asset.file_type == "IMAGE" and file_path and file_path.exists():
            return FileResponse(file_path, media_type=asset.mime_type)
        raise HTTPException(status_code=404, detail="Thumbnail not found")

    media_type = "image/webp" if str(thumb_path).endswith(".webp") else "image/jpeg"
    return FileResponse(thumb_path, media_type=media_type)


def build_file_response(asset: Asset, original: bool = False) -> FileResponse:
    encoded_path = resolve_data_path(asset.encoded_video_path, config.ENCODED_DIR)
    if not original and encoded_path and encoded_path.exists():
        return FileResponse(encoded_path, media_type="video/mp4", filename=asset.original_file_name)

    is_raw = Path(asset.file_path).suffix.lower() in RAW_EXTENSIONS
    thumb_large_path = resolve_data_path(asset.thumb_large_path, config.THUMB_DIR)
    if not original and is_raw and thumb_large_path and thumb_large_path.exists():
        media_type = "image/webp" if str(thumb_large_path).endswith(".webp") else "image/jpeg"
        return FileResponse(thumb_large_path, media_type=media_type)

    file_path = resolve_data_path(asset.file_path, config.UPLOAD_DIR)
    if not file_path or not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found on disk")

    return FileResponse(
        file_path,
        media_type=asset.mime_type,
        filename=asset.original_file_name,
    )
