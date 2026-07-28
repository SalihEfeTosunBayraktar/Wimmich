"""Admin Router - server statistics and user listing."""
import shutil
from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

import config
from database import get_db
from models import User, Asset, Album, Job, Person, SharedLink
from auth import get_admin_user
from services.ml_service import get_ml_status
from services.job_service import job_worker
from utils.video_utils import is_ffmpeg_available

router = APIRouter(prefix="/api/admin", tags=["admin"])


def _get_storage_warning(total_size: int) -> dict:
    """Two independent checks - see config.py's STORAGE_WARN_PERCENT/
    DISK_WARN_FREE_GB comment for why neither alone is sufficient."""
    quota_warning = False
    limit_mb = config.TOTAL_STORAGE_LIMIT_MB
    if limit_mb > 0:
        used_percent = (total_size / (limit_mb * 1024 * 1024)) * 100
        quota_warning = used_percent >= config.STORAGE_WARN_PERCENT

    disk_warning = False
    disk_free_gb = None
    disk_total_gb = None
    try:
        usage = shutil.disk_usage(config.DATA_DIR)
        disk_free_gb = round(usage.free / (1024 ** 3), 1)
        disk_total_gb = round(usage.total / (1024 ** 3), 1)
        disk_warning = disk_free_gb < config.DISK_WARN_FREE_GB
    except OSError:
        pass  # data dir on an unreachable/disconnected volume - not fatal, just no disk reading

    return {
        "quota_warning": quota_warning,
        "disk_warning": disk_warning,
        "disk_free_gb": disk_free_gb,
        "disk_total_gb": disk_total_gb,
        "total_storage_limit_mb": limit_mb,
    }


@router.get("/stats")
async def get_server_stats(
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Get server statistics."""
    user_count = (await db.execute(select(func.count(User.id)))).scalar()

    total_assets = (await db.execute(
        select(func.count(Asset.id)).where(Asset.is_trashed == False)
    )).scalar()

    total_photos = (await db.execute(
        select(func.count(Asset.id)).where(
            Asset.file_type == "IMAGE", Asset.is_trashed == False
        )
    )).scalar()

    total_videos = (await db.execute(
        select(func.count(Asset.id)).where(
            Asset.file_type == "VIDEO", Asset.is_trashed == False
        )
    )).scalar()

    total_size = (await db.execute(select(func.sum(Asset.file_size)))).scalar() or 0

    album_count = (await db.execute(select(func.count(Album.id)))).scalar()
    person_count = (await db.execute(select(func.count(Person.id)))).scalar()
    share_count = (await db.execute(select(func.count(SharedLink.id)))).scalar()

    pending_jobs = (await db.execute(
        select(func.count(Job.id)).where(Job.status == "PENDING")
    )).scalar()
    running_jobs = (await db.execute(
        select(func.count(Job.id)).where(Job.status == "RUNNING")
    )).scalar()
    session_stats = job_worker.get_session_stats()

    return {
        "users": user_count,
        "total_assets": total_assets,
        "photos": total_photos,
        "videos": total_videos,
        "total_size": total_size,
        "albums": album_count,
        "people": person_count,
        "shared_links": share_count,
        "jobs": {
            "pending": pending_jobs,
            "running": running_jobs,
            "completed": session_stats["completed"],
            "failed": session_stats["failed"],
        },
        "ml": get_ml_status(),
        "ffmpeg_available": is_ffmpeg_available(),
        "storage_warning": _get_storage_warning(total_size),
    }


@router.get("/users")
async def list_users(
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """List all users."""
    stmt = select(User).order_by(User.created_at)
    result = await db.execute(stmt)
    users = list(result.scalars().all())

    user_list = []
    for u in users:
        asset_count = (await db.execute(
            select(func.count(Asset.id)).where(Asset.user_id == u.id)
        )).scalar()
        total_size = (await db.execute(
            select(func.sum(Asset.file_size)).where(Asset.user_id == u.id)
        )).scalar() or 0

        user_list.append({
            "id": u.id,
            "email": u.email,
            "name": u.name,
            "is_admin": u.is_admin,
            "is_approved": u.is_approved,
            "created_at": u.created_at.isoformat() if u.created_at else None,
            "asset_count": asset_count,
            "total_size": total_size,
            "storage_quota_mb": u.storage_quota_mb,
            "priority": u.priority,
        })

    return {"users": user_list}


@router.post("/shutdown")
async def shutdown_server(
    admin: User = Depends(get_admin_user),
):
    """Cleanly stop background work and release GPU/CPU memory, then exit
    the process - the safe alternative to closing the console window while
    a job is running. A hard window close kills everything at once with
    none of this cleanup (the Cloudflare Tunnel child process included),
    and can visibly stall the whole machine for a moment while Windows
    reclaims several GB of abruptly-orphaned CUDA memory in one go instead
    of it being released in an orderly way first.
    """
    from services.shutdown_service import graceful_cleanup, schedule_exit

    await graceful_cleanup()
    schedule_exit(0)
    return {"message": "Sunucu kapatılıyor"}


@router.post("/restart")
async def restart_server(
    admin: User = Depends(get_admin_user),
):
    """Same graceful cleanup as /shutdown, but exits with the "relaunch me"
    code instead of the plain one - start.bat's loop (also used by
    /update/apply) brings the process straight back up. For when a setting
    change or a stuck background worker calls for a fresh process, without
    wanting an actual code update."""
    from services.shutdown_service import graceful_cleanup, schedule_exit, RESTART_EXIT_CODE

    await graceful_cleanup()
    schedule_exit(RESTART_EXIT_CODE)
    return {"message": "Sunucu yeniden başlatılıyor"}


@router.get("/update/check")
async def check_for_update(
    admin: User = Depends(get_admin_user),
):
    """Check the GitHub remote for commits not yet applied locally -
    read-only, doesn't change anything."""
    from services.update_service import check_for_updates

    return await check_for_updates()


@router.post("/update/apply")
async def apply_update(
    admin: User = Depends(get_admin_user),
):
    """Pull the latest code + reinstall base dependencies, then restart the
    process - start.bat's loop relaunches it automatically on the special
    exit code below, same graceful cleanup as /shutdown otherwise."""
    from fastapi import HTTPException
    from services.update_service import apply_update as apply_update_service
    from services.shutdown_service import graceful_cleanup, schedule_exit, RESTART_EXIT_CODE

    try:
        result = await apply_update_service()
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))

    await graceful_cleanup()
    schedule_exit(RESTART_EXIT_CODE)
    return result
