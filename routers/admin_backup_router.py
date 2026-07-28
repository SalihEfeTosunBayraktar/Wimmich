"""Admin Backup Router - backup destination/schedule settings."""
from pydantic import BaseModel

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import User
from auth import get_admin_user
from services import backup_service
from services.audit_log_service import log_action

router = APIRouter(prefix="/api/admin/backup", tags=["admin"])


class UpdateBackupSettingsRequest(BaseModel):
    backup_dir: str
    interval_hours: int = 24
    enabled: bool = False


@router.get("/settings")
async def get_settings(admin: User = Depends(get_admin_user)):
    return backup_service.get_backup_settings()


@router.post("/settings")
async def update_settings(
    req: UpdateBackupSettingsRequest,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Saves the destination folder/schedule - doesn't require the path to
    exist yet (the backup destination may be a drive that isn't plugged in
    at the moment), only validated when a backup actually runs."""
    result = backup_service.update_backup_settings(req.backup_dir, req.interval_hours, req.enabled)
    await log_action(db, admin, "backup_settings.update", "backup_settings", None, {
        "backup_dir": req.backup_dir,
        "interval_hours": req.interval_hours,
        "enabled": req.enabled,
    })
    await db.commit()
    return result
