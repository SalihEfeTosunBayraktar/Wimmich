"""THUMBNAIL job handler - (re)generate thumbnails for assets."""
import asyncio
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

import config
from models import Asset, Job
from services.job_core import check_job_cancelled
from utils.path_utils import resolve_data_path


def _has_valid_thumbnails(asset: Asset) -> bool:
    """DB columns alone aren't enough - checks the files themselves still
    exist, so a thumbnail deleted/corrupted outside the app still gets
    regenerated instead of being silently treated as done. Uses
    resolve_data_path so thumbnails that are still sitting right there
    under the current data folder aren't declared missing (and wastefully
    regenerated) just because the data folder was moved/copied since the
    stored absolute path was written."""
    paths = [asset.thumb_small_path, asset.thumb_medium_path, asset.thumb_large_path]
    if not all(paths):
        return False
    resolved = [resolve_data_path(p, config.THUMB_DIR) for p in paths]
    return all(r and r.is_file() for r in resolved)


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
    raw_assets = list(result.scalars().all())
    # Assets that already have valid thumbnails are never touched again -
    # expunge them right away instead of holding the whole library's worth
    # of loaded objects in the session for this job's entire run just to
    # have filtered most of them out.
    assets = []
    for a in raw_assets:
        if asset_id or not _has_valid_thumbnails(a):
            assets.append(a)
        else:
            db.expunge(a)

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
        # See clip_handler.py's identical expunge - keeps this job's RAM use
        # bounded instead of holding every processed asset for its whole run.
        db.expunge(asset)
