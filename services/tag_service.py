"""Free-text asset tagging - see models/tag.py."""
from typing import List
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from models import Tag, AssetTag, Asset, User


def _normalize(name: str) -> str:
    return name.strip()


async def _get_or_create_tag(db: AsyncSession, user: User, name: str) -> Tag:
    """Case-insensitively deduped per user - "Vacation" and "vacation" typed
    on two different days should land on the same tag, not fork into two."""
    clean = _normalize(name)
    result = await db.execute(
        select(Tag).where(Tag.user_id == user.id, func.lower(Tag.name) == clean.lower())
    )
    tag = result.scalar_one_or_none()
    if tag:
        return tag

    tag = Tag(user_id=user.id, name=clean)
    db.add(tag)
    await db.flush()
    return tag


async def list_tags(db: AsyncSession, user: User) -> List[dict]:
    """All of this user's tags with how many (non-trashed) assets carry
    each - used both for the manage-tags view and the gallery search
    suggestion counts."""
    result = await db.execute(
        select(Tag.id, Tag.name, func.count(AssetTag.asset_id))
        .outerjoin(AssetTag, AssetTag.tag_id == Tag.id)
        .outerjoin(Asset, and_(Asset.id == AssetTag.asset_id, Asset.is_trashed == False))
        .where(Tag.user_id == user.id)
        .group_by(Tag.id)
        .order_by(Tag.name)
    )
    return [{"id": tid, "name": name, "count": count} for tid, name, count in result.all()]


async def get_tags_for_asset(db: AsyncSession, asset_id: str) -> List[dict]:
    result = await db.execute(
        select(Tag.id, Tag.name)
        .join(AssetTag, AssetTag.tag_id == Tag.id)
        .where(AssetTag.asset_id == asset_id)
        .order_by(Tag.name)
    )
    return [{"id": tid, "name": name} for tid, name in result.all()]


async def add_tags_to_asset(db: AsyncSession, user: User, asset_id: str, names: List[str]) -> List[dict]:
    for raw_name in names:
        name = _normalize(raw_name)
        if not name:
            continue
        tag = await _get_or_create_tag(db, user, name)
        existing = await db.execute(
            select(AssetTag).where(AssetTag.asset_id == asset_id, AssetTag.tag_id == tag.id)
        )
        if not existing.scalar_one_or_none():
            db.add(AssetTag(asset_id=asset_id, tag_id=tag.id))
    await db.flush()
    return await get_tags_for_asset(db, asset_id)


async def remove_tag_from_asset(db: AsyncSession, asset_id: str, tag_id: str) -> None:
    result = await db.execute(
        select(AssetTag).where(AssetTag.asset_id == asset_id, AssetTag.tag_id == tag_id)
    )
    link = result.scalar_one_or_none()
    if link:
        await db.delete(link)
        await db.flush()


async def bulk_add_tags(db: AsyncSession, user: User, asset_ids: List[str], names: List[str]) -> int:
    """Applies every name in `names` to every asset in `asset_ids` -
    scoped to the user's own assets via the caller's own ownership check,
    same as bulk_update_metadata."""
    tags = [await _get_or_create_tag(db, user, name) for name in names if _normalize(name)]
    count = 0
    for asset_id in asset_ids:
        for tag in tags:
            existing = await db.execute(
                select(AssetTag).where(AssetTag.asset_id == asset_id, AssetTag.tag_id == tag.id)
            )
            if not existing.scalar_one_or_none():
                db.add(AssetTag(asset_id=asset_id, tag_id=tag.id))
                count += 1
    await db.flush()
    return count
