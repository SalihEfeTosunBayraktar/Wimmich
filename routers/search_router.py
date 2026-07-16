"""Search Router - Metadata & Smart Search"""
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import User
from auth import get_current_user
from services.search_service import search_metadata, search_smart
from utils.serializers import asset_to_dict

router = APIRouter(prefix="/api/search", tags=["search"])


@router.get("")
async def search(
    q: str = Query(..., min_length=1),
    search_type: str = Query("smart", pattern="^(smart|metadata)$"),
    file_type: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    is_favorite: Optional[bool] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Search assets by text or metadata."""
    if search_type == "smart":
        results = await search_smart(db, user.id, q, limit=limit)
        return {
            "results": [
                {**asset_to_dict(asset), "score": round(score, 3)}
                for asset, score in results
            ],
            "total": len(results),
            "search_type": "smart",
        }
    else:
        assets = await search_metadata(
            db, user.id, q,
            file_type=file_type,
            date_from=date_from,
            date_to=date_to,
            is_favorite=is_favorite,
            limit=limit,
            offset=offset,
        )
        return {
            "results": [asset_to_dict(a) for a in assets],
            "total": len(assets),
            "search_type": "metadata",
        }
