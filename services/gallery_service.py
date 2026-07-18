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
    # Distinct from date_desc - taken_at (the photo's own EXIF/capture
    # date) is what date_desc sorts by, which is not the same photo order
    # as "what did I add to Wimmich most recently" for reference/import
    # mode assets and scans of an old archive, where taken_at can be years
    # in the past while created_at (upload/index time) is today.
    "uploaded_desc": Asset.created_at.desc(),
    "name_asc": Asset.original_file_name.asc(),
    "name_desc": Asset.original_file_name.desc(),
    "size_desc": Asset.file_size.desc(),
    "size_asc": Asset.file_size.asc(),
}


SMART_CATEGORIES = ("screenshot", "document", "nature", "pet", "food", "car", "technology")

# The fixed 6x6 mosaic size each month cell renders (see .month-cell-grid
# in photo-grid.css) - no point serializing/sending more than this many
# assets for a month up front (a busy month could otherwise ship
# thousands of full asset records over the wire just to render 36
# thumbnails). The "+N" drilldown fetches a month's full list separately
# via get_month_assets(), only when the user actually asks for it.
MONTH_CELL_CAP = 36


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
    elif filter_by.startswith("city_"):
        conditions.append(Asset.city == filter_by[len("city_"):])
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

    # True per-month counts first (column-only) - needed for the "+N"
    # overflow badge even for a month whose actual asset rows get capped
    # below, so the badge still shows the real remainder rather than 0.
    month_counts_result = await db.execute(
        select(func.strftime("%m", date_expr)).where(and_(*year_conditions))
    )
    month_counts = {}
    for (m,) in month_counts_result.all():
        if m:
            month_counts[int(m)] = month_counts.get(int(m), 0) + 1

    year_assets = list((await db.execute(
        select(Asset).where(and_(*year_conditions)).order_by(SORT_COLUMNS.get(sort_by, SORT_COLUMNS["date_desc"]))
    )).scalars().all())

    months = [
        {"month": m, "display_date": config.LOCALE_MONTH_NAMES.get(m, ""), "assets": [], "total_count": month_counts.get(m, 0)}
        for m in range(1, 13)
    ]
    for asset in year_assets:
        dt = asset.taken_at or asset.created_at
        bucket = months[dt.month - 1]["assets"]
        # year_assets is already sorted by sort_by - the first MONTH_CELL_CAP
        # encountered per month (in that same global order) are exactly the
        # "top N for this month" under the same ordering, so capping here
        # during the single pass is equivalent to a per-month top-N query,
        # without needing one. Only the mosaic cell's fixed 36 slots ever
        # get serialized/sent - a month with thousands of photos doesn't
        # balloon the response just to render 36 thumbnails.
        if len(bucket) < MONTH_CELL_CAP:
            bucket.append(asset_to_dict(asset))

    return {
        "groups": [{"year": year, "months": months}],
        "total": len(years_present),
        "page": year_page,
        "per_page": 1,
        "total_pages": len(years_present),
    }


async def get_month_assets(
    db: AsyncSession,
    user: User,
    sort_by: str,
    filter_by: str,
    year: int,
    month: int,
) -> dict:
    """Every asset in one specific (year, month) - the "+N" drilldown's full
    view, fetched only when the user actually opens it instead of
    front-loading every month's complete asset list into the year-grid
    response just to render a fixed 36-thumbnail mosaic per month."""
    conditions = [Asset.user_id == user.id, Asset.is_trashed == False]
    _apply_filter(conditions, filter_by)

    date_expr = func.coalesce(Asset.taken_at, Asset.created_at)
    month_start = datetime(year, month, 1)
    month_end = datetime(year + 1, 1, 1) if month == 12 else datetime(year, month + 1, 1)
    conditions += [date_expr >= month_start, date_expr < month_end]

    assets = list((await db.execute(
        select(Asset).where(and_(*conditions)).order_by(SORT_COLUMNS.get(sort_by, SORT_COLUMNS["date_desc"]))
    )).scalars().all())

    return {"assets": [asset_to_dict(a) for a in assets]}


# The fixed 30x7 mosaic size a whole year renders in "Yıla Göre" mode
# (see .photo-grid--dense in photo-grid.css, fixed at 30 columns).
YEAR_VIEW_CAP = 30 * 7


async def _get_year_grid(
    db: AsyncSession,
    user: User,
    sort_by: str,
    filter_by: str,
    year_page: int,
) -> dict:
    """"Yıla Göre" paginates by YEAR instead of asset count, same reasoning
    as _get_year_month_grid: asset-count pagination couldn't tell "more of
    the year that's already at its cap" apart from "the next year the user
    actually wants to scroll into" without fetching and inspecting it
    first, since a single page of 60 could straddle both. One page = one
    already-capped year sidesteps that entirely - scrolling to the next
    page always means the next year, never entangled with the current
    year's overflow."""
    conditions = [Asset.user_id == user.id, Asset.is_trashed == False]
    _apply_filter(conditions, filter_by)

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

    total_count = (await db.execute(select(func.count(Asset.id)).where(and_(*year_conditions)))).scalar()

    assets = list((await db.execute(
        select(Asset).where(and_(*year_conditions))
        .order_by(SORT_COLUMNS.get(sort_by, SORT_COLUMNS["date_desc"]))
        .limit(YEAR_VIEW_CAP)
    )).scalars().all())

    return {
        "groups": [{"display_date": str(year), "assets": [asset_to_dict(a) for a in assets], "total_count": total_count}],
        "total": len(years_present),
        "page": year_page,
        "per_page": 1,
        "total_pages": len(years_present),
    }


async def get_year_assets(
    db: AsyncSession,
    user: User,
    sort_by: str,
    filter_by: str,
    year: int,
) -> dict:
    """Every asset in one specific year - the year view's "+N" drilldown,
    fetched only when the user actually clicks it (see get_month_assets,
    same reasoning)."""
    conditions = [Asset.user_id == user.id, Asset.is_trashed == False]
    _apply_filter(conditions, filter_by)

    date_expr = func.coalesce(Asset.taken_at, Asset.created_at)
    year_start = datetime(year, 1, 1)
    year_end = datetime(year + 1, 1, 1)
    conditions += [date_expr >= year_start, date_expr < year_end]

    assets = list((await db.execute(
        select(Asset).where(and_(*conditions)).order_by(SORT_COLUMNS.get(sort_by, SORT_COLUMNS["date_desc"]))
    )).scalars().all())

    return {"assets": [asset_to_dict(a) for a in assets]}


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
    if group_by == "year":
        return await _get_year_grid(db, user, sort_by, filter_by, page)

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

    groupers = {"day": _group_by_day, "type": _group_by_type}
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
