"""
Wimmich - Windows-Based Photo/Video Management Server
A self-hosted alternative to Immich, running natively on Windows.
"""
import sys

# Nothing in this codebase currently prints non-ASCII text to the console
# (verified: every utils/log.py call site is plain ASCII), but Windows'
# default console codepage often isn't UTF-8, especially on Turkish-locale
# machines - reproduced directly: a Windows OSError's own (Turkish, OS-
# generated) message came through mojibake in the terminal. Reconfiguring
# here up front, before anything else prints, is cheap insurance against
# a future UnicodeEncodeError crash from any non-ASCII text (ours or an
# OS/library message passing through). try/except since .reconfigure()
# is Python 3.7+ only and some redirected streams don't support it.
try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except Exception:
    pass

import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path

import config
from database import init_db
from services.job_service import job_worker
from version import APP_VERSION_FULL, get_version_info
from utils.spa_response import render_spa
from utils.log import info, success, warn, error

_DIVIDER = "\033[2m" + "=" * 60 + "\033[0m"


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Startup
    print(_DIVIDER)
    print("\033[1m  Wimmich - Photo/Video Management Server\033[0m")
    print(_DIVIDER)
    info("BOOT", f"Version: {APP_VERSION_FULL}")
    info("BOOT", f"Data directory: {config.DATA_DIR}")
    info("BOOT", f"Server: http://localhost:{config.PORT}")
    print(_DIVIDER)

    # Initialize database
    await init_db()
    success("BOOT", "Database initialized")

    # Check ML availability. torch/dlib are optional installs - never let a
    # missing one prevent server startup, it only changes the log line.
    from services.ml_service import get_ml_status
    ml = get_ml_status()
    if ml["clip_available"]:
        clip_device = "CPU"
        try:
            import torch
            if torch.cuda.is_available():
                clip_device = f"GPU: {torch.cuda.get_device_name(0)}"
        except ImportError:
            pass
        success("BOOT", f"CLIP semantic search available [{clip_device}]")
    else:
        warn("BOOT", "CLIP not available (install torch + transformers for smart search)")
    if ml["face_recognition_available"]:
        face_device = "CPU"
        try:
            import torch
            if torch.cuda.is_available():
                face_device = f"GPU: {torch.cuda.get_device_name(0)}"
        except ImportError:
            pass
        success("BOOT", f"Face recognition available [{face_device}]")
    else:
        warn("BOOT", "Face recognition not available (install facenet-pytorch)")

    # Check FFmpeg
    from utils.video_utils import is_ffmpeg_available
    # off the event loop - this can shell out to a network download
    # (utils/ffmpeg_setup.py) that would otherwise block every single
    # startup (and everyone's requests) for its full timeout on a bad
    # network.
    if await asyncio.to_thread(is_ffmpeg_available):
        success("BOOT", "FFmpeg available (video support enabled)")
    else:
        warn("BOOT", "FFmpeg not found (video thumbnails disabled)")

    # Start background job worker
    await job_worker.start()
    success("BOOT", "Background job worker started")

    # Auto start tunnel if enabled
    if getattr(config, "AUTO_START_TUNNEL", False):
        try:
            from services.tunnel_service import start_tunnel
            await start_tunnel()
            success("BOOT", "Cloudflare Tunnel auto-started successfully")
        except Exception as e:
            error("BOOT", f"Failed to auto-start Cloudflare Tunnel: {e}")

    print(_DIVIDER)
    print(f"\033[1m  Ready! Open http://localhost:{config.PORT}\033[0m")
    print(_DIVIDER)

    yield

    # Shutdown
    await job_worker.stop()
    info("BOOT", "Wimmich shutting down...")


# Create app
app = FastAPI(
    title="Wimmich",
    description="Windows-Based Photo/Video Management Server",
    version=APP_VERSION_FULL,
    lifespan=lifespan,
)

from fastapi.responses import JSONResponse
from services.job_service import JobAlreadyExistsException

