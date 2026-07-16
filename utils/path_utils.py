"""Resolves stored asset-file paths (thumbnails, originals, encoded video)
against the CURRENT data directory, tolerating the whole data folder having
been moved or copied to a different location since the path was written.

Every such path is always written as {base_dir}/{user_id}/{filename} (see
media_processing.py) - so if the stored absolute path no longer exists,
re-deriving it from just those last two segments against the live base_dir
finds the same file at its new location without needing a DB migration.
"""
from pathlib import Path
from typing import Optional


def resolve_data_path(stored_path: Optional[str], base_dir: Path) -> Optional[Path]:
    """Returns a Path that exists on disk if one can be found, trying the
    stored value first (the common case, and correct even for paths that
    intentionally live outside base_dir, like external/imported files).
    Falls back to re-deriving under base_dir; returns the original stored
    path unresolved if neither location has the file, so callers' normal
    "not found" handling still applies."""
    if not stored_path:
        return None
    stored = Path(stored_path)
    if stored.exists():
        return stored
    candidate = base_dir / stored.parent.name / stored.name
    if candidate.exists():
        return candidate
    return stored
