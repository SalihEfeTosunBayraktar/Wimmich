"""CLIP job handler - generate CLIP embeddings for image assets."""
import asyncio
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

import config
from models import Asset, Job
from services.job_core import check_job_cancelled


async def handle_job_clip(db: AsyncSession, job: Job):
    """Generate CLIP embeddings for assets."""
    from services.ml_service import compute_clip_embedding, save_embedding, CLIP_AVAILABLE

    if not CLIP_AVAILABLE:
        # Previously generated a random "embedding" here so assets looked
        # processed even without CLIP - that polluted search with meaningless
        # matches and permanently marked assets as processed (clip_embedding_path
        # set), so they'd never be retried even after installing CLIP later.
        return

    data = job.data or {}
    asset_id = data.get("asset_id")

    if asset_id:
        assets_query = select(Asset).where(Asset.id == asset_id)
    else:
        # Process all unprocessed image assets
        assets_query = select(Asset).where(
            and_(
                Asset.file_type == "IMAGE",
                Asset.clip_embedding_path.is_(None),
                Asset.is_trashed == False,
            )
        )

    result = await db.execute(assets_query)
    assets = list(result.scalars().all())

    total = len(assets)
    processed = 0

    # Each call is a PIL decode (CPU) followed by a model forward pass (GPU);
    # running a batch concurrently overlaps one image's decode with another's
    # inference instead of doing everything one image at a time.
    for batch_start in range(0, total, config.JOB_IMPORT_CONCURRENCY):
        batch = assets[batch_start:batch_start + config.JOB_IMPORT_CONCURRENCY]
        await check_job_cancelled(db, job.id)

        embeddings = await asyncio.gather(
            *[asyncio.to_thread(compute_clip_embedding, asset.file_path) for asset in batch],
            return_exceptions=True,
        )

        for asset, embedding in zip(batch, embeddings):
            processed += 1
            if isinstance(embedding, Exception):
                print(f"[JOB] CLIP embedding failed for asset {asset.id}: {embedding}")
                continue
            if embedding is not None:
                emb_path = str(config.ML_DIR / f"clip_{asset.id}.npy")
                if save_embedding(embedding, emb_path):
                    asset.clip_embedding_path = emb_path
                    asset.ml_processed = True

        job.progress = int(processed / total * 100) if total > 0 else 100
        await db.commit()
        # Without this, the session's identity map keeps every asset ever
        # loaded by this job attached for its whole run - on a big library
        # (thousands of assets) that grows RAM steadily until the job ends,
        # since a commit alone doesn't detach already-processed objects.
        for asset in batch:
            db.expunge(asset)

    if processed:
        from services.job_service import create_job, JobAlreadyExistsException
        try:
            await create_job(db, "CATEGORIZE", {})
        except JobAlreadyExistsException:
            pass
        # New embeddings change the similarity picture for the whole
        # library (a fresh photo can newly become someone else's closest
        # match too), so this recomputes from scratch rather than trying
        # to patch just the new assets in.
        try:
            await create_job(db, "SIMILARITY", {})
        except JobAlreadyExistsException:
            pass
