"""CLIP semantic search via LAION's multilingual CLIP.

A ViT-H/14 image tower jointly trained with a frozen XLM-Roberta-Large text
tower on LAION-5B - Turkish (or any other language) search queries land in
the same embedding space the images were embedded into. Noticeably
stronger than a ViT-B/32 or ViT-L/14 pair, at the cost of wanting a real
GPU with a few GB of headroom.
"""
import threading
from typing import Optional, List, Tuple
import numpy as np

import config
from utils.embedding_utils import load_embedding, cosine_similarity

_model = None
_preprocess = None
_tokenizer = None
_device = None
_load_lock = threading.Lock()

CLIP_AVAILABLE = False
try:
    import open_clip  # noqa: F401
    CLIP_AVAILABLE = True
except ImportError:
    CLIP_AVAILABLE = False


def _load_clip():
    """Lazy-load the CLIP model (image + text share one checkpoint).

    Guarded by a lock: compute_clip_embedding/compute_text_embedding run
    concurrently across several asyncio.to_thread workers, and without it
    every thread sees _model as None on the first batch and loads its own
    duplicate ~5GB model onto the GPU at once."""
    global _model, _preprocess, _tokenizer, _device
    if _model is not None:
        return

    with _load_lock:
        if _model is not None:
            return

        if not CLIP_AVAILABLE:
            raise RuntimeError("CLIP not available. Install: pip install open_clip_torch")

        import torch
        import open_clip

        _device = "cuda" if torch.cuda.is_available() else "cpu"
        cache_dir = str(config.ML_DIR / "clip_cache")

        print(f"[ML] Loading CLIP model: {config.ML_CLIP_MODEL} ({config.ML_CLIP_PRETRAINED}) on device: {_device}...")
        model, _, preprocess = open_clip.create_model_and_transforms(
            config.ML_CLIP_MODEL, pretrained=config.ML_CLIP_PRETRAINED, cache_dir=cache_dir,
        )
        _model = model.to(_device).eval()
        _preprocess = preprocess
        _tokenizer = open_clip.get_tokenizer(config.ML_CLIP_MODEL)
        print(f"[ML] CLIP model loaded successfully on device: {_device}.")


def compute_clip_embedding(image_path: str) -> Optional[np.ndarray]:
    """Compute a CLIP image embedding."""
    if not CLIP_AVAILABLE:
        return None

    try:
        _load_clip()
        import torch
        from utils.image_utils import _open_any_image

        # Plain PIL can't decode camera RAW (.dng etc.) at all ("cannot
        # identify image file") - _open_any_image already handles that
        # (extracts the embedded JPEG preview via rawpy) for thumbnails/EXIF,
        # CLIP indexing just never used it, so RAW photos silently never got
        # a CLIP embedding (unsearchable, no visual-duplicate detection).
        img = _open_any_image(image_path).convert("RGB")
        tensor = _preprocess(img).unsqueeze(0).to(_device)
        with torch.no_grad():
            features = _model.encode_image(tensor)
            features = features / features.norm(dim=-1, keepdim=True)
        return features.squeeze(0).cpu().numpy()

    except Exception as e:
        print(f"[ML] CLIP embedding error for {image_path}: {e}")
        return None


def compute_text_embedding(text: str) -> Optional[np.ndarray]:
    """Compute a CLIP text embedding for a query (any language)."""
    if not CLIP_AVAILABLE:
        return None

    try:
        _load_clip()
        import torch

        tokens = _tokenizer([text]).to(_device)
        with torch.no_grad():
            features = _model.encode_text(tokens)
            features = features / features.norm(dim=-1, keepdim=True)
        return features.squeeze(0).cpu().numpy()

    except Exception as e:
        print(f"[ML] Text embedding error: {e}")
        return None


def search_by_text(
    query: str,
    embedding_paths: List[Tuple[str, str]],  # [(asset_id, embedding_path), ...]
    top_k: int = 50,
) -> List[Tuple[str, float]]:
    """
    Search assets by text query using CLIP.
    Returns [(asset_id, score), ...] sorted by score descending.
    """
    text_emb = compute_text_embedding(query)
    if text_emb is None:
        return []

    results = []
    for asset_id, emb_path in embedding_paths:
        emb = load_embedding(emb_path)
        if emb is not None and emb.shape == text_emb.shape:
            score = cosine_similarity(text_emb, emb)
            results.append((asset_id, score))

    results.sort(key=lambda x: x[1], reverse=True)
    return results[:top_k]
