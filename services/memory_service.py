"""Memory Service - 'On This Day' memories"""
from datetime import datetime, timedelta, timezone
from typing import List, Dict
from sqlalchemy import select, and_, func, extract
from sqlalchemy.ext.asyncio import AsyncSession

from models import Asset


async def get_memories(
    db: AsyncSession,
    user_id: str,
    limit_per_year: int = 10,
) -> List[Dict]:
    """
    Get 'On This Day' memories - photos from the same day in previous years.
    Returns a list of memory groups: [{year, years_ago, assets: [...]}]
    """
    now = datetime.now(timezone.utc)
    current_month = now.month
    current_day = now.day
    current_year = now.year

    memories = []

    # Check each previous year
    for years_ago in range(1, 20):
        target_year = current_year - years_ago

        # Query assets from this date in target_year
        stmt = (
            select(Asset)
            .where(
                and_(
                    Asset.user_id == user_id,
                    Asset.is_trashed == False,
                    extract("year", func.coalesce(Asset.taken_at, Asset.created_at)) == target_year,
                    extract("month", func.coalesce(Asset.taken_at, Asset.created_at)) == current_month,
                    extract("day", func.coalesce(Asset.taken_at, Asset.created_at)) == current_day,
                )
            )
            .order_by(func.coalesce(Asset.taken_at, Asset.created_at))
            .limit(limit_per_year)
        )

        result = await db.execute(stmt)
        assets = list(result.scalars().all())

        if assets:
            memories.append({
                "year": target_year,
                "years_ago": years_ago,
                "title": f"{years_ago} yıl önce" if years_ago > 1 else "1 yıl önce",
                "date": f"{current_day:02d}.{current_month:02d}.{target_year}",
                "asset_count": len(assets),
                "assets": assets,
            })

    return memories
