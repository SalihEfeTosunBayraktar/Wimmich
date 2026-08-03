"""Auth Router - Registration, Login, Profile"""
import asyncio
import base64
import io
import json
import uuid
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request, UploadFile, File
from fastapi.responses import FileResponse
from pydantic import BaseModel, EmailStr
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
import pyotp
import qrcode

import config
from database import get_db
from models import User, Asset, Session, Job
from auth import (
    hash_password, verify_password, create_access_token, create_session, decode_token,
    get_current_user, create_2fa_pending_token,
)
from services import login_rate_limit
from services.job_service import create_job, JobAlreadyExistsException
from utils.password_policy import is_password_strong_enough, MIN_PASSWORD_LENGTH
from utils.image_utils import create_avatar
from utils.file_signature import matches_claimed_type
from utils.path_utils import resolve_data_path

router = APIRouter(prefix="/api/auth", tags=["auth"])

TOTP_ISSUER = "Wimmich"

# A profile picture has no business being anywhere near config.MAX_UPLOAD_SIZE
# (500MB default) - capped separately and much lower.
MAX_AVATAR_SIZE = 20 * 1024 * 1024


async def _read_bounded(file: UploadFile, limit: int) -> Optional[bytes]:
    """Same reasoning as asset_mutation_service._read_bounded: reads in
    chunks and bails as soon as the size limit is passed, instead of
    file.read() unconditionally buffering (and, past ~1MB, spooling to
    disk) an arbitrarily large body before any size check runs."""
    chunks = []
    total = 0
    while True:
        chunk = await file.read(1024 * 1024)
        if not chunk:
            break
        total += len(chunk)
        if total > limit:
            return None
        chunks.append(chunk)
    return b"".join(chunks)


def _login_rate_keys(request: Request, email: str) -> list:
    """Identity keys a login attempt is throttled against - the client's real
    IP and the email, limited independently. Behind the Cloudflare tunnel the
    socket IP is 127.0.0.1 for everyone, so CF-Connecting-IP (set by
    Cloudflare, not the client) is honored when present to recover the real
    attacker IP; X-Forwarded-For's first hop is the fallback. On a direct LAN
    connection request.client.host is the real, unspoofable socket IP.

    Those headers are only trusted when the socket IP is loopback, i.e. the
    request actually came through the local reverse proxy - anyone who can
    reach this server directly (LAN, or a misconfigured/absent proxy) could
    otherwise set CF-Connecting-IP themselves and pin the rate limiter to a
    victim's IP (or a fresh one each attempt) to dodge it entirely."""
    socket_ip = request.client.host if request.client else None
    ip = None
    if socket_ip in ("127.0.0.1", "::1"):
        ip = request.headers.get("cf-connecting-ip")
        if not ip:
            xff = request.headers.get("x-forwarded-for")
            ip = xff.split(",")[0].strip() if xff else None
    if not ip:
        ip = socket_ip or "unknown"
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
    # Same loopback-trust IP derivation as login, keyed on IP alone (there's
    # no existing account to also key on) - registration was previously
    # unthrottled, letting someone script arbitrarily many signups (or use
    # it to brute-force which emails are already registered - see the
    # "Email already registered" check below).
    register_keys = [_login_rate_keys(request, "")[0]]
    retry_after = login_rate_limit.check_retry_after(register_keys)
    if retry_after is not None:
        raise HTTPException(status_code=429, detail="Too many attempts", headers={"Retry-After": str(retry_after)})

    if not is_password_strong_enough(req.password):
        login_rate_limit.record_failure(register_keys)
        raise HTTPException(status_code=400, detail=f"Password must be at least {MIN_PASSWORD_LENGTH} characters")

    # Check if email exists
    result = await db.execute(select(User).where(User.email == req.email))
    if result.scalar_one_or_none():
        login_rate_limit.record_failure(register_keys)
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
            "is_guest": user.is_guest,
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

    if user.totp_enabled:
        # No session/jti created yet - a login that never completes the
        # second step must leave no trace in the sessions list. The pending
        # token itself can't be used as a real access token (get_current_user
        # explicitly rejects it), so leaking it is harmless without the
        # actual TOTP code too.
        return {"requires_2fa": True, "pre_auth_token": create_2fa_pending_token(user.id)}

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
            "is_guest": user.is_guest,
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
        "is_guest": user.is_guest,
        "is_approved": user.is_approved,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "asset_count": asset_count,
        "total_size": total_size,
        "storage_quota_mb": user.storage_quota_mb,
        "totp_enabled": user.totp_enabled,
        "has_profile_image": bool(user.profile_image_path),
        "trash_days": user.trash_days,
        "trash_days_effective": user.trash_days or config.TRASH_DAYS,
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

    if req.email and req.email != user.email:
        # Changing the account's email is a credential change same as the
        # password below - it moves where password-reset/login identity
        # points - so it gets the same current_password re-entry
        # requirement. Without this, anyone who steals a logged-in
        # session/token could quietly redirect the account's email to one
        # they control.
        if not req.current_password or not verify_password(req.current_password, user.password_hash):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
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


