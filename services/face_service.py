"""Face detection and clustering via facenet-pytorch (MTCNN + InceptionResnetV1),
running on GPU when one is available.

dlib's pip wheel has no CUDA support (confirmed: torch.cuda.is_available()
being True says nothing about dlib itself), so face detection previously
ran entirely on CPU regardless of the machine's GPU - facenet-pytorch reuses
the same torch/CUDA install already working for CLIP.
"""
import threading
from typing import List, Dict, Tuple
import numpy as np

import config

FACE_AVAILABLE = False
try:
    from facenet_pytorch import MTCNN, InceptionResnetV1  # noqa: F401
    FACE_AVAILABLE = True
except ImportError:
    FACE_AVAILABLE = False

_mtcnn = None
_resnet = None
_device = None
_load_lock = threading.Lock()


def _load_face_models():
    """Lazy-load the detector (MTCNN) and embedding model (InceptionResnetV1).

    Guarded by a lock: detect_faces() runs concurrently across several
    asyncio.to_thread workers, and without it every one of those threads
    sees _mtcnn as None on the first batch and loads its own duplicate
    model onto the GPU at once (wasted VRAM/time, and with a nearly-full
    8GB card here, a real OOM risk)."""
    global _mtcnn, _resnet, _device
    if _mtcnn is not None and _resnet is not None:
        return

    with _load_lock:
        if _mtcnn is not None and _resnet is not None:
            return

        import torch
        from facenet_pytorch import MTCNN, InceptionResnetV1

        _device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"[ML] Loading face detection/recognition models on device: {_device}...")
        # min_face_size default (20px) let MTCNN "detect" tiny texture/pattern
        # patches as faces at high confidence (confirmed directly: a zigzag
        # stitching pattern on a swimsuit strap got flagged as a face) -
        # those false positives all embedded similarly to each other, which
        # is what merged thousands of unrelated faces into one giant cluster.
        # Real faces worth grouping are rarely under ~60px even after
        # downscaling to FACE_DETECT_MAX_DIM.
        _mtcnn = MTCNN(keep_all=True, device=_device, post_process=False, min_face_size=60)
        _resnet = InceptionResnetV1(pretrained="vggface2").eval().to(_device)
        print(f"[ML] Face models loaded successfully on device: {_device}.")


def _load_downscaled_rgb(image_path: str):
    """PIL Image, RGB, downscaled to FACE_DETECT_MAX_DIM - detecting on
    30+ MP originals is needlessly slow and previously ate tens of GB of RAM."""
    from PIL import Image

    img = Image.open(image_path).convert("RGB")
    img.thumbnail((config.FACE_DETECT_MAX_DIM, config.FACE_DETECT_MAX_DIM), Image.Resampling.LANCZOS)
    return img


