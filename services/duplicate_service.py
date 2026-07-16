"""Duplicate-asset detection: grouping by checksum. Checksum backfill for
assets missing one runs as a DUPCHECK background job (see
job_handlers/dupcheck_handler.py), not synchronously here."""
import asyncio
import hashlib
from datetime import datetime
from typing import Optional
from sqlalchemy import select, and_, or_, func
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.ext.asyncio import AsyncSession

from models import Asset, User, IgnoredDuplicateGroup, IgnoredSimilarAsset
from utils.serializers import asset_to_dict
from utils.embedding_utils import load_embedding


def _sort_groups(groups: list, sort_by: str) -> list:
    if sort_by == "date_desc":
        groups.sort(key=lambda g: g["latest_date"] or datetime.min, reverse=True)
    elif sort_by == "date_asc":
        groups.sort(key=lambda g: g["latest_date"] or datetime.max)
    elif sort_by == "size_desc":
        groups.sort(key=lambda g: g["total_size"], reverse=True)
    elif sort_by == "name":
        groups.sort(key=lambda g: g["assets"][0]["original_file_name"] if g["assets"] else "")
    return groups


async def get_duplicate_groups(
    db: AsyncSession,
    user: User,
    sort_by: str,
    file_type: Optional[str],
    location: Optional[str] = None,
) -> dict:
    """Get duplicate asset groups (matching checksum) for the current user."""
    conditions = [
        Asset.user_id == user.id,
        Asset.is_trashed == False,
        Asset.is_archived == False,
        Asset.checksum.isnot(None),
        Asset.checksum != "",
    ]
    if file_type:
        conditions.append(Asset.file_type == file_type.upper())
    if location:
        # Single "city/location" filter box: match either field, partial text.
        conditions.append(
            or_(Asset.city.ilike(f"%{location}%"), Asset.country.ilike(f"%{location}%"))
        )

    subq = (
        select(Asset.checksum)
        .where(and_(*conditions))
        .group_by(Asset.checksum)
        .having(func.count(Asset.id) > 1)
    )
    subq_res = await db.execute(subq)
    duplicate_checksums = [r[0] for r in subq_res.all()]

    ignored_res = await db.execute(
        select(IgnoredDuplicateGroup.checksum).where(IgnoredDuplicateGroup.user_id == user.id)
    )
    ignored_checksums = {r[0] for r in ignored_res.all()}
    duplicate_checksums = [c for c in duplicate_checksums if c not in ignored_checksums]

    if not duplicate_checksums:
        return {"groups": []}

    stmt = select(Asset).where(
        and_(
            Asset.user_id == user.id,
            Asset.is_trashed == False,
            Asset.is_archived == False,
            Asset.checksum.in_(duplicate_checksums),
        )
    )
    res = await db.execute(stmt)
    assets = res.scalars().all()

    groups_dict = {}
    for asset in assets:
        chk = asset.checksum
        if chk not in groups_dict:
            groups_dict[chk] = {
                "checksum": chk,
                "assets": [],
                "total_size": 0,
                "latest_date": None,
                "city": asset.city,
                "country": asset.country,
            }
        groups_dict[chk]["assets"].append(asset_to_dict(asset))
        groups_dict[chk]["total_size"] += asset.file_size

        asset_date = asset.taken_at or asset.created_at
        if not groups_dict[chk]["latest_date"] or (
            asset_date and asset_date > groups_dict[chk]["latest_date"]
        ):
            groups_dict[chk]["latest_date"] = asset_date

    groups = _sort_groups(list(groups_dict.values()), sort_by)

    for g in groups:
        if g["latest_date"]:
            g["latest_date"] = g["latest_date"].isoformat()

    return {"groups": groups}


# Checksum-based matching above only catches byte-identical files - the
# same photo re-saved through a different app (WhatsApp, cloud backup,
# a re-export) gets re-compressed and every byte changes, so it never
# matches even though it's visually the same picture. This mode instead
# clusters by CLIP embedding similarity, which is robust to that kind of
# re-encoding. High threshold (only very close matches) since CLIP embeds
# whole-image *semantic* content - two different-but-similar photos from
# the same moment can also score high, and this needs to stay a "these
# are the same picture" signal, not "these look alike".
VISUAL_DUP_THRESHOLD = 0.975


def _cluster_by_visual_similarity(items: list, threshold: float) -> list:
    """items: [(asset_id, embedding_path), ...].
    Returns [([asset_id, ...], avg_similarity), ...] for clusters of 2+."""
    import numpy as np

    ids, embeddings = [], []
    for asset_id, path in items:
        emb = load_embedding(path)
        if emb is not None:
            ids.append(asset_id)
            embeddings.append(emb)
    if len(embeddings) < 2:
        return []

    try:
        from sklearn.cluster import DBSCAN
        from sklearn.metrics.pairwise import cosine_similarity as sk_cosine_similarity
    except ImportError:
        return []

    X = np.array(embeddings)
    sims = sk_cosine_similarity(X)
    # Floating-point rounding can push a near-identical pair's similarity
    # a hair above 1.0 (e.g. 1.0000000001), making 1 - sims negative right
    # where it matters most (the closest matches) - DBSCAN's precomputed
    # metric rejects negative distances outright, so clamp at 0.
    dist = np.clip(1 - sims, 0, None)
    labels = DBSCAN(eps=1 - threshold, min_samples=2, metric="precomputed").fit(dist).labels_

    clusters = {}
    for idx, label in enumerate(labels):
        if label == -1:
            continue
        clusters.setdefault(label, []).append(idx)

    result = []
    for member_idxs in clusters.values():
        pair_sims = [
            sims[i][j]
            for a, i in enumerate(member_idxs)
            for j in member_idxs[a + 1:]
        ]
        avg_sim = float(sum(pair_sims) / len(pair_sims)) if pair_sims else 1.0
        result.append(([ids[i] for i in member_idxs], avg_sim))
    return result


