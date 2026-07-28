"""Records admin actions for later review - see models/audit_log.py."""
from typing import Optional
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from models import AuditLog, User


async def log_action(
    db: AsyncSession,
    actor: User,
    action: str,
    target_type: Optional[str] = None,
    target_id: Optional[str] = None,
    detail: Optional[dict] = None,
) -> None:
    """Adds the entry to the session without committing - callers already
    commit as part of the same request (right after their actual mutation),
    so this rides along in the same transaction rather than risking a
    logged action that didn't actually happen if the real commit fails."""
    entry = AuditLog(
        actor_user_id=actor.id,
        actor_email=actor.email,
        action=action,
        target_type=target_type,
        target_id=str(target_id) if target_id is not None else None,
    )
    if detail is not None:
        entry.detail = detail
    db.add(entry)
    await db.flush()


async def list_audit_log(db: AsyncSession, page: int = 1, per_page: int = 50) -> dict:
    total = (await db.execute(select(func.count(AuditLog.id)))).scalar()

    result = await db.execute(
        select(AuditLog)
        .order_by(AuditLog.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
    )
    entries = list(result.scalars().all())

    return {
        "entries": [
            {
                "id": e.id,
                "actor_email": e.actor_email,
                "action": e.action,
                "target_type": e.target_type,
                "target_id": e.target_id,
                "detail": e.detail,
                "created_at": e.created_at.isoformat() if e.created_at else None,
            }
            for e in entries
        ],
        "total": total,
        "page": page,
        "per_page": per_page,
    }