def detect_faces(image_path: str) -> List[Dict]:
    """
    Detect faces in an image and compute a 512-d embedding per face.
    Uses facenet-pytorch (GPU) if available, otherwise falls back to OpenCV
    Haar Cascade (CPU-only, detection quality only - see FACE_AVAILABLE usage
    in job_handlers/face_handler.py).
    """
    if FACE_AVAILABLE:
        try:
            _load_face_models()
            import torch
            from facenet_pytorch import extract_face, fixed_image_standardization

            img = _load_downscaled_rgb(image_path)
            img_w, img_h = img.size

            boxes, probs = _mtcnn.detect(img)
            if boxes is None:
                return []

            faces = []
            for box, prob in zip(boxes, probs):
                if prob is None or prob < 0.9:
                    continue
                left, top, right, bottom = box
                left, top = max(0.0, left), max(0.0, top)
                right, bottom = min(float(img_w), right), min(float(img_h), bottom)
                if right <= left or bottom <= top:
                    continue
                # Belt-and-suspenders on top of min_face_size: a detection
                # this small is far more likely to be a texture/pattern
                # false positive than an actual identifiable face.
                if (right - left) < 50 or (bottom - top) < 50:
                    continue

                face_tensor = extract_face(img, box, image_size=160)
                # extract_face() returns raw [0, 255] pixel values -
                # InceptionResnetV1 was trained on inputs standardized to
                # roughly [-1, 1] and does no normalization of its own, so
                # skipping this fed every face completely out-of-range
                # input. The resulting embeddings barely separated
                # different people at all (random-pair euclidean distance
                # averaged ~0.65 in a [0, 1.65] range), which is what
                # collapsed clustering into one giant mixed-identity blob.
                face_tensor = fixed_image_standardization(face_tensor)
                with torch.no_grad():
                    embedding = _resnet(face_tensor.unsqueeze(0).to(_device))[0].cpu().numpy()

                faces.append({
                    "x": left / img_w,
                    "y": top / img_h,
                    "w": (right - left) / img_w,
                    "h": (bottom - top) / img_h,
                    "embedding": embedding,
                    "confidence": float(prob),
                })
            return faces
        except Exception as e:
            print(f"[ML] Face detection error: {e}")
            # Do NOT fall through to the Haar Cascade path below: its
            # embedding is a completely different, incompatible shape
            # (128-d resized-grayscale-patch vs facenet's 512-d) - one image
            # falling back silently poisoned clustering for every face in
            # the library at once, since np.array() can't stack embeddings
            # of mixed dimensions ("setting an array element with a
            # sequence... inhomogeneous shape"). Better to skip this one
            # image's faces than break every other face's clustering.
            return []

    # Only reached when facenet-pytorch isn't installed at all.
    # Fallback to OpenCV Haar Cascade (always available, CPU-only)
    try:
        import cv2

        img = np.asarray(_load_downscaled_rgb(image_path))
        img_h, img_w = img.shape[:2]
        gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)

        cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        face_cascade = cv2.CascadeClassifier(cascade_path)

        detected_faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))

        faces = []
        for (x, y, w, h) in detected_faces:
            face_crop = gray[y:y+h, x:x+w]
            resized = cv2.resize(face_crop, (16, 8))  # 128 elements
            embedding = resized.flatten().astype(float) / 255.0
            embedding = embedding / (np.linalg.norm(embedding) + 1e-8)

            faces.append({
                "x": x / img_w,
                "y": y / img_h,
                "w": w / img_w,
                "h": h / img_h,
                "embedding": embedding,
                "confidence": 0.9,
            })
        return faces
    except Exception as e:
        print(f"[ML] OpenCV face detection error: {e}")
        return []


def cluster_faces(
    face_embeddings: List[Tuple[str, np.ndarray]],  # [(face_id, embedding), ...]
    threshold: float = 0.6,
) -> Dict[int, List[str]]:
    """
    Cluster face embeddings into groups (persons).
    Returns {cluster_id: [face_id, ...], ...}
    """
    if not face_embeddings:
        return {}

    try:
        from sklearn.cluster import DBSCAN

        ids = [f[0] for f in face_embeddings]
        embeddings = np.array([f[1] for f in face_embeddings])

        clustering = DBSCAN(eps=threshold, min_samples=2, metric="euclidean").fit(embeddings)

        clusters = {}
        for face_id, label in zip(ids, clustering.labels_):
            if label == -1:
                continue  # Noise - unclustered
            clusters.setdefault(label, []).append(face_id)

        return clusters

    except ImportError:
        return _simple_cluster(face_embeddings, threshold)
    except Exception as e:
        print(f"[ML] Clustering error: {e}")
        return {}


def _simple_cluster(
    face_embeddings: List[Tuple[str, np.ndarray]],
    threshold: float = 0.6,
) -> Dict[int, List[str]]:
    """Simple greedy clustering fallback without sklearn."""
    clusters = {}
    cluster_centers = []
    cluster_id = 0

    for face_id, embedding in face_embeddings:
        matched = False
        for cid, center in enumerate(cluster_centers):
            dist = np.linalg.norm(embedding - center)
            if dist < threshold:
                clusters[cid].append(face_id)
                n = len(clusters[cid])
                cluster_centers[cid] = center + (embedding - center) / n
                matched = True
                break

        if not matched:
            clusters[cluster_id] = [face_id]
            cluster_centers.append(embedding.copy())
            cluster_id += 1

    return {k: v for k, v in clusters.items() if len(v) >= 2}


def compare_faces(emb1: np.ndarray, emb2: np.ndarray) -> float:
    """Compare two face embeddings. Lower distance = more similar."""
    return float(np.linalg.norm(emb1 - emb2))
