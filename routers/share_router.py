"""Share Router - Public sharing links"""
import secrets
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import User, Asset, Album, AlbumAsset, SharedLink
from auth import get_current_user, get_optional_user, hash_password, verify_password
from services import asset_media_service

router = APIRouter(tags=["shares"])


class ShareCreateRequest(BaseModel):
    link_type: str  # ASSET or ALBUM
    asset_ids: Optional[List[str]] = None
    album_id: Optional[str] = None
    password: Optional[str] = None
    expires_in_days: Optional[int] = None
    allow_download: bool = True
    description: Optional[str] = None


class SharePasswordRequest(BaseModel):
    password: str


def _share_to_dict(share: SharedLink) -> dict:
    return {
        "id": share.id,
        "key": share.key,
        "link_type": share.link_type,
        "album_id": share.album_id,
        "asset_count": len(share.asset_ids) if share.asset_ids_json else 0,
        "has_password": share.password_hash is not None,
        "expires_at": share.expires_at.isoformat() if share.expires_at else None,
        "allow_download": share.allow_download,
        "description": share.description,
        "view_count": share.view_count,
        "created_at": share.created_at.isoformat() if share.created_at else None,
        "url": f"/shared/{share.key}",
    }


@router.post("/api/shares")
async def create_share(
    req: ShareCreateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a sharing link."""
    key = secrets.token_urlsafe(32)

    share = SharedLink(
        user_id=user.id,
        key=key,
        link_type=req.link_type,
        allow_download=req.allow_download,
        description=req.description,
    )

    if req.link_type == "ASSET" and req.asset_ids:
        share.asset_ids = req.asset_ids
    elif req.link_type == "ALBUM" and req.album_id:
        share.album_id = req.album_id
    else:
        raise HTTPException(status_code=400, detail="Invalid share configuration")

    if req.password:
        share.password_hash = hash_password(req.password)

    if req.expires_in_days:
        from datetime import timedelta
        share.expires_at = datetime.now(timezone.utc) + timedelta(days=req.expires_in_days)

    db.add(share)
    await db.commit()

    return _share_to_dict(share)


@router.get("/api/shares")
async def list_shares(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List user's sharing links."""
    stmt = (
        select(SharedLink)
        .where(SharedLink.user_id == user.id)
        .order_by(SharedLink.created_at.desc())
    )
    result = await db.execute(stmt)
    shares = list(result.scalars().all())
    return {"shares": [_share_to_dict(s) for s in shares]}


@router.delete("/api/shares/{share_id}")
async def delete_share(
    share_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a sharing link."""
    result = await db.execute(
        select(SharedLink).where(
            and_(SharedLink.id == share_id, SharedLink.user_id == user.id)
        )
    )
    share = result.scalar_one_or_none()
    if not share:
        raise HTTPException(status_code=404, detail="Share not found")

    await db.delete(share)
    await db.commit()
    return {"message": "Share deleted"}


async def _get_share_or_404(db: AsyncSession, key: str) -> SharedLink:
    """Look up a share by key, checking existence and expiry - the two
    checks every public share-scoped endpoint needs regardless of what it
    does with the share afterward. Password verification is deliberately
    NOT included here: view_shared() needs a soft "requires_password" JSON
    reply, while the media endpoints below need a hard 403 - two different
    enough response shapes that folding them into one helper would just
    push a branch back onto every caller anyway."""
    result = await db.execute(select(SharedLink).where(SharedLink.key == key))
    share = result.scalar_one_or_none()

    if not share:
        raise HTTPException(status_code=404, detail="Shared link not found")

    # expires_at round-trips through SQLite as a naive datetime (no tzinfo
    # preserved) even though it's always written as UTC - comparing it
    # against an aware datetime.now(timezone.utc) raises TypeError, so the
    # "now" side has to be naive too here to match.
    if share.expires_at and share.expires_at < datetime.now(timezone.utc).replace(tzinfo=None):
        raise HTTPException(status_code=410, detail="Shared link has expired")

    return share


async def _resolve_share_asset_ids(db: AsyncSession, share: SharedLink) -> set:
    """Every asset id actually covered by this share - an ASSET-type
    share's fixed id list, or an ALBUM-type share's current membership
    (so removing a photo from the album also removes it from anything
    already shared, matching what the share viewer's asset list itself
    would show). Used to scope the public media endpoints so a visitor
    can't reach any asset outside what was explicitly shared."""
    if share.link_type == "ASSET" and share.asset_ids:
        return set(share.asset_ids)
    if share.link_type == "ALBUM" and share.album_id:
        stmt = select(AlbumAsset.asset_id).where(AlbumAsset.album_id == share.album_id)
        rows = (await db.execute(stmt)).scalars().all()
        return set(rows)
    return set()


async def _require_share_asset_access(db: AsyncSession, key: str, asset_id: str, password: Optional[str]) -> tuple:
    """Full hard-fail access check for the public per-asset media endpoints:
    valid/unexpired share, correct password (if one is set), and the asset
    actually belongs to that share's scope. Raises 404/410/403 on any
    failure so a visitor gets no signal about which check failed. Returns
    (share, asset) - callers that also need share.allow_download (the
    /file endpoint) check it AFTER this succeeds, not before, so a wrong
    password never leaks whether downloads happen to be enabled."""
    share = await _get_share_or_404(db, key)

    if share.password_hash and not (password and verify_password(password, share.password_hash)):
        raise HTTPException(status_code=403, detail="Password required or incorrect")

    asset_ids = await _resolve_share_asset_ids(db, share)
    if asset_id not in asset_ids:
        raise HTTPException(status_code=404, detail="Asset not found in this share")

    asset_result = await db.execute(select(Asset).where(Asset.id == asset_id))
    asset = asset_result.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    return share, asset


@router.get("/api/shared/{key}/assets/{asset_id}/thumbnail")
async def get_shared_asset_thumbnail(
    key: str,
    asset_id: str,
    size: str = Query("medium", pattern="^(small|medium|large)$"),
    password: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Public, share-scoped thumbnail - no auth required. Always allowed
    regardless of allow_download, same as the authenticated thumbnail
    endpoint (that flag only governs the original-file download)."""
    _, asset = await _require_share_asset_access(db, key, asset_id, password)
    return asset_media_service.build_thumbnail_response(asset, size)


@router.get("/api/shared/{key}/assets/{asset_id}/file")
async def get_shared_asset_file(
    key: str,
    asset_id: str,
    password: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Public, share-scoped original file - no auth required. Blocked
    entirely when the share was created with "allow download" off."""
    share, asset = await _require_share_asset_access(db, key, asset_id, password)
    if not share.allow_download:
        raise HTTPException(status_code=403, detail="Downloads are disabled for this share")
    return asset_media_service.build_file_response(asset)


@router.get("/api/shared/{key}")
async def view_shared(
    key: str,
    password: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """View a shared link (public, no auth required)."""
    share = await _get_share_or_404(db, key)

    # Check password
    if share.password_hash:
        if not password or not verify_password(password, share.password_hash):
            return {
                "requires_password": True,
                "description": share.description,
            }

    # Increment view count
    share.view_count += 1
    await db.commit()

    # Get assets
    from utils.serializers import asset_to_dict
    assets = []

    if share.link_type == "ASSET" and share.asset_ids:
        for aid in share.asset_ids:
            asset_result = await db.execute(select(Asset).where(Asset.id == aid))
            asset = asset_result.scalar_one_or_none()
            if asset:
                assets.append(asset_to_dict(asset))

    elif share.link_type == "ALBUM" and share.album_id:
        album_result = await db.execute(select(Album).where(Album.id == share.album_id))
        album = album_result.scalar_one_or_none()

        if album:
            stmt = (
                select(Asset)
                .join(AlbumAsset, AlbumAsset.asset_id == Asset.id)
                .where(AlbumAsset.album_id == share.album_id)
            )
            asset_results = await db.execute(stmt)
            assets = [asset_to_dict(a) for a in asset_results.scalars().all()]

    return {
        "requires_password": False,
        "description": share.description,
        "link_type": share.link_type,
        "allow_download": share.allow_download,
        "assets": assets,
        "total": len(assets),
    }
