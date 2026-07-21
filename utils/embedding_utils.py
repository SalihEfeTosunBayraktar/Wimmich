"""Shared numpy embedding (de)serialization and similarity helpers."""
import threading
from collections import OrderedDict
from pathlib import Path
from typing import Optional
import numpy as np


def save_embedding(embedding: np.ndarray, path: str) -> bool:
    """Save numpy embedding to file."""
    try:
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        np.save(path, embedding)
        return True
    except Exception:
        return False


def load_embedding(path: str) -> Optional[np.ndarray]:
    """Load numpy embedding from file."""
    try:
        if Path(path).exists():
            return np.load(path)
    except Exception:
        pass
    return None


# Bounded LRU cache of loaded embeddings, keyed by path. Text search
# (clip_service.search_by_text) otherwise re-reads EVERY embedding file
# from disk on every query - and the UI fires a query per debounced
# keystroke, so on a large library that's tens of thousands of tiny file
# reads per keystroke. An embedding at a given path never changes once
# written (paths are per-asset UUIDs), so caching by path is safe; misses
# are deliberately NOT cached, so a photo that gets embedded after a search
# already ran is picked up on the next query instead of being stuck absent.
# Only the search hot path uses this - the batch jobs (dedup, clustering,
# similarity) iterate their inputs exactly once, so caching would only cost
# them memory with no reuse.
_EMB_CACHE: "OrderedDict[str, np.ndarray]" = OrderedDict()
_EMB_CACHE_MAX = 20000  # ~80MB at 1024-dim float32; well above most libraries
_EMB_CACHE_LOCK = threading.Lock()


def load_embedding_cached(path: str) -> Optional[np.ndarray]:
    """load_embedding() with a process-wide bounded LRU cache. The returned
    array is marked read-only - callers must not mutate it (the cache hands
    out the same object to everyone). Safe under the concurrent-search
    threads asyncio.to_thread spins up: the lock only guards the (constant-
    time) dict bookkeeping, never the disk read itself."""
    with _EMB_CACHE_LOCK:
        cached = _EMB_CACHE.get(path)
        if cached is not None:
            _EMB_CACHE.move_to_end(path)
            return cached

    arr = load_embedding(path)  # disk read outside the lock
    if arr is None:
        return None
    arr.flags.writeable = False

    with _EMB_CACHE_LOCK:
        # Another thread may have inserted the same path meanwhile - reuse
        # its copy so there's one canonical object per path, and don't grow
        # the cache twice for it.
        existing = _EMB_CACHE.get(path)
        if existing is not None:
            _EMB_CACHE.move_to_end(path)
            return existing
        _EMB_CACHE[path] = arr
        _EMB_CACHE.move_to_end(path)
        while len(_EMB_CACHE) > _EMB_CACHE_MAX:
            _EMB_CACHE.popitem(last=False)
    return arr


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Compute cosine similarity between two vectors."""
    dot = np.dot(a, b)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(dot / (norm_a * norm_b))
