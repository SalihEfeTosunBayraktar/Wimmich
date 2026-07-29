"""Wimmich Authentication Module - JWT + Password Hashing"""
import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
import bcrypt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

import config
from database import get_db
from models import User, Session, ApiKey

# Bearer token scheme
security = HTTPBearer(auto_error=False)

# Below this staleness, get_current_user skips the last_seen_at UPDATE - a
# write on literally every authenticated request (this app fires many per
# page load) for a timestamp nobody needs to the second is wasted I/O.
SESSION_LAST_SEEN_THROTTLE = timedelta(minutes=5)

# Marks a bearer token as a long-lived API key rather than a JWT, so
# get_current_user can tell them apart without ever attempting to
# jwt.decode() a key (which would just fail) or vice versa.
API_KEY_PREFIX = "wmk_"


def generate_api_key() -> tuple[str, str, str]:
    """Returns (raw_key, key_hash, key_prefix). The raw key is returned to
    the caller exactly once (shown to the user at creation time); only its
    hash is ever persisted, so a stolen database dump can't be used to
    authenticate as anyone."""
    raw_key = API_KEY_PREFIX + secrets.token_urlsafe(32)
    key_hash = hash_api_key(raw_key)
    key_prefix = raw_key[:12]
    return raw_key, key_hash, key_prefix


def hash_api_key(raw_key: str) -> str:
    # A high-entropy random token (unlike a user-chosen password) needs no
    # salt or slow KDF - a plain SHA-256 digest is standard practice here
    # (same approach GitHub/Stripe-style API tokens use) and lets lookup use
    # a direct indexed equality query instead of scanning every key.
    return hashlib.sha256(raw_key.encode('utf-8')).hexdigest()


def hash_password(password: str) -> str:
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    plain_bytes = plain_password.encode('utf-8')
    hashed_bytes = hashed_password.encode('utf-8')
    try:
        return bcrypt.checkpw(plain_bytes, hashed_bytes)
    except Exception:
        return False


def create_access_token(user_id: str, email: str, is_admin: bool = False, priority: int = 3, jti: str = None) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=config.JWT_EXPIRE_HOURS)
    payload = {
        "sub": user_id,
        "email": email,
        "is_admin": is_admin,
        "priority": priority,
        "jti": jti or str(uuid.uuid4()),
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, config.JWT_SECRET, algorithm=config.JWT_ALGORITHM)


# Marks a token as "password was correct, but 2FA still needs to be
# confirmed" - deliberately NOT a real access token (get_current_user
# rejects anything carrying this claim, see below), so it's useless for
# calling any other endpoint even if it leaked. Short-lived since its only
# job is to survive the few seconds between the login form and the 6-digit
# code form.
TWO_FA_PENDING_EXPIRE_MINUTES = 5


def create_2fa_pending_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "purpose": "2fa_pending",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=TWO_FA_PENDING_EXPIRE_MINUTES),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, config.JWT_SECRET, algorithm=config.JWT_ALGORITHM)


async def create_session(db: AsyncSession, user_id: str, jti: str, request: Request) -> Session:
    """Creates the server-side row a token's `jti` claim is checked against
    on every request (see get_current_user) - what actually lets a session
    be listed/revoked later, since the JWT itself carries no server-side
    state of its own once issued."""
    session = Session(
        user_id=user_id,
        jti=jti,
        user_agent=request.headers.get("user-agent", "")[:500],
        ip_address=(request.client.host if request.client else None),
    )
    db.add(session)
    await db.flush()
    return session


def decode_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, config.JWT_SECRET, algorithms=[config.JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


async def _get_user_for_api_key(token: str, db: AsyncSession) -> User:
    """API keys carry no embedded claims (unlike a JWT, which is trusted
    until its own exp/jti check fails) - every request re-checks the DB row
    directly, including its optional expires_at. Slower per-request, but
    keys are meant for a handful of scripts/integrations, not the main
    app's request volume."""
    key_hash = hash_api_key(token)
    result = await db.execute(select(ApiKey).where(ApiKey.key_hash == key_hash))
    api_key = result.scalar_one_or_none()
    if not api_key or api_key.revoked:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or revoked API key",
        )

    now = datetime.now(timezone.utc)

    expires_at = api_key.expires_at
    if expires_at:
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if now >= expires_at:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="API key has expired",
            )

    last_used = api_key.last_used_at
    if last_used and last_used.tzinfo is None:
        last_used = last_used.replace(tzinfo=timezone.utc)
    if not last_used or now - last_used > SESSION_LAST_SEEN_THROTTLE:
        api_key.last_used_at = now
        await db.commit()

    result = await db.execute(select(User).where(User.id == api_key.user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    return user


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    """FastAPI dependency to get the current authenticated user."""
    token = None

    # Check Authorization header
    if credentials:
        token = credentials.credentials
    else:
        # Check cookie
        token = request.cookies.get("wimmich_token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if token.startswith(API_KEY_PREFIX):
        return await _get_user_for_api_key(token, db)

    payload = decode_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    # A 2FA-pending token (issued by /login when the password was right but
    # the TOTP code hasn't been entered yet) must never work as a real
    # bearer token - only /auth/2fa/login-verify is allowed to consume it.
    if payload.get("purpose") == "2fa_pending":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Two-factor verification required",
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    # Tokens issued before this feature existed have no jti claim - treated
    # as always-valid (no session row to check against) rather than
    # rejecting every session that predates the upgrade; each is retired
    # naturally at its own JWT_EXPIRE_HOURS expiry or the next login,
    # whichever comes first.
    jti = payload.get("jti")
    if jti:
        session_result = await db.execute(select(Session).where(Session.jti == jti))
        session = session_result.scalar_one_or_none()
        if not session or session.revoked:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session revoked",
            )
        now = datetime.now(timezone.utc)
        last_seen = session.last_seen_at
        if last_seen and last_seen.tzinfo is None:
            last_seen = last_seen.replace(tzinfo=timezone.utc)
        if not last_seen or now - last_seen > SESSION_LAST_SEEN_THROTTLE:
            session.last_seen_at = now
            await db.commit()

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return user


async def get_admin_user(user: User = Depends(get_current_user)) -> User:
    """Dependency that requires admin privileges."""
    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return user


async def get_optional_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    """Optional auth - returns None if not authenticated."""
    try:
        return await get_current_user(request, credentials, db)
    except HTTPException:
        return None
