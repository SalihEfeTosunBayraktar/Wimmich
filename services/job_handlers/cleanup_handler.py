"""Periodic trash cleanup - not a queued job type, called directly by the worker loop."""
from datetime import datetime, timezone, timedelta
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

import config
from models import Asset
from utils.log import info


async def handle_cleanup_trash(db: AsyncSession):
    """Permanently delete assets that have been in trash for TRASH_DAYS."""
    from services.media_service import delete_asset_files

    cutoff = datetime.now(timezone.utc) - timedelta(days=config.TRASH_DAYS)
    result = await db.execute(
        select(Asset).where(
            and_(
                Asset.is_trashed == True,
                Asset.trashed_at <= cutoff,
            )
        )
    )
    expired = list(result.scalars().all())

    for asset in expired:
        delete_asset_files(asset)
        await db.delete(asset)

    if expired:
        await db.commit()
        info("JOB", f"Cleaned up {len(expired)} expired trash items.")
