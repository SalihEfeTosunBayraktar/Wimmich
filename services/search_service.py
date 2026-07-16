"""Search Service"""
from datetime import datetime
from typing import Optional, List, Tuple
from sqlalchemy import select, and_, or_, func
from sqlalchemy.ext.asyncio import AsyncSession

from models import Asset
from services.ml_service import search_by_text, CLIP_AVAILABLE


async def search_metadata(
    db: AsyncSession,
    user_id: str,
    query: str,
    file_type: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    is_favorite: Optional[bool] = None,
    limit: int = 100,
    offset: int = 0,
) -> List[Asset]:
    """Search assets by metadata (filename, date, type)."""
    conditions = [
        Asset.user_id == user_id,
        Asset.is_trashed == False,
    ]

    if query:
        conditions.append(
            or_(
                Asset.original_file_name.ilike(f"%{query}%"),
                Asset.city.ilike(f"%{query}%"),
                Asset.country.ilike(f"%{query}%"),
            )
        )

    if file_type:
        conditions.append(Asset.file_type == file_type.upper())

    if date_from:
        try:
            dt = datetime.fromisoformat(date_from)
            conditions.append(func.coalesce(Asset.taken_at, Asset.created_at) >= dt)
        except ValueError:
            pass

    if date_to:
        try:
            dt = datetime.fromisoformat(date_to)
            conditions.append(func.coalesce(Asset.taken_at, Asset.created_at) <= dt)
        except ValueError:
            pass

    if is_favorite is not None:
        conditions.append(Asset.is_favorite == is_favorite)

    stmt = (
        select(Asset)
        .where(and_(*conditions))
        .order_by(func.coalesce(Asset.taken_at, Asset.created_at).desc())
        .offset(offset)
        .limit(limit)
    )

    result = await db.execute(stmt)
    return list(result.scalars().all())


async def search_smart(
    db: AsyncSession,
    user_id: str,
    query: str,
    limit: int = 50,
) -> List[Tuple[Asset, float]]:
    """
    Smart search using CLIP semantic search, blended with a plain metadata
    match (filename/city/country). CLIP has no grounding for proper nouns
    like a city name or a file's own name - "Sivas" or "IMG_2024" would
    score every photo near-zero and return nothing, even though the photo
    is literally tagged with that city or named that. Metadata hits are
    exact substring matches, so they're trustworthy enough to rank first.
    Returns list of (asset, score) tuples.
    """
    metadata_assets = await search_metadata(db, user_id, query, limit=limit)
    metadata_ids = {a.id for a in metadata_assets}

    if not CLIP_AVAILABLE:
        return [(a, 1.0) for a in metadata_assets]

    # Column-only select for the scoring pass - every search request (this
    # runs on every debounced keystroke from the UI) doesn't need to
    # materialize a full Asset ORM object, with every column, for
    # potentially thousands of embeddings just to read two fields off each
    # and throw the rest away.
    stmt = (
        select(Asset.id, Asset.clip_embedding_path)
        .where(
            and_(
                Asset.user_id == user_id,
                Asset.is_trashed == False,
                Asset.clip_embedding_path.isnot(None),
            )
        )
    )
    result = await db.execute(stmt)
    embedding_data = [(aid, path) for aid, path in result.all()]

    # Metadata matches always lead (exact match beats a fuzzy visual guess),
    # then CLIP results fill the rest of the limit, skipping duplicates.
    results = [(a, 1.0) for a in metadata_assets]

    if embedding_data:
        import asyncio
        scored = await asyncio.to_thread(search_by_text, query, embedding_data, limit)
        top_scores = {aid: score for aid, score in scored if aid not in metadata_ids and score > 0.15}
        if top_scores:
            # Only the actual top-K results get fetched as full Asset rows.
            top_result = await db.execute(select(Asset).where(Asset.id.in_(top_scores.keys())))
            asset_map = {a.id: a for a in top_result.scalars().all()}
            # scored is already sorted best-first (see search_by_text) -
            # iterate it, not the DB fetch above, to keep that ranking.
            for asset_id, score in scored:
                if asset_id in top_scores and asset_id in asset_map:
                    results.append((asset_map[asset_id], score))

    return results[:limit] if len(results) > limit else results
