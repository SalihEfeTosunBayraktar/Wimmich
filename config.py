"""Wimmich Configuration Module"""
import os
import secrets
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Base directories
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR_ENV = os.getenv("WIMMICH_DATA_DIR")
DATA_DIR = Path(DATA_DIR_ENV).resolve() if DATA_DIR_ENV else BASE_DIR / "data"
UPLOAD_DIR = DATA_DIR / "uploads"
THUMB_DIR = DATA_DIR / "thumbs"
ENCODED_DIR = DATA_DIR / "encoded"
ML_DIR = DATA_DIR / "ml"

# Local DB directory (independent of movable data directory to prevent db locks)
DB_DIR = BASE_DIR / "data"

# Create directories
for d in [DATA_DIR, UPLOAD_DIR, THUMB_DIR, ENCODED_DIR, ML_DIR, DB_DIR]:
    d.mkdir(parents=True, exist_ok=True)


def update_config(
    new_path_str: str,
    new_token_str: str,
    total_limit_mb: int = 0,
    auto_start: bool = False,
    custom_domain: str = "",
) -> None:
    """Updates the data directory, tunnel token/domain, and total storage limit at runtime and saves them to .env file."""
    global DATA_DIR, UPLOAD_DIR, THUMB_DIR, ENCODED_DIR, ML_DIR, TUNNEL_TOKEN, TOTAL_STORAGE_LIMIT_MB, AUTO_START_TUNNEL, TUNNEL_CUSTOM_DOMAIN
    new_path = Path(new_path_str).resolve()

    new_upload = new_path / "uploads"
    new_thumb = new_path / "thumbs"
    new_encoded = new_path / "encoded"
    new_ml = new_path / "ml"

    for d in [new_path, new_upload, new_thumb, new_encoded, new_ml]:
        d.mkdir(parents=True, exist_ok=True)

    DATA_DIR = new_path
    UPLOAD_DIR = new_upload
    THUMB_DIR = new_thumb
    ENCODED_DIR = new_encoded
    ML_DIR = new_ml
    TUNNEL_TOKEN = new_token_str.strip()
    TOTAL_STORAGE_LIMIT_MB = total_limit_mb
    AUTO_START_TUNNEL = auto_start
    TUNNEL_CUSTOM_DOMAIN = custom_domain.strip()

    # Write/Update in .env file
    env_path = BASE_DIR / ".env"
    lines = []
    data_dir_found = False
    token_found = False
    limit_found = False
    auto_start_found = False
    domain_found = False

    if env_path.exists():
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                if line.strip().startswith("WIMMICH_DATA_DIR="):
                    lines.append(f"WIMMICH_DATA_DIR={new_path_str}\n")
                    data_dir_found = True
                elif line.strip().startswith("WIMMICH_TUNNEL_TOKEN="):
                    lines.append(f"WIMMICH_TUNNEL_TOKEN={new_token_str}\n")
                    token_found = True
                elif line.strip().startswith("WIMMICH_TOTAL_STORAGE_LIMIT_MB="):
                    lines.append(f"WIMMICH_TOTAL_STORAGE_LIMIT_MB={total_limit_mb}\n")
                    limit_found = True
                elif line.strip().startswith("WIMMICH_AUTO_START_TUNNEL="):
                    lines.append(f"WIMMICH_AUTO_START_TUNNEL={'true' if auto_start else 'false'}\n")
                    auto_start_found = True
                elif line.strip().startswith("WIMMICH_TUNNEL_CUSTOM_DOMAIN="):
                    lines.append(f"WIMMICH_TUNNEL_CUSTOM_DOMAIN={custom_domain}\n")
                    domain_found = True
                else:
                    lines.append(line)

    if not data_dir_found:
        lines.append(f"\nWIMMICH_DATA_DIR={new_path_str}\n")
    if not token_found:
        lines.append(f"WIMMICH_TUNNEL_TOKEN={new_token_str}\n")
    if not limit_found:
        lines.append(f"WIMMICH_TOTAL_STORAGE_LIMIT_MB={total_limit_mb}\n")
    if not auto_start_found:
        lines.append(f"WIMMICH_AUTO_START_TUNNEL={'true' if auto_start else 'false'}\n")
    if not domain_found:
        lines.append(f"WIMMICH_TUNNEL_CUSTOM_DOMAIN={custom_domain}\n")

    with open(env_path, "w", encoding="utf-8") as f:
        f.writelines(lines)

