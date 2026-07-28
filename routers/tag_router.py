"""Tag Router - free-text asset tags (list, per-asset add/remove, bulk add)."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import User
from auth import get_current_user
from services import tag_service
from services.asset_query_service import get_asset_or_404

router = APIRouter(prefix="/api", tags=["tags"])


class AddTagsRequest(BaseModel):
    names: List[str]


class BulkTagRequest(BaseModel):
    asset_ids: List[str]
    names: List[str]


@router.get("/tags")
async def list_tags(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return {"tags": await tag_service.list_tags(db, user)}


# Registered before asset_router's GET /{asset_id} catch-all would matter
# only if it lived in the same router - it doesn't, but the literal
# "/assets/bulk-tags" path below still needs to be registered ahead of
# asset_router's PUT /{asset_id} in main.py's include_router order, same
# reasoning as bulk-metadata.
@router.put("/assets/bulk-tags")
async def bulk_add_tags(
    req: BulkTagRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    for asset_id in req.asset_ids:
        await get_asset_or_404(db, asset_id, user.id)
    count = await tag_service.bulk_add_tags(db, user, req.asset_ids, req.names)
    await db.commit()
    return {"message": "Etiketler eklendi", "added": count}


@router.get("/assets/{asset_id}/tags")
async def get_asset_tags(
    asset_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_asset_or_404(db, asset_id, user.id)
    return {"tags": await tag_service.get_tags_for_asset(db, asset_id)}


@router.post("/assets/{asset_id}/tags")
async def add_asset_tags(
    asset_id: str,
    req: AddTagsRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_asset_or_404(db, asset_id, user.id)
    tags = await tag_service.add_tags_to_asset(db, user, asset_id, req.names)
    await db.commit()
    return {"tags": tags}


@router.delete("/assets/{asset_id}/tags/{tag_id}")
async def remove_asset_tag(
    asset_id: str,
    tag_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_asset_or_404(db, asset_id, user.id)
    await tag_service.remove_tag_from_asset(db, asset_id, tag_id)
    await db.commit()
    return {"message": "Etiket kaldırıldı"}
