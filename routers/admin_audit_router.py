"""Admin Audit Log Router - read-only view of recorded admin actions."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import User
from auth import get_admin_user
from services.audit_log_service import list_audit_log

router = APIRouter(prefix="/api/admin/audit-log", tags=["admin"])


@router.get("")
async def get_audit_log(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    return await list_audit_log(db, page, per_page)