# Server
HOST = os.getenv("WIMMICH_HOST", "0.0.0.0")
PORT = int(os.getenv("WIMMICH_PORT", "3000"))
TUNNEL_TOKEN = os.getenv("WIMMICH_TUNNEL_TOKEN", "")
TUNNEL_CUSTOM_DOMAIN = os.getenv("WIMMICH_TUNNEL_CUSTOM_DOMAIN", "")
TOTAL_STORAGE_LIMIT_MB = int(os.getenv("WIMMICH_TOTAL_STORAGE_LIMIT_MB", "0"))
AUTO_START_TUNNEL = os.getenv("WIMMICH_AUTO_START_TUNNEL", "false").lower() == "true"

# Database
DATABASE_URL = os.getenv("WIMMICH_DB_URL", f"sqlite+aiosqlite:///{DB_DIR / 'wimmich.db'}")

# JWT
JWT_SECRET_ENV = os.getenv("WIMMICH_JWT_SECRET")
if not JWT_SECRET_ENV:
    JWT_SECRET_ENV = secrets.token_hex(32)
    env_path = BASE_DIR / ".env"
    lines = []
    jwt_found = False
    if env_path.exists():
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                if line.strip().startswith("WIMMICH_JWT_SECRET="):
                    lines.append(f"WIMMICH_JWT_SECRET={JWT_SECRET_ENV}\n")
                    jwt_found = True
                else:
                    lines.append(line)
    if not jwt_found:
        lines.append(f"\nWIMMICH_JWT_SECRET={JWT_SECRET_ENV}\n")
    with open(env_path, "w", encoding="utf-8") as f:
        f.writelines(lines)

JWT_SECRET = JWT_SECRET_ENV
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = int(os.getenv("WIMMICH_JWT_EXPIRE_HOURS", "168"))  # 7 days

# Login brute-force protection: after LOGIN_MAX_FAILURES failed attempts for
# the same client IP or the same email within LOGIN_FAILURE_WINDOW_SECONDS,
# further attempts are refused with 429 until the window rolls off. A
# successful login clears that identity's counter. See services/login_rate_limit.py.
LOGIN_MAX_FAILURES = int(os.getenv("WIMMICH_LOGIN_MAX_FAILURES", "10"))
LOGIN_FAILURE_WINDOW_SECONDS = int(os.getenv("WIMMICH_LOGIN_FAILURE_WINDOW_SECONDS", "900"))

# Thumbnails
THUMB_SIZES = {
    "small": 200,
    "medium": 600,
    "large": 1200,
}

# Upload limits
MAX_UPLOAD_SIZE = int(os.getenv("WIMMICH_MAX_UPLOAD_MB", "500")) * 1024 * 1024  # 500MB default

# Supported formats
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".tiff", ".tif", ".heic", ".heif", ".avif", ".svg"}
VIDEO_EXTENSIONS = {".mp4", ".mov", ".avi", ".mkv", ".wmv", ".flv", ".webm", ".m4v", ".3gp"}
RAW_EXTENSIONS = {".raw", ".cr2", ".cr3", ".nef", ".arw", ".dng", ".orf", ".rw2"}
ALL_EXTENSIONS = IMAGE_EXTENSIONS | VIDEO_EXTENSIONS | RAW_EXTENSIONS

# FFmpeg
FFMPEG_PATH = os.getenv("WIMMICH_FFMPEG_PATH", "ffmpeg")
FFPROBE_PATH = os.getenv("WIMMICH_FFPROBE_PATH", "")

