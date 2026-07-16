"""Zero-shot content categorization using the CLIP embeddings the app
already computes - compares each photo's embedding to a fixed set of
category text prompts instead of training/running a separate classifier.
"""
from typing import Dict, List, Optional
import numpy as np

from utils.embedding_utils import cosine_similarity

# A few English prompts per category (CLIP's captions were overwhelmingly
# English even in multilingual variants, so English prompts anchor better
# here than translating them - this only affects category *labels*, not
# what languages users can still search with).
CATEGORY_PROMPTS = {
    "screenshot": [
        "a screenshot of a phone or computer screen",
        "a screenshot with app icons, menus, or user interface text",
    ],
    "document": [
        "a photo of a document, paper, or receipt with text",
        "a scanned page or form",
    ],
    "nature": [
        "a photo of nature, a landscape, mountains, forest, or scenery",
        "a photo of the sky, sea, or a sunset",
    ],
    "pet": [
        "a photo of a cat",
        "a photo of a dog",
        "a close-up photo of a pet animal",
    ],
    "food": [
        "a photo of food or a meal on a plate",
        "a photo of a drink, dessert, or a restaurant table",
    ],
    "car": [
        "a photo of a car or a vehicle",
        "a photo of a motorcycle, truck, or a car dashboard",
    ],
    "technology": [
        "a photo of a computer, laptop, or phone as the main subject",
        "a photo of electronics, a gadget, or a circuit board",
    ],
}

# Minimum cosine similarity to accept a category match - below this the
# photo is left uncategorized rather than force-fit into the closest label.
# Calibrated empirically against this specific model (LAION multilingual
# CLIP-H/14): real photo embeddings vs. single-sentence category prompts
# scored -0.05 to +0.18 across a sample of the actual library - nowhere
# near the 0.22 first guessed (based on OpenAI CLIP's typical scale, which
# this model doesn't share). 0.22 left 4307 of 4308 photos uncategorized.
CATEGORY_THRESHOLD = 0.09

# Sentinel stored on Asset.smart_category when a photo was checked but
# matched nothing confidently - distinct from NULL ("never checked"), so
# the CATEGORIZE job doesn't keep re-examining the same photo forever.
NO_CATEGORY = "none"

# How close a new photo's embedding needs to be to a user-flagged "wrong
# category" example before it gets vetoed away from that category too.
# Cosine similarity here tends to run much hotter than the anchor-prompt
# scores above (same-subject photos, not photo-vs-caption), so this sits
# far higher than CATEGORY_THRESHOLD.
CORRECTION_VETO_THRESHOLD = 0.9

_category_anchors: Optional[dict] = None


def _load_category_anchors() -> dict:
    """Compute (once per process) the averaged text embedding for each category."""
    global _category_anchors
    if _category_anchors is not None:
        return _category_anchors

    from services.clip_service import compute_text_embedding

    anchors = {}
    for category, prompts in CATEGORY_PROMPTS.items():
        embeddings = [compute_text_embedding(p) for p in prompts]
        embeddings = [e for e in embeddings if e is not None]
        if not embeddings:
            continue
        avg = np.mean(embeddings, axis=0)
        avg = avg / (np.linalg.norm(avg) + 1e-8)
        anchors[category] = avg

    _category_anchors = anchors
    return anchors


def classify_embedding(
    embedding: np.ndarray,
    corrections: Optional[Dict[str, List[np.ndarray]]] = None,
) -> Optional[str]:
    """Return the best-matching category name, or None if nothing clears the
    threshold. `corrections` (category -> [rejected embeddings, ...], from
    load_correction_embeddings) lets prior "wrong category" feedback veto a
    category that would otherwise match - falls through to the next-best
    category instead of forcing a mismatch."""
    anchors = _load_category_anchors()
    if not anchors:
        return None

    scored = sorted(
        (
            (cosine_similarity(embedding, anchor), category)
            for category, anchor in anchors.items()
            if anchor.shape == embedding.shape
        ),
        reverse=True,
    )

    for score, category in scored:
        if score <= CATEGORY_THRESHOLD:
            break
        if corrections and _vetoed(embedding, category, corrections):
            continue
        return category

    return None


def _vetoed(embedding: np.ndarray, category: str, corrections: Dict[str, List[np.ndarray]]) -> bool:
    rejected = corrections.get(category)
    if not rejected:
        return False
    return any(
        r.shape == embedding.shape and cosine_similarity(embedding, r) >= CORRECTION_VETO_THRESHOLD
        for r in rejected
    )
