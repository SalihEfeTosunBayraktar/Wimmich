"""Cloudflare Tunnel Service - public API surface for remote access management.

Re-exports the process lifecycle from tunnel_process.py so existing
`from services.tunnel_service import ...` call sites keep working.
"""
import asyncio
import ssl
import urllib.request

import config
from utils.log import info, success
from services.tunnel_process import (
    start_tunnel,
    stop_tunnel,
    is_cloudflared_available,
    get_tunnel_state,
)

__all__ = [
    "start_tunnel",
    "stop_tunnel",
    "is_cloudflared_available",
    "get_tunnel_status",
    "download_cloudflared",
]


def get_tunnel_status() -> dict:
    """Get current tunnel status."""
    state = get_tunnel_state()
    process = state["process"]
    is_running = process is not None and process.poll() is None

    if not is_running and process is not None:
        # Process died unexpectedly
        return {
            "status": "crashed",
            "url": None,
            "available": is_cloudflared_available(),
            "last_logs": state["log_lines"][-10:] if state["log_lines"] else [],
        }

    return {
        "status": "running" if is_running else "stopped",
        "url": state["url"] if is_running else None,
        "started_at": state["started_at"].isoformat() if state["started_at"] else None,
        "available": is_cloudflared_available(),
        "last_logs": state["log_lines"][-10:] if state["log_lines"] else [],
        "using_custom_token": bool(getattr(config, "TUNNEL_TOKEN", "")),
        "custom_domain": getattr(config, "TUNNEL_CUSTOM_DOMAIN", ""),
    }


async def download_cloudflared() -> dict:
    """Download cloudflared.exe for Windows."""
    url = config.CLOUDFLARED_DOWNLOAD_URL
    dest = (config.DB_DIR if hasattr(config, "DB_DIR") else config.DATA_DIR) / config.CLOUDFLARED_EXE_NAME

    try:
        info("TUNNEL", f"Downloading cloudflared from {url}...")

        ctx = ssl.create_default_context()
        req = urllib.request.Request(
            url,
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        )

        def _download():
            with urllib.request.urlopen(req, context=ctx, timeout=30) as response:
                with open(dest, "wb") as f:
                    f.write(response.read())

        await asyncio.get_event_loop().run_in_executor(None, _download)
        success("TUNNEL", f"Downloaded to {dest}")
        return {"status": "downloaded", "path": str(dest)}
    except Exception as e:
        raise RuntimeError(f"İndirme başarısız: {e}")