@app.exception_handler(JobAlreadyExistsException)
async def job_already_exists_exception_handler(request, exc):
    return JSONResponse(
        status_code=400,
        content={"detail": str(exc)},
    )

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
from routers.auth_router import router as auth_router
from routers.asset_router import router as asset_router
from routers.asset_media_router import router as asset_media_router
from routers.album_router import router as album_router
from routers.search_router import router as search_router
from routers.person_router import router as person_router
from routers.map_router import router as map_router
from routers.share_router import router as share_router
from routers.admin_router import router as admin_router
from routers.admin_users_router import router as admin_users_router
from routers.admin_jobs_router import router as admin_jobs_router
from routers.admin_config_router import router as admin_config_router
from routers.admin_backup_router import router as admin_backup_router
from routers.tunnel_router import router as tunnel_router
from routers.import_router import router as import_router

app.include_router(auth_router)
# asset_media_router must be registered before asset_router: it has literal
# paths like /download-zip, and asset_router's GET /{asset_id} catch-all
# would otherwise swallow them (Starlette matches routes in registration
# order, and /{asset_id} matches literally any single path segment).
app.include_router(asset_media_router)
app.include_router(asset_router)
app.include_router(album_router)
app.include_router(search_router)
app.include_router(person_router)
app.include_router(map_router)
app.include_router(share_router)
app.include_router(admin_router)
app.include_router(admin_users_router)
app.include_router(admin_jobs_router)
app.include_router(admin_config_router)
app.include_router(admin_backup_router)
app.include_router(tunnel_router)
app.include_router(import_router)

# Static files - "Cache-Control: no-cache" forces every request (browser
# *and* any CDN edge cache in front of it, e.g. the Cloudflare Tunnel) to
# revalidate with the server instead of serving a stale cached copy after
# a deploy. Doesn't cost real bandwidth: revalidation is a 304 when the
# file's ETag/Last-Modified hasn't changed, a real fetch only when it has.
# The app's own ?v=<git-hash> query-string busting should already force a
# fresh URL per deploy, but a cache that ignores query strings (some CDN
# configs do) would otherwise keep serving what it fetched before.
class NoCacheStaticFiles(StaticFiles):
    async def get_response(self, path, scope):
        response = await super().get_response(path, scope)
        response.headers["Cache-Control"] = "no-cache"
        return response


static_dir = Path(__file__).parent / "static"
if static_dir.exists():
    app.mount("/static", NoCacheStaticFiles(directory=str(static_dir)), name="static")


# Serve SPA
@app.get("/")
async def serve_index():
    index_path = static_dir / "index.html"
    if index_path.exists():
        return render_spa(index_path)
    return {"message": "Wimmich API is running. Frontend not found."}


@app.get("/shared/{key}")
async def serve_shared_page(key: str):
    """Serve SPA for shared links."""
    index_path = static_dir / "index.html"
    if index_path.exists():
        return render_spa(index_path)
    return {"message": "Shared page"}


# Health check
@app.get("/api/health")
async def health():
    return {"status": "ok", **get_version_info()}


if __name__ == "__main__":
    import errno
    import socket
    import sys
    import uvicorn

    # Checked up front, before handing off to uvicorn - confirmed directly
    # that uvicorn.run() swallows a bind failure internally (its own
    # logger prints "ERROR: [Errno 10048] ...", already after the lifespan
    # above has run to completion) and returns normally instead of raising,
    # so wrapping uvicorn.run() itself in try/except never catches this.
    # A quick bind-and-release here is the only reliable way to surface a
    # clear message before the user's real error is buried in uvicorn's own
    # (differently-worded, OS-locale-dependent) log line.
    try:
        probe = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        probe.bind((config.HOST, config.PORT))
        probe.close()
    except OSError as e:
        if e.errno == errno.EADDRINUSE:
            error("BOOT", f"Port {config.PORT} is already in use by another program.")
            error("BOOT", "Change WIMMICH_PORT in .env to a different port, or stop whatever else is using it.")
        else:
            error("BOOT", f"Cannot start the server on {config.HOST}:{config.PORT}: {e}")
        sys.exit(1)

    uvicorn.run(
        "main:app",
        host=config.HOST,
        port=config.PORT,
        reload=False,
        log_level="info",
    )
