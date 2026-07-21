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

            # No per-asset CLIP/FACE/etc. jobs here. The browser uploads one
            # file per request, so creating follow-up jobs per file meant a
            # 200-photo upload spawned ~600 job rows. Instead the client
            # calls process-pending ONCE after the whole upload batch (see
            # queue_pending_processing below), which queues one bulk job per
            # needed type - the same shape as the import/scan handlers.

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


async def queue_pending_processing(db: AsyncSession, user: User) -> dict:
    """Queue one bulk follow-up job per type that still has unprocessed work
    for this user - called once by the client after an upload batch finishes,
    instead of a job per uploaded file. Each handler runs in "process
    everything still missing" mode (no asset_id) and skips what's already
    done, so a single bulk job covers every file the batch just added.

    Only queues a type that actually has pending work, so an all-images
    upload doesn't spawn an empty TRANSCODE job, etc. Safe against
    double-queuing via create_job's own dedup (JobAlreadyExistsException).
    """
    async def _has(*conditions) -> bool:
        row = (await db.execute(
            select(Asset.id).where(and_(Asset.user_id == user.id, Asset.is_trashed == False, *conditions)).limit(1)
        )).first()
        return row is not None

    queued = []

    # New images (no CLIP embedding yet) also need face detection - tie the
    # two together rather than trying to detect "face-pending" separately (a
    # scanned-but-faceless image has no Face row, so there's no clean flag).
    if await _has(Asset.file_type == "IMAGE", Asset.clip_embedding_path.is_(None)):
        for job_type, jdata in (("CLIP", {}), ("FACE", {"user_id": user.id})):
            try:
                await create_job(db, job_type, jdata)
                queued.append(job_type)
            except JobAlreadyExistsException:
                pass

    if await _has(Asset.file_type == "VIDEO", Asset.encoded_video_path.is_(None)):
        try:
            await create_job(db, "TRANSCODE", {})
            queued.append("TRANSCODE")
        except JobAlreadyExistsException:
            pass

    if await _has(Asset.latitude.isnot(None), Asset.city.is_(None)):
        try:
            await create_job(db, "GEOCODE", {})
            queued.append("GEOCODE")
        except JobAlreadyExistsException:
            pass

    return {"queued": queued}


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
