"""ML Service - public API surface for CLIP search and face recognition.

Re-exports from clip_service/face_service/embedding_utils so existing
`from services.ml_service import ...` call sites keep working after the
split into per-concern modules.
"""
import config
from services.clip_service import (
    CLIP_AVAILABLE,
    compute_clip_embedding,
    compute_text_embedding,
    search_by_text,
    is_clip_loaded,
)
from services.face_service import (
    FACE_AVAILABLE,
    detect_faces,
    cluster_faces,
    compare_faces,
)
from utils.embedding_utils import save_embedding, load_embedding, cosine_similarity
from utils.geocoding_utils import GEOCODING_AVAILABLE

ML_AVAILABLE = CLIP_AVAILABLE or FACE_AVAILABLE

__all__ = [
    "CLIP_AVAILABLE",
    "FACE_AVAILABLE",
    "ML_AVAILABLE",
    "is_clip_loaded",
    "compute_clip_embedding",
    "compute_text_embedding",
    "search_by_text",
    "detect_faces",
    "cluster_faces",
    "compare_faces",
    "save_embedding",
    "load_embedding",
    "cosine_similarity",
    "get_ml_status",
]


def get_ml_status() -> dict:
    """Get ML feature availability status."""
    return {
        "ml_available": ML_AVAILABLE,
        "clip_available": CLIP_AVAILABLE,
        "face_recognition_available": FACE_AVAILABLE,
        "face_detection_available": True,  # OpenCV Haar Cascade fallback always works
        "person_clustering_available": FACE_AVAILABLE,  # crude OpenCV embedding can't reliably tell people apart
        "clip_model": config.ML_CLIP_MODEL if CLIP_AVAILABLE else None,
        "geocoding_available": GEOCODING_AVAILABLE,
    }
