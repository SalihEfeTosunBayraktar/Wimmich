"""Album Router - CRUD, Members, Assets (thin routes)."""
from typing import Optional, List
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import User
from auth import get_current_user
from services import album_service

router = APIRouter(prefix="/api/albums", tags=["albums"])


class AlbumCreateRequest(BaseModel):
    name: str
    description: Optional[str] = None
    asset_ids: Optional[List[str]] = None
    is_smart: bool = False
    smart_query: Optional[str] = None


class AlbumUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    cover_asset_id: Optional[str] = None


class AlbumAssetsRequest(BaseModel):
    asset_ids: List[str]


class AlbumShareRequest(BaseModel):
    user_id: str
    can_edit: bool = False


@router.get("")
async def list_albums(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all albums for current user (owned + shared)."""
    return await album_service.list_albums_for_user(db, user)


@router.get("/share-targets")
async def get_share_targets(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Other accounts on this server that an album can be shared with.
    Registered before the /{album_id} routes below so "share-targets"
    isn't swallowed as a path parameter."""
    return await album_service.list_share_targets(db, user)


@router.post("")
async def create_album(
    req: AlbumCreateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new album."""
    return await album_service.create_album(
        db, user, req.name, req.description, req.asset_ids, req.is_smart, req.smart_query
    )


@router.get("/{album_id}")
async def get_album(
    album_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get album details with assets."""
    return await album_service.get_album_detail(db, album_id, user.id)


@router.put("/{album_id}")
async def update_album(
    album_id: str,
    req: AlbumUpdateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update album metadata."""
    return await album_service.update_album(
        db, album_id, user.id, req.name, req.description, req.cover_asset_id
    )


@router.delete("/{album_id}")
async def delete_album(
    album_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete an album (does not delete assets)."""
    return await album_service.delete_album(db, album_id, user.id)


@router.post("/{album_id}/assets")
async def add_assets_to_album(
    album_id: str,
    req: AlbumAssetsRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add assets to album."""
    return await album_service.add_assets_to_album(db, album_id, user.id, req.asset_ids)


@router.delete("/{album_id}/assets")
async def remove_assets_from_album(
    album_id: str,
    req: AlbumAssetsRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove assets from album."""
    return await album_service.remove_assets_from_album(db, album_id, user.id, req.asset_ids)


@router.post("/{album_id}/users")
async def share_album(
    album_id: str,
    req: AlbumShareRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Share album with another user."""
    return await album_service.share_album(db, album_id, user.id, req.user_id, req.can_edit)


@router.delete("/{album_id}/users/{target_user_id}")
async def unshare_album(
    album_id: str,
    target_user_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Revoke a shared user's access to this album."""
    return await album_service.unshare_album(db, album_id, user.id, target_user_id)
