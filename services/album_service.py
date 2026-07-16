"""Album business logic: listing, CRUD, membership, sharing."""
from typing import Optional, List
from fastapi import HTTPException
from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession

from models import User, Album, AlbumAsset, AlbumUser, Asset
from utils.serializers import album_to_dict, asset_to_dict


async def get_album_for_user(
    db: AsyncSession, album_id: str, user_id: str, require_owner: bool = False, require_edit: bool = False
) -> Album:
    """Get album and verify access. require_edit additionally rejects a
    shared user whose access is view-only (can_edit=False) - the owner
    always passes both checks."""
    result = await db.execute(select(Album).where(Album.id == album_id))
    album = result.scalar_one_or_none()

    if not album:
        raise HTTPException(status_code=404, detail="Album not found")

    if album.user_id == user_id:
        return album

    if require_owner:
        raise HTTPException(status_code=403, detail="Not album owner")

    shared = await db.execute(
        select(AlbumUser).where(
            and_(AlbumUser.album_id == album_id, AlbumUser.user_id == user_id)
        )
    )
    share = shared.scalar_one_or_none()
    if not share:
        raise HTTPException(status_code=403, detail="No access to this album")
    if require_edit and not share.can_edit:
        raise HTTPException(status_code=403, detail="View-only access to this album")

    return album


async def list_albums_for_user(db: AsyncSession, user: User) -> dict:
    """List all albums for current user (owned + shared)."""
    stmt = select(Album).where(Album.user_id == user.id).order_by(Album.updated_at.desc())
    owned = list((await db.execute(stmt)).scalars().all())

    shared_stmt = (
        select(Album, AlbumUser.can_edit)
        .join(AlbumUser, AlbumUser.album_id == Album.id)
        .where(AlbumUser.user_id == user.id)
        .order_by(Album.updated_at.desc())
    )
    shared_rows = (await db.execute(shared_stmt)).all()
    shared_can_edit = {album.id: can_edit for album, can_edit in shared_rows}
    shared = [album for album, _ in shared_rows]

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

        albums.append(album_to_dict(
            album, count, cover_thumb,
            viewer_id=user.id, viewer_can_edit=shared_can_edit.get(album.id, False),
        ))

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
    return album_to_dict(album, len(asset_ids or []), viewer_id=user.id)


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

    viewer_can_edit = None
    if album.user_id != user_id:
        own_share = await db.execute(
            select(AlbumUser).where(
                and_(AlbumUser.album_id == album_id, AlbumUser.user_id == user_id)
            )
        )
        row = own_share.scalar_one_or_none()
        viewer_can_edit = row.can_edit if row else False

    album_data = album_to_dict(album, len(assets), viewer_id=user_id, viewer_can_edit=viewer_can_edit)
    album_data["assets"] = [asset_to_dict(a) for a in assets]

    owner_result = await db.execute(select(User).where(User.id == album.user_id))
    owner = owner_result.scalar_one_or_none()
    album_data["owner_name"] = owner.name if owner else None

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
    album = await get_album_for_user(db, album_id, user_id, require_edit=True)

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
    await get_album_for_user(db, album_id, user_id, require_edit=True)

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


async def unshare_album(db: AsyncSession, album_id: str, user_id: str, target_user_id: str) -> dict:
    """Revoke a shared user's access - owner-only, same as granting it."""
    await get_album_for_user(db, album_id, user_id, require_owner=True)

    result = await db.execute(
        select(AlbumUser).where(
            and_(AlbumUser.album_id == album_id, AlbumUser.user_id == target_user_id)
        )
    )
    share = result.scalar_one_or_none()
    if not share:
        raise HTTPException(status_code=404, detail="Album is not shared with this user")

    await db.delete(share)
    await db.commit()
    return {"message": "Share removed"}


async def list_share_targets(db: AsyncSession, user: User) -> dict:
    """Other approved accounts on this server that albums can be shared
    with - deliberately minimal (id/name/email only, no admin/quota/
    approval fields), unlike the admin-only full user list."""
    stmt = (
        select(User)
        .where(and_(User.id != user.id, User.is_approved == True))
        .order_by(User.name)
    )
    users = list((await db.execute(stmt)).scalars().all())
    return {"users": [{"id": u.id, "name": u.name, "email": u.email} for u in users]}
