"""TRANSCODE job handler - re-encode videos to broadly browser-compatible H.264.

Videos are served as-is otherwise (utils/video_utils.transcode_video was
defined but never invoked from any job/upload path before this), so
phone-recorded HEVC/H.265 videos would often fail to play in-browser.
"""
import asyncio
import threading
from pathlib import Path
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

import config
from models import Asset, Job
from services.job_core import check_job_cancelled, JobCancelledException
from utils.video_utils import transcode_video, is_ffmpeg_available

# How often the handler re-checks the job's cancelled flag WHILE ffmpeg is
# running on the current asset, not just between assets - see
# _transcode_with_cancellation's docstring.
CANCEL_POLL_SECONDS = 2


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

        success = await _transcode_with_cancellation(db, job.id, asset.file_path, str(output_path))
        if success:
            asset.encoded_video_path = str(output_path)
        else:
            print(f"[JOB] Transcode failed for asset {asset.id}")

        job.progress = int((i + 1) / total * 100) if total > 0 else 100
        await db.commit()
        # See clip_handler.py's identical expunge.
        db.expunge(asset)


async def _transcode_with_cancellation(db: AsyncSession, job_id: str, input_path: str, output_path: str) -> bool:
    """Runs transcode_video() while polling the job's cancelled flag every
    CANCEL_POLL_SECONDS - a plain `await asyncio.to_thread(transcode_video,
    ...)` blocks until ffmpeg exits on its own with no way back in, so
    cancelling mid-transcode neither stopped ffmpeg (it kept using CPU/RAM
    until it finished by itself, possibly up to the 1hr ceiling) nor freed
    the job worker to pick up the next queued job in the meantime."""
    cancel_event = threading.Event()
    transcode_task = asyncio.ensure_future(
        asyncio.to_thread(transcode_video, input_path, output_path, cancel_event=cancel_event)
    )

    while not transcode_task.done():
        try:
            await check_job_cancelled(db, job_id)
        except JobCancelledException:
            cancel_event.set()
            await transcode_task  # let the thread finish killing ffmpeg before we return
            raise
        await asyncio.wait([transcode_task], timeout=CANCEL_POLL_SECONDS)

    return transcode_task.result()
