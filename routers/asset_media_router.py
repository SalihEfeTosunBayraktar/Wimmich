"""Asset Media Router - original file/thumbnail streaming, bulk zip download, memories."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

import config
from database import get_db
from models import User
from auth import get_current_user
from services import asset_query_service, download_service, asset_media_service
from services.memory_service import get_memories as _get_memories
from utils.serializers import asset_to_dict
from utils.path_utils import resolve_data_path

router = APIRouter(prefix="/api/assets", tags=["assets"])


@router.get("/{asset_id}/file")
async def get_asset_file(
    asset_id: str,
    original: bool = Query(False),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Stream the file for playback/download.

    Videos with a transcoded copy (encoded_video_path, broadly browser-
    compatible H.264) are served by default for smoother playback; pass
    ?original=true to force the original file (e.g. for "download original").
    Camera RAW images (.dng etc) get the same treatment: browsers can't
    render RAW at all, so the large thumbnail (extracted from the RAW's
    embedded preview - see utils/image_utils.py) is served in its place.
    """
    asset = await asset_query_service.get_asset_or_404(db, asset_id, user.id)
    return asset_media_service.build_file_response(asset, original)


@router.get("/{asset_id}/thumbnail")
async def get_asset_thumbnail(
    asset_id: str,
    size: str = Query("medium", pattern="^(small|medium|large)$"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get asset thumbnail."""
    asset = await asset_query_service.get_asset_or_404(db, asset_id, user.id)
    return asset_media_service.build_thumbnail_response(asset, size)


@router.get("/faces/{face_id}")
async def get_face_crop(
    face_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get cropped face image."""
    from models import Face, Asset
    from sqlalchemy import select, and_
    from sqlalchemy.orm import selectinload
    import io
    from PIL import Image
    import asyncio
    
    # Query Face and Asset eagerly loading the asset relationship
    stmt = (
        select(Face)
        .options(selectinload(Face.asset))
        .join(Asset)
        .where(and_(Face.id == face_id, Asset.user_id == user.id))
    )
    result = await db.execute(stmt)
    face = result.scalar_one_or_none()
    if not face:
        raise HTTPException(status_code=404, detail="Face not found")
        
    # Extract values for the thread to avoid touching SQLAlchemy session/lazy-load in background thread
    path_choices = [
        (face.asset.thumb_large_path, config.THUMB_DIR),
        (face.asset.file_path, config.UPLOAD_DIR),
    ]
    face_x, face_y, face_w, face_h = face.x, face.y, face.w, face.h

    # Crop the image in a thread pool
    def crop_operation():
        path_to_crop = None
        for stored, base_dir in path_choices:
            resolved = resolve_data_path(stored, base_dir)
            if resolved and resolved.exists():
                path_to_crop = resolved
                break
        if not path_to_crop:
            raise FileNotFoundError("Asset file not found")
        
        with Image.open(path_to_crop) as img:
            width, height = img.size
            left = max(0, min(width - 1, int(face_x * width)))
            top = max(0, min(height - 1, int(face_y * height)))
            right = max(left + 1, min(width, int((face_x + face_w) * width)))
            bottom = max(top + 1, min(height, int((face_y + face_h) * height)))
            
            cropped = img.crop((left, top, right, bottom))
            buf = io.BytesIO()
            cropped.save(buf, format="WEBP", quality=90)
            buf.seek(0)
            return buf
            
    try:
        buf = await asyncio.to_thread(crop_operation)
        return StreamingResponse(buf, media_type="image/webp")
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Asset file not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to crop face: {e}")


@router.get("/download-zip")
async def download_zip(
    ids: List[str] = Query(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Download multiple selected assets as a single zip file."""
    buffer = await download_service.build_zip_archive(db, user, ids)
    return StreamingResponse(
        buffer,
        media_type="application/zip",
        headers={"Content-Disposition": "attachment; filename=wimmich_export.zip"},
    )


@router.get("/memories/today")
async def get_memories(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get 'On This Day' memories."""
    memories = await _get_memories(db, user.id)
    return {
        "memories": [
            {
                "year": mem["year"],
                "years_ago": mem["years_ago"],
                "title": mem["title"],
                "date": mem["date"],
                "asset_count": mem["asset_count"],
                "assets": [asset_to_dict(a) for a in mem["assets"]],
            }
            for mem in memories
        ]
    }
