"""EXPORT job handler - zips one user's own non-trashed original files
plus a JSON metadata manifest (GDPR-style "download my data")."""
import asyncio
import json
import zipfile
from datetime import datetime
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

import config
from models import Asset, AlbumAsset, Album, AssetTag, Tag, Job
from services.backup_service import add_file_to_archive
from services.job_core import check_job_cancelled
from utils.path_utils import resolve_data_path
from utils.log import success


async def handle_job_export(db: AsyncSession, job: Job):
    user_id = job.data.get("user_id")
    if not user_id:
        raise RuntimeError("Dışa aktarma isteğinde user_id eksik.")

    conditions = [Asset.user_id == user_id, Asset.is_trashed == False]
    result = await db.execute(select(Asset).where(and_(*conditions)))
    assets = list(result.scalars().all())

    # Album memberships and tags are looked up once for the whole user
    # rather than per-asset, to keep this a couple of queries instead of
    # 2 x len(assets) - same reasoning as backup_handler's incremental scan.
    album_rows = (await db.execute(
        select(AlbumAsset.asset_id, Album.name)
        .join(Album, Album.id == AlbumAsset.album_id)
        .where(Album.user_id == user_id)
    )).all()
    albums_by_asset = {}
    for asset_id, album_name in album_rows:
        albums_by_asset.setdefault(asset_id, []).append(album_name)

    tag_rows = (await db.execute(
        select(AssetTag.asset_id, Tag.name)
        .join(Tag, Tag.id == AssetTag.tag_id)
        .where(Tag.user_id == user_id)
    )).all()
    tags_by_asset = {}
    for asset_id, tag_name in tag_rows:
        tags_by_asset.setdefault(asset_id, []).append(tag_name)

    config.EXPORT_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    archive_path = config.EXPORT_DIR / f"export_{user_id}_{timestamp}.zip"

    manifest = []
    total = len(assets) or 1
    zf = zipfile.ZipFile(archive_path, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6)
    try:
        for i, asset in enumerate(assets):
            await check_job_cancelled(db, job.id)
            resolved_path = resolve_data_path(asset.file_path, config.UPLOAD_DIR)
            included = bool(resolved_path and resolved_path.exists())
            if included:
                arcname = f"files/{asset.id}_{asset.original_file_name}"
                # Off the event loop - zf.write() reads the full original
                # file (possibly a multi-GB video) and DEFLATE-compresses
                # it synchronously; unwrapped, this blocked every other
                # request on the server for however long that took, once
                # per asset in the export. backup_handler.py already does
                # this same wrapping for the identical operation.
                await asyncio.to_thread(add_file_to_archive, zf, str(resolved_path), arcname)
            manifest.append({
                "id": asset.id,
                "file_name": asset.original_file_name,
                "included_in_archive": f"files/{asset.id}_{asset.original_file_name}" if included else None,
                "taken_at": asset.taken_at.isoformat() if asset.taken_at else None,
                "created_at": asset.created_at.isoformat() if asset.created_at else None,
                "latitude": asset.latitude,
                "longitude": asset.longitude,
                "city": asset.city,
                "country": asset.country,
                "is_favorite": asset.is_favorite,
                "is_archived": asset.is_archived,
                "tags": tags_by_asset.get(asset.id, []),
                "albums": albums_by_asset.get(asset.id, []),
            })
            job.progress = int((i + 1) / total * 95)
            await db.commit()
            db.expunge(asset)

        zf.writestr("manifest.json", json.dumps({
            "exported_at": datetime.now().isoformat(),
            "asset_count": len(assets),
            "assets": manifest,
        }, ensure_ascii=False, indent=2))
    finally:
        zf.close()

    job.result_json = json.dumps({"archive_path": str(archive_path)})
    job.progress = 100
    await db.commit()
    success("JOB", f"Export completed for user {user_id}: {len(assets)} asset(s) -> {archive_path}")
