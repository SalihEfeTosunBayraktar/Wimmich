"""API Keys Router - long-lived tokens for external clients (scripts, a
future mobile app) as an alternative to interactive JWT login. Authenticated
the same way as a JWT (Authorization: Bearer <key>) - see auth.py's
get_current_user, which tells the two apart by the key's "wmk_" prefix."""
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import User, ApiKey
from auth import get_current_user, generate_api_key

router = APIRouter(prefix="/api/auth/api-keys", tags=["api-keys"])

# 0/None = never expires. Capped rather than an arbitrary free-form integer
# so a fat-fingered "36500" doesn't create a key that's functionally
# permanent while LOOKING time-limited in the UI.
MAX_EXPIRY_DAYS = 3650


class CreateApiKeyRequest(BaseModel):
    name: str
    expires_in_days: Optional[int] = None


@router.get("")
async def list_api_keys(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """This user's own active (non-revoked) API keys - never the raw key
    itself, only what was recorded at creation time. Expired keys are
    still listed (not filtered out) so the owner can see one lapsed
    instead of it just silently vanishing - only revoke() actually
    removes a key from this list."""
    result = await db.execute(
        select(ApiKey).where(ApiKey.user_id == user.id, ApiKey.revoked == False)
        .order_by(ApiKey.created_at.desc())
    )
    keys = list(result.scalars().all())
    now = datetime.now(timezone.utc)
    return {
        "keys": [
            {
                "id": k.id,
                "name": k.name,
                "key_prefix": k.key_prefix,
                "created_at": k.created_at.isoformat() if k.created_at else None,
                "last_used_at": k.last_used_at.isoformat() if k.last_used_at else None,
                "expires_at": k.expires_at.isoformat() if k.expires_at else None,
                "is_expired": bool(k.expires_at and k.expires_at.replace(tzinfo=timezone.utc) <= now),
            }
            for k in keys
        ]
    }


@router.post("")
async def create_api_key(
    req: CreateApiKeyRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    name = req.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Name is required")
    if len(name) > 255:
        raise HTTPException(status_code=400, detail="Name is too long")
    if req.expires_in_days is not None and not (1 <= req.expires_in_days <= MAX_EXPIRY_DAYS):
        raise HTTPException(status_code=400, detail=f"Expiry must be between 1 and {MAX_EXPIRY_DAYS} days")

    expires_at = (
        datetime.now(timezone.utc) + timedelta(days=req.expires_in_days)
        if req.expires_in_days else None
    )

    raw_key, key_hash, key_prefix = generate_api_key()
    api_key = ApiKey(user_id=user.id, name=name, key_hash=key_hash, key_prefix=key_prefix, expires_at=expires_at)
    db.add(api_key)
    await db.commit()

    return {
        "id": api_key.id,
        "name": api_key.name,
        "key": raw_key,
        "key_prefix": api_key.key_prefix,
        "created_at": api_key.created_at.isoformat() if api_key.created_at else None,
        "expires_at": api_key.expires_at.isoformat() if api_key.expires_at else None,
    }


@router.delete("/{key_id}")
async def revoke_api_key(
    key_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Revoke one of THIS user's own keys - scoped to user.id so there's no
    way to pass another user's key id and disable their integration."""
    result = await db.execute(
        select(ApiKey).where(ApiKey.id == key_id, ApiKey.user_id == user.id)
    )
    api_key = result.scalar_one_or_none()
    if not api_key:
        raise HTTPException(status_code=404, detail="API key not found")

    api_key.revoked = True
    await db.commit()
    return {"message": "API key revoked"}
