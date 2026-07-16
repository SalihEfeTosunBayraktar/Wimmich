"""THUMBNAIL job handler - (re)generate thumbnails for assets."""
import asyncio
import os
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from models import Asset, Job
from services.job_core import check_job_cancelled


def _has_valid_thumbnails(asset: Asset) -> bool:
    """DB columns alone aren't enough - checks the files themselves still
    exist, so a thumbnail deleted/corrupted outside the app still gets
    regenerated instead of being silently treated as done."""
    paths = [asset.thumb_small_path, asset.thumb_medium_path, asset.thumb_large_path]
    return all(paths) and all(os.path.isfile(p) for p in paths)


async def handle_job_thumbnail(db: AsyncSession, job: Job):
    """(Re)generate thumbnails for assets missing one - a manually-triggered
    bulk run used to reprocess every single asset in the library from
    scratch every time regardless of whether its thumbnails already
    existed, making it unusably slow to just backfill the handful that
    actually need it. A specific asset_id (e.g. "fix this one" from the
    UI) still forces a regenerate, since that's the explicit intent."""
    from services.media_processing import _process_image, _process_video

    data = job.data or {}
    asset_id = data.get("asset_id")

    if asset_id:
        assets_query = select(Asset).where(Asset.id == asset_id)
    else:
        # Trashed and 0-byte (failed-import) assets can never produce a
        # thumbnail - without this, they fail and get logged again on every
        # single bulk run forever, since "still missing a thumbnail" is
        # permanently true for them.
        assets_query = select(Asset).where(
            and_(Asset.is_trashed == False, Asset.file_size > 0)
        )

    result = await db.execute(assets_query)
    assets = [a for a in result.scalars().all() if asset_id or not _has_valid_thumbnails(a)]

    total = len(assets)
    for i, asset in enumerate(assets):
        await check_job_cancelled(db, job.id)
        try:
            if asset.file_type == "IMAGE":
                updates = await asyncio.to_thread(_process_image, {}, asset.file_path, asset.file_name, asset.user_id)
            else:
                updates = await asyncio.to_thread(_process_video, {}, asset.file_path, asset.file_name, asset.user_id)

            for key in ["thumb_small_path", "thumb_medium_path", "thumb_large_path"]:
                if updates.get(key):
                    setattr(asset, key, updates[key])
        except Exception as e:
            print(f"[JOB] Thumbnail generation failed for asset {asset.id}: {e}")

        job.progress = int((i + 1) / total * 100) if total > 0 else 100
        await db.commit()
