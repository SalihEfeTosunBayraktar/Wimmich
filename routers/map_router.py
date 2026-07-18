"""Map Router - Geo-tagged photos on map"""
from fastapi import APIRouter, Depends
from sqlalchemy import select, and_, func
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


@router.get("/cities")
async def get_city_stats(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Photo counts grouped by city, for the map page's visit ranking.

    Grouped by city name (not a lat/lng bucket) since it's already
    reverse-geocoded text - more meaningful as "which city" than a raw
    coordinate grid cell. Country is grouped alongside it to keep
    same-named cities in different countries from being merged together.
    """
    stmt = (
        select(Asset.city, Asset.country, func.count(Asset.id).label("count"))
        .where(
            and_(
                Asset.user_id == user.id,
                Asset.is_trashed == False,
                Asset.city.isnot(None),
            )
        )
        .group_by(Asset.city, Asset.country)
        .order_by(func.count(Asset.id).desc())
    )
    rows = (await db.execute(stmt)).all()

    # Assets with coordinates but no resolved city yet (geocoding pending -
    # see geocode_handler.py) - excluded from the ranking itself rather than
    # dumped into a meaningless "Unknown" bucket, but surfaced here so the
    # UI can point at running Tag Locations instead of silently omitting them.
    unresolved = (await db.execute(
        select(func.count(Asset.id)).where(
            and_(
                Asset.user_id == user.id,
                Asset.is_trashed == False,
                Asset.latitude.isnot(None),
                Asset.city.is_(None),
            )
        )
    )).scalar()

    return {
        "cities": [{"city": c, "country": co, "count": n} for c, co, n in rows],
        "unresolved_count": unresolved,
    }


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
