"""Tailscale detection - a read-only alternative to the Cloudflare Tunnel
panel. Wimmich doesn't manage the Tailscale process at all (unlike
cloudflared, which it downloads/starts/stops itself): if Tailscale is
already running on the host, its virtual network IP already reaches
Wimmich automatically since the server binds 0.0.0.0. This only detects
that and surfaces the address - installing/logging into Tailscale stays
the user's own OS-level step, same division of responsibility as a
manual reverse proxy.
"""
import json
import os
import shutil
import subprocess

# Windows installs Tailscale here even when its own installer doesn't add it
# to PATH; fall back to a plain PATH lookup for setups where it was added
# (or a future non-Windows target).
_WINDOWS_TAILSCALE_PATH = r"C:\Program Files\Tailscale\tailscale.exe"


def _find_tailscale_exe():
    on_path = shutil.which("tailscale")
    if on_path:
        return on_path
    if os.path.exists(_WINDOWS_TAILSCALE_PATH):
        return _WINDOWS_TAILSCALE_PATH
    return None


def get_tailscale_status() -> dict:
    exe = _find_tailscale_exe()
    if not exe:
        return {"available": False, "running": False, "ip": None, "hostname": None}

    try:
        result = subprocess.run(
            [exe, "status", "--json"],
            capture_output=True, text=True, timeout=5,
        )
    except (OSError, subprocess.TimeoutExpired):
        return {"available": True, "running": False, "ip": None, "hostname": None}

    if result.returncode != 0:
        # Installed but not logged in / "tailscale up" never run - a valid,
        # common state, not an error.
        return {"available": True, "running": False, "ip": None, "hostname": None}

    try:
        data = json.loads(result.stdout)
    except json.JSONDecodeError:
        return {"available": True, "running": False, "ip": None, "hostname": None}

    self_node = data.get("Self") or {}
    ips = self_node.get("TailscaleIPs") or []
    return {
        "available": True,
        "running": bool(ips),
        "ip": ips[0] if ips else None,
        "hostname": (self_node.get("DNSName") or "").rstrip("."),
    }
