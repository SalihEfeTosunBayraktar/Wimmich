"""Face clustering - groups detected faces into Person records.

All numpy-heavy work (loading embeddings from disk, distance computations,
DBSCAN) runs in a worker thread via asyncio.to_thread so the event loop -
and therefore the web UI - stays responsive while a big library clusters.
Only the DB reads/writes happen on the loop.
"""
import asyncio
from sqlalchemy import select, and_, update
from sqlalchemy.ext.asyncio import AsyncSession

import config
from models import Asset, Face, Person
from services.ml_service import load_embedding, cluster_faces, compare_faces


async def _fetch_unclustered(db: AsyncSession, user_id: str) -> list:
    stmt = (
        select(Face)
        .join(Asset, Asset.id == Face.asset_id)
        .where(
            and_(
                Asset.user_id == user_id,
                Asset.is_trashed == False,
                Face.person_id.is_(None),
                Face.embedding_path.isnot(None),
            )
        )
    )
    return list((await db.execute(stmt)).scalars().all())


async def _fetch_person_faces(db: AsyncSession, user_id: str) -> list:
    """[(person_id, embedding_path), ...] for the user's existing people."""
    stmt = (
        select(Face.person_id, Face.embedding_path)
        .join(Person, Person.id == Face.person_id)
        .where(and_(Person.user_id == user_id, Face.embedding_path.isnot(None)))
    )
    return [(pid, path) for pid, path in (await db.execute(stmt)).all()]


def _compute_assignments(unclustered: list, person_faces: list) -> tuple:
    """CPU-heavy part, runs in a thread. Takes plain (id, path) data, returns
    ({face_id: person_id} for existing-person matches, [[face_ids], ...] new clusters)."""
    threshold = config.FACE_MATCH_THRESHOLD

    centroids = {}
    for person_id, emb_path in person_faces:
        emb = load_embedding(emb_path)
        if emb is not None:
            centroids.setdefault(person_id, []).append(emb)
    centroids = {pid: sum(embs) / len(embs) for pid, embs in centroids.items()}

    matched = {}
    remaining = []
    for face_id, emb_path in unclustered:
        emb = load_embedding(emb_path)
        if emb is None:
            continue
        best_pid, best_dist = None, threshold
        for pid, centroid in centroids.items():
            dist = compare_faces(emb, centroid)
            if dist < best_dist:
                best_pid, best_dist = pid, dist
        if best_pid:
            matched[face_id] = best_pid
        else:
            remaining.append((face_id, emb))

    clusters = cluster_faces(remaining, threshold=threshold) if remaining else {}
    new_groups = [ids for ids in clusters.values() if len(ids) >= config.FACE_MIN_CLUSTER_SIZE]
    return matched, new_groups


async def cluster_user_faces(db: AsyncSession, user_id: str) -> dict:
    """Assign unclustered faces to existing people, or form new Person groups."""
    unclustered = await _fetch_unclustered(db, user_id)
    if not unclustered:
        return {"assigned_to_existing": 0, "new_people": 0}

    faces_by_id = {f.id: f for f in unclustered}
    unclustered_data = [(f.id, f.embedding_path) for f in unclustered]
    person_faces = await _fetch_person_faces(db, user_id)

    matched, new_groups = await asyncio.to_thread(
        _compute_assignments, unclustered_data, person_faces
    )

    for face_id, person_id in matched.items():
        faces_by_id[face_id].person_id = person_id
    for person_id in set(matched.values()):
        person = (await db.execute(select(Person).where(Person.id == person_id))).scalar_one_or_none()
        if person:
            person.face_count += sum(1 for pid in matched.values() if pid == person_id)

    new_people = 0
    for face_ids in new_groups:
        person = Person(user_id=user_id, face_count=len(face_ids), thumbnail_face_id=face_ids[0])
        db.add(person)
        await db.flush()
        for fid in face_ids:
            faces_by_id[fid].person_id = person.id
        new_people += 1

    await db.commit()
    return {"assigned_to_existing": len(matched), "new_people": new_people}


