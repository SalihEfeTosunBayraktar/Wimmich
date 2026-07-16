"""
Wimmich - Windows-Based Photo/Video Management Server
A self-hosted alternative to Immich, running natively on Windows.
"""
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


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Startup
    print("=" * 60)
    print("  Wimmich - Photo/Video Management Server")
    print("=" * 60)
    print(f"  Version: {APP_VERSION_FULL}")
    print(f"  Data directory: {config.DATA_DIR}")
    print(f"  Server: http://localhost:{config.PORT}")
    print("=" * 60)

    # Initialize database
    await init_db()
    print("  Database initialized")

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
        print(f"  CLIP semantic search available [{clip_device}]")
    else:
        print("  CLIP not available (install torch + transformers for smart search)")
    if ml["face_recognition_available"]:
        face_device = "CPU"
        try:
            import torch
            if torch.cuda.is_available():
                face_device = f"GPU: {torch.cuda.get_device_name(0)}"
        except ImportError:
            pass
        print(f"  Face recognition available [{face_device}]")
    else:
        print("  Face recognition not available (install facenet-pytorch)")

    # Check FFmpeg
    from utils.video_utils import is_ffmpeg_available
    if is_ffmpeg_available():
        print("  FFmpeg available (video support enabled)")
    else:
        print("  FFmpeg not found (video thumbnails disabled)")

    # Start background job worker
    await job_worker.start()
    print("  Background job worker started")

    # Auto start tunnel if enabled
    if getattr(config, "AUTO_START_TUNNEL", False):
        try:
            from services.tunnel_service import start_tunnel
            await start_tunnel()
            print("  Cloudflare Tunnel auto-started successfully")
        except Exception as e:
            print(f"  Failed to auto-start Cloudflare Tunnel: {e}")

    print("=" * 60)
    print(f"  Ready! Open http://localhost:{config.PORT}")
    print("=" * 60)

    yield

    # Shutdown
    await job_worker.stop()
    print("  Wimmich shutting down...")


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
    import uvicorn
    uvicorn.run(
        "main:app",
        host=config.HOST,
        port=config.PORT,
        reload=False,
        log_level="info",
    )
