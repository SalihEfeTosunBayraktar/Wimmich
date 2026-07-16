"""DUPCHECK job handler - backfill checksums for assets missing one, so the
duplicates page can group them. Runs as a tracked background job (instead
of synchronously in the request) so the UI can show real progress on large
libraries instead of a single opaque "scanning..." with no feedback."""
import asyncio
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from models import Asset, Job
from services.job_core import check_job_cancelled
from utils.hash_utils import compute_file_hash


async def handle_job_dupcheck(db: AsyncSession, job: Job):
    data = job.data or {}
    user_id = data.get("user_id")

    conditions = [Asset.is_trashed == False, (Asset.checksum.is_(None)) | (Asset.checksum == "")]
    if user_id:
        conditions.append(Asset.user_id == user_id)

    result = await db.execute(select(Asset).where(and_(*conditions)))
    assets = list(result.scalars().all())

    total = len(assets)
    updated = 0
    for i, asset in enumerate(assets):
        await check_job_cancelled(db, job.id)
        try:
            asset.checksum = await asyncio.to_thread(compute_file_hash, asset.file_path)
            updated += 1
        except Exception as e:
            print(f"[WARN] Checksum backfill failed for asset {asset.id} ({asset.file_path}): {e}")

        job.progress = int((i + 1) / total * 100) if total > 0 else 100
        await db.commit()

    print(f"[JOB] Dupcheck completed: {updated}/{total} checksums computed")
