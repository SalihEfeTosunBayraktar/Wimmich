"""Fast local filesystem walking for media files.

The folder browser and folder-import scan previously ran one Path.glob()
pass per extension in config.ALL_EXTENSIONS (twice each, once per case,
since glob is case-sensitive even on Windows) - roughly 50+ separate
directory scans for a single folder listing. Reproduced directly: this is
what made browsing/scanning a real external drive feel frozen with no
feedback, especially over slow/spinning disks where each pass re-touches
the same directory entries from scratch. A single walk checking each
entry's extension against the set is the same result for a fraction of
the filesystem calls.
"""
import os
from pathlib import Path
from typing import Iterator

import config


def iter_media_files(root: str, recursive: bool) -> Iterator[str]:
    """Yields absolute paths of media files under root - a single pass per
    directory instead of one glob() per extension."""
    root_path = Path(root)
    if root_path.is_file():
        if root_path.suffix.lower() in config.ALL_EXTENSIONS:
            yield str(root_path)
        return
    if not root_path.is_dir():
        return

    if recursive:
        for dirpath, _dirnames, filenames in os.walk(root):
            for name in filenames:
                if Path(name).suffix.lower() in config.ALL_EXTENSIONS:
                    yield os.path.join(dirpath, name)
    else:
        try:
            with os.scandir(root) as it:
                for entry in it:
                    if entry.is_file() and Path(entry.name).suffix.lower() in config.ALL_EXTENSIONS:
                        yield entry.path
        except (PermissionError, OSError):
            return


def count_immediate_media(folder: str) -> int:
    """Non-recursive count of media files directly inside folder (one
    level only) - used for the folder browser's per-subfolder count
    badge, which was the single biggest source of the slowdown since it
    ran on every subfolder shown in a listing."""
    count = 0
    try:
        with os.scandir(folder) as it:
            for entry in it:
                if entry.is_file() and Path(entry.name).suffix.lower() in config.ALL_EXTENSIONS:
                    count += 1
    except (PermissionError, OSError):
        pass
    return count
