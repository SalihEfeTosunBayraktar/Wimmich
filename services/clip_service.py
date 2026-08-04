"""CLIP semantic search via LAION's multilingual CLIP.

A ViT-H/14 image tower jointly trained with a frozen XLM-Roberta-Large text
tower on LAION-5B - Turkish (or any other language) search queries land in
the same embedding space the images were embedded into. Noticeably
stronger than a ViT-B/32 or ViT-L/14 pair, at the cost of wanting a real
GPU with a few GB of headroom.
"""
import concurrent.futures
import threading
import time
from typing import Optional, List, Tuple
import numpy as np

import config
from utils.embedding_utils import load_embedding, load_embedding_cached, cosine_similarity
from utils.log import info, success, error

_model = None
_preprocess = None
_tokenizer = None
_device = None
_load_lock = threading.Lock()
# time.monotonic() of the last actual embedding computation - read by
# gpu_idle_service.py to decide whether this has been sitting idle long
# enough to unload. Monotonic rather than wall-clock so a system clock
# adjustment can't accidentally trigger (or indefinitely postpone) a
# timeout.
_last_used: Optional[float] = None

CLIP_AVAILABLE = False
try:
    import open_clip  # noqa: F401
    CLIP_AVAILABLE = True
except ImportError:
    CLIP_AVAILABLE = False


def is_clip_loaded() -> bool:
    """Whether the (~4-5GB) model is actually resident on the GPU/CPU right
    now, not just installed - _load_clip() only runs on the first CLIP job
    or the first search, so there's a real, multi-second-to-a-minute delay
    the very first time either happens that this makes visible to callers
    instead of leaving it silent."""
    return _model is not None


def idle_seconds() -> Optional[float]:
    """How long since the last actual embedding computation, or None if
    never loaded/already unloaded. Used by gpu_idle_service.py to decide
    whether this has been idle long enough to unload - not "how long since
    the model was loaded", which would unload a model still being used
    continuously just because it happened to load a while ago."""
    if _model is None or _last_used is None:
        return None
    return time.monotonic() - _last_used


def unload_clip() -> bool:
    """Frees the ~4-5GB model from GPU/system memory - the inverse of the
    lazy-load above, for gpu_idle_service.py's idle-timeout unload. Safe to
    call whether or not anything is actually loaded. Returns whether
    anything was actually unloaded (so the caller can log it meaningfully
    instead of a no-op looking identical to a real unload)."""
    global _model, _preprocess, _tokenizer, _device, _last_used
    with _load_lock:
        if _model is None:
            return False
        was_device = _device
        _model = None
        _preprocess = None
        _tokenizer = None
        _device = None
        _last_used = None
        if was_device == "cuda":
            import torch
            torch.cuda.empty_cache()
        success("ML", "CLIP model unloaded (idle timeout) - will reload on next use.")
        return True


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
        import logging

        # Harmless noise, not an error: huggingface_hub warns on every
        # unauthenticated download that an HF_TOKEN would mean higher rate
        # limits/faster downloads - true, but irrelevant here since the
        # checkpoint gets cached locally (cache_dir below) after the first
        # download and never touches the network again after that.
        logging.getLogger("huggingface_hub").setLevel(logging.ERROR)

        _device = "cuda" if torch.cuda.is_available() else "cpu"
        cache_dir = str(config.ML_DIR / "clip_cache")

        info("ML", f"Loading CLIP model: {config.ML_CLIP_MODEL} ({config.ML_CLIP_PRETRAINED}) on device: {_device}...")

        def _create():
            return open_clip.create_model_and_transforms(
                config.ML_CLIP_MODEL, pretrained=config.ML_CLIP_PRETRAINED, cache_dir=cache_dir,
            )

        # _load_clip() already runs inside a worker thread (asyncio.to_thread
        # from the handler) - no running event loop here for asyncio.wait_for.
        # A throwaway single-worker executor bounds just this call instead,
        # so a slow/interrupted connection mid-download of the ~5GB
        # checkpoint (open_clip/huggingface_hub set no timeout of their own)
        # fails cleanly instead of hanging this job - and, until the much
        # longer job-hang watchdog's ceiling, the entire queue - forever.
        # Deliberately NOT `with ThreadPoolExecutor(...)`: its __exit__ calls
        # shutdown(wait=True), which would block here until the abandoned
        # download thread finishes, silently defeating the timeout below.
        executor = concurrent.futures.ThreadPoolExecutor(max_workers=1)
        try:
            future = executor.submit(_create)
            try:
                model, _, preprocess = future.result(timeout=config.ML_MODEL_LOAD_TIMEOUT_SECONDS)
            except concurrent.futures.TimeoutError:
                raise RuntimeError(
                    f"CLIP modeli {config.ML_MODEL_LOAD_TIMEOUT_SECONDS // 60} dakika içinde yüklenemedi "
                    f"(muhtemelen yavaş/kesik internet bağlantısı nedeniyle model indirme işlemi takıldı)."
                )
        finally:
            executor.shutdown(wait=False)

        _model = model.to(_device).eval()
        _preprocess = preprocess
        _tokenizer = open_clip.get_tokenizer(config.ML_CLIP_MODEL)
        success("ML", f"CLIP model loaded successfully on device: {_device}.")


def compute_clip_embedding(image_path: str) -> Optional[np.ndarray]:
    """Compute a CLIP image embedding."""
    global _last_used
    if not CLIP_AVAILABLE:
        return None

    try:
        _load_clip()
        _last_used = time.monotonic()
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
        error("ML", f"CLIP embedding error for {image_path}: {e}")
        return None


def compute_text_embedding(text: str) -> Optional[np.ndarray]:
    """Compute a CLIP text embedding for a query (any language)."""
    global _last_used
    if not CLIP_AVAILABLE:
        return None

    try:
        _load_clip()
        _last_used = time.monotonic()
        import torch

        tokens = _tokenizer([text]).to(_device)
        with torch.no_grad():
            features = _model.encode_text(tokens)
            features = features / features.norm(dim=-1, keepdim=True)
        return features.squeeze(0).cpu().numpy()

    except Exception as e:
        error("ML", f"Text embedding error: {e}")
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
        emb = load_embedding_cached(emb_path)
        if emb is not None and emb.shape == text_emb.shape:
            score = cosine_similarity(text_emb, emb)
            results.append((asset_id, score))

    results.sort(key=lambda x: x[1], reverse=True)
    return results[:top_k]
