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


@router.get("/api/shared/{key}")
async def view_shared(
    key: str,
    password: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """View a shared link (public, no auth required)."""
    result = await db.execute(select(SharedLink).where(SharedLink.key == key))
    share = result.scalar_one_or_none()

    if not share:
        raise HTTPException(status_code=404, detail="Shared link not found")

    # Check expiry
    if share.expires_at and share.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=410, detail="Shared link has expired")

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
