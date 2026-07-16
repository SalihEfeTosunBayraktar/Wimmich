"""Shared numpy embedding (de)serialization and similarity helpers."""
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


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Compute cosine similarity between two vectors."""
    dot = np.dot(a, b)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(dot / (norm_a * norm_b))
