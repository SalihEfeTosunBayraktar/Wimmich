"""Map Router - Geo-tagged photos on map"""
from fastapi import APIRouter, Depends
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import User, Asset
from auth import get_current_user

router = APIRouter(prefix="/api/map", tags=["map"])


@router.get("/markers")
async def get_map_markers(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all geo-tagged assets for map display."""
    stmt = (
        select(Asset)
        .where(
            and_(
                Asset.user_id == user.id,
                Asset.is_trashed == False,
                Asset.latitude.isnot(None),
                Asset.longitude.isnot(None),
            )
        )
    )
    result = await db.execute(stmt)
    assets = list(result.scalars().all())

    markers = []
    for asset in assets:
        markers.append({
            "id": asset.id,
            "lat": asset.latitude,
            "lng": asset.longitude,
            "thumb": f"/api/assets/{asset.id}/thumbnail?size=small",
            "file_name": asset.original_file_name,
            "file_type": asset.file_type,
            "taken_at": asset.taken_at.isoformat() if asset.taken_at else None,
            "city": asset.city,
            "country": asset.country,
        })

    return {"markers": markers, "total": len(markers)}


@router.get("/cluster")
async def get_map_clusters(
    zoom: int = 10,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get clustered markers for map display at given zoom level."""
    stmt = (
        select(Asset)
        .where(
            and_(
                Asset.user_id == user.id,
                Asset.is_trashed == False,
                Asset.latitude.isnot(None),
                Asset.longitude.isnot(None),
            )
        )
    )
    result = await db.execute(stmt)
    assets = list(result.scalars().all())

    # Simple grid-based clustering
    grid_size = 360 / (2 ** zoom)  # Approximate
    clusters = {}

    for asset in assets:
        # Round to grid cell
        grid_lat = round(asset.latitude / grid_size) * grid_size
        grid_lng = round(asset.longitude / grid_size) * grid_size
        key = f"{grid_lat:.4f},{grid_lng:.4f}"

        if key not in clusters:
            clusters[key] = {
                "lat": grid_lat,
                "lng": grid_lng,
                "count": 0,
                "preview_id": asset.id,
                "assets": [],
            }
        clusters[key]["count"] += 1
        if len(clusters[key]["assets"]) < 4:
            clusters[key]["assets"].append({
                "id": asset.id,
                "thumb": f"/api/assets/{asset.id}/thumbnail?size=small",
            })

    return {"clusters": list(clusters.values()), "total_assets": len(assets)}
