"""Asset mutations: upload, metadata updates, favorite/archive/trash, bulk actions."""
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from models import Asset, User
from services.media_service import process_upload, delete_asset_files, UploadIntegrityError
from services.job_service import create_job, JobAlreadyExistsException
from services.quota_service import check_all_quotas
from services.asset_query_service import get_asset_or_404
from utils.serializers import asset_to_dict


def _parse_client_timestamp(raw: Optional[str]) -> Optional[datetime]:
    """Parse a browser File API lastModified value (milliseconds since epoch)."""
    if not raw:
        return None
    try:
        return datetime.fromtimestamp(int(raw) / 1000, tz=timezone.utc)
    except (ValueError, OSError, OverflowError):
        return None


async def upload_files(
    db: AsyncSession, user: User, files: List, last_modified: Optional[List[Optional[str]]] = None,
    checksums: Optional[List[Optional[str]]] = None,
) -> dict:
    """Process a batch of uploaded files: quota checks, dedup, storage, ML job queuing."""
    results = []
    errors = []

    for i, file in enumerate(files):
        try:
            file_data = await file.read()
            incoming_size = len(file_data)

            quota_error = await check_all_quotas(db, user, incoming_size)
            if quota_error:
                errors.append({"file_name": file.filename, "error": quota_error})
                continue

            fallback_taken_at = _parse_client_timestamp(
                last_modified[i] if last_modified and i < len(last_modified) else None
            )
            expected_checksum = checksums[i] if checksums and i < len(checksums) else None
            attrs = await process_upload(file_data, file.filename, user.id, fallback_taken_at, expected_checksum=expected_checksum)

            if attrs.get("checksum"):
                dup_result = await db.execute(
                    select(Asset).where(
                        and_(
                            Asset.user_id == user.id,
                            Asset.checksum == attrs["checksum"],
                            Asset.is_trashed == False,
                        )
                    )
                )
                existing = dup_result.scalar_one_or_none()
                if existing:
                    results.append({
                        "file_name": file.filename,
                        "status": "duplicate",
                        "existing_id": existing.id,
                    })
                    continue

            asset = Asset(user_id=user.id, **attrs)
            db.add(asset)
            await db.flush()

            jobs_to_queue = [
                ("CLIP", {"asset_id": asset.id}),
                ("FACE", {"asset_id": asset.id, "user_id": user.id}),
            ]
            if asset.file_type == "VIDEO":
                jobs_to_queue.append(("TRANSCODE", {"asset_id": asset.id}))
            # EXIF GPS but no resolved city yet - see import_handler.py's
            # identical comment.
            if asset.latitude is not None and asset.longitude is not None:
                jobs_to_queue.append(("GEOCODE", {"asset_id": asset.id}))

            for job_type, job_data in jobs_to_queue:
                try:
                    await create_job(db, job_type, job_data)
                except JobAlreadyExistsException:
                    pass

            results.append({
                "file_name": file.filename,
                "status": "uploaded",
                "asset": asset_to_dict(asset),
            })

        except UploadIntegrityError as e:
            # Distinct from the generic branch below so the client can tell
            # "transfer looked incomplete/corrupted, safe to just retry this
            # one file" apart from a permanent rejection (bad format, quota).
            errors.append({"file_name": file.filename, "error": str(e), "retryable": True})
        except Exception as e:
            errors.append({"file_name": file.filename, "error": str(e)})

    return {"results": results, "errors": errors}


async def update_asset(
    db: AsyncSession, asset_id: str, user: User,
    is_favorite: Optional[bool], is_archived: Optional[bool],
    taken_at: Optional[datetime] = None,
    latitude: Optional[float] = None, longitude: Optional[float] = None,
    city: Optional[str] = None, country: Optional[str] = None,
) -> dict:
    """Update asset metadata, including manual EXIF corrections (taken_at,
    location) for photos where the camera got it wrong or left it out."""
    asset = await get_asset_or_404(db, asset_id, user.id)
    if is_favorite is not None:
        asset.is_favorite = is_favorite
    if is_archived is not None:
        asset.is_archived = is_archived
    if taken_at is not None:
        asset.taken_at = taken_at
    if latitude is not None:
        asset.latitude = latitude
    if longitude is not None:
        asset.longitude = longitude
    if city is not None:
        asset.city = city
    if country is not None:
        asset.country = country
    await db.commit()
    return asset_to_dict(asset)


