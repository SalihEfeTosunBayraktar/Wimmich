"""Shared dict serializers for API responses (Asset, Album)."""
import math
from typing import Optional

from models import Asset, Album


def _clean_coord(value: Optional[float]) -> Optional[float]:
    """Return None for NaN/Inf coordinates (invalid GPS data)."""
    if value is None:
        return None
    try:
        if math.isnan(value) or math.isinf(value):
            return None
    except Exception:
        return None
    return value


def asset_to_dict(asset: Asset) -> dict:
    """Serialize an Asset model to the API response shape."""
    return {
        "id": asset.id,
        "file_name": asset.original_file_name,
        "file_type": asset.file_type,
        "mime_type": asset.mime_type,
        "file_size": asset.file_size,
        "width": asset.width,
        "height": asset.height,
        "duration_seconds": asset.duration_seconds,
        "taken_at": asset.taken_at.isoformat() if asset.taken_at else None,
        "created_at": asset.created_at.isoformat() if asset.created_at else None,
        "latitude": _clean_coord(asset.latitude),
        "longitude": _clean_coord(asset.longitude),
        "city": asset.city,
        "country": asset.country,
        "is_favorite": asset.is_favorite,
        "is_archived": asset.is_archived,
        "is_trashed": asset.is_trashed,
        "has_faces": False,
        "exif": asset.exif_dict if asset.exif_data else None,
        "thumb_small": f"/api/assets/{asset.id}/thumbnail?size=small" if asset.thumb_small_path else None,
        "thumb_medium": f"/api/assets/{asset.id}/thumbnail?size=medium" if asset.thumb_medium_path else None,
        "thumb_large": f"/api/assets/{asset.id}/thumbnail?size=large" if asset.thumb_large_path else None,
        "file_url": f"/api/assets/{asset.id}/file",
    }


def album_to_dict(album: Album, asset_count: int = 0, cover_thumb: Optional[str] = None) -> dict:
    """Serialize an Album model to the API response shape."""
    return {
        "id": album.id,
        "name": album.name,
        "description": album.description,
        "cover_asset_id": album.cover_asset_id,
        "cover_thumb": cover_thumb,
        "asset_count": asset_count,
        "created_at": album.created_at.isoformat() if album.created_at else None,
        "updated_at": album.updated_at.isoformat() if album.updated_at else None,
        "user_id": album.user_id,
    }
