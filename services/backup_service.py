"""Backup: a full SQLite snapshot (metadata - albums, faces, favorites,
categories, everything that took real processing time to build) plus an
incremental compressed archive of media files that haven't been backed up
yet, written to a user-chosen destination folder (meant to be a separate
disk - a backup living on the same drive as the original doesn't protect
against a drive failure).

Settings live in their own small JSON file rather than the .env-based
config.update_config() - that function already juggles several unrelated
settings, and the backup destination is meant to be configurable even
before the drive is plugged in (validated at run time, not save time).
"""
import json
import os
import sqlite3
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import config

SETTINGS_PATH = config.DB_DIR / "backup_settings.json"
DEFAULT_SETTINGS = {
    "backup_dir": "",
    "interval_hours": 24,
    "enabled": False,
    "last_backup_at": None,
    "last_backup_status": None,
    "last_backup_error": None,
}


def get_backup_settings() -> dict:
    if not SETTINGS_PATH.exists():
        return dict(DEFAULT_SETTINGS)
    try:
        with open(SETTINGS_PATH, "r", encoding="utf-8") as f:
            saved = json.load(f)
        return {**DEFAULT_SETTINGS, **saved}
    except (json.JSONDecodeError, OSError):
        return dict(DEFAULT_SETTINGS)


def _save_backup_settings(settings: dict) -> None:
    SETTINGS_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(SETTINGS_PATH, "w", encoding="utf-8") as f:
        json.dump(settings, f, indent=2)


def update_backup_settings(backup_dir: str, interval_hours: int, enabled: bool) -> dict:
    """Saves the destination/schedule. Doesn't check the path exists -
    the whole point is to let the user set this up before the destination
    drive is even plugged in; existence is only checked when a backup
    actually runs."""
    settings = get_backup_settings()
    settings["backup_dir"] = backup_dir.strip()
    settings["interval_hours"] = max(1, int(interval_hours))
    settings["enabled"] = bool(enabled)
    _save_backup_settings(settings)
    return settings


def record_backup_result(status: str, error: Optional[str] = None) -> None:
    settings = get_backup_settings()
    settings["last_backup_at"] = datetime.now(timezone.utc).isoformat()
    settings["last_backup_status"] = status
    settings["last_backup_error"] = error
    _save_backup_settings(settings)


def is_backup_due() -> bool:
    settings = get_backup_settings()
    if not settings["enabled"] or not settings["backup_dir"]:
        return False
    if not settings["last_backup_at"]:
        return True
    last = datetime.fromisoformat(settings["last_backup_at"])
    elapsed_hours = (datetime.now(timezone.utc) - last).total_seconds() / 3600
    return elapsed_hours >= settings["interval_hours"]


def backup_database(backup_dir: Path) -> str:
    """Online-safe SQLite backup (sqlite3's own backup API) - a plain file
    copy could grab a torn/inconsistent snapshot mid-write, since the app
    keeps writing to the DB (WAL mode) the whole time this runs."""
    db_dir = backup_dir / "database"
    db_dir.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    dest_path = db_dir / f"wimmich_{timestamp}.db"

    src_path = config.DB_DIR / "wimmich.db"
    src = sqlite3.connect(str(src_path))
    try:
        dst = sqlite3.connect(str(dest_path))
        try:
            src.backup(dst)
        finally:
            dst.close()
    finally:
        src.close()

    _rotate_old_db_snapshots(db_dir)
    return str(dest_path)


def _rotate_old_db_snapshots(db_dir: Path) -> None:
    snapshots = sorted(db_dir.glob("wimmich_*.db"), key=lambda p: p.stat().st_mtime, reverse=True)
    for old in snapshots[config.BACKUP_KEEP_DB_SNAPSHOTS:]:
        try:
            old.unlink()
        except OSError:
            pass


def add_file_to_archive(zf: zipfile.ZipFile, file_path: str, arcname: str) -> None:
    """One file at a time so the caller can check for job cancellation
    between files (run via asyncio.to_thread per call, not for the whole
    archive at once)."""
    zf.write(file_path, arcname)
