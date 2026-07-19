"""IMPORT job handler - import files from a local folder (copy or reference mode).

Per-file hashing/EXIF/thumbnail work is pure CPU+IO with no DB access, so a
batch of files is processed concurrently via asyncio.gather - only the
actual DB writes (asset creation, job queuing) run sequentially, since an
AsyncSession isn't safe to use from multiple coroutines at once.
"""
import json
import os
from datetime import datetime
from pathlib import Path
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

import config
from models import Asset, Job, User
from services.job_core import check_job_cancelled, JobAlreadyExistsException
from services.job_handlers.import_reference import build_reference_asset
from services.quota_service import check_server_quota, check_user_quota
from utils.log import warn, error, success
from utils.media_scan_utils import iter_media_files


def _collect_import_files(path: str, recursive: bool) -> list:
    target = Path(path)
    if not target.exists():
        raise ValueError(f"Path not found: {path}")
    # One pass per directory (see utils/media_scan_utils) instead of one
    # glob() per extension - the same ~50x-fewer-filesystem-calls fix as
    # the folder browser/scan preview, applied here too since a real
    # import walks the exact same tree.
    return list(iter_media_files(path, recursive))


async def _process_one(file_path: str, user_id: str, copy_files: bool, source_root: str, dest_path: str = None):
    """Hash/EXIF/thumbnail work for one file - no DB access, safe to run
    concurrently with other files via asyncio.gather."""
    import asyncio
    from services.media_service import process_upload

    filename = os.path.basename(file_path)

    if copy_files:
        # One thread dispatch doing both reads back-to-back, not two
        # separate asyncio.to_thread calls (each its own round-trip to the
        # source drive, possibly picked up by a different thread-pool
        # worker) for what's really one unit of "read this file" work.
        def read_file_and_mtime():
            with open(file_path, "rb") as f:
                data = f.read()
            # Files being imported already exist on disk with a real mtime -
            # use it as a taken_at fallback instead of "now" (the import
            # time) when the file has no EXIF/embedded date.
            mtime = datetime.fromtimestamp(os.path.getmtime(file_path))
            return data, mtime
        file_data, fallback_taken_at = await asyncio.to_thread(read_file_and_mtime)
        attrs = await process_upload(
            file_data, filename, user_id, fallback_taken_at,
            dest_dir=Path(dest_path) if dest_path else None,
        )
        return ("copy", attrs)
    else:
        asset = await build_reference_asset(file_path, filename, user_id, source_root)
        return ("ref", asset)


