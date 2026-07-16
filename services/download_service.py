"""Bulk zip download: stream multiple selected assets as one .zip file."""
import asyncio
import io
import zipfile
from pathlib import Path
from typing import List
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

import config
from models import Asset, User
from utils.path_utils import resolve_data_path


def _build_zip_sync(file_paths_and_names: List[tuple]) -> io.BytesIO:
    """Read and zip every file - pure CPU/IO, no DB access, safe to run in a thread."""
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_STORED) as zf:
        for path, name in file_paths_and_names:
            zf.write(path, arcname=name)
    buffer.seek(0)
    return buffer


async def build_zip_archive(db: AsyncSession, user: User, asset_ids: List[str]) -> io.BytesIO:
    """Build an in-memory zip of the given assets' original files (ownership-checked)."""
    result = await db.execute(
        select(Asset).where(and_(Asset.id.in_(asset_ids), Asset.user_id == user.id))
    )
    assets = list(result.scalars().all())

    used_names = set()
    file_paths_and_names = []
    for asset in assets:
        path = resolve_data_path(asset.file_path, config.UPLOAD_DIR)
        if not path or not path.exists():
            continue

        name = asset.original_file_name
        if name in used_names:
            # Disambiguate duplicate filenames within the same zip
            stem, suffix = path.stem, path.suffix
            counter = 1
            while f"{stem}_{counter}{suffix}" in used_names:
                counter += 1
            name = f"{stem}_{counter}{suffix}"
        used_names.add(name)

        file_paths_and_names.append((path, name))

    # Reading/writing every file's bytes is pure CPU/IO with no DB access -
    # doing it directly in this coroutine blocked the whole event loop (every
    # other request on the server) for as long as the zip took to build.
    return await asyncio.to_thread(_build_zip_sync, file_paths_and_names)
