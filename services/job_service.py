"""Job Service - public API surface for the background job queue.

Re-exports the worker core from job_core and the job handlers registry from
job_handlers so existing call sites (`from services.job_service import ...`)
keep working after the split.
"""
import json
from typing import Optional
from sqlalchemy import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from models import Job
from services.job_core import (
    JobCancelledException,
    JobAlreadyExistsException,
    check_job_cancelled,
    JobWorker,
    job_worker,
)

__all__ = [
    "JobCancelledException",
    "JobAlreadyExistsException",
    "check_job_cancelled",
    "JobWorker",
    "job_worker",
    "create_job",
]


async def create_job(
    db: AsyncSession,
    job_type: str,
    data: Optional[dict] = None,
) -> Job:
    """Create a new job in the queue, rejecting duplicates targeting the same asset.

    Bulk callers (import/scan of thousands of files) call this once per
    asset, each time on the SAME long-lived session - column-only selects
    and expunging the returned job (every caller only ever reads job.id,
    an already-loaded scalar attribute that a detached object still has)
    keep this from being yet another steadily-growing identity map on top
    of the caller's own asset objects.

    The duplicate check is a single indexed lookup on Job.asset_id, not a
    fetch-and-json.loads() of every active job of this type - confirmed
    directly that the old approach was O(n) per call (~11ms at 2000
    pending jobs, growing roughly linearly with queue size), so a big
    import queuing one CLIP+FACE job per asset turned into O(n^2) total,
    blocking the event loop - every request on the server, not just the
    import - for however long that JSON-parsing loop took.
    """
    target_asset_id = data.get("asset_id") if data else None

    existing = await db.execute(
        select(Job.id).where(
            and_(
                Job.job_type == job_type,
                Job.asset_id == target_asset_id,
                or_(Job.status == "PENDING", Job.status == "RUNNING"),
            )
        ).limit(1)
    )
    if existing.first():
        raise JobAlreadyExistsException(
            f"Zaten devam eden veya sıraya alınmış bir '{job_type}' işlemi var."
        )

    job = Job(
        job_type=job_type,
        asset_id=target_asset_id,
        data_json=json.dumps(data) if data else None,
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)
    db.expunge(job)
    return job
