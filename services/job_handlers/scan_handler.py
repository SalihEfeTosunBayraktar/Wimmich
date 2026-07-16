"""SCAN job handler - index files from an external library directory."""
import os
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models import Asset, Job
from services.job_core import check_job_cancelled, JobAlreadyExistsException


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
            print(f"[JOB] Scan skipped {file_path}: empty (0-byte) source file")
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

            # Unlike IMPORT, this never queued follow-up processing at all -
            # externally-scanned assets got no CLIP embedding, no face
            # detection, and (for video) no transcode, ever. CLIP/FACE only
            # apply to images - queuing them for video just errors every time.
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

            await db.commit()
            # See clip_handler.py's identical expunge - a big external
            # library scan can create thousands of assets in this one
            # session; without this every one of them stays attached for
            # the job's whole run.
            db.expunge(asset)

        except Exception as e:
            print(f"[JOB] Scan error for {file_path}: {e}")

        job.progress = int((i + 1) / total * 100) if total > 0 else 100
        await db.commit()
