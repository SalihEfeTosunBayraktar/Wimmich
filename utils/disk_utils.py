"""Windows drive-type detection - used to warn when Reference mode points
at a removable/network drive that could disappear later, silently
orphaning every asset that references it (see repair_handler.py's
trash-on-missing-source path, which is what actually happens when a
referenced drive goes away)."""
import ctypes
from pathlib import Path

DRIVE_UNKNOWN = 0
DRIVE_NO_ROOT_DIR = 1
DRIVE_REMOVABLE = 2
DRIVE_FIXED = 3
DRIVE_REMOTE = 4
DRIVE_CDROM = 5
DRIVE_RAMDISK = 6

_TYPE_LABELS = {
    DRIVE_REMOVABLE: "removable",
    DRIVE_FIXED: "fixed",
    DRIVE_REMOTE: "network",
    DRIVE_CDROM: "cdrom",
    DRIVE_RAMDISK: "ramdisk",
}

_RISKY_LABELS = {"removable", "network", "cdrom"}


def get_drive_type(path: str) -> str:
    """One of 'fixed'/'removable'/'network'/'cdrom'/'ramdisk'/'unknown' for
    the drive or network share the given path lives on. Best-effort: any
    failure (non-Windows, malformed path, WinAPI error) falls back to
    'unknown' rather than raising - this is advisory-only, never load-
    bearing for whether an import can proceed."""
    try:
        drive_root = Path(path).drive
        if not drive_root:
            return "unknown"
        if not drive_root.endswith("\\"):
            drive_root += "\\"
        drive_type = ctypes.windll.kernel32.GetDriveTypeW(drive_root)
    except Exception:
        return "unknown"

    return _TYPE_LABELS.get(drive_type, "unknown")


def is_risky_for_reference(path: str) -> bool:
    """True if Reference mode (index in place, never copy) is risky for a
    path on this drive - removable/network/optical media can be unplugged,
    disconnected, or ejected independently of Wimmich at any time."""
    return get_drive_type(path) in _RISKY_LABELS
