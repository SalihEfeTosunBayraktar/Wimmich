"""Tailscale Router - read-only detection for the admin panel's Remote
Access card, alongside the Cloudflare Tunnel controls."""
from fastapi import APIRouter, Depends

from models import User
from auth import get_admin_user
from services.tailscale_service import get_tailscale_status

router = APIRouter(prefix="/api/tailscale", tags=["tailscale"])


@router.get("/status")
async def tailscale_status(admin: User = Depends(get_admin_user)):
    return get_tailscale_status()