# Cloudflare Tunnel
CLOUDFLARED_EXE_NAME = os.getenv("WIMMICH_CLOUDFLARED_EXE_NAME", "cloudflared.exe")
CLOUDFLARED_DOWNLOAD_URL = os.getenv(
    "WIMMICH_CLOUDFLARED_URL",
    "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe",
)

# ML Settings
# LAION's multilingual CLIP: a ViT-H/14 image tower jointly trained with a
# frozen XLM-Roberta-Large text tower on LAION-5B, so Turkish (or any other
# language) search queries land in the same embedding space the images were
# embedded into. Noticeably stronger than a ViT-B/32 or ViT-L/14 pair
# (~4.8GB single checkpoint) - wants a real GPU with a few GB of headroom.
# open_clip's registered architecture name + pretrained tag (not the
# "hf-hub:" form - this checkpoint predates the open_clip_config.json
# format that newer hf-hub auto-loading expects).
ML_CLIP_MODEL = os.getenv("WIMMICH_CLIP_MODEL", "xlm-roberta-large-ViT-H-14")
ML_CLIP_PRETRAINED = os.getenv("WIMMICH_CLIP_PRETRAINED", "frozen_laion5b_s13b_b90k")
ML_BATCH_SIZE = int(os.getenv("WIMMICH_ML_BATCH_SIZE", "16"))
ML_ENABLED = os.getenv("WIMMICH_ML_ENABLED", "true").lower() == "true"
# Bounds the CLIP/face-recognition model's first-use download (a multi-GB
# checkpoint over HTTP with no timeout of its own) - see clip_service.py's
# _load_clip() and face_service.py's _load_face_models(). Without this, a
# slow/interrupted connection mid-download hangs that job (and, until the
# job-hang watchdog's much longer ceiling kicks in, the entire queue behind
# it) indefinitely.
ML_MODEL_LOAD_TIMEOUT_SECONDS = int(os.getenv("WIMMICH_ML_MODEL_LOAD_TIMEOUT_SECONDS", "1200"))

# Bounds EXIF/thumbnail extraction for a single image (services/media_service.py's
# process_upload -> media_processing._process_image, PIL/rawpy-based, no
# timeout of its own). Video already has its own ceiling via ffmpeg's
# internal timeouts (utils/video_utils.py), but a pathological image
# (decompression-bomb-scale panorama, malformed RAW) can otherwise hang
# its worker thread forever. For import_handler.py's concurrent batches
# this is worse than it sounds: one stuck file blocks the whole
# asyncio.gather() the rest of that batch is waiting on, freezing the
# job's progress bar long before the much longer, job-total-age-based
# hang watchdog would ever notice.
MEDIA_PROCESSING_TIMEOUT_SECONDS = int(os.getenv("WIMMICH_MEDIA_PROCESSING_TIMEOUT_SECONDS", "180"))

# Face clustering. Distance is the L2 distance between facenet-pytorch
# (InceptionResnetV1, vggface2 weights) 512-d embeddings - a different scale
# than dlib's old 128-d descriptor (whose 0.55-0.6 range doesn't apply here).
# 0.7 is the community-reported "same person" ballpark for this unnormalized
# embedding; may need tuning once there's real clustering output to check
# against (RECLUSTER can re-run with a new value without re-detecting faces).
FACE_MATCH_THRESHOLD = float(os.getenv("WIMMICH_FACE_MATCH_THRESHOLD", "0.7"))
FACE_MIN_CLUSTER_SIZE = int(os.getenv("WIMMICH_FACE_MIN_CLUSTER_SIZE", "2"))
# Detection runs on a downscaled copy of the image (coordinates are stored
# normalized, so no back-scaling is needed). MTCNN's per-image GPU cost
# scales with pixel count, so this is a speed/recall tradeoff: 4000 measured
# ~100% GPU utilization but ~45 images/min; 3000 cuts pixel count by ~44%
# for a real speedup, at the cost of only the smallest/most distant faces in
# very large group photos - min_face_size (face_service.py) already filters
# those as more likely to be false positives than identifiable people.
FACE_DETECT_MAX_DIM = int(os.getenv("WIMMICH_FACE_DETECT_MAX_DIM", "3000"))

