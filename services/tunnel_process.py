"""Cloudflare Tunnel process lifecycle: find cloudflared, start/stop the tunnel."""
import subprocess
import asyncio
import os
import re
import signal
from pathlib import Path
from typing import Optional
from datetime import datetime, timezone

import config
from utils.log import error

# Tunnel state
_tunnel_process: Optional[subprocess.Popen] = None
_tunnel_url: Optional[str] = None
_tunnel_started_at: Optional[datetime] = None
_tunnel_log_lines: list = []

def _find_cloudflared() -> Optional[str]:
    """Find cloudflared executable."""
    import shutil

    # Check local DB directory (always constant)
    if hasattr(config, "DB_DIR"):
        db_path = config.DB_DIR / config.CLOUDFLARED_EXE_NAME
        if db_path.exists() and db_path.is_file():
            return str(db_path)

    # Check in data directory
    data_path = config.DATA_DIR / config.CLOUDFLARED_EXE_NAME
    if data_path.exists() and data_path.is_file():
        return str(data_path)

    # Check in project directory
    local_path = config.BASE_DIR / config.CLOUDFLARED_EXE_NAME
    if local_path.exists() and local_path.is_file():
        return str(local_path)

    # Check PATH using shutil
    try:
        path = shutil.which("cloudflared")
        if path and Path(path).is_file():
            return path
    except Exception:
        pass

    return None

def is_cloudflared_available() -> bool:
    """Check if cloudflared is installed."""
    return _find_cloudflared() is not None

async def start_tunnel(port: Optional[int] = None) -> dict:
    """Start a Cloudflare Quick Tunnel, or a named tunnel if a Zero Trust token is configured."""
    global _tunnel_process, _tunnel_url, _tunnel_started_at, _tunnel_log_lines

    if _tunnel_process and _tunnel_process.poll() is None:
        return {
            "status": "already_running",
            "url": _tunnel_url,
            "started_at": _tunnel_started_at.isoformat() if _tunnel_started_at else None,
        }

    cloudflared = _find_cloudflared()
    if not cloudflared:
        raise RuntimeError(
            f"cloudflared bulunamadı. {config.CLOUDFLARED_EXE_NAME} dosyasını proje klasörüne koyun veya "
            "https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/ adresinden indirin."
        )

    target_port = port or config.PORT
    _tunnel_log_lines = []
    _tunnel_started_at = datetime.now(timezone.utc)

    token = getattr(config, "TUNNEL_TOKEN", "")
    if token:
        _tunnel_process = subprocess.Popen(
            [cloudflared, "tunnel", "--no-autoupdate", "--protocol", "http2", "run", "--token", token],
            stdout=subprocess.DEVNULL,  # never read; avoid pipe-buffer deadlock
            stderr=subprocess.PIPE,
            text=True,
            creationflags=subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0,
        )
        # Drain stderr for the process's lifetime (see _drain_tunnel_output);
        # also gives the admin panel real diagnostics instead of an empty log.
        asyncio.create_task(_drain_tunnel_output(_tunnel_process))

        # Give it 3 seconds to check if it crashed immediately
        await asyncio.sleep(3)
        if _tunnel_process.poll() is not None:
            raise RuntimeError(
                f"Tünel başlatılamadı (Token geçersiz olabilir): {' '.join(_tunnel_log_lines[-5:])}"
            )

        custom_domain = getattr(config, "TUNNEL_CUSTOM_DOMAIN", "").strip()
        _tunnel_url = (
            (custom_domain if custom_domain.startswith("http") else f"https://{custom_domain}")
            if custom_domain else None
        )
        return {
            "status": "started",
            "url": _tunnel_url,
            "started_at": _tunnel_started_at.isoformat(),
            "custom_domain_configured": bool(custom_domain),
        }

    # Start quick tunnel
    _tunnel_process = subprocess.Popen(
        [cloudflared, "tunnel", "--protocol", "http2", "--url", f"http://localhost:{target_port}"],
        stdout=subprocess.DEVNULL,  # never read; avoid pipe-buffer deadlock
        stderr=subprocess.PIPE,
        text=True,
        creationflags=subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0,
    )

    _tunnel_url = await _wait_for_tunnel_url(_tunnel_process)

    if _tunnel_url:
        return {
            "status": "started",
            "url": _tunnel_url,
            "started_at": _tunnel_started_at.isoformat(),
        }

    if _tunnel_process.poll() is not None:
        raise RuntimeError(f"Tunnel başlatılamadı: {' '.join(_tunnel_log_lines[-5:])}")

    return {
        "status": "starting",
        "url": None,
        "started_at": _tunnel_started_at.isoformat(),
        "message": "Tunnel başlatılıyor, URL bekleniyor...",
    }

async def _drain_tunnel_output(process: subprocess.Popen) -> None:
    """Read cloudflared's stderr into _tunnel_log_lines for the process's whole
    lifetime - an unread pipe fills its OS buffer and blocks the process."""
    loop = asyncio.get_event_loop()
    while True:
        line = await loop.run_in_executor(None, process.stderr.readline)
        if not line:
            break
        _tunnel_log_lines.append(line.strip())
        if len(_tunnel_log_lines) > 100:
            _tunnel_log_lines.pop(0)

async def _wait_for_tunnel_url(process: subprocess.Popen, timeout: int = 30) -> Optional[str]:
    """Wait for cloudflared to output the tunnel URL, draining its output for good."""
    url_pattern = re.compile(r'https://[a-zA-Z0-9\-]+\.trycloudflare\.com')
    asyncio.create_task(_drain_tunnel_output(process))

    elapsed = 0.0
    poll_interval = 0.25
    while elapsed < timeout:
        for line in reversed(_tunnel_log_lines):
            match = url_pattern.search(line)
            if match:
                return match.group(0)
        if process.poll() is not None:
            return None
        await asyncio.sleep(poll_interval)
        elapsed += poll_interval
    return None

async def stop_tunnel() -> dict:
    """Stop the Cloudflare Tunnel."""
    global _tunnel_process, _tunnel_url, _tunnel_started_at
    if not _tunnel_process or _tunnel_process.poll() is not None:
        _tunnel_process = None
        _tunnel_url = None
        _tunnel_started_at = None
        return {"status": "not_running"}

    try:
        _tunnel_process.terminate() if os.name == 'nt' else _tunnel_process.send_signal(signal.SIGTERM)
        try:
            _tunnel_process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            _tunnel_process.kill()
    except Exception as e:
        error("TUNNEL", f"Error stopping: {e}")

    old_url = _tunnel_url
    _tunnel_process = None
    _tunnel_url = None
    _tunnel_started_at = None

    return {
        "status": "stopped",
        "previous_url": old_url,
    }

def get_tunnel_state() -> dict:
    """Raw process state for get_tunnel_status() to format."""
    return {
        "process": _tunnel_process,
        "url": _tunnel_url,
        "started_at": _tunnel_started_at,
        "log_lines": _tunnel_log_lines,
    }
