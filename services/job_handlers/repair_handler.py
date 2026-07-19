"""REPAIR job handler - finds assets whose backing file is missing or
broken and either fixes them (source still recoverable) or moves them to
trash (source genuinely gone).

Three asset categories, matched to how they got into the library:
- Reference-mode (is_external=True): file_path == external_path, the
  original is the ONLY copy. If it still exists but our own thumbnail/EXIF
  processing is missing or failed, regenerate in place. If it's gone,
  there's nothing left to recover - trash it (this is also what makes
  externally-deleted source files actually get noticed at all: a rescan of
  the same folder only looks for NEW files, see scan_handler.py, so it
  never revisits - let alone re-validates - anything already indexed).
- Copy-mode import (is_external=False, external_path set): file_path is
  Wimmich's own copy. If it's missing/broken but external_path (the
  original import source) still exists, re-copy + reprocess from there.
  If external_path is also gone, trash it.
- Native upload (is_external=False, external_path=None): file_path is the
  only copy there ever was. If it's broken, nothing to recover from -
  trash it.
"""
import asyncio
import json
import shutil
import uuid
from datetime import datetime, timezone
from pathlib import Path
from sqlalchemy import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

import config
from models import Asset, Job
from services.job_core import check_job_cancelled
from services.media_processing import _process_image, _process_video
from utils.path_utils import resolve_data_path
from utils.log import info, warn


def _thumbnail_broken(asset: Asset) -> bool:
    """True if the source file is presumably fine but our own processing
    isn't - missing thumbnail, or a previous attempt explicitly failed."""
    if asset.thumbnail_failed_at is not None:
        return True
    if not asset.thumb_medium_path:
        return True
    resolved = resolve_data_path(asset.thumb_medium_path, config.THUMB_DIR)
    return not (resolved and resolved.exists())


async def _reprocess_in_place(asset: Asset, source_path: str) -> bool:
    """Regenerate EXIF/thumbnails from source_path without touching
    file_path - used for reference-mode assets, where the source IS the
    asset's file_path already, and for copy-mode assets right after a
    fresh re-copy has already updated file_path to point at the new copy."""
    unique_name = f"{uuid.uuid4().hex}{Path(source_path).suffix.lower()}"
    result = {}
    try:
        if asset.file_type == "IMAGE":
            result = await asyncio.wait_for(
                asyncio.to_thread(_process_image, result, source_path, unique_name, asset.user_id),
                timeout=config.MEDIA_PROCESSING_TIMEOUT_SECONDS,
            )
        elif asset.file_type == "VIDEO":
            result = await asyncio.wait_for(
                asyncio.to_thread(_process_video, result, source_path, unique_name, asset.user_id),
                timeout=config.MEDIA_PROCESSING_TIMEOUT_SECONDS,
            )
    except asyncio.TimeoutError:
        warn("JOB", f"Repair: media processing timed out for asset {asset.id} ({source_path})")
        return False

    if not result.get("thumb_medium_path"):
        return False  # source exists but is unprocessable (corrupt file) - leave the asset as-is, don't trash it just for this

    asset.thumb_small_path = result.get("thumb_small_path")
    asset.thumb_medium_path = result.get("thumb_medium_path")
    asset.thumb_large_path = result.get("thumb_large_path")
    asset.thumbnail_failed_at = None
    if result.get("width"):
        asset.width = result["width"]
        asset.height = result["height"]
    return True


async def _recopy_from_source(asset: Asset) -> bool:
    """Copy-mode asset whose own copy is gone/broken - re-copy from the
    original import source (external_path) into a fresh location, mirroring
    what a brand new copy-mode import does in media_service.py."""
    ext = Path(asset.external_path).suffix.lower()
    unique_name = f"{uuid.uuid4().hex}{ext}"
    now = datetime.now()
    date_dir = config.UPLOAD_DIR / asset.user_id / str(now.year) / f"{now.month:02d}"

    def copy_file():
        date_dir.mkdir(parents=True, exist_ok=True)
        new_path = date_dir / unique_name
        shutil.copy2(asset.external_path, new_path)
        return str(new_path)

    try:
        new_file_path = await asyncio.to_thread(copy_file)
    except OSError as e:
        warn("JOB", f"Repair: re-copy failed for asset {asset.id}: {e}")
        return False

    ok = await _reprocess_in_place(asset, new_file_path)
    if ok:
        asset.file_path = new_file_path
    else:
        # Reprocessing failed on the freshly-copied file - remove the
        # orphaned copy rather than leaving a dangling file with nothing
        # pointing at it.
        try:
            Path(new_file_path).unlink(missing_ok=True)
        except OSError:
            pass
    return ok


def _trash(asset: Asset, reason: str) -> None:
    asset.is_trashed = True
    asset.trashed_at = datetime.now(timezone.utc)
    warn("JOB", f"Repair: asset {asset.id} ({asset.original_file_name}) trashed - {reason}")


async def handle_job_repair(db: AsyncSession, job: Job):
    """Check every reference-mode and copy-mode-imported asset for this
    user, repairing what's recoverable and trashing what's genuinely gone."""
    data = job.data or {}
    user_id = data.get("user_id")
    if not user_id:
        raise ValueError("Missing user_id")

    stmt = select(Asset).where(
        and_(
            Asset.user_id == user_id,
            Asset.is_trashed == False,
            or_(
                Asset.is_external == True,
                Asset.external_path.isnot(None),
            ),
        )
    )
    assets = list((await db.execute(stmt)).scalars().all())
    total = len(assets)
    checked = repaired = trashed = 0

    for i, asset in enumerate(assets):
        await check_job_cancelled(db, job.id)
        checked += 1

        # file_path is what actually gets served/thumbnailed regardless of
        # source - reference mode just happens to have file_path ==
        # external_path, so checking file_path first handles "thumbnail
        # broken but the file itself is fine" identically for reference and
        # copy-mode assets, with no need to special-case is_external here.
        file_path = resolve_data_path(asset.file_path, config.UPLOAD_DIR)
        file_exists = bool(file_path) and await asyncio.to_thread(file_path.exists)

        if file_exists:
            if _thumbnail_broken(asset):
                if await _reprocess_in_place(asset, str(file_path)):
                    repaired += 1
        elif asset.external_path and asset.external_path != asset.file_path:
            # Copy-mode: our own copy is gone/broken, but the original
            # import source is a genuinely different path - try recovering
            # from there before giving up.
            source_exists = await asyncio.to_thread(lambda p=asset.external_path: Path(p).exists())
            if source_exists:
                if await _recopy_from_source(asset):
                    repaired += 1
            else:
                _trash(asset, f"local copy gone and original source at {asset.external_path} is also gone")
                trashed += 1
        else:
            # Reference mode (file_path == external_path, already covered
            # by the file_exists check above) with the source now missing -
            # nothing left to recover from.
            _trash(asset, f"source no longer exists at {asset.file_path}")
            trashed += 1

        job.progress = int((i + 1) / total * 100) if total > 0 else 100
        await db.commit()
        db.expunge(asset)

    job.result_json = json.dumps({"checked": checked, "repaired": repaired, "trashed": trashed})
    info("JOB", f"Repair completed for user {user_id}: {checked} checked, {repaired} repaired, {trashed} trashed.")
