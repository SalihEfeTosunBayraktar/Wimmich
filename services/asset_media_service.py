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

# A thumbnail/original is immutable for a given asset id: regenerating one
# (the REPAIR/THUMBNAIL jobs) writes a NEW uuid-named file and repoints the
# asset at it, so a cached response can never go stale for the URL that
# served it. Without this header every gallery view re-requested all ~60
# thumbnails on the page - each one an authenticated request with its own
# session+user lookup and asset lookup, which is precisely the load that
# made browsing painful while a job was running. "private" keeps them out
# of shared/CDN caches, since these URLs are per-user authenticated.
#
# NOT applied to video responses. A <video> element fetches with a Range
# header, FileResponse answers 206 Partial Content, and the header would
# then mark that *partial* body cacheable for the whole URL - the browser
# replays the fragment for later requests and playback breaks. Videos are
# one request per view anyway, so there was nothing to win there.
_MEDIA_CACHE_CONTROL = "private, max-age=604800"  # 7 days


def _cached(response: FileResponse) -> FileResponse:
    response.headers["Cache-Control"] = _MEDIA_CACHE_CONTROL
    return response


def _is_video(asset: Asset) -> bool:
    return asset.file_type == "VIDEO" or (asset.mime_type or "").startswith("video/")


def _cached_unless_video(asset: Asset, response: FileResponse) -> FileResponse:
    return response if _is_video(asset) else _cached(response)


def build_thumbnail_response(asset: Asset, size: str) -> FileResponse:
    stored_thumb_path = getattr(asset, f"thumb_{size}_path", None)
    thumb_path = resolve_data_path(stored_thumb_path, config.THUMB_DIR)
    if not thumb_path or not thumb_path.exists():
        # Fallback to original for images
        file_path = resolve_data_path(asset.file_path, config.UPLOAD_DIR)
        if asset.file_type == "IMAGE" and file_path and file_path.exists():
            # filename= forces Content-Disposition: attachment, same as
            # build_file_response below - without it this was the one place
            # in the app serving an asset's own file inline with its stored
            # mime_type, which mattered a lot when SVG (a script execution
            # context, not just an image format) was still an accepted
            # upload type. Kept as defense-in-depth even now that .svg is
            # rejected at upload time, since this endpoint is reachable
            # unauthenticated via share links and any pre-existing SVG
            # asset would otherwise still serve inline.
            return _cached(FileResponse(file_path, media_type=asset.mime_type, filename=asset.original_file_name))
        raise HTTPException(status_code=404, detail="Thumbnail not found")

    media_type = "image/webp" if str(thumb_path).endswith(".webp") else "image/jpeg"
    return _cached(FileResponse(thumb_path, media_type=media_type))


def build_file_response(asset: Asset, original: bool = False) -> FileResponse:
    encoded_path = resolve_data_path(asset.encoded_video_path, config.ENCODED_DIR)
    if not original and encoded_path and encoded_path.exists():
        return FileResponse(encoded_path, media_type="video/mp4", filename=asset.original_file_name)

    is_raw = Path(asset.file_path).suffix.lower() in RAW_EXTENSIONS
    thumb_large_path = resolve_data_path(asset.thumb_large_path, config.THUMB_DIR)
    if not original and is_raw and thumb_large_path and thumb_large_path.exists():
        media_type = "image/webp" if str(thumb_large_path).endswith(".webp") else "image/jpeg"
        return _cached(FileResponse(thumb_large_path, media_type=media_type))

    file_path = resolve_data_path(asset.file_path, config.UPLOAD_DIR)
    if not file_path or not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found on disk")

    return _cached_unless_video(asset, FileResponse(
        file_path,
        media_type=asset.mime_type,
        filename=asset.original_file_name,
    ))