# Looser than FACE_MATCH_THRESHOLD (which auto-merges) - this only ever
# produces a suggestion the user has to confirm, so a few false positives
# are cheap and worth catching more near-misses than the strict threshold would.
NAMING_SUGGESTION_THRESHOLD = config.FACE_MATCH_THRESHOLD + 0.07


def _compute_naming_suggestions(person_faces: list, unnamed_ids: set, named_ids: set) -> dict:
    """CPU-heavy part, runs in a thread. Returns {unnamed_person_id: (named_person_id, distance)}."""
    centroids = {}
    for pid, emb_path in person_faces:
        emb = load_embedding(emb_path)
        if emb is not None:
            centroids.setdefault(pid, []).append(emb)
    centroids = {pid: sum(embs) / len(embs) for pid, embs in centroids.items()}

    suggestions = {}
    for uid in unnamed_ids:
        if uid not in centroids:
            continue
        best_pid, best_dist = None, NAMING_SUGGESTION_THRESHOLD
        for nid in named_ids:
            if nid not in centroids:
                continue
            dist = compare_faces(centroids[uid], centroids[nid])
            if dist < best_dist:
                best_pid, best_dist = nid, dist
        if best_pid:
            suggestions[uid] = (best_pid, best_dist)
    return suggestions


async def get_naming_queue(db: AsyncSession, user_id: str) -> list:
    """Unnamed Person groups needing a name, largest first - each with an
    optional suggested match against an existing named person to confirm
    ("bu kişi X mi?") instead of just a blank name field."""
    unnamed_stmt = (
        select(Person)
        .where(and_(Person.user_id == user_id, Person.name.is_(None), Person.is_hidden == False))
        .order_by(Person.face_count.desc())
    )
    unnamed = list((await db.execute(unnamed_stmt)).scalars().all())
    if not unnamed:
        return []

    named_stmt = select(Person).where(and_(Person.user_id == user_id, Person.name.isnot(None)))
    named_by_id = {p.id: p for p in (await db.execute(named_stmt)).scalars().all()}

    person_faces = await _fetch_person_faces(db, user_id)
    suggestions = await asyncio.to_thread(
        _compute_naming_suggestions,
        person_faces,
        {p.id for p in unnamed},
        set(named_by_id.keys()),
    )

    result = []
    for p in unnamed:
        entry = {"id": p.id, "face_count": p.face_count, "thumbnail_face_id": p.thumbnail_face_id}
        suggestion = suggestions.get(p.id)
        if suggestion:
            suggested_person = named_by_id.get(suggestion[0])
            if suggested_person:
                entry["suggested_person"] = {"id": suggested_person.id, "name": suggested_person.name}
        result.append(entry)
    return result


async def recluster_user_faces(db: AsyncSession, user_id: str) -> dict:
    """Rebuild clustering from scratch, preserving user-named people.

    Unnamed (auto-generated) Person groups are dissolved and their faces
    re-clustered with the current threshold; named people are kept, and freed
    faces can re-match against them. Lets the user recover from a bad
    auto-clustering pass without losing naming work.
    """
    unnamed_stmt = select(Person.id).where(
        and_(Person.user_id == user_id, Person.name.is_(None))
    )
    unnamed_ids = [pid for (pid,) in (await db.execute(unnamed_stmt)).all()]

    if unnamed_ids:
        await db.execute(
            update(Face).where(Face.person_id.in_(unnamed_ids)).values(person_id=None)
        )
        for pid in unnamed_ids:
            person = (await db.execute(select(Person).where(Person.id == pid))).scalar_one_or_none()
            if person:
                await db.delete(person)
        await db.commit()

    result = await cluster_user_faces(db, user_id)
    result["dissolved_groups"] = len(unnamed_ids)
    return result
