"""Local filesystem browsing/scanning for the folder-import feature."""
import os
from pathlib import Path
from typing import Optional
from fastapi import HTTPException
from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession

import config
from models import Asset
from services.media_service import delete_asset_files
from utils.disk_utils import get_drive_type, is_risky_for_reference
from utils.media_scan_utils import iter_media_files, count_immediate_media


def _list_drives() -> dict:
    """List Windows drive letters as browse targets."""
    drives = []
    for letter in "ABCDEFGHIJKLMNOPQRSTUVWXYZ":
        drive = f"{letter}:\\"
        if not os.path.exists(drive):
            continue
        total, free = 0, 0
        try:
            import shutil
            usage = shutil.disk_usage(drive)
            total, free = usage.total, usage.free
        except Exception:
            pass
        drives.append({
            "name": f"{letter}:\\",
            "path": drive,
            "type": "drive",
            "total_size": total,
            "free_size": free,
        })
    return {"items": drives, "current_path": "", "parent_path": None}


def browse_path(path: Optional[str]) -> dict:
    """Browse a local directory for the import folder picker."""
    if not path:
        if os.name == 'nt':
            return _list_drives()
        path = "/"

    target = Path(path)
    if not target.exists():
        raise HTTPException(status_code=404, detail="Yol bulunamadı")
    if not target.is_dir():
        raise HTTPException(status_code=400, detail="Bu bir klasör değil")

    items = []
    try:
        for entry in sorted(target.iterdir(), key=lambda e: (not e.is_dir(), e.name.lower())):
            try:
                is_dir = entry.is_dir()
                item = {"name": entry.name, "path": str(entry), "type": "folder" if is_dir else "file"}

                if is_dir:
                    item["media_count"] = count_immediate_media(str(entry))
                else:
                    ext = entry.suffix.lower()
                    if ext in config.ALL_EXTENSIONS:
                        item["size"] = entry.stat().st_size
                        item["media_type"] = (
                            "IMAGE" if ext in config.IMAGE_EXTENSIONS or ext in config.RAW_EXTENSIONS else "VIDEO"
                        )
                    else:
                        continue  # Skip non-media files

                items.append(item)
            except (PermissionError, OSError):
                continue
    except PermissionError:
        raise HTTPException(status_code=403, detail="Bu klasöre erişim izni yok")

    parent = str(target.parent) if target.parent != target else None
    return {"items": items, "current_path": str(target), "parent_path": parent}


def _collect_scan_candidates(path: str, recursive: bool) -> list:
    """Walk a folder for media files - one pass per directory (see
    utils/media_scan_utils), can still take a while on a large/deep tree,
    but nowhere near as long as the old one-glob()-per-extension approach."""
    return list(iter_media_files(path, recursive))


def _compute_scan_stats(new_files: list) -> tuple:
    total_size = sum(Path(f).stat().st_size for f in new_files if Path(f).exists())
    n_images = sum(1 for f in new_files if Path(f).suffix.lower() in config.IMAGE_EXTENSIONS | config.RAW_EXTENSIONS)
    n_videos = sum(1 for f in new_files if Path(f).suffix.lower() in config.VIDEO_EXTENSIONS)
    return total_size, n_images, n_videos


async def scan_folder_preview(
    db: AsyncSession, user_id: str, path: str, recursive: bool, copy_files: bool
) -> dict:
    """Scan a folder and report what would be imported, without importing anything."""
    import asyncio

    target = Path(path)
    if not target.exists():
        raise HTTPException(status_code=404, detail="Yol bulunamadı")

    # Recursive globbing over a large/deep tree is pure blocking filesystem
    # work - this preview scan ran directly in the event loop before,
    # stalling the whole server (every user, every request) for as long as
    # the walk took, which matters a lot right before a big import.
    found_files = await asyncio.to_thread(_collect_scan_candidates, path, recursive)

    # One query for every already-imported path this user has, not one query
    # PER FILE FOUND - a 400GB/hundred-thousand-file folder was doing that
    # many sequential awaited round-trips here before (each one a full ORM
    # load just to check existence), which alone accounted for 30+ minutes
    # on a real report. Same fix shape as the job-queue O(n^2) bug fixed
    # earlier this session: one indexed column-only SELECT, then a plain
    # Python set membership check per file - no DB access in the loop at all.
    existing_result = await db.execute(
        select(Asset.external_path).where(
            and_(Asset.user_id == user_id, Asset.external_path.isnot(None))
        )
    )
    existing_paths = {row[0] for row in existing_result.all()}

    already_imported = 0
    new_files = []
    for fp in found_files:
        if fp in existing_paths:
            already_imported += 1
        else:
            new_files.append(fp)

    total_size, images_count, videos_count = await asyncio.to_thread(_compute_scan_stats, new_files)
    disk_type = await asyncio.to_thread(get_drive_type, path)
    reference_risky = await asyncio.to_thread(is_risky_for_reference, path)

    return {
        "path": str(target),
        "total_found": len(found_files),
        "new_files": len(new_files),
        "already_imported": already_imported,
        "images": images_count,
        "videos": videos_count,
        "total_size": total_size,
        "copy_mode": copy_files,
        # Removable/network/optical drives can disappear independently of
        # Wimmich at any time - Reference mode has nothing left to fall
        # back on if that happens (see repair_handler.py), so this is
        # surfaced to nudge toward Copy mode for those, not enforced.
        "disk_type": disk_type,
        "reference_risky": reference_risky,
    }


async def list_reference_roots(db: AsyncSession, user_id: str) -> list:
    """Distinct source folders currently linked via a "Reference" mode
    import, with an asset count and total size per folder - lets the whole
    batch from one import be seen/removed as a group instead of hunting
    down its files one at a time in the main gallery."""
    stmt = (
        select(Asset.reference_root, func.count(Asset.id), func.sum(Asset.file_size))
        .where(and_(
            Asset.user_id == user_id,
            Asset.is_external == True,
            Asset.reference_root.isnot(None),
            Asset.is_trashed == False,
        ))
        .group_by(Asset.reference_root)
        .order_by(Asset.reference_root)
    )
    result = await db.execute(stmt)
    return [
        {"path": path, "asset_count": count, "total_size": total_size or 0}
        for path, count, total_size in result.all()
    ]


async def remove_reference_root(db: AsyncSession, user_id: str, path: str) -> int:
    """Un-links every asset that came from this reference folder - deletes
    Wimmich's own derivative files (thumbnails, CLIP embedding) but never
    the original on disk, via delete_asset_files' is_external guard. This
    only removes the link, it's not a file-delete - the folder itself is
    untouched and can be re-imported later if wanted."""
    result = await db.execute(
        select(Asset).where(and_(
            Asset.user_id == user_id,
            Asset.reference_root == path,
            Asset.is_external == True,
        ))
    )
    assets = list(result.scalars().all())
    for asset in assets:
        delete_asset_files(asset)
        await db.delete(asset)
    await db.commit()
    return len(assets)
