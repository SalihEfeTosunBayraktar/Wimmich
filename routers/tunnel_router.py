"""Tunnel Router - Cloudflare Tunnel management"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

from models import User
from auth import get_admin_user
from services.tunnel_service import (
    start_tunnel, stop_tunnel, get_tunnel_status,
    is_cloudflared_available, download_cloudflared
)

router = APIRouter(prefix="/api/tunnel", tags=["tunnel"])


@router.get("/status")
async def tunnel_status(admin: User = Depends(get_admin_user)):
    """Get current tunnel status."""
    return get_tunnel_status()


@router.post("/start")
async def tunnel_start(admin: User = Depends(get_admin_user)):
    """Start Cloudflare Tunnel for remote access."""
    try:
        result = await start_tunnel()
        return result
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/stop")
async def tunnel_stop(admin: User = Depends(get_admin_user)):
    """Stop Cloudflare Tunnel."""
    result = await stop_tunnel()
    return result


@router.post("/download")
async def tunnel_download(admin: User = Depends(get_admin_user)):
    """Download cloudflared.exe."""
    try:
        result = await download_cloudflared()
        return result
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))
