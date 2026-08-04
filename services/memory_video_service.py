"""Auto-generated "on this day" / weekly-highlight slideshow videos.

Each "on this day" year group gets its own separate video (per user
request: a 2015 memory and a 2019 memory on the same day are different
moments, not one blended reel) - see generate_daily(). A weekly summary
covers the last 7 days in one video - see generate_weekly(). Both are
idempotent against MemoryVideo.source_key, so calling either repeatedly
(the periodic scheduler wakes up regularly) never produces duplicates.
"""
import asyncio
import threading
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import List, Optional
from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession

import config
from models import Asset, MemoryVideo, User
from services.memory_service import get_memories
from services.video_style_service import build_video, DEFAULT_STYLE
from utils.path_utils import resolve_data_path
from utils.video_utils import get_video_info, create_video_thumbnail
from utils.log import warn, success

# Below this many photos, a slideshow reads as thin rather than as a
# highlight reel - the memory/week just gets skipped for video generation
# that round (it's still visible as a normal photo group everywhere else).
MIN_PHOTOS_DAILY = 3
MIN_PHOTOS_WEEKLY = 5
MAX_PHOTOS_PER_VIDEO = 20

_TR_MONTHS = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
]


def _date_label(asset: Asset) -> Optional[str]:
    """"Temmuz 2019"-style caption for the date-overlay option - month name
    rather than a numeric date, since the video is a "memory" (which
    month/year this was) not a filing record needing day-level precision."""
    d = asset.taken_at or asset.created_at
    if not d:
        return None
    return f"{_TR_MONTHS[d.month - 1]} {d.year}"


def _source_image_path(asset: Asset) -> Optional[str]:
    """Prefers an existing thumbnail over the original file - a 20-photo
    video is already several ffmpeg invocations; feeding it multi-megapixel
    RAW/HEIC originals instead of already-decoded, uniformly-sized
    thumbnails would multiply that cost for no visible quality gain in a
    1280x720 output."""
    for attr in ("thumb_large_path", "thumb_medium_path"):
        stored = getattr(asset, attr, None)
        if not stored:
            continue
        resolved = resolve_data_path(stored, config.THUMB_DIR)
        if resolved and resolved.exists():
            return str(resolved)
    resolved = resolve_data_path(asset.file_path, config.UPLOAD_DIR)
    return str(resolved) if resolved and resolved.exists() else None


async def _already_generated(db: AsyncSession, user_id: str, source_key: str) -> bool:
    stmt = select(MemoryVideo.id).where(
        and_(MemoryVideo.user_id == user_id, MemoryVideo.source_key == source_key)
    )
    return (await db.execute(stmt)).scalar_one_or_none() is not None


async def render_group(
    db: AsyncSession,
    user: User,
    kind: str,
    title: str,
    source_key: str,
    assets: List[Asset],
    cancel_event: Optional[threading.Event] = None,
) -> MemoryVideo:
    """Builds one video from one photo group and records it. Always
    returns a MemoryVideo row (status READY or FAILED) rather than raising
    - a render failure for one memory group shouldn't be indistinguishable
    from "nothing was ever attempted" in the UI."""
    style = user.memory_video_style or DEFAULT_STYLE
    format_key = user.memory_video_format or "landscape"
    show_date = bool(user.memory_video_show_date)

    image_paths = []
    labels = []
    used_asset_ids = []
    for asset in assets[:MAX_PHOTOS_PER_VIDEO]:
        if asset.file_type != "IMAGE":
            continue  # a video clip isn't slideshow material here (v1)
        path = _source_image_path(asset)
        if path:
            image_paths.append(path)
            labels.append(_date_label(asset) if show_date else None)
            used_asset_ids.append(asset.id)

    video = MemoryVideo(
        user_id=user.id, kind=kind, style=style, format=format_key, title=title,
        source_key=source_key, status="PENDING",
    )
    video.asset_ids = used_asset_ids
    db.add(video)
    await db.flush()

    if len(image_paths) < 2:
        video.status = "FAILED"
        video.error_message = "Yeterli fotoğraf yok (en az 2 gerekli)"
        await db.commit()
        return video

    out_dir = config.MEMORY_VIDEO_DIR / user.id
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"{video.id}.mp4"
    thumb_path = out_dir / f"{video.id}_thumb.jpg"

    try:
        ok = await asyncio.to_thread(
            build_video, style, image_paths, str(out_path), cancel_event, format_key, labels,
        )
        if not ok:
            video.status = "FAILED"
            video.error_message = "Video oluşturulamadı (ffmpeg hatası)"
            await db.commit()
            return video

        info = await asyncio.to_thread(get_video_info, str(out_path))
        await asyncio.to_thread(create_video_thumbnail, str(out_path), str(thumb_path))

        video.video_path = str(out_path)
        video.thumb_path = str(thumb_path) if thumb_path.exists() else None
        video.duration_seconds = int(info.get("duration") or 0) or None
        video.status = "READY"
        await db.commit()
        success("MEMVID", f"Generated {kind} video for user {user.id}: {title} ({len(image_paths)} photos)")
        return video
    except Exception as e:
        video.status = "FAILED"
        video.error_message = str(e)[:500]
        await db.commit()
        warn("MEMVID", f"Failed to render {kind} video for user {user.id}: {e}")
        return video