async def toggle_favorite(db: AsyncSession, asset_id: str, user: User) -> dict:
    asset = await get_asset_or_404(db, asset_id, user.id)
    asset.is_favorite = not asset.is_favorite
    await db.commit()
    return {"is_favorite": asset.is_favorite}


async def toggle_archive(db: AsyncSession, asset_id: str, user: User) -> dict:
    asset = await get_asset_or_404(db, asset_id, user.id)
    asset.is_archived = not asset.is_archived
    await db.commit()
    return {"is_archived": asset.is_archived}


async def regenerate_thumbnail(db: AsyncSession, asset_id: str, user: User) -> dict:
    """Force-regenerate one asset's thumbnails - a THUMBNAIL job with a
    specific asset_id bypasses the handler's normal "only what's missing"
    bulk filter (see thumbnail_handler.py), so this works even when the
    existing thumbnail looks fine but is actually stale/wrong."""
    asset = await get_asset_or_404(db, asset_id, user.id)
    try:
        await create_job(db, "THUMBNAIL", {"asset_id": asset.id})
    except JobAlreadyExistsException:
        pass
    return {"message": "Küçük resim yeniden oluşturuluyor"}


async def retranscode_video(db: AsyncSession, asset_id: str, user: User) -> dict:
    """Force-retranscode one video asset, same asset_id bypass as
    regenerate_thumbnail above (see transcode_handler.py)."""
    from fastapi import HTTPException

    asset = await get_asset_or_404(db, asset_id, user.id)
    if asset.file_type != "VIDEO":
        raise HTTPException(status_code=400, detail="Bu işlem yalnızca videolar için geçerli")
    try:
        await create_job(db, "TRANSCODE", {"asset_id": asset.id})
    except JobAlreadyExistsException:
        pass
    return {"message": "Video yeniden dönüştürülüyor"}


async def trash_asset(db: AsyncSession, asset_id: str, user: User) -> dict:
    asset = await get_asset_or_404(db, asset_id, user.id)
    asset.is_trashed = True
    asset.trashed_at = datetime.now(timezone.utc)
    await db.commit()
    return {"message": "Moved to trash"}


async def restore_asset(db: AsyncSession, asset_id: str, user: User) -> dict:
    asset = await get_asset_or_404(db, asset_id, user.id)
    asset.is_trashed = False
    asset.trashed_at = None
    await db.commit()
    return {"message": "Restored from trash"}


async def delete_permanently(db: AsyncSession, asset_id: str, user: User) -> dict:
    asset = await get_asset_or_404(db, asset_id, user.id)
    delete_asset_files(asset, delete_reference_source=True)
    await db.delete(asset)
    await db.commit()
    return {"message": "Permanently deleted"}


async def bulk_action(db: AsyncSession, asset_ids: List[str], action: str, user: User) -> dict:
    result = await db.execute(
        select(Asset).where(and_(Asset.id.in_(asset_ids), Asset.user_id == user.id))
    )
    assets = list(result.scalars().all())

    count = 0
    for asset in assets:
        if action == "delete":
            asset.is_trashed = True
            asset.trashed_at = datetime.now(timezone.utc)
        elif action == "favorite":
            asset.is_favorite = True
        elif action == "unfavorite":
            asset.is_favorite = False
        elif action == "archive":
            asset.is_archived = True
        elif action == "unarchive":
            asset.is_archived = False
        elif action == "restore":
            asset.is_trashed = False
            asset.trashed_at = None
        elif action == "delete_permanent":
            delete_asset_files(asset, delete_reference_source=True)
            await db.delete(asset)
        count += 1

    await db.commit()
    return {"message": f"{action} applied to {count} assets", "count": count}
