"""Reads the "this photo looks like that one" relationships precomputed by
the SIMILARITY job (see job_handlers/similarity_handler.py) - a plain DB
join instead of a live CLIP cosine-similarity scan against the whole
library on every viewer open. Purely informational: this never suggests
deleting anything, unlike duplicate_service's visual-duplicate mode."""
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from models import Asset, User, SimilarAsset
from utils.serializers import asset_to_dict


async def get_similar_assets(db: AsyncSession, user: User, asset_id: str) -> dict:
    result = await db.execute(
        select(SimilarAsset, Asset)
        .join(Asset, Asset.id == SimilarAsset.similar_asset_id)
        .where(and_(
            SimilarAsset.asset_id == asset_id,
            Asset.user_id == user.id,
            Asset.is_trashed == False,
        ))
        .order_by(SimilarAsset.score.desc())
    )

    assets = []
    for similar_row, asset in result.all():
        d = asset_to_dict(asset)
        d["similarity"] = round(similar_row.score * 100, 1)
        assets.append(d)

    return {"assets": assets}
