"""Admin Users Router - create/delete/quota/approval actions on user accounts."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import User, Asset
from auth import get_admin_user, hash_password

router = APIRouter(prefix="/api/admin", tags=["admin"])


class CreateUserRequest(BaseModel):
    email: str
    password: str
    name: str
    is_admin: bool = False
    storage_quota_mb: int = 0


class UpdateQuotaRequest(BaseModel):
    storage_quota_mb: int


class ApproveUserRequest(BaseModel):
    is_approved: bool


class UpdateAdminRequest(BaseModel):
    is_admin: bool


@router.post("/users")
async def create_user(
    req: CreateUserRequest,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new user (admin only)."""
    existing = await db.execute(select(User).where(User.email == req.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already exists")

    user = User(
        email=req.email,
        password_hash=hash_password(req.password),
        name=req.name,
        is_admin=req.is_admin,
        is_approved=True,  # Users manually created by admin are pre-approved
        storage_quota_mb=req.storage_quota_mb,
    )
    db.add(user)
    await db.commit()

    return {"message": "User created", "user_id": user.id}


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a user (admin only)."""
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    from services.media_service import delete_asset_files
    assets_result = await db.execute(select(Asset).where(Asset.user_id == user_id))
    for asset in assets_result.scalars().all():
        delete_asset_files(asset, delete_reference_source=True)

    await db.delete(user)
    await db.commit()
    return {"message": "User deleted"}


@router.put("/users/{user_id}/quota")
async def update_user_quota(
    user_id: str,
    req: UpdateQuotaRequest,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a user's storage quota (admin only)."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.storage_quota_mb = req.storage_quota_mb
    await db.commit()
    return {"message": "Kullanıcı kotası güncellendi", "storage_quota_mb": user.storage_quota_mb}


@router.put("/users/{user_id}/approve")
async def approve_user(
    user_id: str,
    req: ApproveUserRequest,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Approve or reject a user (admin only)."""
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Kendi onay durumunuzu değiştiremezsiniz.")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")

    user.is_approved = req.is_approved
    await db.commit()
    return {"message": "Kullanıcı onay durumu güncellendi", "is_approved": user.is_approved}


@router.put("/users/{user_id}/admin")
async def update_user_admin(
    user_id: str,
    req: UpdateAdminRequest,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Grant or revoke admin rights (admin only). Blocks changing your own
    status - the same self-lockout risk as the approve endpoint above, but
    worse here: removing your own last admin would leave the server with
    no admin account at all until someone edits the database by hand."""
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Kendi yöneticilik durumunuzu değiştiremezsiniz.")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")

    user.is_admin = req.is_admin
    await db.commit()
    return {"message": "Kullanıcı yöneticilik durumu güncellendi", "is_admin": user.is_admin}
