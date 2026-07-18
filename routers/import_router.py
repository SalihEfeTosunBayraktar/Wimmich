"""Import Router - Local folder/file import for archive migration."""
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import User, Job
from auth import get_current_user
from services.job_service import create_job
from services.filesystem_browse_service import (
    browse_path, scan_folder_preview, list_reference_roots, remove_reference_root,
)

router = APIRouter(prefix="/api/import", tags=["import"])


class ImportRequest(BaseModel):
    path: str  # Local folder or file path
    copy_files: bool = True  # True=copy, False=reference (external library)
    recursive: bool = True
    dest_path: Optional[str] = None  # Copy mode only: where copies land (defaults to the app's storage)


class BrowseRequest(BaseModel):
    path: Optional[str] = None  # None = show drives/roots


class ReferenceRootRequest(BaseModel):
    path: str


@router.post("/browse")
async def browse_filesystem(
    req: BrowseRequest,
    user: User = Depends(get_current_user),
):
    """Browse local filesystem to select folders for import."""
    import asyncio
    return await asyncio.to_thread(browse_path, req.path)


@router.post("/scan")
async def scan_folder(
    req: ImportRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Scan a folder and show what would be imported."""
    return await scan_folder_preview(db, user.id, req.path, req.recursive, req.copy_files)


@router.post("/start")
async def start_import(
    req: ImportRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Start importing files from a local path."""
    target = Path(req.path)
    if not target.exists():
        raise HTTPException(status_code=404, detail="Yol bulunamadı")

    if req.dest_path and Path(req.dest_path).exists() and not Path(req.dest_path).is_dir():
        raise HTTPException(status_code=400, detail="Hedef yol bir klasör değil")

    job = await create_job(db, "IMPORT", {
        "path": str(target),
        "user_id": user.id,
        "copy_files": req.copy_files,
        "recursive": req.recursive,
        "dest_path": req.dest_path,
    })

    return {"message": "İçe aktarma başlatıldı", "job_id": job.id}


@router.get("/status/{job_id}")
async def import_status(
    job_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get import job status."""
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="İş bulunamadı")

    return {
        "id": job.id,
        "status": job.status,
        "progress": job.progress,
        "error": job.error_message,
        "path": job.data.get("path"),
        "created_at": job.created_at.isoformat() if job.created_at else None,
        "completed_at": job.completed_at.isoformat() if job.completed_at else None,
    }


@router.get("/references")
async def get_reference_roots(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List the distinct folders currently linked via a Reference-mode import."""
    return {"references": await list_reference_roots(db, user.id)}


@router.delete("/references")
async def delete_reference_root(
    req: ReferenceRootRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Un-link every asset referenced from this folder - removes them from
    Wimmich, never touches the original files on disk."""
    count = await remove_reference_root(db, user.id, req.path)
    return {"message": f"{count} referans kaldırıldı", "count": count}
