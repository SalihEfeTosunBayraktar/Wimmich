"""File Hashing Utilities"""
import hashlib
from pathlib import Path


def compute_sha256(file_path: str, chunk_size: int = 8192) -> str:
    """Compute SHA-256 hash of a file."""
    sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        while True:
            chunk = f.read(chunk_size)
            if not chunk:
                break
            sha256.update(chunk)
    return sha256.hexdigest()


def compute_file_hash(file_path: str) -> str:
    """Alias for compute_sha256."""
    return compute_sha256(file_path)


def compute_bytes_hash(data: bytes) -> str:
    """SHA-256 of an in-memory buffer - used for upload bytes already held
    in memory, so callers don't need to write to disk first just to hash
    what they already have."""
    return hashlib.sha256(data).hexdigest()


def get_file_size(file_path: str) -> int:
    """Get file size in bytes."""
    return Path(file_path).stat().st_size