class TrashRetentionRequest(BaseModel):
    # None/omitted = go back to using the server-wide default.
    days: Optional[int] = None


@router.put("/trash-retention")
async def update_trash_retention(
    req: TrashRetentionRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """How long THIS user's own trashed items are kept before permanent
    deletion - independent of every other user's setting and of the
    server-wide config.TRASH_DAYS default, which only applies when this is
    left unset."""
    if req.days is not None and not (1 <= req.days <= 365):
        raise HTTPException(status_code=400, detail="Days must be between 1 and 365")

    user.trash_days = req.days
    await db.commit()
    return {"trash_days": user.trash_days, "trash_days_effective": user.trash_days or config.TRASH_DAYS}


@router.post("/profile-image")
async def upload_profile_image(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Sets the profile picture from a directly uploaded file - center-
    cropped to a square avatar, same processing as the library-photo path
    below so it looks consistent regardless of source."""
    data = await _read_bounded(file, MAX_AVATAR_SIZE)
    if data is None:
        raise HTTPException(status_code=413, detail=f"Dosya çok büyük (maksimum {MAX_AVATAR_SIZE // (1024 * 1024)} MB)")
    if not matches_claimed_type(file.filename or "", data):
        raise HTTPException(status_code=400, detail="Dosya türü uzantısıyla eşleşmiyor")

    suffix = Path(file.filename or "").suffix or ".jpg"
    tmp_path = config.AVATAR_DIR / f"_upload_{user.id}{suffix}"
    tmp_path.write_bytes(data)

    output_path = config.AVATAR_DIR / f"{user.id}.webp"
    try:
        ok = await asyncio.to_thread(create_avatar, str(tmp_path), str(output_path))
    finally:
        tmp_path.unlink(missing_ok=True)

    if not ok:
        raise HTTPException(status_code=400, detail="Resim işlenemedi - desteklenmeyen veya bozuk dosya")

    user.profile_image_path = str(output_path)
    await db.commit()
    return {"message": "Profil resmi güncellendi"}


class ProfileImageFromAssetRequest(BaseModel):
    asset_id: str


@router.post("/profile-image/from-asset")
async def set_profile_image_from_asset(
    req: ProfileImageFromAssetRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Sets the profile picture from a photo already in the user's own
    library - scoped to their own assets, same as every other per-asset
    action, so an asset id from someone else's library 404s instead of
    leaking whether it exists."""
    result = await db.execute(select(Asset).where(Asset.id == req.asset_id, Asset.user_id == user.id))
    asset = result.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=404, detail="Fotoğraf bulunamadı")
    if asset.file_type != "IMAGE":
        raise HTTPException(status_code=400, detail="Sadece fotoğraflar profil resmi olarak kullanılabilir")

    source_path = resolve_data_path(asset.file_path, config.UPLOAD_DIR)
    if not source_path or not source_path.exists():
        raise HTTPException(status_code=404, detail="Kaynak dosya bulunamadı")

    output_path = config.AVATAR_DIR / f"{user.id}.webp"
    ok = await asyncio.to_thread(create_avatar, str(source_path), str(output_path))
    if not ok:
        raise HTTPException(status_code=400, detail="Resim işlenemedi")

    user.profile_image_path = str(output_path)
    await db.commit()
    return {"message": "Profil resmi güncellendi"}


@router.delete("/profile-image")
async def delete_profile_image(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if user.profile_image_path:
        path = resolve_data_path(user.profile_image_path, config.AVATAR_DIR)
        if path and path.exists():
            try:
                path.unlink()
            except OSError:
                pass
        user.profile_image_path = None
        await db.commit()
    return {"message": "Profil resmi kaldırıldı"}


@router.get("/profile-image/{user_id}")
async def get_profile_image(
    user_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Any authenticated user can view any other user's avatar - not
    sensitive data, same reasoning as a forum/chat profile picture being
    visible to other members."""
    result = await db.execute(select(User).where(User.id == user_id))
    target = result.scalar_one_or_none()
    if not target or not target.profile_image_path:
        raise HTTPException(status_code=404, detail="Profil resmi yok")

    path = resolve_data_path(target.profile_image_path, config.AVATAR_DIR)
    if not path or not path.exists():
        raise HTTPException(status_code=404, detail="Profil resmi yok")

    return FileResponse(path, media_type="image/webp")


async def _get_latest_export_job(db: AsyncSession, user_id: str) -> Optional[Job]:
    """No indexed user_id column on Job (only asset_id, see job_service.py's
    docstring) - EXPORT jobs are rare enough per user that a small scan of
    just this job_type ordered by recency is fine, same tradeoff the
    per-user duplicate check in create_job() already makes."""
    result = await db.execute(
        select(Job).where(Job.job_type == "EXPORT").order_by(Job.created_at.desc())
    )
    for job in result.scalars().all():
        if job.data.get("user_id") == user_id:
            return job
    return None


@router.post("/export")
async def request_data_export(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Queues a background job that zips this user's own photos/videos plus
    a JSON metadata manifest - see export_handler.py. Kept as a job (not a
    synchronous request) because a whole-library zip can take a while."""
    try:
        job = await create_job(db, "EXPORT", {"user_id": user.id})
    except JobAlreadyExistsException as e:
        raise HTTPException(status_code=409, detail=str(e))
    return {"job_id": job.id, "status": job.status}


@router.get("/export/status")
async def get_export_status(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    job = await _get_latest_export_job(db, user.id)
    if not job:
        return {"job": None}
    return {
        "job": {
            "id": job.id,
            "status": job.status,
            "progress": job.progress,
            "error_message": job.error_message,
            "created_at": job.created_at.isoformat() if job.created_at else None,
        }
    }


@router.get("/export/download")
async def download_data_export(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Serves the most recently COMPLETED export for this user - not
    necessarily the latest job overall, since the latest one could be a
    still-RUNNING re-request or a FAILED retry."""
    result = await db.execute(
        select(Job).where(Job.job_type == "EXPORT", Job.status == "COMPLETED").order_by(Job.created_at.desc())
    )
    archive_path = None
    for job in result.scalars().all():
        if job.data.get("user_id") != user.id:
            continue
        try:
            archive_path = Path(json.loads(job.result_json).get("archive_path"))
        except (json.JSONDecodeError, TypeError, AttributeError):
            continue
        break

    if not archive_path or not archive_path.exists():
        raise HTTPException(status_code=404, detail="Henüz tamamlanmış bir veri dışa aktarma bulunamadı")

    return FileResponse(archive_path, media_type="application/zip", filename=archive_path.name)


class TwoFactorVerifyRequest(BaseModel):
    code: str


class TwoFactorDisableRequest(BaseModel):
    password: str


class TwoFactorLoginRequest(BaseModel):
    pre_auth_token: str
    code: str


@router.post("/2fa/setup")
async def setup_2fa(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Generates a new TOTP secret + QR code - not enabled yet until the
    user proves their authenticator app actually works (see /2fa/verify).
    Calling this again before verifying just replaces the unconfirmed
    secret and starts over, which is fine since nothing was enabled yet."""
    secret = pyotp.random_base32()
    user.totp_secret = secret
    await db.commit()

    uri = pyotp.totp.TOTP(secret).provisioning_uri(name=user.email, issuer_name=TOTP_ISSUER)
    qr_img = qrcode.make(uri)
    buf = io.BytesIO()
    qr_img.save(buf, format="PNG")
    qr_data_uri = f"data:image/png;base64,{base64.b64encode(buf.getvalue()).decode('ascii')}"

    return {"secret": secret, "otpauth_uri": uri, "qr_code_data_uri": qr_data_uri}


@router.post("/2fa/verify")
async def verify_2fa(
    req: TwoFactorVerifyRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Confirms the authenticator app is actually working before turning
    2FA on for real - an abandoned setup (scanned the QR, closed the tab)
    must never silently enable 2FA on its own."""
    if not user.totp_secret:
        raise HTTPException(status_code=400, detail="Start 2FA setup first")
    if not pyotp.TOTP(user.totp_secret).verify(req.code, valid_window=1):
        raise HTTPException(status_code=400, detail="Invalid code")

    user.totp_enabled = True
    await db.commit()
    return {"message": "Two-factor authentication enabled"}


@router.post("/2fa/disable")
async def disable_2fa(
    req: TwoFactorDisableRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Requires the current password - 2FA exists specifically so a stolen
    password alone isn't enough to log in; it shouldn't be enough to turn
    2FA back off either."""
    if not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect password")

    user.totp_enabled = False
    user.totp_secret = None
    await db.commit()
    return {"message": "Two-factor authentication disabled"}


@router.post("/2fa/login-verify")
async def login_verify_2fa(
    req: TwoFactorLoginRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """Second step of login for a 2FA-enabled account - exchanges the
    short-lived pre-auth token from /login plus a valid TOTP code for the
    real session/access token, mirroring the second half of a normal
    login."""
    payload = decode_token(req.pre_auth_token)
    if not payload or payload.get("purpose") != "2fa_pending":
        raise HTTPException(status_code=401, detail="Invalid or expired login attempt")

    result = await db.execute(select(User).where(User.id == payload.get("sub")))
    user = result.scalar_one_or_none()
    if not user or not user.totp_enabled or not user.totp_secret:
        raise HTTPException(status_code=401, detail="Invalid or expired login attempt")

    # Same brute-force guard as the password step - a 6-digit code is a far
    # smaller search space, so rate limiting it matters even more here.
    rate_keys = _login_rate_keys(request, user.email)
    retry_after = login_rate_limit.check_retry_after(rate_keys)
    if retry_after is not None:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Çok fazla başarısız deneme. Lütfen bir süre sonra tekrar deneyin.",
            headers={"Retry-After": str(retry_after)},
        )

    if not pyotp.TOTP(user.totp_secret).verify(req.code, valid_window=1):
        login_rate_limit.record_failure(rate_keys)
        raise HTTPException(status_code=401, detail="Invalid code")

    login_rate_limit.reset(rate_keys)
    jti = str(uuid.uuid4())
    await create_session(db, user.id, jti, request)
    await db.commit()
    token = create_access_token(user.id, user.email, user.is_admin, user.priority, jti=jti)

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
            "is_guest": user.is_guest,
            "is_approved": user.is_approved,
        }
    }


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
