""""Wrong category" feedback: removes one photo from a smart category
immediately, and uses its CLIP embedding as a negative example so other
already-categorized photos (and future CATEGORIZE runs) that look similar
get vetoed away from that category too - see classify_embedding's
`corrections` param in smart_category_service.py.
"""
import asyncio
from typing import Dict, List
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from models import Asset, CategoryCorrection
from services.smart_category_service import classify_embedding, NO_CATEGORY
from utils.embedding_utils import load_embedding


async def load_correction_embeddings(db: AsyncSession, user_id: str) -> Dict[str, List]:
    """category -> [rejected embedding, ...] for every correction this user has made."""
    stmt = (
        select(CategoryCorrection.category, Asset.clip_embedding_path)
        .join(Asset, Asset.id == CategoryCorrection.asset_id)
        .where(CategoryCorrection.user_id == user_id)
    )
    rows = (await db.execute(stmt)).all()

    by_category: Dict[str, List[str]] = {}
    for category, emb_path in rows:
        if emb_path:
            by_category.setdefault(category, []).append(emb_path)

    result: Dict[str, List] = {}
    for category, paths in by_category.items():
        embeddings = await asyncio.gather(*[asyncio.to_thread(load_embedding, p) for p in paths])
        result[category] = [e for e in embeddings if e is not None]

    return result


async def record_category_correction(db: AsyncSession, user_id: str, asset: Asset, wrong_category: str) -> int:
    """Record the correction, drop this photo from the category, and
    re-check every other photo currently in that category for the same
    user (in case the embedding that made this one match is common to
    several photos). Returns how many other assets were re-categorized."""
    existing = (await db.execute(
        select(CategoryCorrection).where(
            and_(CategoryCorrection.asset_id == asset.id, CategoryCorrection.category == wrong_category)
        )
    )).scalar_one_or_none()
    if not existing:
        db.add(CategoryCorrection(user_id=user_id, asset_id=asset.id, category=wrong_category))

    asset.smart_category = NO_CATEGORY

    corrections = await load_correction_embeddings(db, user_id)

    others_stmt = select(Asset).where(
        and_(
            Asset.user_id == user_id,
            Asset.smart_category == wrong_category,
            Asset.id != asset.id,
            Asset.clip_embedding_path.isnot(None),
        )
    )
    others = list((await db.execute(others_stmt)).scalars().all())

    reclassified = 0
    for other in others:
        embedding = await asyncio.to_thread(load_embedding, other.clip_embedding_path)
        if embedding is None:
            continue
        new_category = classify_embedding(embedding, corrections)
        if new_category != wrong_category:
            other.smart_category = new_category or NO_CATEGORY
            reclassified += 1

    await db.commit()
    return reclassified
