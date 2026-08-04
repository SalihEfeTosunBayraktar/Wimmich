"""Memory Video Router - auto-generated "on this day"/weekly slideshow
videos: listing, playback, deletion, manual trigger, and the per-user
enable/style settings."""
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import User, MemoryVideo
from auth import get_current_user
from services import memory_video_service, video_style_service
from services.job_service import create_job, JobAlreadyExistsException
from utils.serializers import memory_video_to_dict

router = APIRouter(prefix="/api/memory-videos", tags=["memory-videos"])


async def _get_owned_video(db: AsyncSession, user_id: str, video_id: str) -> MemoryVideo:
    result = await db.execute(
        select(MemoryVideo).where(and_(MemoryVideo.id == video_id, MemoryVideo.user_id == user_id))
    )
    video = result.scalar_one_or_none()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    return video


@router.get("")
async def list_memory_videos(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    videos = await memory_video_service.list_for_user(db, user.id)
    return {"videos": [memory_video_to_dict(v) for v in videos]}


@router.get("/styles")
async def list_styles(user: User = Depends(get_current_user)):
    return {"styles": video_style_service.get_style_choices()}


class SettingsRequest(BaseModel):
    enabled: Optional[bool] = None
    style: Optional[str] = None


@router.put("/settings")
async def update_settings(
    req: SettingsRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if req.enabled is not None:
        user.memory_video_enabled = req.enabled
    if req.style is not None:
        if req.style not in video_style_service.VIDEO_STYLES:
            raise HTTPException(status_code=400, detail="Unknown style")
        user.memory_video_style = req.style
    await db.commit()
    return {
        "enabled": user.memory_video_enabled,
        "style": user.memory_video_style,
    }


@router.get("/settings")
async def get_settings(user: User = Depends(get_current_user)):
    return {
        "enabled": user.memory_video_enabled,
        "style": user.memory_video_style,
    }


class GenerateRequest(BaseModel):
    kind: str  # DAILY or WEEKLY


@router.post("/generate")
async def generate_now(
    req: GenerateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Manual "generate now" - queues the same MEMORY_VIDEO job the
    periodic scheduler would, so a user can try the feature (or force a
    re-check) without waiting up to CHECK_INTERVAL_SECONDS for the next
    automatic pass. Works regardless of memory_video_enabled - the toggle
    only gates the *automatic* scheduler, not an explicit request."""
    if req.kind not in ("DAILY", "WEEKLY"):
        raise HTTPException(status_code=400, detail="kind must be DAILY or WEEKLY")
    try:
        job = await create_job(db, "MEMORY_VIDEO", {"user_id": user.id, "kind": req.kind})
    except JobAlreadyExistsException as e:
        raise HTTPException(status_code=409, detail=str(e))
    return {"job_id": job.id}


@router.delete("/{video_id}")
async def delete_memory_video(
    video_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    ok = await memory_video_service.delete_video(db, user.id, video_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Video not found")
    return {"message": "Video deleted"}


@router.get("/{video_id}/file")
async def get_memory_video_file(
    video_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    video = await _get_owned_video(db, user.id, video_id)
    if not video.video_path:
        raise HTTPException(status_code=404, detail="Video not ready")
    path = Path(video.video_path)
    if not path.exists():
        raise HTTPException(status_code=404, detail="Video file missing on disk")
    return FileResponse(path, media_type="video/mp4")


@router.get("/{video_id}/thumbnail")
async def get_memory_video_thumbnail(
    video_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    video = await _get_owned_video(db, user.id, video_id)
    if not video.thumb_path:
        raise HTTPException(status_code=404, detail="Thumbnail not available")
    path = Path(video.thumb_path)
    if not path.exists():
        raise HTTPException(status_code=404, detail="Thumbnail file missing on disk")
    return FileResponse(path, media_type="image/jpeg")
