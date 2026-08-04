"""Periodic idle-timeout unload for the CLIP/face-recognition models -
frees several GB of GPU (or system) memory during stretches with no ML
activity. Off by default (config.GPU_IDLE_UNLOAD_ENABLED); see config.py's
own comment for why.

Two independent guards against unloading a model that's actually in use:
1. Each model's own idle_seconds() only counts time since its last real
   embedding computation - a long-running batch job keeps resetting this
   on every single image processed, so it never approaches the timeout
   while genuinely busy (see clip_service.py/face_service.py's matching
   comments on their own _last_used tracking).
2. Belt-and-suspenders, explicitly requested: skipped entirely whenever a
   CLIP or FACE job is currently RUNNING, regardless of what
   idle_seconds() reports - a model sitting between two embedding calls
   for slightly longer than usual (one big image, a brief GPU contention
   stall) shouldn't be misread as "idle" just because that one gap was
   wider than normal.
"""
import asyncio
from sqlalchemy import select, and_

import config
from database import AsyncSessionLocal
from models import Job
from utils.log import info, error

# Checking every 2 minutes against a timeout measured in whole minutes
# means the worst-case delay past the configured timeout is small relative
# to it, without polling so often it's pointless overhead.
CHECK_INTERVAL_SECONDS = 120

_task = None
_running = False


async def _ml_job_currently_running() -> bool:
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Job.id).where(
                and_(Job.job_type.in_(("CLIP", "FACE")), Job.status == "RUNNING")
            ).limit(1)
        )
        return result.first() is not None


async def _check_once():
    if not config.GPU_IDLE_UNLOAD_ENABLED:
        return

    from services.clip_service import idle_seconds as clip_idle_seconds, unload_clip
    from services.face_service import idle_seconds as face_idle_seconds, unload_face_models

    timeout_seconds = config.GPU_IDLE_UNLOAD_MINUTES * 60
    clip_idle = clip_idle_seconds()
    face_idle = face_idle_seconds()
    clip_should_unload = clip_idle is not None and clip_idle >= timeout_seconds
    face_should_unload = face_idle is not None and face_idle >= timeout_seconds

    if not clip_should_unload and not face_should_unload:
        return  # neither is loaded, or loaded but still within its timeout

    if await _ml_job_currently_running():
        return

    if clip_should_unload:
        unload_clip()
    if face_should_unload:
        unload_face_models()


async def _loop():
    global _running
    _running = True
    while _running:
        try:
            await _check_once()
        except Exception as e:
            error("GPU-IDLE", f"Idle-unload check failed: {e}")
        await asyncio.sleep(CHECK_INTERVAL_SECONDS)


async def start():
    global _task
    if _task is not None:
        return
    _task = asyncio.create_task(_loop())
    info("BOOT", "GPU idle-unload scheduler started")


async def stop():
    global _running, _task
    _running = False
    if _task is not None:
        _task.cancel()
        _task = None
