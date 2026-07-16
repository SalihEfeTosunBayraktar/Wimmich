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
    """
    target_asset_id = data.get("asset_id") if data else None

    stmt = select(Job.data_json).where(
        and_(
            Job.job_type == job_type,
            or_(Job.status == "PENDING", Job.status == "RUNNING")
        )
    )
    res = await db.execute(stmt)
    active_data_jsons = res.scalars().all()

    for active_data_json in active_data_jsons:
        act_data = json.loads(active_data_json) if active_data_json else {}
        if target_asset_id == act_data.get("asset_id"):
            raise JobAlreadyExistsException(
                f"Zaten devam eden veya sıraya alınmış bir '{job_type}' işlemi var."
            )

    job = Job(
        job_type=job_type,
        data_json=json.dumps(data) if data else None,
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)
    db.expunge(job)
    return job
