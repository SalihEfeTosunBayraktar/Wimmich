"""Album business logic: listing, CRUD, membership, sharing."""
from typing import Optional, List
from fastapi import HTTPException
from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession

from models import User, Album, AlbumAsset, AlbumUser, Asset
from utils.serializers import album_to_dict, asset_to_dict


async def get_album_for_user(
    db: AsyncSession, album_id: str, user_id: str, require_owner: bool = False
) -> Album:
    """Get album and verify access."""
    result = await db.execute(select(Album).where(Album.id == album_id))
    album = result.scalar_one_or_none()

    if not album:
        raise HTTPException(status_code=404, detail="Album not found")

    if require_owner and album.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not album owner")

    if album.user_id != user_id:
        shared = await db.execute(
            select(AlbumUser).where(
                and_(AlbumUser.album_id == album_id, AlbumUser.user_id == user_id)
            )
        )
        if not shared.scalar_one_or_none():
            raise HTTPException(status_code=403, detail="No access to this album")

    return album


async def list_albums_for_user(db: AsyncSession, user: User) -> dict:
    """List all albums for current user (owned + shared)."""
    stmt = select(Album).where(Album.user_id == user.id).order_by(Album.updated_at.desc())
    owned = list((await db.execute(stmt)).scalars().all())

    shared_stmt = (
        select(Album)
        .join(AlbumUser, AlbumUser.album_id == Album.id)
        .where(AlbumUser.user_id == user.id)
        .order_by(Album.updated_at.desc())
    )
    shared = list((await db.execute(shared_stmt)).scalars().all())

    albums = []
    for album in owned + shared:
        count = (await db.execute(
            select(func.count(AlbumAsset.id)).where(AlbumAsset.album_id == album.id)
        )).scalar()

        cover_thumb = None
        cover_id = album.cover_asset_id
        if not cover_id:
            first = await db.execute(
                select(AlbumAsset.asset_id).where(AlbumAsset.album_id == album.id).limit(1)
            )
            first_row = first.first()
            if first_row:
                cover_id = first_row[0]

        if cover_id:
            cover_thumb = f"/api/assets/{cover_id}/thumbnail?size=medium"

        albums.append(album_to_dict(album, count, cover_thumb))

    return {"albums": albums}


async def create_album(
    db: AsyncSession, user: User, name: str, description: Optional[str], asset_ids: Optional[List[str]]
) -> dict:
    album = Album(user_id=user.id, name=name, description=description)
    db.add(album)
    await db.flush()

    if asset_ids:
        for aid in asset_ids:
            db.add(AlbumAsset(album_id=album.id, asset_id=aid))
        album.cover_asset_id = asset_ids[0]

    await db.commit()
    return album_to_dict(album, len(asset_ids or []))


async def get_album_detail(db: AsyncSession, album_id: str, user_id: str) -> dict:
    """Get album details with assets and shared users."""
    album = await get_album_for_user(db, album_id, user_id)

    stmt = (
        select(Asset)
        .join(AlbumAsset, AlbumAsset.asset_id == Asset.id)
        .where(AlbumAsset.album_id == album_id)
        .order_by(func.coalesce(Asset.taken_at, Asset.created_at).desc())
    )
    assets = list((await db.execute(stmt)).scalars().all())

    album_data = album_to_dict(album, len(assets))
    album_data["assets"] = [asset_to_dict(a) for a in assets]

    shared_stmt = (
        select(AlbumUser, User)
        .join(User, User.id == AlbumUser.user_id)
        .where(AlbumUser.album_id == album_id)
    )
    shared_result = await db.execute(shared_stmt)
    album_data["shared_users"] = [
        {"user_id": au.user_id, "name": u.name, "email": u.email, "can_edit": au.can_edit}
        for au, u in shared_result.all()
    ]

    return album_data


async def update_album(
    db: AsyncSession, album_id: str, user_id: str,
    name: Optional[str], description: Optional[str], cover_asset_id: Optional[str],
) -> dict:
    album = await get_album_for_user(db, album_id, user_id, require_owner=True)

    if name is not None:
        album.name = name
    if description is not None:
        album.description = description
    if cover_asset_id is not None:
        album.cover_asset_id = cover_asset_id

    await db.commit()
    return album_to_dict(album)


async def delete_album(db: AsyncSession, album_id: str, user_id: str) -> dict:
    album = await get_album_for_user(db, album_id, user_id, require_owner=True)
    await db.delete(album)
    await db.commit()
    return {"message": "Album deleted"}


async def add_assets_to_album(db: AsyncSession, album_id: str, user_id: str, asset_ids: List[str]) -> dict:
    album = await get_album_for_user(db, album_id, user_id)

    added = 0
    for aid in asset_ids:
        existing = await db.execute(
            select(AlbumAsset).where(
                and_(AlbumAsset.album_id == album_id, AlbumAsset.asset_id == aid)
            )
        )
        if not existing.scalar_one_or_none():
            db.add(AlbumAsset(album_id=album_id, asset_id=aid))
            added += 1

    if not album.cover_asset_id and asset_ids:
        album.cover_asset_id = asset_ids[0]

    await db.commit()
    return {"message": f"{added} assets added to album"}


async def remove_assets_from_album(db: AsyncSession, album_id: str, user_id: str, asset_ids: List[str]) -> dict:
    await get_album_for_user(db, album_id, user_id)

    for aid in asset_ids:
        result = await db.execute(
            select(AlbumAsset).where(
                and_(AlbumAsset.album_id == album_id, AlbumAsset.asset_id == aid)
            )
        )
        link = result.scalar_one_or_none()
        if link:
            await db.delete(link)

    await db.commit()
    return {"message": "Assets removed from album"}


async def share_album(db: AsyncSession, album_id: str, user_id: str, target_user_id: str, can_edit: bool) -> dict:
    await get_album_for_user(db, album_id, user_id, require_owner=True)

    target_result = await db.execute(select(User).where(User.id == target_user_id))
    if not target_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Target user not found")

    existing = await db.execute(
        select(AlbumUser).where(
            and_(AlbumUser.album_id == album_id, AlbumUser.user_id == target_user_id)
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Album already shared with this user")

    db.add(AlbumUser(album_id=album_id, user_id=target_user_id, can_edit=can_edit))
    await db.commit()
    return {"message": "Album shared"}
