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
        # Reference-mode originals are deleted here too, same as any other
        # permanent delete - including ones the user trashed manually
        # (not just REPAIR's auto-trash-on-missing-source, where the file
        # is already gone anyway). TRASH_DAYS is exactly the grace period
        # meant to absorb that: restoring from trash before it expires is
        # the only undo.
        delete_asset_files(asset, delete_reference_source=True)
        await db.delete(asset)

    if expired:
        await db.commit()
        info("JOB", f"Cleaned up {len(expired)} expired trash items.")
