"""Album business logic: listing, CRUD, membership, sharing."""
import asyncio
from typing import Optional, List, Tuple
from fastapi import HTTPException
from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession

from models import User, Album, AlbumAsset, AlbumUser, Asset
from utils.serializers import album_to_dict, asset_to_dict

# Same acceptance bar search_smart() uses for its CLIP results - if a query
# would surface a photo in search, that's a reasonable bar for auto-adding
# it to a dynamic album too. This model's real photo-vs-text scores run
# much lower than typical CLIP models (-0.05 to +0.18 per
# smart_category_service.py's own calibration note), so don't raise this
# casually - it was not guessed, it matches an already-shipped threshold.
SMART_ALBUM_MATCH_THRESHOLD = 0.15


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
    db: AsyncSession, user: User, name: str, description: Optional[str], asset_ids: Optional[List[str]],
    is_smart: bool = False, smart_query: Optional[str] = None,
) -> dict:
    is_smart = bool(is_smart and smart_query and smart_query.strip())
    album = Album(
        user_id=user.id, name=name, description=description,
        is_smart=is_smart, smart_query=smart_query.strip() if is_smart else None,
    )
    db.add(album)
    await db.flush()

    if is_smart:
        # A dynamic album's contents come purely from matching its query -
        # any asset_ids passed alongside it are ignored rather than mixed
        # in, since that would leave the album half auto-curated and half
        # not with no way to tell the two apart later.
        matched_ids = await _backfill_smart_album(db, album)
        if matched_ids:
            album.cover_asset_id = matched_ids[0]
        count = len(matched_ids)
    elif asset_ids:
        for aid in asset_ids:
            db.add(AlbumAsset(album_id=album.id, asset_id=aid))
        album.cover_asset_id = asset_ids[0]
        count = len(asset_ids)
    else:
        count = 0

    await db.commit()
    return album_to_dict(album, count, viewer_id=user.id)


async def _backfill_smart_album(db: AsyncSession, album: Album) -> List[str]:
    """Populate a freshly-created dynamic album by scoring every already-
    CLIP-indexed photo in the owner's library against its query - the same
    check the CLIP job applies to new photos as they're indexed from here
    on (see load_smart_album_queries_for_user/match_asset_to_smart_albums).
    """
    from services.ml_service import CLIP_AVAILABLE, search_by_text

    if not CLIP_AVAILABLE:
        return []

    stmt = select(Asset.id, Asset.clip_embedding_path).where(
        and_(
            Asset.user_id == album.user_id,
            Asset.is_trashed == False,
            Asset.clip_embedding_path.isnot(None),
        )
    )
    embedding_data = [(aid, path) for aid, path in (await db.execute(stmt)).all()]
    if not embedding_data:
        return []

    # top_k = the whole library, not search's usual small page size - a
    # dynamic album wants every matching photo, not just the best handful.
    scored = await asyncio.to_thread(search_by_text, album.smart_query, embedding_data, len(embedding_data))
    matched_ids = [aid for aid, score in scored if score > SMART_ALBUM_MATCH_THRESHOLD]

    for aid in matched_ids:
        db.add(AlbumAsset(album_id=album.id, asset_id=aid))

    return matched_ids


async def load_smart_album_queries_for_user(db: AsyncSession, user_id: str) -> List[Tuple[str, "object"]]:
    """(album_id, query_text_embedding) pairs for a user's dynamic albums -
    meant to be computed once per CLIP job run and reused across every
    photo it processes, rather than re-embedding the same query text once
    per photo."""
    from services.ml_service import CLIP_AVAILABLE, compute_text_embedding

    if not CLIP_AVAILABLE:
        return []

    result = await db.execute(
        select(Album).where(and_(Album.user_id == user_id, Album.is_smart == True, Album.smart_query.isnot(None)))
    )
    albums = list(result.scalars().all())

    entries = []
    for album in albums:
        emb = await asyncio.to_thread(compute_text_embedding, album.smart_query)
        if emb is not None:
            entries.append((album.id, emb))
    return entries


async def match_asset_to_smart_albums(
    db: AsyncSession, asset_id: str, embedding, smart_album_entries: List[Tuple[str, "object"]]
) -> None:
    """Auto-adds asset_id to any of the given dynamic albums its embedding
    scores above the match threshold on - called right after a photo's own
    CLIP embedding is computed. Skips albums it's already in."""
    if not smart_album_entries:
        return
    from utils.embedding_utils import cosine_similarity

    for album_id, query_emb in smart_album_entries:
        if query_emb.shape != embedding.shape:
            continue
        if cosine_similarity(query_emb, embedding) <= SMART_ALBUM_MATCH_THRESHOLD:
            continue
        existing = await db.execute(
            select(AlbumAsset).where(and_(AlbumAsset.album_id == album_id, AlbumAsset.asset_id == asset_id))
        )
        if not existing.scalar_one_or_none():
            db.add(AlbumAsset(album_id=album_id, asset_id=asset_id))


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
