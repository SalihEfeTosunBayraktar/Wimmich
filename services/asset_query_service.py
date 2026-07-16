"""Read-only asset queries: timeline, statistics, trash/favorites lists, single-asset detail."""
from typing import Optional
from fastapi import HTTPException
from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession

import config
from models import Asset, Face, User
from utils.serializers import asset_to_dict


async def get_asset_or_404(db: AsyncSession, asset_id: str, user_id: str) -> Asset:
    result = await db.execute(
        select(Asset).where(and_(Asset.id == asset_id, Asset.user_id == user_id))
    )
    asset = result.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset


async def get_timeline_data(
    db: AsyncSession,
    user: User,
    page: int,
    per_page: int,
    file_type: Optional[str],
    favorites_only: bool,
) -> dict:
    """Get assets in chronological order grouped by date."""
    conditions = [
        Asset.user_id == user.id,
        Asset.is_trashed == False,
        Asset.is_archived == False,
    ]
    if file_type:
        conditions.append(Asset.file_type == file_type.upper())
    if favorites_only:
        conditions.append(Asset.is_favorite == True)

    total = (await db.execute(select(func.count(Asset.id)).where(and_(*conditions)))).scalar()

    offset = (page - 1) * per_page
    stmt = (
        select(Asset)
        .where(and_(*conditions))
        .order_by(func.coalesce(Asset.taken_at, Asset.created_at).desc())
        .offset(offset)
        .limit(per_page)
    )
    result = await db.execute(stmt)
    assets = list(result.scalars().all())

    groups = {}
    for asset in assets:
        dt = asset.taken_at or asset.created_at
        date = dt.strftime("%Y-%m-%d")
        if date not in groups:
            month_name = config.LOCALE_MONTH_NAMES.get(dt.month, "")
            groups[date] = {
                "date": date,
                "display_date": f"{dt.day} {month_name} {dt.year}",
                "assets": [],
            }
        groups[date]["assets"].append(asset_to_dict(asset))

    return {
        "groups": list(groups.values()),
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page if total > 0 else 0,
    }


async def get_statistics_data(db: AsyncSession, user: User) -> dict:
    """Get user's asset statistics."""
    photo_count = (await db.execute(
        select(func.count(Asset.id)).where(
            and_(Asset.user_id == user.id, Asset.file_type == "IMAGE", Asset.is_trashed == False)
        )
    )).scalar()

    video_count = (await db.execute(
        select(func.count(Asset.id)).where(
            and_(Asset.user_id == user.id, Asset.file_type == "VIDEO", Asset.is_trashed == False)
        )
    )).scalar()

    fav_count = (await db.execute(
        select(func.count(Asset.id)).where(
            and_(Asset.user_id == user.id, Asset.is_favorite == True, Asset.is_trashed == False)
        )
    )).scalar()

    total_size = (await db.execute(
        select(func.sum(Asset.file_size)).where(Asset.user_id == user.id)
    )).scalar() or 0

    trash_count = (await db.execute(
        select(func.count(Asset.id)).where(
            and_(Asset.user_id == user.id, Asset.is_trashed == True)
        )
    )).scalar()

    return {
        "photos": photo_count,
        "videos": video_count,
        "favorites": fav_count,
        "total_size": total_size,
        "trash_count": trash_count,
        "total": photo_count + video_count,
    }


async def get_trash_assets(db: AsyncSession, user: User) -> list:
    stmt = (
        select(Asset)
        .where(and_(Asset.user_id == user.id, Asset.is_trashed == True))
        # 0-byte assets (failed imports - no thumbnail is possible, nothing
        # to restore) sort last so a batch of them trashed together doesn't
        # bury every real, restorable photo below a wall of broken tiles.
        .order_by((Asset.file_size == 0).asc(), Asset.trashed_at.desc())
    )
    result = await db.execute(stmt)
    return [asset_to_dict(a) for a in result.scalars().all()]


async def get_archived_assets(db: AsyncSession, user: User) -> list:
    stmt = (
        select(Asset)
        .where(and_(
            Asset.user_id == user.id,
            Asset.is_archived == True,
            Asset.is_trashed == False,
        ))
        .order_by(func.coalesce(Asset.taken_at, Asset.created_at).desc())
    )
    result = await db.execute(stmt)
    return [asset_to_dict(a) for a in result.scalars().all()]


async def get_favorite_assets(db: AsyncSession, user: User) -> list:
    stmt = (
        select(Asset)
        .where(and_(
            Asset.user_id == user.id,
            Asset.is_favorite == True,
            Asset.is_trashed == False,
        ))
        .order_by(func.coalesce(Asset.taken_at, Asset.created_at).desc())
    )
    result = await db.execute(stmt)
    return [asset_to_dict(a) for a in result.scalars().all()]


async def get_asset_detail(db: AsyncSession, asset_id: str, user: User) -> dict:
    """Get single asset details, including its detected faces."""
    asset = await get_asset_or_404(db, asset_id, user.id)
    data = asset_to_dict(asset)

    face_result = await db.execute(select(Face).where(Face.asset_id == asset_id))
    faces = list(face_result.scalars().all())
    data["faces"] = [
        {"id": f.id, "x": f.x, "y": f.y, "w": f.w, "h": f.h, "person_id": f.person_id}
        for f in faces
    ]
    data["has_faces"] = len(faces) > 0
    return data
