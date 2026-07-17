"""BACKUP job handler - snapshots the database and archives any media
files not backed up yet, to the user-configured destination folder."""
import asyncio
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

import config
from models import Asset, Job
from services.job_core import check_job_cancelled
from services import backup_service
from utils.path_utils import resolve_data_path
from utils.log import success


async def handle_job_backup(db: AsyncSession, job: Job):
    settings = backup_service.get_backup_settings()
    backup_dir_str = settings["backup_dir"]
    if not backup_dir_str:
        msg = "Yedekleme klasörü henüz ayarlanmadı."
        backup_service.record_backup_result("failed", msg)
        raise RuntimeError(msg)

    backup_dir = Path(backup_dir_str)
    try:
        backup_dir.mkdir(parents=True, exist_ok=True)
    except OSError as e:
        msg = f"Yedekleme klasörüne erişilemedi (disk bağlı mı?): {e}"
        backup_service.record_backup_result("failed", msg)
        raise RuntimeError(msg)

    await check_job_cancelled(db, job.id)
    await asyncio.to_thread(backup_service.backup_database, backup_dir)
    job.progress = 10
    await db.commit()

    # Only assets never backed up before - this is what makes each run
    # incremental instead of re-archiving the whole library every time.
    conditions = [Asset.backed_up_at.is_(None), Asset.is_trashed == False, Asset.file_size > 0]
    result = await db.execute(select(Asset).where(and_(*conditions)))
    assets = list(result.scalars().all())

    if not assets:
        backup_service.record_backup_result("completed")
        job.progress = 100
        await db.commit()
        success("JOB", "Backup completed: DB snapshot only (no new media since last backup)")
        return

    media_dir = backup_dir / "media"
    media_dir.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    archive_path = media_dir / f"wimmich_media_{timestamp}.zip"

    total = len(assets)
    # LZMA measured ~10x slower than DEFLATE on this library's actual
    # photos/videos while compressing *worse* (0.3% smaller vs 1% for
    # DEFLATE) - JPEG/MP4/HEIC are already compressed, so there's no real
    # gain left for a heavier algorithm to find, only more CPU time spent
    # trying. DEFLATE at max level is the better trade for this content.
    zf = zipfile.ZipFile(archive_path, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9)
    try:
        for i, asset in enumerate(assets):
            await check_job_cancelled(db, job.id)
            # resolve_data_path so a backup taken after the data folder was
            # moved/copied still finds files under their current location
            # instead of silently skipping every asset as "missing" - see
            # asset_media_router.py's identical use for the same reason.
            resolved_path = resolve_data_path(asset.file_path, config.UPLOAD_DIR)
            if resolved_path and resolved_path.exists():
                arcname = f"{asset.user_id}/{asset.id}_{asset.original_file_name}"
                await asyncio.to_thread(backup_service.add_file_to_archive, zf, str(resolved_path), arcname)
            asset.backed_up_at = datetime.now(timezone.utc)
            job.progress = 10 + int((i + 1) / total * 90)
            await db.commit()
            # See clip_handler.py's identical expunge.
            db.expunge(asset)
    finally:
        # Closing finalizes the zip's central directory - do this even on
        # cancellation so whatever was already added is still a valid,
        # readable archive instead of a truncated one.
        zf.close()

    backup_service.record_backup_result("completed")
    success("JOB", f"Backup completed: DB snapshot + {total} media file(s) archived to {backup_dir}")
