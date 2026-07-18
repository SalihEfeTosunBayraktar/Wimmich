"""Admin-configurable override for how many files a bulk job (import/CLIP/
categorize) processes in parallel per batch - see config.JOB_IMPORT_CONCURRENCY.

Settings live in their own small JSON file, same reasoning as
backup_service.py: a pure runtime tuning knob doesn't need .env/deployment
persistence semantics, just something a handler can re-read on its next
dispatch without a server restart.
"""
import json
import os
from typing import Optional

import config

SETTINGS_PATH = config.DB_DIR / "job_concurrency_settings.json"
DEFAULT_SETTINGS = {"concurrency": None}  # None = use config.JOB_IMPORT_CONCURRENCY


def get_concurrency_settings() -> dict:
    if not SETTINGS_PATH.exists():
        return dict(DEFAULT_SETTINGS)
    try:
        with open(SETTINGS_PATH, "r", encoding="utf-8") as f:
            saved = json.load(f)
        return {**DEFAULT_SETTINGS, **saved}
    except (json.JSONDecodeError, OSError):
        return dict(DEFAULT_SETTINGS)


def _save_concurrency_settings(settings: dict) -> None:
    SETTINGS_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(SETTINGS_PATH, "w", encoding="utf-8") as f:
        json.dump(settings, f, indent=2)


def update_concurrency_settings(concurrency: Optional[int]) -> dict:
    settings = get_concurrency_settings()
    settings["concurrency"] = None if not concurrency else max(1, min(int(concurrency), 32))
    _save_concurrency_settings(settings)
    return settings


def get_effective_concurrency() -> int:
    """Handlers call this instead of reading config.JOB_IMPORT_CONCURRENCY
    directly, so an admin's override takes effect on the next job dispatch
    without a server restart."""
    value = get_concurrency_settings().get("concurrency")
    return int(value) if value else config.JOB_IMPORT_CONCURRENCY


def get_system_info() -> dict:
    cpu_count = os.cpu_count() or 1
    total_ram_gb = None
    try:
        import psutil
        total_ram_gb = round(psutil.virtual_memory().total / (1024 ** 3), 1)
    except ImportError:
        pass  # psutil not installed - degrade to a CPU-only suggestion
    return {"cpu_count": cpu_count, "total_ram_gb": total_ram_gb}


def get_suggested_concurrency() -> int:
    """Heuristic, not a measurement: leave one core free for the web
    server/event loop, budget roughly 2GB RAM per concurrent worker (CLIP/
    FACE models plus per-image decode buffers), and cap at 8 regardless of
    how large the machine is - untested above that, and this concurrency
    setting was never validated past single digits."""
    info = get_system_info()
    cpu_budget = max(1, info["cpu_count"] - 1)
    if info["total_ram_gb"] is not None:
        ram_budget = max(1, int(info["total_ram_gb"] // 2))
        suggested = min(cpu_budget, ram_budget)
    else:
        suggested = cpu_budget
    return max(1, min(suggested, 8))
