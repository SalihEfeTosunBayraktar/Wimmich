"""Periodic trigger for auto-generated memory videos.

This app has no external scheduler (no APScheduler/Celery beat) - this is
a plain asyncio loop task started from main.py's lifespan, the same
lightweight pattern the job worker itself uses. Wakes every
CHECK_INTERVAL_SECONDS and queues a DAILY and a WEEKLY MEMORY_VIDEO job for
every user with memory_video_enabled on.

Both job kinds are idempotent (memory_video_service checks
MemoryVideo.source_key before doing any real work), so waking up more
often than strictly necessary just costs an occasional "nothing new"
no-op job, not a duplicate video - simpler and more restart-safe than
tracking "did I already run today" state that would need to survive a
server restart correctly.
"""
import asyncio
from sqlalchemy import select

from database import AsyncSessionLocal
from models import User
from services.job_service import create_job, JobAlreadyExistsException
from utils.log import info, error

CHECK_INTERVAL_SECONDS = 6 * 60 * 60  # every 6 hours

_task = None
_running = False


async def _check_once():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.memory_video_enabled == True))
        users = list(result.scalars().all())
        for user in users:
            for kind in ("DAILY", "WEEKLY"):
                try:
                    await create_job(db, "MEMORY_VIDEO", {"user_id": user.id, "kind": kind})
                except JobAlreadyExistsException:
                    pass  # already queued/running - the point of the dedup check


async def _loop():
    global _running
    _running = True
    # Small delay so this doesn't compete with everything else spinning up
    # right at startup (ML model loads, tunnel connect, etc.).
    await asyncio.sleep(30)
    while _running:
        try:
            await _check_once()
        except Exception as e:
            error("MEMVID-SCHED", f"Scheduler check failed: {e}")
        await asyncio.sleep(CHECK_INTERVAL_SECONDS)


async def start():
    global _task
    if _task is not None:
        return
    _task = asyncio.create_task(_loop())
    info("BOOT", "Memory video scheduler started")


async def stop():
    global _running, _task
    _running = False
    if _task is not None:
        _task.cancel()
        _task = None
