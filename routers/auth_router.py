"""Auth Router - Registration, Login, Profile"""
from fastapi import APIRouter, Depends, HTTPException, status, Response
from pydantic import BaseModel, EmailStr
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import User, Asset
from auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str


class LoginRequest(BaseModel):
    email: str
    password: str


class UpdateProfileRequest(BaseModel):
    name: str = None
    email: str = None
    current_password: str = None
    new_password: str = None


@router.post("/register")
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register a new user. First user becomes admin."""
    # Check if email exists
    result = await db.execute(select(User).where(User.email == req.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Check if first user (becomes admin)
    count_result = await db.execute(select(func.count(User.id)))
    user_count = count_result.scalar()
    is_first_user = user_count == 0

    user = User(
        email=req.email,
        password_hash=hash_password(req.password),
        name=req.name,
        is_admin=is_first_user,
        is_approved=is_first_user,  # First user (admin) is automatically approved
    )
    db.add(user)
    await db.flush()

    if not user.is_approved:
        return {
            "token": None,
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "is_admin": user.is_admin,
                "is_approved": user.is_approved,
            },
            "message": "Kayıt başarılı. Giriş yapabilmek için yönetici onayı bekleniyor."
        }

    token = create_access_token(user.id, user.email, user.is_admin)

    return {
        "token": token,
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "is_admin": user.is_admin,
            "is_approved": user.is_approved,
        }
    }


# A precomputed bcrypt hash of a throwaway value, verified against when no
# user matches the email. Without this, a nonexistent email returns
# immediately while a real email with a wrong password spends ~100ms in
# bcrypt - that timing gap alone lets an attacker enumerate which emails
# are registered. Running a real bcrypt comparison in both paths closes it.
_DUMMY_PASSWORD_HASH = hash_password("wimmich-login-timing-equalizer")


@router.post("/login")
async def login(req: LoginRequest, response: Response, db: AsyncSession = Depends(get_db)):
    """Login and get JWT token."""
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()

    if not user:
        # Spend the same bcrypt time as a real-user-wrong-password attempt
        # before failing, so the "does this email exist" timing side channel
        # is gone. Result deliberately ignored.
        verify_password(req.password, _DUMMY_PASSWORD_HASH)
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.is_approved and not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hesabınız henüz yönetici tarafından onaylanmadı."
        )

    token = create_access_token(user.id, user.email, user.is_admin)

    # Set cookie too
    response.set_cookie(
        key="wimmich_token",
        value=token,
        httponly=True,
        max_age=7 * 24 * 3600,
        samesite="lax",
    )

    return {
        "token": token,
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "is_admin": user.is_admin,
            "is_approved": user.is_approved,
        }
    }


@router.get("/me")
async def get_me(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Get current user info."""
    # Count assets
    count_result = await db.execute(
        select(func.count(Asset.id)).where(Asset.user_id == user.id, Asset.is_trashed == False)
    )
    asset_count = count_result.scalar()

    # Total size
    size_result = await db.execute(
        select(func.sum(Asset.file_size)).where(Asset.user_id == user.id)
    )
    total_size = size_result.scalar() or 0

    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "is_admin": user.is_admin,
        "is_approved": user.is_approved,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "asset_count": asset_count,
        "total_size": total_size,
        "storage_quota_mb": user.storage_quota_mb,
    }


@router.put("/me")
async def update_me(
    req: UpdateProfileRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update current user profile."""
    if req.name:
        user.name = req.name

    if req.email:
        # Check if email taken
        result = await db.execute(
            select(User).where(User.email == req.email, User.id != user.id)
        )
        if result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Email already in use")
        user.email = req.email

    if req.new_password:
        if not req.current_password or not verify_password(req.current_password, user.password_hash):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        user.password_hash = hash_password(req.new_password)

    await db.commit()

    return {"message": "Profile updated", "user": {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "is_admin": user.is_admin,
    }}


@router.post("/logout")
async def logout(response: Response):
    """Logout - clear cookie."""
    response.delete_cookie("wimmich_token")
    return {"message": "Logged out"}
