"""CATEGORIZE job handler - zero-shot content categorization (screenshot/
document/nature/pet/...) for assets that already have a CLIP embedding.
"""
import asyncio
from sqlalchemy import select, and_, or_, func
from sqlalchemy.ext.asyncio import AsyncSession

import config
from models import Asset, Job
from services.job_core import check_job_cancelled
from services.smart_category_service import classify_embedding, NO_CATEGORY
from services.category_correction_service import load_correction_embeddings
from utils.embedding_utils import load_embedding
from utils.log import info, warn, success


async def handle_job_categorize(db: AsyncSession, job: Job):
    """Classify assets with a CLIP embedding that are either uncategorized
    (NULL) or previously landed on NO_CATEGORY.

    NO_CATEGORY is re-checked every run, not treated as a permanent dead
    end: "wrong category" corrections (category_correction_service.py)
    cascade-veto every OTHER photo currently in that category the moment
    a correction is made, which can knock a genuine match down to
    NO_CATEGORY too - and since that used to be a one-way sentinel, a run
    of corrections could permanently erode a whole category over time with
    no way back (this is exactly what emptied out "pet": 93 corrections
    left legitimate pet photos stuck at NO_CATEGORY forever). Re-checking
    NO_CATEGORY each run is cheap (a handful of in-memory cosine-similarity
    comparisons per photo, no model inference) and self-heals that erosion
    instead of requiring a manual reset.
    """
    data = job.data or {}
    scoped_user_id = data.get("user_id")

    conditions = [
        Asset.clip_embedding_path.isnot(None),
        or_(Asset.smart_category.is_(None), Asset.smart_category == NO_CATEGORY),
        Asset.is_trashed == False,
    ]
    if scoped_user_id:
        conditions.append(Asset.user_id == scoped_user_id)

    result = await db.execute(select(Asset).where(and_(*conditions)))
    assets = list(result.scalars().all())

    total = len(assets)
    processed = 0

    if total == 0:
        # "0/0 classified" alone doesn't say whether there was genuinely
        # nothing left to do, or nothing has ever been CLIP-embedded yet
        # (e.g. CLIP failed to load, or the CLIP job hasn't run/finished) -
        # those look identical from the job's own result but mean very
        # different things, and the second one is a real problem worth a
        # clear message instead of a silent, unremarkable "0/0".
        no_embedding_conditions = [Asset.clip_embedding_path.is_(None), Asset.is_trashed == False]
        if scoped_user_id:
            no_embedding_conditions.append(Asset.user_id == scoped_user_id)
        pending_clip = (await db.execute(
            select(func.count(Asset.id)).where(and_(*no_embedding_conditions))
        )).scalar_one()
        if pending_clip:
            warn("JOB", f"Categorize: nothing to classify yet - {pending_clip} asset(s) still have no CLIP embedding (run/wait for the CLIP job first).")
        else:
            info("JOB", "Categorize: nothing to classify - every CLIP-embedded asset already has a category.")
        return

    info("JOB", f"Categorizing {total} asset(s)...")

    # Corrections are per-user, so this can't load them once for the whole
    # batch - a job with no scoped_user_id processes every user's assets
    # together, and always defaulting to {} (as before) meant the routine
    # auto-triggered run (after every CLIP batch - see clip_handler.py)
    # silently ignored every correction ever made, only a manually-run job
    # with an explicit user_id applied them at all.
    corrections_by_user = {}

    # Read once, not once per range()/slice reference below - see
    # import_handler.py's identical comment for why.
    from services.job_concurrency_service import get_effective_concurrency
    concurrency = get_effective_concurrency()

    for batch_start in range(0, total, concurrency):
        batch = assets[batch_start:batch_start + concurrency]
        await check_job_cancelled(db, job.id)

        embeddings = await asyncio.gather(
            *[asyncio.to_thread(load_embedding, asset.clip_embedding_path) for asset in batch],
            return_exceptions=True,
        )

        for asset, embedding in zip(batch, embeddings):
            processed += 1
            if isinstance(embedding, Exception) or embedding is None:
                asset.smart_category = NO_CATEGORY
                continue
            if asset.user_id not in corrections_by_user:
                corrections_by_user[asset.user_id] = await load_correction_embeddings(db, asset.user_id)
            category = classify_embedding(embedding, corrections_by_user[asset.user_id])
            asset.smart_category = category or NO_CATEGORY

        job.progress = int(processed / total * 100) if total > 0 else 100
        await db.commit()
        # See clip_handler.py's identical expunge - keeps this job's RAM use
        # bounded by batch size instead of the whole library.
        for asset in batch:
            db.expunge(asset)

    success("JOB", f"Categorize completed: {processed}/{total} assets classified")