def _visual_group_key(asset_ids: list) -> str:
    """Display-only id for a visual-duplicate group (stable for a given
    membership, independent of clustering-run label order) - NOT used for
    "Atla" anymore, since a hash of current members shifts whenever the
    cluster gains or loses one, see IgnoredSimilarAsset instead."""
    return "visual:" + hashlib.sha256(",".join(sorted(asset_ids)).encode()).hexdigest()


async def get_visual_duplicate_groups(
    db: AsyncSession,
    user: User,
    sort_by: str,
    file_type: Optional[str],
    location: Optional[str] = None,
) -> dict:
    """Near-duplicate groups via CLIP embedding similarity (images only -
    videos have no CLIP embedding, see clip_handler.py)."""
    ignored_res = await db.execute(
        select(IgnoredSimilarAsset.asset_id).where(IgnoredSimilarAsset.user_id == user.id)
    )
    ignored_asset_ids = {r[0] for r in ignored_res.all()}

    conditions = [
        Asset.user_id == user.id,
        Asset.is_trashed == False,
        Asset.is_archived == False,
        Asset.file_type == "IMAGE",
        Asset.clip_embedding_path.isnot(None),
    ]
    if ignored_asset_ids:
        conditions.append(Asset.id.notin_(ignored_asset_ids))
    if file_type:
        conditions.append(Asset.file_type == file_type.upper())
    if location:
        conditions.append(
            or_(Asset.city.ilike(f"%{location}%"), Asset.country.ilike(f"%{location}%"))
        )

    # Column-only select for the clustering pass - the DBSCAN pass below
    # only ever reads (id, embedding_path); every image in the library with
    # an embedding doesn't need to be materialized as a full Asset ORM
    # object just for that; only the (typically much smaller) set that
    # actually ends up in a cluster gets fetched as full rows below.
    result = await db.execute(select(Asset.id, Asset.clip_embedding_path).where(and_(*conditions)))
    items = [(aid, path) for aid, path in result.all()]

    clusters = await asyncio.to_thread(_cluster_by_visual_similarity, items, VISUAL_DUP_THRESHOLD)

    clustered_ids = {aid for asset_ids, _ in clusters for aid in asset_ids}
    assets_by_id = {}
    if clustered_ids:
        full_result = await db.execute(select(Asset).where(Asset.id.in_(clustered_ids)))
        assets_by_id = {a.id: a for a in full_result.scalars().all()}

    groups = []
    for asset_ids, avg_sim in clusters:
        key = _visual_group_key(asset_ids)
        cluster_assets = [assets_by_id[aid] for aid in asset_ids if aid in assets_by_id]
        if not cluster_assets:
            # An asset in this cluster was deleted between the two queries
            # above - vanishingly rare, but cluster_assets[0] below would
            # otherwise crash the whole request over one stale group.
            continue
        dates = [a.taken_at or a.created_at for a in cluster_assets if a.taken_at or a.created_at]
        groups.append({
            "checksum": key,
            "match_score": round(avg_sim * 100, 1),
            "assets": [asset_to_dict(a) for a in cluster_assets],
            "total_size": sum(a.file_size for a in cluster_assets),
            "latest_date": max(dates) if dates else None,
            "city": cluster_assets[0].city,
            "country": cluster_assets[0].country,
        })

    groups = _sort_groups(groups, sort_by)
    for g in groups:
        if g["latest_date"]:
            g["latest_date"] = g["latest_date"].isoformat()

    return {"groups": groups}


async def ignore_duplicate_group(db: AsyncSession, user: User, checksum: str) -> dict:
    """Mark a duplicate group as skipped - keeps every file, just hides the
    group from future listings until un-ignored."""
    stmt = sqlite_insert(IgnoredDuplicateGroup).values(
        user_id=user.id, checksum=checksum
    ).on_conflict_do_nothing(index_elements=["user_id", "checksum"])
    await db.execute(stmt)
    await db.commit()
    return {"message": "Grup atlandı"}


async def unignore_duplicate_group(db: AsyncSession, user: User, checksum: str) -> dict:
    """Undo a skip so the group shows up again."""
    result = await db.execute(
        select(IgnoredDuplicateGroup).where(
            and_(IgnoredDuplicateGroup.user_id == user.id, IgnoredDuplicateGroup.checksum == checksum)
        )
    )
    row = result.scalar_one_or_none()
    if row:
        await db.delete(row)
        await db.commit()
    return {"message": "Atlama geri alındı"}


async def ignore_visual_duplicate_group(db: AsyncSession, user: User, asset_ids: list) -> dict:
    """Dismiss a visual-duplicate group - marks every member asset as
    ignored (not the group hash) so the same photos don't get re-flagged
    together under a new cluster once membership shifts. Deletes nothing."""
    if not asset_ids:
        return {"message": "Grup atlandı"}
    stmt = sqlite_insert(IgnoredSimilarAsset).values(
        [{"user_id": user.id, "asset_id": aid} for aid in asset_ids]
    ).on_conflict_do_nothing(index_elements=["user_id", "asset_id"])
    await db.execute(stmt)
    await db.commit()
    return {"message": "Grup atlandı"}


