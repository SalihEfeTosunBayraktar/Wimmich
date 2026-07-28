"""Periodic trash cleanup - not a queued job type, called directly by the worker loop."""
from datetime import datetime, timezone, timedelta
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

import config
from models import Asset, User
from utils.log import info


async def handle_cleanup_trash(db: AsyncSession):
    """Permanently delete assets that have been in trash past their
    owner's retention period - each user's own trash_days override (or the
    server-wide config.TRASH_DAYS default, if they never set one), not a
    single global cutoff for everyone."""
    from services.media_service import delete_asset_files

    # Distinct owners who currently have anything in trash - avoids one
    # query per registered user when only a handful actually have trash.
    user_ids_result = await db.execute(
        select(Asset.user_id).where(Asset.is_trashed == True).distinct()
    )
    user_ids = [row[0] for row in user_ids_result.all()]
    if not user_ids:
        return

    users_result = await db.execute(select(User).where(User.id.in_(user_ids)))
    users_by_id = {u.id: u for u in users_result.scalars().all()}

    now = datetime.now(timezone.utc)
    total_expired = 0

    for user_id in user_ids:
        user = users_by_id.get(user_id)
        days = (user.trash_days if user and user.trash_days else None) or config.TRASH_DAYS
        cutoff = now - timedelta(days=days)

        result = await db.execute(
            select(Asset).where(
                and_(
                    Asset.user_id == user_id,
                    Asset.is_trashed == True,
                    Asset.trashed_at <= cutoff,
                )
            )
        )
        expired = list(result.scalars().all())

        for asset in expired:
            # Reference-mode originals are deleted here too, same as any
            # other permanent delete - including ones the user trashed
            # manually (not just REPAIR's auto-trash-on-missing-source,
            # where the file is already gone anyway). The retention period
            # is exactly the grace window meant to absorb that: restoring
            # from trash before it expires is the only undo.
            delete_asset_files(asset, delete_reference_source=True)
            await db.delete(asset)

        total_expired += len(expired)

    if total_expired:
        await db.commit()
        info("JOB", f"Cleaned up {total_expired} expired trash items.")
