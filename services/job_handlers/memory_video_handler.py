"""MEMORY_VIDEO job handler - renders auto-generated "on this day"/weekly
slideshow videos for one user. job.data: {"user_id": ..., "kind": "DAILY"
or "WEEKLY"}."""
import threading
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

import config
from models import Job, User
from services import memory_video_service
from services.job_core import check_job_cancelled, run_cancellable


async def handle_job_memory_video(db: AsyncSession, job: Job):
    data = job.data or {}
    user_id = data.get("user_id")
    kind = data.get("kind")
    if not user_id or kind not in ("DAILY", "WEEKLY"):
        raise ValueError("MEMORY_VIDEO job requires user_id and kind (DAILY/WEEKLY)")

    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not user:
        return  # user deleted since the job was queued - nothing to do

    if kind == "DAILY":
        groups = await memory_video_service.pending_daily_groups(db, user)
    else:
        group = await memory_video_service.pending_weekly_group(db, user)
        groups = [group] if group else []

    total = len(groups) or 1
    for i, group in enumerate(groups):
        await check_job_cancelled(db, job.id)
        cancel_event = threading.Event()
        await run_cancellable(
            db, job.id, cancel_event,
            memory_video_service.render_group(
                db, user, kind, group["title"], group["source_key"], group["assets"],
                cancel_event=cancel_event,
            ),
        )
        job.progress = int((i + 1) / total * 100)
        await db.commit()
