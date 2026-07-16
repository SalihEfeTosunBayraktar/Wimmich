"""TRANSCODE job handler - re-encode videos to broadly browser-compatible H.264.

Videos are served as-is otherwise (utils/video_utils.transcode_video was
defined but never invoked from any job/upload path before this), so
phone-recorded HEVC/H.265 videos would often fail to play in-browser.
"""
import asyncio
from pathlib import Path
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

import config
from models import Asset, Job
from services.job_core import check_job_cancelled
from utils.video_utils import transcode_video, is_ffmpeg_available


async def handle_job_transcode(db: AsyncSession, job: Job):
    """Transcode video assets that don't have a compatible encoded copy yet."""
    if not is_ffmpeg_available():
        return

    data = job.data or {}
    asset_id = data.get("asset_id")

    if asset_id:
        assets_query = select(Asset).where(Asset.id == asset_id)
    else:
        assets_query = select(Asset).where(
            and_(
                Asset.file_type == "VIDEO",
                Asset.encoded_video_path.is_(None),
                Asset.is_trashed == False,
            )
        )

    result = await db.execute(assets_query)
    assets = list(result.scalars().all())

    total = len(assets)
    for i, asset in enumerate(assets):
        await check_job_cancelled(db, job.id)

        encoded_dir = config.ENCODED_DIR / asset.user_id
        encoded_dir.mkdir(parents=True, exist_ok=True)
        output_path = encoded_dir / f"{asset.id}.mp4"

        success = await asyncio.to_thread(transcode_video, asset.file_path, str(output_path))
        if success:
            asset.encoded_video_path = str(output_path)
        else:
            print(f"[JOB] Transcode failed for asset {asset.id}")

        job.progress = int((i + 1) / total * 100) if total > 0 else 100
        await db.commit()
        # See clip_handler.py's identical expunge.
        db.expunge(asset)
