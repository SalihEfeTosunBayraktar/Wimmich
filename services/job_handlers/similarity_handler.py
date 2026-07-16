"""SIMILARITY job handler - precompute "this photo looks like that one"
relationships (CLIP embedding cosine similarity) for every image with an
embedding, so the viewer's "benzer fotoğraflar" badge is a fast DB lookup
instead of re-scanning the whole library's embeddings live on every open.

Lower than duplicate_service's VISUAL_DUP_THRESHOLD (0.975) on purpose -
that one gates actual deletion, so it stays strict; this one only ever
surfaces a browsing suggestion, and the goal is casting a wide net for
genuinely-related photos, not just near-duplicates."""
from sqlalchemy import select, and_, delete
from sqlalchemy.ext.asyncio import AsyncSession

from models import Asset, SimilarAsset, Job
from services.job_core import check_job_cancelled

SIMILAR_THRESHOLD = 0.80
SIMILAR_LIMIT = 24


def _compute_similarity_map(items: list) -> dict:
    """items: [(asset_id, embedding_path), ...].
    Returns {asset_id: [(similar_asset_id, score), ...]}, CPU-heavy, runs
    in a thread - one full pairwise matrix instead of one query per asset."""
    import numpy as np
    from sklearn.metrics.pairwise import cosine_similarity as sk_cosine_similarity
    from utils.embedding_utils import load_embedding

    ids, embeddings = [], []
    for asset_id, path in items:
        emb = load_embedding(path)
        if emb is not None:
            ids.append(asset_id)
            embeddings.append(emb)
    if len(embeddings) < 2:
        return {}

    X = np.array(embeddings)
    sims = sk_cosine_similarity(X)

    result = {}
    for i, aid in enumerate(ids):
        row = [
            (ids[j], float(sims[i][j]))
            for j in range(len(ids))
            if j != i and sims[i][j] >= SIMILAR_THRESHOLD
        ]
        row.sort(key=lambda x: x[1], reverse=True)
        result[aid] = row[:SIMILAR_LIMIT]
    return result


async def handle_job_similarity(db: AsyncSession, job: Job):
    import asyncio

    data = job.data or {}
    user_id = data.get("user_id")

    conditions = [
        Asset.file_type == "IMAGE",
        Asset.is_trashed == False,
        Asset.clip_embedding_path.isnot(None),
    ]
    if user_id:
        conditions.append(Asset.user_id == user_id)

    result = await db.execute(select(Asset.id, Asset.clip_embedding_path).where(and_(*conditions)))
    items = result.all()

    job.progress = 10
    await db.commit()

    if not items:
        job.progress = 100
        await db.commit()
        return

    similarity_map = await asyncio.to_thread(_compute_similarity_map, items)
    await check_job_cancelled(db, job.id)

    job.progress = 60
    await db.commit()

    asset_ids = [aid for aid, _ in items]
    await db.execute(delete(SimilarAsset).where(SimilarAsset.asset_id.in_(asset_ids)))

    for asset_id, matches in similarity_map.items():
        for similar_id, score in matches:
            db.add(SimilarAsset(asset_id=asset_id, similar_asset_id=similar_id, score=score))

    job.progress = 100
    await db.commit()
