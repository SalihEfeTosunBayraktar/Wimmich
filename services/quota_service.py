"""Storage quota checks shared by upload endpoints and the filesystem import job."""
from typing import Optional
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

import config
from models import Asset, User


def check_file_size(incoming_size: int) -> Optional[str]:
    """Return a Turkish error message if the file exceeds the per-file size limit, else None."""
    if incoming_size > config.MAX_UPLOAD_SIZE:
        return (
            f"Dosya boyutu limitini aşıyor "
            f"(Maksimum limit: {config.MAX_UPLOAD_SIZE // (1024 * 1024)} MB)"
        )
    return None


async def check_server_quota(db: AsyncSession, incoming_size: int) -> Optional[str]:
    """Return a Turkish error message if the server-wide storage limit would be exceeded, else None."""
    limit_mb = getattr(config, "TOTAL_STORAGE_LIMIT_MB", 0)
    if limit_mb <= 0:
        return None

    total_used = (await db.execute(select(func.sum(Asset.file_size)))).scalar() or 0
    limit_bytes = limit_mb * 1024 * 1024
    if total_used + incoming_size > limit_bytes:
        return f"Sunucu toplam depolama kotası doldu ({limit_mb} MB limit)"
    return None


async def check_user_quota(db: AsyncSession, user: User, incoming_size: int) -> Optional[str]:
    """Return a Turkish error message if the user's personal quota would be exceeded, else None."""
    if user.storage_quota_mb <= 0:
        return None

    current_used = (
        await db.execute(select(func.sum(Asset.file_size)).where(Asset.user_id == user.id))
    ).scalar() or 0
    quota_bytes = user.storage_quota_mb * 1024 * 1024
    if current_used + incoming_size > quota_bytes:
        return f"Kişisel depolama kotanız aşıldı ({user.storage_quota_mb} MB limit)"
    return None


async def check_all_quotas(db: AsyncSession, user: User, incoming_size: int) -> Optional[str]:
    """Run all quota checks in order, returning the first Turkish error message or None if all pass."""
    error = check_file_size(incoming_size)
    if error:
        return error

    error = await check_server_quota(db, incoming_size)
    if error:
        return error

    return await check_user_quota(db, user, incoming_size)
