"""SCAN job handler - index files from an external library directory."""
import os
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models import Asset, Job
from services.job_core import check_job_cancelled, JobAlreadyExistsException
from utils.log import warn, error


async def handle_job_scan(db: AsyncSession, job: Job):
    """Scan external library directory."""
    from services.media_service import scan_external_directory, process_upload
    from services.job_service import create_job

    data = job.data
    directory = data.get("directory")
    user_id = data.get("user_id")

    if not directory or not user_id:
        raise ValueError("Missing directory or user_id")

    import asyncio
    files = await asyncio.to_thread(scan_external_directory, directory, user_id)
    total = len(files)
    # Which follow-up job types this scan will need - one bulk job each is
    # queued after the whole scan finishes, not one per file (see the
    # matching change and rationale in import_handler.py).
    need_clip_face = False
    need_transcode = False
    need_geocode = False

    for i, file_path in enumerate(files):
        await check_job_cancelled(db, job.id)
        # Check if already indexed - column-only select, a plain existence
        # check has no business loading a full Asset ORM object into the
        # session's identity map for the rest of this job's run.
        result = await db.execute(
            select(Asset.id).where(Asset.external_path == file_path).limit(1)
        )
        if result.first():
            continue

        if os.path.getsize(file_path) == 0:
            # Empty source file - would just create an asset with no actual
            # content, failing CLIP/face processing on every retry.
            warn("JOB", f"Scan skipped {file_path}: empty (0-byte) source file")
            job.progress = int((i + 1) / total * 100) if total > 0 else 100
            continue

        try:
            def read_file():
                with open(file_path, "rb") as f:
                    return f.read()
            file_data = await asyncio.to_thread(read_file)

            # Files scanned from disk have a real mtime - use it when the
            # file itself has no EXIF/embedded date, instead of falling back
            # to "now" (the scan time).
            def get_mtime():
                import os
                return datetime.fromtimestamp(os.path.getmtime(file_path))
            fallback_taken_at = await asyncio.to_thread(get_mtime)
            attrs = await process_upload(
                file_data, os.path.basename(file_path), user_id, fallback_taken_at
            )

            asset = Asset(
                user_id=user_id,
                is_external=True,
                external_path=file_path,
                **{k: v for k, v in attrs.items() if k not in ["city", "country"]}
            )
            db.add(asset)
            await db.flush()

            # Note what follow-up processing this asset needs; the actual
            # (bulk, whole-scan) jobs are queued once after the loop, not
            # per-file. CLIP/FACE only apply to images.
            if asset.file_type == "IMAGE":
                need_clip_face = True
            elif asset.file_type == "VIDEO":
                need_transcode = True
            if asset.latitude is not None and asset.longitude is not None:
                need_geocode = True

            await db.commit()
            # See clip_handler.py's identical expunge - a big external
            # library scan can create thousands of assets in this one
            # session; without this every one of them stays attached for
            # the job's whole run.
            db.expunge(asset)

        except Exception as e:
            error("JOB", f"Scan error for {file_path}: {e}")

        job.progress = int((i + 1) / total * 100) if total > 0 else 100
        await db.commit()

    # One bulk job per needed type for the whole scan, not one per file -
    # see import_handler.py for the full rationale (the handlers run in
    # "process everything still missing" mode with no asset_id, and the
    # single-worker model makes queuing them here race-free).
    if need_clip_face:
        for job_type, jdata in (("CLIP", {}), ("FACE", {"user_id": user_id})):
            try:
                await create_job(db, job_type, jdata)
            except JobAlreadyExistsException:
                pass
    if need_transcode:
        try:
            await create_job(db, "TRANSCODE", {})
        except JobAlreadyExistsException:
            pass
    if need_geocode:
        try:
            await create_job(db, "GEOCODE", {})
        except JobAlreadyExistsException:
            pass

    # A rescan only ever looks for NEW files (existing_paths above skips
    # anything already indexed) - it never revisits what's already in the
    # library, so a source file deleted after being indexed would
    # otherwise go unnoticed forever. Auto-queuing REPAIR after every scan
    # is what actually catches that: it re-validates every reference/
    # copy-imported asset's backing file, not just what this run touched.
    try:
        await create_job(db, "REPAIR", {"user_id": user_id})
    except JobAlreadyExistsException:
        pass
