"""Admin Jobs Router - list/trigger/cancel background jobs."""
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

import config
from database import get_db
from models import User, Job
from auth import get_admin_user
from services.job_service import create_job
from services import job_concurrency_service

router = APIRouter(prefix="/api/admin", tags=["admin"])

VALID_JOB_TYPES = ["THUMBNAIL", "CLIP", "FACE", "SCAN", "CLEANUP", "GEOCODE", "TRANSCODE", "RECLUSTER", "CATEGORIZE", "BACKUP", "SIMILARITY"]


@router.get("/jobs")
async def list_jobs(
    status: Optional[str] = None,
    limit: int = 50,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """List jobs."""
    stmt = select(Job).order_by(Job.created_at.desc()).limit(limit)
    if status:
        stmt = stmt.where(Job.status == status.upper())

    result = await db.execute(stmt)
    jobs = list(result.scalars().all())

    return {
        "jobs": [
            {
                "id": j.id,
                "type": j.job_type,
                "status": j.status,
                "progress": j.progress,
                "error": j.error_message,
                "created_at": j.created_at.isoformat() if j.created_at else None,
                "started_at": j.started_at.isoformat() if j.started_at else None,
                "completed_at": j.completed_at.isoformat() if j.completed_at else None,
            }
            for j in jobs
        ]
    }


@router.post("/jobs/{job_type}/run")
async def run_job(
    job_type: str,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Manually trigger a job."""
    jtype = job_type.upper()
    if jtype not in VALID_JOB_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid job type. Valid: {VALID_JOB_TYPES}")

    existing = (await db.execute(
        select(Job).where(
            and_(
                Job.job_type == jtype,
                or_(Job.status == "PENDING", Job.status == "RUNNING")
            )
        ).limit(1)
    )).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail=f"Zaten devam eden veya sıraya alınmış bir '{jtype}' işlemi var.")

    job = await create_job(db, jtype, {"user_id": admin.id})
    return {"message": "İşlem sıraya alındı", "job_id": job.id}


@router.post("/jobs/cancel-all")
async def cancel_all_jobs(
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Cancel every pending/running job - an escape hatch for when a stuck
    or unwanted job blocks starting new ones and there's no obvious single
    job to cancel."""
    result = await db.execute(
        select(Job).where(or_(Job.status == "PENDING", Job.status == "RUNNING"))
    )
    jobs = list(result.scalars().all())
    now = datetime.now(timezone.utc)
    for job in jobs:
        job.status = "CANCELLED"
        job.completed_at = now
        job.error_message = "Tüm işlemler kullanıcı tarafından sıfırlandı."
    await db.commit()
    return {"message": f"{len(jobs)} işlem iptal edildi", "count": len(jobs)}


@router.post("/jobs/{job_id}/cancel")
async def cancel_job(
    job_id: str,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Cancel a running or pending background job."""
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="İşlem bulunamadı")

    if job.status not in ["PENDING", "RUNNING"]:
        raise HTTPException(status_code=400, detail="Sadece bekleyen veya çalışan işlemler iptal edilebilir.")

    job.status = "CANCELLED"
    job.completed_at = datetime.now(timezone.utc)
    job.error_message = "İşlem kullanıcı tarafından iptal edildi."
    await db.commit()
    return {"message": "İşlem iptal edildi"}


class UpdateJobConcurrencyRequest(BaseModel):
    concurrency: Optional[int] = None  # None = use the env-var default


@router.get("/jobs/concurrency")
async def get_job_concurrency(admin: User = Depends(get_admin_user)):
    settings = job_concurrency_service.get_concurrency_settings()
    return {
        "effective": job_concurrency_service.get_effective_concurrency(),
        "override": settings["concurrency"],
        "default": config.JOB_IMPORT_CONCURRENCY,
        "suggested": job_concurrency_service.get_suggested_concurrency(),
        "system": job_concurrency_service.get_system_info(),
    }


@router.post("/jobs/concurrency")
async def update_job_concurrency(
    req: UpdateJobConcurrencyRequest,
    admin: User = Depends(get_admin_user),
):
    return job_concurrency_service.update_concurrency_settings(req.concurrency)
