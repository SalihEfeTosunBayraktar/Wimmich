"""Admin Config Router - storage directory, tunnel token/domain settings."""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import User
from auth import get_admin_user
from services.audit_log_service import log_action

router = APIRouter(prefix="/api/admin", tags=["admin"])

_MB = 1024 * 1024


def _format_mb(mb: int) -> str:
    """Largest EXACT unit - for values the admin typed, where re-rounding
    would show them a different number than the one that is stored."""
    for unit, size in (("TB", 1024 * 1024), ("GB", 1024), ("MB", 1)):
        if mb >= size and mb % size == 0:
            return f"{mb // size} {unit}"
    return f"{mb} MB"


def _format_cap_mb(mb: int) -> str:
    """Largest unit, rounded DOWN - for a ceiling. A drive's spare room is
    never a round number, so the exact-multiple rule above would always
    print it as a seven-digit megabyte count. Mirrors _formatStorageCap in
    admin-render.js so this error and the hint under the field render the
    same ceiling the same way; two spellings of one number reads like a bug.
    Rounded down because a maximum must never promise more than exists."""
    for unit, size in (("TB", 1024 * 1024), ("GB", 1024), ("MB", 1)):
        if mb >= size:
            return f"{mb / size:.1f} {unit}".replace(".0 ", " ")
    return f"{mb} MB"


async def _reject_limit_bigger_than_the_disk(db: AsyncSession, req, target_path: str) -> None:
    """A storage limit the drive cannot honour is not a limit, it's a number
    that does nothing - the disk fills first and the warning badges never
    fire. Checked server-side because the panel's own check can be bypassed
    by anything talking to the API directly.

    The ceiling is free space PLUS what the library already occupies: free
    space alone would refuse a limit that merely covers the photos already
    stored, which is a perfectly reasonable thing to set.

    Checked against the requested path, not the current one - if both are
    changing at once, the new drive is the one that has to hold it.
    """
    import shutil
    from pathlib import Path

    from sqlalchemy import func, select

    from models import Asset

    limit_mb = req.total_storage_limit_mb or 0
    if limit_mb <= 0:
        return  # 0 means unlimited, nothing to compare against

    # Walk up to the nearest folder that exists - a not-yet-created target
    # still lives on a real drive, and that drive is what we can measure.
    probe = Path(target_path)
    while not probe.exists() and probe.parent != probe:
        probe = probe.parent

    try:
        free_bytes = shutil.disk_usage(probe).free
    except OSError:
        return  # unreachable/disconnected drive - not our error to raise here

    used_bytes = (await db.execute(select(func.sum(Asset.file_size)))).scalar() or 0
    max_mb = (free_bytes + used_bytes) // _MB

    if limit_mb > max_mb:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Bu sınır diskin tutabileceğinden fazla - "
                f"en çok {_format_cap_mb(max_mb)} ayarlayabilirsiniz."
            ),
        )


class UpdateConfigParameters(BaseModel):
    data_dir: str
    tunnel_token: Optional[str] = ""
    total_storage_limit_mb: Optional[int] = 0
    auto_start_tunnel: Optional[bool] = False
    tunnel_custom_domain: Optional[str] = ""


@router.get("/config")
async def get_config(admin: User = Depends(get_admin_user)):
    """Get server data directory configuration."""
    import config
    return {
        "data_dir": str(config.DATA_DIR),
        "db_dir": str(config.DB_DIR),
        "tunnel_token": getattr(config, "TUNNEL_TOKEN", ""),
        "total_storage_limit_mb": getattr(config, "TOTAL_STORAGE_LIMIT_MB", 0),
        "auto_start_tunnel": getattr(config, "AUTO_START_TUNNEL", False),
        "tunnel_custom_domain": getattr(config, "TUNNEL_CUSTOM_DOMAIN", ""),
    }


@router.post("/config")
async def update_config(
    req: UpdateConfigParameters,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Update server data directory configuration."""
    import config

    path_str = req.data_dir.strip()
    if not path_str:
        raise HTTPException(status_code=400, detail="Depolama yolu boş olamaz")

    await _reject_limit_bigger_than_the_disk(db, req, path_str)

    try:
        config.update_config(
            path_str,
            req.tunnel_token or "",
            req.total_storage_limit_mb or 0,
            bool(req.auto_start_tunnel),
            req.tunnel_custom_domain or "",
        )
        # tunnel_token is a credential - record only whether one is set, never
        # the value itself.
        await log_action(db, admin, "config.update", "config", None, {
            "data_dir": path_str,
            "tunnel_token_set": bool(req.tunnel_token),
            "total_storage_limit_mb": req.total_storage_limit_mb or 0,
            "auto_start_tunnel": bool(req.auto_start_tunnel),
            "tunnel_custom_domain": req.tunnel_custom_domain or "",
        })
        await db.commit()
        return {
            "message": "Ayarlar başarıyla güncellendi",
            "data_dir": str(config.DATA_DIR),
            "tunnel_token": getattr(config, "TUNNEL_TOKEN", ""),
            "total_storage_limit_mb": getattr(config, "TOTAL_STORAGE_LIMIT_MB", 0),
            "auto_start_tunnel": getattr(config, "AUTO_START_TUNNEL", False),
            "tunnel_custom_domain": getattr(config, "TUNNEL_CUSTOM_DOMAIN", ""),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ayarlar güncellenirken hata oluştu: {str(e)}")
