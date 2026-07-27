"""Auth Router - Registration, Login, Profile"""
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from pydantic import BaseModel, EmailStr
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import User, Asset, Session
from auth import hash_password, verify_password, create_access_token, create_session, decode_token, get_current_user
from services import login_rate_limit
from utils.password_policy import is_password_strong_enough, MIN_PASSWORD_LENGTH

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _login_rate_keys(request: Request, email: str) -> list:
    """Identity keys a login attempt is throttled against - the client's real
    IP and the email, limited independently. Behind the Cloudflare tunnel the
    socket IP is 127.0.0.1 for everyone, so CF-Connecting-IP (set by
    Cloudflare, not the client) is honored when present to recover the real
    attacker IP; X-Forwarded-For's first hop is the fallback. On a direct LAN
    connection request.client.host is the real, unspoofable socket IP."""
    ip = request.headers.get("cf-connecting-ip")
    if not ip:
        xff = request.headers.get("x-forwarded-for")
        ip = xff.split(",")[0].strip() if xff else (request.client.host if request.client else "unknown")
    return [f"ip:{ip}", f"email:{email.strip().lower()}"]


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
async def register(req: RegisterRequest, request: Request, db: AsyncSession = Depends(get_db)):
    """Register a new user. First user becomes admin."""
    if not is_password_strong_enough(req.password):
        raise HTTPException(status_code=400, detail=f"Password must be at least {MIN_PASSWORD_LENGTH} characters")

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

    jti = str(uuid.uuid4())
    await create_session(db, user.id, jti, request)
    await db.commit()
    token = create_access_token(user.id, user.email, user.is_admin, user.priority, jti=jti)

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
async def login(req: LoginRequest, request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    """Login and get JWT token."""
    rate_keys = _login_rate_keys(request, req.email)
    retry_after = login_rate_limit.check_retry_after(rate_keys)
    if retry_after is not None:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Çok fazla başarısız giriş denemesi. Lütfen bir süre sonra tekrar deneyin.",
            headers={"Retry-After": str(retry_after)},
        )

    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()

    if not user:
        # Spend the same bcrypt time as a real-user-wrong-password attempt
        # before failing, so the "does this email exist" timing side channel
        # is gone. Result deliberately ignored.
        verify_password(req.password, _DUMMY_PASSWORD_HASH)
        login_rate_limit.record_failure(rate_keys)
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not verify_password(req.password, user.password_hash):
        login_rate_limit.record_failure(rate_keys)
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.is_approved and not user.is_admin:
        # A correct-password attempt on an unapproved account is not a brute
        # force - don't count it against the limit, but don't clear the
        # counter either (still an unauthenticated caller).
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hesabınız henüz yönetici tarafından onaylanmadı."
        )

    # Correct credentials - clear this identity's failure history so a few
    # earlier typos never accumulate toward a lockout.
    login_rate_limit.reset(rate_keys)
    jti = str(uuid.uuid4())
    await create_session(db, user.id, jti, request)
    await db.commit()
    token = create_access_token(user.id, user.email, user.is_admin, user.priority, jti=jti)

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
        if not is_password_strong_enough(req.new_password):
            raise HTTPException(status_code=400, detail=f"Password must be at least {MIN_PASSWORD_LENGTH} characters")
        user.password_hash = hash_password(req.new_password)

    await db.commit()

    return {"message": "Profile updated", "user": {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "is_admin": user.is_admin,
    }}


@router.post("/logout")
async def logout(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    """Logout - clears the cookie AND revokes the session server-side, so a
    copy of the token that leaked or lingered somewhere stops working
    immediately instead of staying valid until it naturally expires."""
    auth_header = request.headers.get("authorization", "")
    token = auth_header[7:] if auth_header.lower().startswith("bearer ") else request.cookies.get("wimmich_token")
    if token:
        payload = decode_token(token)
        jti = payload.get("jti") if payload else None
        if jti:
            result = await db.execute(select(Session).where(Session.jti == jti))
            session = result.scalar_one_or_none()
            if session:
                session.revoked = True
                await db.commit()
    response.delete_cookie("wimmich_token")
    return {"message": "Logged out"}


@router.get("/sessions")
async def list_sessions(
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """This user's own active (non-revoked) sessions - never another
    user's, regardless of who's asking."""
    result = await db.execute(
        select(Session).where(Session.user_id == user.id, Session.revoked == False)
        .order_by(Session.last_seen_at.desc())
    )
    sessions = list(result.scalars().all())

    auth_header = request.headers.get("authorization", "")
    current_token = auth_header[7:] if auth_header.lower().startswith("bearer ") else request.cookies.get("wimmich_token")
    current_payload = decode_token(current_token) if current_token else None
    current_jti = current_payload.get("jti") if current_payload else None

    return {
        "sessions": [
            {
                "id": s.id,
                "created_at": s.created_at.isoformat() if s.created_at else None,
                "last_seen_at": s.last_seen_at.isoformat() if s.last_seen_at else None,
                "user_agent": s.user_agent,
                "ip_address": s.ip_address,
                "is_current": s.jti == current_jti,
            }
            for s in sessions
        ]
    }


@router.delete("/sessions/{session_id}")
async def revoke_session(
    session_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Revoke one of THIS user's own sessions - scoped to user.id so there's
    no way to pass another user's session id and sign them out."""
    result = await db.execute(
        select(Session).where(Session.id == session_id, Session.user_id == user.id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.revoked = True
    await db.commit()
    return {"message": "Session revoked"}