# Trash
TRASH_DAYS = int(os.getenv("WIMMICH_TRASH_DAYS", "30"))

# Backup: how many rotated full-DB snapshots to keep in the backup
# destination before deleting the oldest - the DB itself is small (tens of
# MB), so keeping several is cheap and gives a bit of point-in-time choice
# if the newest snapshot turns out to be from after some bad edit.
BACKUP_KEEP_DB_SNAPSHOTS = int(os.getenv("WIMMICH_BACKUP_KEEP_DB_SNAPSHOTS", "14"))

# Locale
LOCALE_MONTH_NAMES = {
    1: "Ocak", 2: "Şubat", 3: "Mart", 4: "Nisan",
    5: "Mayıs", 6: "Haziran", 7: "Temmuz", 8: "Ağustos",
    9: "Eylül", 10: "Ekim", 11: "Kasım", 12: "Aralık",
}

# Background job worker
JOB_POLL_INTERVAL_SECONDS = float(os.getenv("WIMMICH_JOB_POLL_INTERVAL_SECONDS", "2"))
# How often to check whether the currently-running job finished, so the next
# PENDING one can be dispatched immediately instead of waiting out the full
# idle poll interval. Bulk imports queue one CLIP/FACE job per asset, so at
# JOB_POLL_INTERVAL_SECONDS=2 this alone added 2+ seconds of pure waiting
# per asset - ~30+ minutes of dead time on a 1000-photo import before any
# actual processing time is counted.
JOB_BUSY_CHECK_INTERVAL_SECONDS = float(os.getenv("WIMMICH_JOB_BUSY_CHECK_INTERVAL_SECONDS", "0.2"))
JOB_IMPORT_COMMIT_BATCH_SIZE = int(os.getenv("WIMMICH_JOB_IMPORT_COMMIT_BATCH_SIZE", "10"))
# Number of files whose hash/EXIF/thumbnail work (all CPU/IO, no DB access)
# runs concurrently during an import. This was previously 1-at-a-time even
# though none of that work touches the (not concurrency-safe) DB session -
# a same-disk "copy" import was bottlenecked to a single CPU core the whole
# time despite the machine having many more available.
JOB_IMPORT_CONCURRENCY = int(os.getenv("WIMMICH_JOB_IMPORT_CONCURRENCY", "4"))
# Face detection now runs on GPU (facenet-pytorch). VRAM is the ceiling to
# watch (CLIP's model resident alongside this can leave as little as
# ~600MB free on an 8GB card), but with only face models loaded there's
# several GB of headroom - raised from 2 once GPU utilization measured
# only ~15-50% and fluctuating with concurrency=2, meaning the pipeline
# (image decode/resize on CPU feeding the GPU) was starving the GPU between
# batches rather than being VRAM-bound. If CUDA OOM errors show up in the
# logs during a CLIP+FACE overlap, lower this back down.
FACE_DETECT_CONCURRENCY = int(os.getenv("WIMMICH_FACE_DETECT_CONCURRENCY", "6"))
# How long a single job can run before the worker gives up waiting on it and
# moves on to the next PENDING job - see JobWorker._check_hang_watchdog.
# Comfortably above transcode_handler.py's own legitimate 3600s/60min ceiling
# for one video, so a genuinely slow-but-alive large transcode is never
# falsely killed by this.
JOB_HANG_TIMEOUT_MINUTES = float(os.getenv("WIMMICH_JOB_HANG_TIMEOUT_MINUTES", "90"))
# How many times a job that hit the hang watchdog gets automatically
# re-queued before being left FAILED for good.
JOB_HANG_MAX_RETRIES = int(os.getenv("WIMMICH_JOB_HANG_MAX_RETRIES", "2"))

# External Library
EXTERNAL_LIBRARY_PATHS = os.getenv("WIMMICH_EXTERNAL_LIBS", "").split(";") if os.getenv("WIMMICH_EXTERNAL_LIBS") else []