async def pending_daily_groups(db: AsyncSession, user: User) -> List[dict]:
    """Today's 'on this day' groups this user hasn't already gotten a video
    for, each with its own dedup key so a 2015 memory and a 2019 memory on
    the same calendar day generate two separate videos, not one blended
    reel - per explicit request, not an oversight."""
    memories = await get_memories(db, user.id)
    now = datetime.now(timezone.utc)
    date_str = now.strftime("%Y-%m-%d")

    pending = []
    for group in memories:
        if group["asset_count"] < MIN_PHOTOS_DAILY:
            continue
        source_key = f"daily:{date_str}:{group['years_ago']}"
        if await _already_generated(db, user.id, source_key):
            continue
        pending.append({
            "source_key": source_key,
            "title": f"{group['years_ago']} yıl önce bugün" if group["years_ago"] > 1 else "1 yıl önce bugün",
            "assets": group["assets"],
        })
    return pending


async def pending_weekly_group(db: AsyncSession, user: User) -> Optional[dict]:
    """Last 7 days' photos, keyed by ISO week so re-running the same week
    never double-generates."""
    now = datetime.now(timezone.utc)
    iso_year, iso_week, _ = now.isocalendar()
    source_key = f"weekly:{iso_year}-W{iso_week:02d}"
    if await _already_generated(db, user.id, source_key):
        return None

    week_ago = now - timedelta(days=7)
    stmt = (
        select(Asset)
        .where(
            and_(
                Asset.user_id == user.id,
                Asset.is_trashed == False,
                Asset.file_type == "IMAGE",
                func.coalesce(Asset.taken_at, Asset.created_at) >= week_ago.replace(tzinfo=None),
            )
        )
        .order_by(func.coalesce(Asset.taken_at, Asset.created_at))
    )
    assets = list((await db.execute(stmt)).scalars().all())
    if len(assets) < MIN_PHOTOS_WEEKLY:
        return None

    # Evenly sampled across the week rather than the first N chronologically -
    # a week with 200 photos shouldn't produce a video that's entirely
    # Monday morning just because that's where the list starts.
    if len(assets) > MAX_PHOTOS_PER_VIDEO:
        step = len(assets) / MAX_PHOTOS_PER_VIDEO
        assets = [assets[int(i * step)] for i in range(MAX_PHOTOS_PER_VIDEO)]

    return {"source_key": source_key, "title": "Bu haftanın özeti", "assets": assets}


async def list_for_user(db: AsyncSession, user_id: str) -> List[MemoryVideo]:
    stmt = (
        select(MemoryVideo)
        .where(MemoryVideo.user_id == user_id)
        .order_by(MemoryVideo.created_at.desc())
    )
    return list((await db.execute(stmt)).scalars().all())


async def delete_video(db: AsyncSession, user_id: str, video_id: str) -> bool:
    stmt = select(MemoryVideo).where(
        and_(MemoryVideo.id == video_id, MemoryVideo.user_id == user_id)
    )
    video = (await db.execute(stmt)).scalar_one_or_none()
    if not video:
        return False
    for path_str in (video.video_path, video.thumb_path):
        if path_str:
            Path(path_str).unlink(missing_ok=True)
    await db.delete(video)
    await db.commit()
    return True
