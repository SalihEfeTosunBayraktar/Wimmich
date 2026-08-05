"""Asset mutations: upload, metadata updates, favorite/archive/trash, bulk actions."""
import asyncio
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import HTTPException
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

import config
from models import Asset, User
from services.media_service import process_upload, delete_asset_files, UploadIntegrityError
from services.job_service import create_job, JobAlreadyExistsException
from services.quota_service import check_all_quotas
from services.asset_query_service import get_asset_or_404
from utils.serializers import asset_to_dict
from utils.sql_utils import select_in_chunks


def _parse_client_timestamp(raw: Optional[str]) -> Optional[datetime]:
    """Parse a browser File API lastModified value (milliseconds since epoch)."""
    if not raw:
        return None
    try:
        return datetime.fromtimestamp(int(raw) / 1000, tz=timezone.utc)
    except (ValueError, OSError, OverflowError):
        return None


async def _read_bounded(file) -> Optional[bytes]:
    """Reads a single upload in chunks, bailing out as soon as it passes
    config.MAX_UPLOAD_SIZE instead of calling file.read() (which reads to
    completion before quota_service ever gets a chance to reject it). A
    single oversized file previously got fully buffered - and, past
    Starlette's ~1MB in-memory SpooledTemporaryFile threshold, fully
    spooled to disk - before its size was checked at all, so an attacker
    could tie up disk/time on arbitrarily large bodies with no real cap.
    Returns None if the file exceeds the limit; caller treats that as this
    file's quota error rather than the more generic one check_all_quotas
    would otherwise produce from a size it never got to see."""
    limit = config.MAX_UPLOAD_SIZE
    chunks = []
    total = 0
    while True:
        chunk = await file.read(1024 * 1024)
        if not chunk:
            break
        total += len(chunk)
        if total > limit:
            return None
        chunks.append(chunk)
    return b"".join(chunks)


async def upload_files(
    db: AsyncSession, user: User, files: List, last_modified: Optional[List[Optional[str]]] = None,
    checksums: Optional[List[Optional[str]]] = None,
) -> dict:
    """Process a batch of uploaded files: quota checks, dedup, storage, ML job queuing."""
    # Enforced here rather than only at the router level so every path into
    # an upload inherits the same rule - originally this lived solely in
    # asset_router.py's /upload handler, which meant share_router.py's
    # upload_to_shared_album() (which attributes visitor uploads to the
    # share owner's account) could let a guest owner's shares accept
    # uploads even though that same account can't upload directly.
    if user.is_guest:
        raise HTTPException(status_code=403, detail="Misafir hesaplar fotoğraf yükleyemez.")

    results = []
    errors = []

    # Batch dedup check using the client-supplied checksums (computed
    # before upload - see api.js's _computeFileChecksum), one query for
    # the whole batch instead of one per file after each is processed.
    # Lets an already-uploaded file (the common case for a repeat backup
    # sync, where most files are re-checked duplicates every run) skip
    # process_upload entirely - not just the duplicate query, but the
    # thumbnail/EXIF work that was previously done first and only THEN
    # discovered to be wasted. Files with no client checksum (older
    # clients, or the check silently unavailable - see
    # _computeFileChecksum's own comment) still get the per-file fallback
    # check below using process_upload's own computed checksum.
    known_checksums = [c for c in (checksums or []) if c]
    existing_by_checksum = {}
    if known_checksums:
        dup_stmt = select(Asset.checksum, Asset.id).where(
            and_(
                Asset.user_id == user.id,
                Asset.checksum.in_(known_checksums),
                Asset.is_trashed == False,
            )
        )
        existing_by_checksum = dict((await db.execute(dup_stmt)).all())

    for i, file in enumerate(files):
        try:
            client_checksum = checksums[i] if checksums and i < len(checksums) else None
            if client_checksum and client_checksum in existing_by_checksum:
                results.append({
                    "file_name": file.filename,
                    "status": "duplicate",
                    "existing_id": existing_by_checksum[client_checksum],
                })
                continue

            file_data = await _read_bounded(file)
            if file_data is None:
                errors.append({
                    "file_name": file.filename,
                    "error": f"Dosya çok büyük (maksimum {config.MAX_UPLOAD_SIZE // (1024 * 1024)} MB)",
                })
                continue
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


async def bulk_update_metadata(
    db: AsyncSession, asset_ids: List[str], user: User,
    taken_at: Optional[datetime] = None,
    latitude: Optional[float] = None, longitude: Optional[float] = None,
    city: Optional[str] = None, country: Optional[str] = None,
) -> dict:
    """Same field set as update_asset, applied to every asset in the batch
    at once - for correcting a whole trip/album's date or location in one
    go instead of one photo at a time (e.g. a camera with the wrong clock,
    or an import that arrived with no GPS on any of them)."""
    # Chunked for the same reason as bulk_action below.
    assets = await select_in_chunks(
        db,
        lambda chunk: select(Asset).where(and_(Asset.id.in_(chunk), Asset.user_id == user.id)),
        asset_ids,
    )
    for asset in assets:
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
    return {"updated": len(assets)}


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
    await asyncio.to_thread(delete_asset_files, asset, delete_reference_source=True)
    await db.delete(asset)
    await db.commit()
    return {"message": "Permanently deleted"}


async def bulk_action(db: AsyncSession, asset_ids: List[str], action: str, user: User) -> dict:
    # Chunked IN() - "select all" over a big library sends every id at
    # once, which exceeds SQLite's bound-parameter ceiling. See
    # utils/sql_utils.py.
    assets = await select_in_chunks(
        db,
        lambda chunk: select(Asset).where(and_(Asset.id.in_(chunk), Asset.user_id == user.id)),
        asset_ids,
    )

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
            # Off the event loop - see delete_permanently's identical
            # wrapping above; a bulk permanent-delete over many assets
            # would otherwise freeze every other request for the whole loop.
            await asyncio.to_thread(delete_asset_files, asset, delete_reference_source=True)
            await db.delete(asset)
        count += 1

    await db.commit()
    return {"message": f"{action} applied to {count} assets", "count": count}
