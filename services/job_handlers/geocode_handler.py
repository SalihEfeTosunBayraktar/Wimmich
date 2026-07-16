"""GEOCODE job handler - backfill city/country for assets that already have
GPS coordinates but no city/country (e.g. uploaded before geocoding existed)."""
import asyncio
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from models import Asset, Job
from services.job_core import check_job_cancelled
from utils.geocoding_utils import lookup_city_country


async def handle_job_geocode(db: AsyncSession, job: Job):
    """Backfill city/country for assets with GPS coordinates but no city set."""
    data = job.data or {}
    asset_id = data.get("asset_id")

    if asset_id:
        assets_query = select(Asset).where(Asset.id == asset_id)
    else:
        assets_query = select(Asset).where(
            and_(
                Asset.latitude.isnot(None),
                Asset.longitude.isnot(None),
                Asset.city.is_(None),
                Asset.is_trashed == False,
            )
        )

    result = await db.execute(assets_query)
    assets = list(result.scalars().all())

    total = len(assets)
    for i, asset in enumerate(assets):
        await check_job_cancelled(db, job.id)
        city, country = await asyncio.to_thread(lookup_city_country, asset.latitude, asset.longitude)
        if city:
            asset.city = city
        if country:
            asset.country = country

        job.progress = int((i + 1) / total * 100) if total > 0 else 100
        await db.commit()
