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


def _collect_import_files(path: str, recursive: bool) -> list:
    target = Path(path)
    if not target.exists():
        raise ValueError(f"Path not found: {path}")

    found_files = []
    if target.is_file():
        if target.suffix.lower() in config.ALL_EXTENSIONS:
            found_files.append(str(target))
    elif target.is_dir():
        pattern = "**/*" if recursive else "*"
        for ext in config.ALL_EXTENSIONS:
            found_files.extend([str(f) for f in target.glob(f"{pattern}{ext}")])
            found_files.extend([str(f) for f in target.glob(f"{pattern}{ext.upper()}")])
        found_files = list(set(found_files))
    return found_files


async def _process_one(file_path: str, user_id: str, copy_files: bool):
    """Hash/EXIF/thumbnail work for one file - no DB access, safe to run
    concurrently with other files via asyncio.gather."""
    import asyncio
    from services.media_service import process_upload

    filename = os.path.basename(file_path)

    if copy_files:
        def read_file():
            with open(file_path, "rb") as f:
                return f.read()
        file_data = await asyncio.to_thread(read_file)

        # Files being imported already exist on disk with a real mtime -
        # use it as a taken_at fallback instead of "now" (the import time)
        # when the file has no EXIF/embedded date.
        def get_mtime():
            return datetime.fromtimestamp(os.path.getmtime(file_path))
        fallback_taken_at = await asyncio.to_thread(get_mtime)
        attrs = await process_upload(file_data, filename, user_id, fallback_taken_at)
        return ("copy", attrs)
    else:
        asset = await build_reference_asset(file_path, filename, user_id)
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

    if not path or not user_id:
        raise ValueError("Missing path or user_id")

    found_files = await asyncio.to_thread(_collect_import_files, path, recursive)

    user_res = await db.execute(select(User).where(User.id == user_id))
    user = user_res.scalar_one_or_none()

    total = len(found_files)
    imported = 0
    skipped = 0
    processed = 0

    for batch_start in range(0, total, config.JOB_IMPORT_CONCURRENCY):
        batch = found_files[batch_start:batch_start + config.JOB_IMPORT_CONCURRENCY]
        await check_job_cancelled(db, job.id)

        # Quota/dedup checks are cheap DB reads - keep them sequential and
        # filter the batch down before doing any heavy per-file work.
        to_process = []
        for file_path in batch:
            def get_size():
                return os.path.getsize(file_path) if os.path.exists(file_path) else 0
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

            # Column-only select - a plain existence check has no business
            # loading a full Asset ORM object into the session's identity
            # map for the rest of this (potentially huge) import job's run.
            existing = await db.execute(
                select(Asset.id).where(
                    and_(Asset.user_id == user_id, Asset.external_path == file_path)
                ).limit(1)
            )
            if existing.first():
                skipped += 1
                processed += 1
                continue

            to_process.append(file_path)

        results = await asyncio.gather(
            *[_process_one(fp, user_id, copy_files) for fp in to_process],
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
