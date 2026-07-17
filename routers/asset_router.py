"""Asset Router - Upload, Timeline, CRUD, Favorites, Archive, Trash (thin routes)."""
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, UploadFile, File, Form, Query, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import User
from auth import get_current_user
from services import asset_query_service, asset_mutation_service, duplicate_service, gallery_service, similar_service
from services import category_correction_service

router = APIRouter(prefix="/api/assets", tags=["assets"])

class AssetUpdateRequest(BaseModel):
    is_favorite: Optional[bool] = None
    is_archived: Optional[bool] = None
    taken_at: Optional[datetime] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    city: Optional[str] = None
    country: Optional[str] = None

class BulkActionRequest(BaseModel):
    asset_ids: List[str]
    action: str  # delete, favorite, unfavorite, archive, unarchive, restore, delete_permanent

class CategoryCorrectionRequest(BaseModel):
    category: str

class VisualIgnoreRequest(BaseModel):
    asset_ids: List[str]

@router.post("/upload")
async def upload_assets(
    files: List[UploadFile] = File(...),
    last_modified: Optional[List[str]] = Form(None),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload one or more files.

    `last_modified` (browser File API lastModified, ms since epoch) is used as
    a taken_at fallback when a file has no EXIF/embedded date - aligned by
    index with `files`.
    """
    return await asset_mutation_service.upload_files(db, user, files, last_modified)

@router.get("/timeline")
async def get_timeline(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    file_type: Optional[str] = None,
    favorites_only: bool = False,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get assets in chronological order grouped by date."""
    return await asset_query_service.get_timeline_data(
        db, user, page, per_page, file_type, favorites_only
    )

@router.get("/statistics")
async def get_statistics(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get user's asset statistics."""
    return await asset_query_service.get_statistics_data(db, user)

@router.get("/duplicates")
async def get_duplicates(
    sort_by: str = Query("date_desc"),
    file_type: Optional[str] = None,
    location: Optional[str] = None,
    mode: str = Query("exact"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get duplicate asset groups for the current user.

    mode=exact (default): byte-identical files, matched by checksum.
    mode=visual: near-duplicates matched by CLIP embedding similarity -
    catches the same photo re-saved through a different app (which
    re-compresses it, changing every byte) that checksum matching misses.
    """
    if mode == "visual":
        return await duplicate_service.get_visual_duplicate_groups(
            db, user, sort_by, file_type, location
        )
    return await duplicate_service.get_duplicate_groups(
        db, user, sort_by, file_type, location
    )

@router.post("/duplicates/scan")
async def scan_duplicates(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Kick off a background job to calculate checksums for assets missing
    one - runs as a tracked job (not synchronously) so the UI can show
    progress on large libraries instead of one opaque blocking request."""
    from services.job_service import create_job, JobAlreadyExistsException
    try:
        job = await create_job(db, "DUPCHECK", {"user_id": user.id})
    except JobAlreadyExistsException as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"message": "Kopya taraması başlatıldı", "job_id": job.id}

@router.post("/duplicates/{checksum}/ignore")
async def ignore_duplicate_group(
    checksum: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Skip a duplicate group - hides it from future listings, deletes nothing."""
    return await duplicate_service.ignore_duplicate_group(db, user, checksum)

@router.delete("/duplicates/{checksum}/ignore")
async def unignore_duplicate_group(
    checksum: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Undo a skip so the group shows up again."""
    return await duplicate_service.unignore_duplicate_group(db, user, checksum)

@router.post("/duplicates/visual/ignore")
async def ignore_visual_duplicate_group(
    body: VisualIgnoreRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Dismiss a visual-duplicate group - unlike the checksum-based skip
    above, this is per-asset since a cluster's membership (and any
    group-level hash) can shift as new photos are added."""
    return await duplicate_service.ignore_visual_duplicate_group(db, user, body.asset_ids)

@router.get("/{asset_id}/similar")
async def get_similar_assets(
    asset_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Visually similar assets to this one (CLIP embedding similarity) -
    purely for browsing related photos, not a duplicate/cleanup suggestion."""
    return await similar_service.get_similar_assets(db, user, asset_id)

@router.get("/trash")
async def get_trash(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get trashed assets."""
    return {"assets": await asset_query_service.get_trash_assets(db, user)}

@router.get("/favorites")
async def get_favorites(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get favorite assets."""
    return {"assets": await asset_query_service.get_favorite_assets(db, user)}

@router.get("/archived")
async def get_archived(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get archived assets."""
    return {"assets": await asset_query_service.get_archived_assets(db, user)}

@router.get("/gallery")
async def get_gallery(
    page: int = Query(1, ge=1),
    per_page: int = Query(60, ge=1, le=200),
    sort_by: str = Query("date_desc"),
    group_by: str = Query("none"),
    filter_by: str = Query("all"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all assets with configurable sort/filter/grouping (vs. the fixed Timeline)."""
    return await gallery_service.get_gallery_data(
        db, user, page, per_page, sort_by, group_by, filter_by
    )

@router.get("/gallery/month")
async def get_gallery_month(
    year: int = Query(..., ge=1),
    month: int = Query(..., ge=1, le=12),
    sort_by: str = Query("date_desc"),
    filter_by: str = Query("all"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Every asset in one month - the "By Month" grid's "+N" drilldown."""
    return await gallery_service.get_month_assets(db, user, sort_by, filter_by, year, month)

@router.get("/gallery/year")
async def get_gallery_year(
    year: int = Query(..., ge=1),
    sort_by: str = Query("date_desc"),
    filter_by: str = Query("all"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Every asset in one year - the "By Year" grid's "+N" drilldown."""
    return await gallery_service.get_year_assets(db, user, sort_by, filter_by, year)

@router.get("/smart-categories")
async def get_smart_categories(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Photo counts per auto-detected content category (screenshot/document/nature/pet)."""
    return await gallery_service.get_smart_category_counts(db, user)

@router.post("/{asset_id}/category-correction")
async def correct_category(
    asset_id: str,
    body: CategoryCorrectionRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark a photo as not belonging to its auto-detected smart category.
    Removes it from that category immediately and uses its embedding as a
    negative example so similar photos get corrected too."""
    if body.category not in gallery_service.SMART_CATEGORIES:
        raise HTTPException(status_code=400, detail="Geçersiz kategori")

    asset = await asset_query_service.get_asset_or_404(db, asset_id, user.id)
    reclassified = await category_correction_service.record_category_correction(
        db, user.id, asset, body.category
    )
    return {"message": "Kategori düzeltildi", "also_reclassified": reclassified}

@router.get("/{asset_id}")
async def get_asset(
    asset_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get single asset details."""
    return await asset_query_service.get_asset_detail(db, asset_id, user)

@router.put("/{asset_id}")
async def update_asset(
    asset_id: str,
    req: AssetUpdateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update asset metadata."""
    return await asset_mutation_service.update_asset(
        db, asset_id, user, req.is_favorite, req.is_archived,
        taken_at=req.taken_at, latitude=req.latitude, longitude=req.longitude,
        city=req.city, country=req.country,
    )

@router.put("/{asset_id}/favorite")
async def toggle_favorite(
    asset_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Toggle favorite status."""
    return await asset_mutation_service.toggle_favorite(db, asset_id, user)

@router.put("/{asset_id}/archive")
async def toggle_archive(
    asset_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Toggle archive status."""
    return await asset_mutation_service.toggle_archive(db, asset_id, user)

@router.delete("/{asset_id}")
async def trash_asset(
    asset_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Move asset to trash."""
    return await asset_mutation_service.trash_asset(db, asset_id, user)

@router.post("/{asset_id}/restore")
async def restore_asset(
    asset_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Restore asset from trash."""
    return await asset_mutation_service.restore_asset(db, asset_id, user)

@router.delete("/{asset_id}/permanent")
async def delete_permanently(
    asset_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Permanently delete asset and files."""
    return await asset_mutation_service.delete_permanently(db, asset_id, user)

@router.post("/bulk")
async def bulk_action(
    req: BulkActionRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Perform bulk actions on multiple assets."""
    return await asset_mutation_service.bulk_action(db, req.asset_ids, req.action, user)
