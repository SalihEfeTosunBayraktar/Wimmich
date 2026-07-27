"""Wimmich Authentication Module - JWT + Password Hashing"""
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
from models import User, Session

# Bearer token scheme
security = HTTPBearer(auto_error=False)

# Below this staleness, get_current_user skips the last_seen_at UPDATE - a
# write on literally every authenticated request (this app fires many per
# page load) for a timestamp nobody needs to the second is wasted I/O.
SESSION_LAST_SEEN_THROTTLE = timedelta(minutes=5)


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

    payload = decode_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
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
