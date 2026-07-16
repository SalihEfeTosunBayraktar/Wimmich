"""Gallery view: sortable/filterable/groupable "all photos" browsing (vs the
fixed-chronological Timeline). Reuses the same {groups:[{display_date, assets}]}
response shape as get_timeline_data so the frontend can share rendering code.
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession

import config
from models import Asset, AlbumAsset, User
from utils.serializers import asset_to_dict

SORT_COLUMNS = {
    "date_desc": func.coalesce(Asset.taken_at, Asset.created_at).desc(),
    "date_asc": func.coalesce(Asset.taken_at, Asset.created_at).asc(),
    "name_asc": Asset.original_file_name.asc(),
    "name_desc": Asset.original_file_name.desc(),
    "size_desc": Asset.file_size.desc(),
    "size_asc": Asset.file_size.asc(),
}


SMART_CATEGORIES = ("screenshot", "document", "nature", "pet", "food", "car", "technology")


def _apply_filter(conditions: list, filter_by: str) -> None:
    if filter_by == "no_album":
        conditions.append(~Asset.id.in_(select(AlbumAsset.asset_id)))
    elif filter_by == "image":
        conditions.append(Asset.file_type == "IMAGE")
    elif filter_by == "video":
        conditions.append(Asset.file_type == "VIDEO")
    elif filter_by == "favorite":
        conditions.append(Asset.is_favorite == True)
    elif filter_by == "not_archived":
        conditions.append(Asset.is_archived == False)
    elif filter_by == "archived":
        conditions.append(Asset.is_archived == True)
    elif filter_by.startswith("category_"):
        category = filter_by[len("category_"):]
        if category in SMART_CATEGORIES:
            conditions.append(Asset.smart_category == category)
    # "all" (default): no extra condition - includes archived, unlike Timeline


def _group_by_day(assets: list) -> list:
    groups = {}
    for asset in assets:
        dt = asset.taken_at or asset.created_at
        key = dt.strftime("%Y-%m-%d")
        if key not in groups:
            month_name = config.LOCALE_MONTH_NAMES.get(dt.month, "")
            groups[key] = {"display_date": f"{dt.day} {month_name} {dt.year}", "assets": []}
        groups[key]["assets"].append(asset_to_dict(asset))
    return list(groups.values())


def _group_by_year(assets: list) -> list:
    groups = {}
    for asset in assets:
        dt = asset.taken_at or asset.created_at
        key = str(dt.year)
        if key not in groups:
            groups[key] = {"display_date": key, "assets": []}
        groups[key]["assets"].append(asset_to_dict(asset))
    return list(groups.values())


def _group_by_type(assets: list) -> list:
    buckets = {"IMAGE": {"display_date": "📷 Fotoğraflar", "assets": []},
               "VIDEO": {"display_date": "🎬 Videolar", "assets": []}}
    for asset in assets:
        buckets[asset.file_type]["assets"].append(asset_to_dict(asset))
    return [b for b in buckets.values() if b["assets"]]


async def _get_year_month_grid(
    db: AsyncSession,
    user: User,
    sort_by: str,
    filter_by: str,
    year_page: int,
) -> dict:
    """"Aya Göre" is a full calendar-year frame (3 rows of 4 months) per
    Apple Photos' Years-tab-but-for-months look, not a flat list of month
    sections - one full year has to be known at once to lay out all 12
    slots (including empty ones), so this paginates by YEAR instead of by
    asset count."""
    conditions = [Asset.user_id == user.id, Asset.is_trashed == False]
    _apply_filter(conditions, filter_by)

    # Only the list of years that actually have photos is needed up front -
    # every asset in the library doesn't need to be loaded (as full ORM
    # rows, sorted, no less) just to read one field off each and throw the
    # rest away. SQLite's strftime does the year extraction in the query.
    date_expr = func.coalesce(Asset.taken_at, Asset.created_at)
    years_result = await db.execute(
        select(func.strftime("%Y", date_expr)).where(and_(*conditions)).distinct()
    )
    years_present = sorted({int(y) for (y,) in years_result.all() if y}, reverse=True)
    if not years_present or year_page > len(years_present):
        return {"groups": [], "total": len(years_present), "page": year_page, "per_page": 1, "total_pages": len(years_present)}

    year = years_present[year_page - 1]
    year_start = datetime(year, 1, 1)
    year_end = datetime(year + 1, 1, 1)
    year_conditions = conditions + [date_expr >= year_start, date_expr < year_end]

    year_assets = list((await db.execute(
        select(Asset).where(and_(*year_conditions)).order_by(SORT_COLUMNS.get(sort_by, SORT_COLUMNS["date_desc"]))
    )).scalars().all())

    months = [{"month": m, "display_date": config.LOCALE_MONTH_NAMES.get(m, ""), "assets": []} for m in range(1, 13)]
    for asset in year_assets:
        dt = asset.taken_at or asset.created_at
        months[dt.month - 1]["assets"].append(asset_to_dict(asset))

    return {
        "groups": [{"year": year, "months": months}],
        "total": len(years_present),
        "page": year_page,
        "per_page": 1,
        "total_pages": len(years_present),
    }


async def get_gallery_data(
    db: AsyncSession,
    user: User,
    page: int,
    per_page: int,
    sort_by: str,
    group_by: str,
    filter_by: str,
) -> dict:
    if group_by == "month":
        return await _get_year_month_grid(db, user, sort_by, filter_by, page)

    conditions = [Asset.user_id == user.id, Asset.is_trashed == False]
    _apply_filter(conditions, filter_by)

    total = (await db.execute(select(func.count(Asset.id)).where(and_(*conditions)))).scalar()

    order_clause = SORT_COLUMNS.get(sort_by, SORT_COLUMNS["date_desc"])
    offset = (page - 1) * per_page
    stmt = (
        select(Asset)
        .where(and_(*conditions))
        .order_by(order_clause)
        .offset(offset)
        .limit(per_page)
    )
    assets = list((await db.execute(stmt)).scalars().all())

    groupers = {"day": _group_by_day, "year": _group_by_year, "type": _group_by_type}
    grouper = groupers.get(group_by)
    if grouper:
        groups = grouper(assets)
    else:
        groups = [{"display_date": None, "assets": [asset_to_dict(a) for a in assets]}] if assets else []

    return {
        "groups": groups,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page if total > 0 else 0,
    }


async def get_smart_category_counts(db: AsyncSession, user: User) -> dict:
    """Photo counts per zero-shot content category, for the smart-albums UI."""
    stmt = (
        select(Asset.smart_category, func.count(Asset.id))
        .where(and_(
            Asset.user_id == user.id,
            Asset.is_trashed == False,
            Asset.smart_category.in_(SMART_CATEGORIES),
        ))
        .group_by(Asset.smart_category)
    )
    rows = (await db.execute(stmt)).all()
    counts = {category: 0 for category in SMART_CATEGORIES}
    counts.update({category: count for category, count in rows})
    return {"categories": counts}