async def handle_job_import(db: AsyncSession, job: Job):
    """Import files from a local folder."""
    import asyncio
    from services.job_service import create_job

    data = job.data
    path = data.get("path")
    user_id = data.get("user_id")
    copy_files = data.get("copy_files", True)
    recursive = data.get("recursive", True)
    dest_path = data.get("dest_path")

    if not path or not user_id:
        raise ValueError("Missing path or user_id")

    found_files = await asyncio.to_thread(_collect_import_files, path, recursive)

    user_res = await db.execute(select(User).where(User.id == user_id))
    user = user_res.scalar_one_or_none()

    # One query for every path this user has already imported, not one
    # query PER FILE FOUND (see filesystem_browse_service.py's scan preview
    # for the identical bug this mirrors, and the O(n^2) job-queue fix
    # earlier this session for the same class of problem) - found_files
    # comes from a single iter_media_files() pass and never repeats a path,
    # so a fetch taken once up front (before any of this run's own imports
    # have committed) can't go stale mid-run.
    existing_result = await db.execute(
        select(Asset.external_path).where(
            and_(Asset.user_id == user_id, Asset.external_path.isnot(None))
        )
    )
    existing_paths = {row[0] for row in existing_result.all()}

    total = len(found_files)
    imported = 0
    skipped = 0
    processed = 0

    # Read once, not once per range()/slice reference below - the range()
    # step is evaluated once when the loop starts, so if an admin saves a
    # new concurrency setting mid-run, reading it again in the slice would
    # desync the two and batches would overlap or skip assets.
    from services.job_concurrency_service import get_effective_concurrency
    concurrency = get_effective_concurrency()

    for batch_start in range(0, total, concurrency):
        batch = found_files[batch_start:batch_start + concurrency]
        await check_job_cancelled(db, job.id)

        # Quota/dedup checks are cheap DB reads - keep them sequential and
        # filter the batch down before doing any heavy per-file work.
        to_process = []
        for file_path in batch:
            # One stat() call instead of exists()+getsize() (two separate
            # round-trips to the source drive for the same information) -
            # cheap on a local disk, but every extra round-trip adds up on
            # a slow/external one, and this runs once per file in the
            # whole import.
            def get_size():
                try:
                    return os.stat(file_path).st_size
                except OSError:
                    return 0
            incoming_size = await asyncio.to_thread(get_size)

            if incoming_size == 0:
                # Empty source file (seen with some WhatsApp "Sent" exports) -
                # importing it just creates an asset with no actual image/
                # video content, which then fails CLIP/face processing every
                # time it's retried.
                warn("JOB", f"Import skipped for {file_path}: empty (0-byte) source file")
                skipped += 1
                processed += 1
                continue

            quota_error = await check_server_quota(db, incoming_size)
            if not quota_error and user:
                quota_error = await check_user_quota(db, user, incoming_size)
            if quota_error:
                warn("JOB", f"Import skipped for {file_path}: {quota_error}")
                skipped += 1
                processed += 1
                continue

            if file_path in existing_paths:
                skipped += 1
                processed += 1
                continue

            to_process.append(file_path)

        results = await asyncio.gather(
            *[_process_one(fp, user_id, copy_files, path, dest_path) for fp in to_process],
            return_exceptions=True,
        )

        new_assets = []
        for file_path, result in zip(to_process, results):
            processed += 1
            if isinstance(result, Exception):
                error("JOB", f"Import error for {file_path}: {result}")
                continue

            try:
                kind, payload = result
                if kind == "copy":
                    asset = Asset(
                        user_id=user_id,
                        is_external=False,
                        external_path=file_path,
                        **{k: v for k, v in payload.items() if k not in ["city", "country"]}
                    )
                else:
                    asset = payload

                db.add(asset)
                await db.flush()
                new_assets.append(asset)

                # CLIP/FACE only make sense for images - queuing them for
                # videos too just produced a "cannot identify image file"
                # error on every attempt.
                if asset.file_type == "IMAGE":
                    try:
                        await create_job(db, "CLIP", {"asset_id": asset.id})
                    except JobAlreadyExistsException:
                        pass
                    try:
                        await create_job(db, "FACE", {"asset_id": asset.id, "user_id": user_id})
                    except JobAlreadyExistsException:
                        pass
                elif asset.file_type == "VIDEO":
                    try:
                        await create_job(db, "TRANSCODE", {"asset_id": asset.id})
                    except JobAlreadyExistsException:
                        pass

                # EXIF GPS but no resolved city yet - auto-queue the same
                # offline reverse-geocode GEOCODE already does manually via
                # "Tag Locations", so a city name is there by the time the
                # user looks at the Map page instead of only after they
                # remember to click that button themselves.
                if asset.latitude is not None and asset.longitude is not None:
                    try:
                        await create_job(db, "GEOCODE", {"asset_id": asset.id})
                    except JobAlreadyExistsException:
                        pass

                imported += 1

            except Exception as e:
                error("JOB", f"Import error for {file_path}: {e}")

        job.progress = int(processed / total * 100) if total > 0 else 100
        await db.commit()
        # See clip_handler.py's identical expunge - this loop can create
        # thousands of assets over a big import; without this the session's
        # identity map holds every one of them for the whole job's run.
        for asset in new_assets:
            db.expunge(asset)

    job.result_json = json.dumps({
        "total_found": total,
        "imported": imported,
        "skipped": skipped,
    })
    success("JOB", f"Import completed: {imported} imported, {skipped} skipped from {total} files")

    # Same reasoning as scan_handler.py's identical call - catches assets
    # (from this import or any earlier one) whose file has since gone
    # missing or broken, re-fixing what's recoverable from its original
    # source and trashing what isn't.
    try:
        await create_job(db, "REPAIR", {"user_id": user_id})
    except JobAlreadyExistsException:
        pass
