"""Reference-mode import: index a file in place without copying it."""
import json
import os
import uuid
from datetime import datetime

import config
from models import Asset


async def build_reference_asset(file_path: str, filename: str, user_id: str) -> Asset:
    """Build an Asset that indexes a file in place, without copying it (reference mode)."""
    import asyncio
    from services.media_service import get_file_type, get_mime_type
    from utils.exif_utils import extract_exif
    from utils.image_utils import create_thumbnail
    from utils.hash_utils import compute_file_hash

    file_size = await asyncio.to_thread(os.path.getsize, file_path)
    asset = Asset(
        user_id=user_id,
        file_path=file_path,
        file_name=filename,
        original_file_name=filename,
        file_type=get_file_type(filename) or "IMAGE",
        mime_type=get_mime_type(filename),
        file_size=file_size,
        is_external=True,
        external_path=file_path,
    )
    asset.checksum = await asyncio.to_thread(compute_file_hash, file_path)

    if asset.file_type == "IMAGE":
        exif = await asyncio.to_thread(extract_exif, file_path)
        asset.width = exif.get("width")
        asset.height = exif.get("height")
        asset.latitude = exif.get("latitude")
        asset.longitude = exif.get("longitude")
        if exif.get("taken_at"):
            try:
                asset.taken_at = datetime.fromisoformat(exif["taken_at"])
            except (ValueError, TypeError):
                pass
        if asset.taken_at is None:
            def get_mtime():
                return datetime.fromtimestamp(os.path.getmtime(file_path))
            asset.taken_at = await asyncio.to_thread(get_mtime)
        exif_clean = {k: v for k, v in exif.items() if k != "raw" and v is not None}
        asset.exif_data = json.dumps(exif_clean)

        thumb_base = config.THUMB_DIR / user_id
        thumb_base.mkdir(parents=True, exist_ok=True)
        stem = uuid.uuid4().hex
        for size_name, size_px in config.THUMB_SIZES.items():
            thumb_path = thumb_base / f"{stem}_{size_name}.webp"
            created = await asyncio.to_thread(create_thumbnail, file_path, str(thumb_path), max_size=size_px)
            if created:
                setattr(asset, f"thumb_{size_name}_path", str(thumb_path))
    elif asset.file_type == "VIDEO":
        def get_mtime():
            return datetime.fromtimestamp(os.path.getmtime(file_path))
        asset.taken_at = await asyncio.to_thread(get_mtime)

    return asset
