"""Manual face-group management: merging people and reassigning single faces.

This is the user-correction layer on top of automatic clustering
(face_clustering_service): fixing wrong merges/splits by hand.
"""
from typing import Optional
from fastapi import HTTPException
from sqlalchemy import select, and_, func, update, delete
from sqlalchemy.ext.asyncio import AsyncSession

from models import User, Person, Face, Asset


async def _get_person_or_404(db: AsyncSession, person_id: str, user_id: str) -> Person:
    result = await db.execute(
        select(Person).where(and_(Person.id == person_id, Person.user_id == user_id))
    )
    person = result.scalar_one_or_none()
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    return person


async def merge_people(db: AsyncSession, user: User, source_id: str, target_id: str) -> dict:
    """Move every face of `source` into `target` and delete `source`."""
    source_person = await _get_person_or_404(db, source_id, user.id)
    target_person = await _get_person_or_404(db, target_id, user.id)

    # Single bulk UPDATE instead of loading every Face row into the ORM
    # session just to flip one column each - a prolific person with
    # thousands of faces used to mean thousands of dirty rows flushed in
    # one transaction for what's fundamentally a one-statement change.
    from sqlalchemy import update
    await db.execute(
        update(Face).where(Face.person_id == source_id).values(person_id=target_id)
    )

    await db.flush()
    # Recompute from actual Face rows rather than adding the two cached
    # counters - matches the pattern used everywhere else in this file
    # (_refresh_person_after_removal, reassign_face). Cached counters can
    # already have drifted from reality (e.g. a prior merge of a merge), so
    # blindly summing them compounds the drift instead of correcting it.
    target_person.face_count = (await db.execute(
        select(func.count(Face.id)).where(Face.person_id == target_id)
    )).scalar() or 0
    await db.delete(source_person)
    await db.commit()

    return {"message": "People merged", "target_id": target_id}


async def _refresh_person_after_removal(db: AsyncSession, person_id: str, removed_face_id: str):
    """Fix face_count/thumbnail of a person a face was just removed from;
    delete the person entirely if it became empty."""
    count = (await db.execute(
        select(func.count(Face.id)).where(Face.person_id == person_id)
    )).scalar() or 0

    person = (await db.execute(select(Person).where(Person.id == person_id))).scalar_one_or_none()
    if not person:
        return
    if count == 0:
        await db.delete(person)
        return

    person.face_count = count
    if person.thumbnail_face_id == removed_face_id:
        another = (await db.execute(
            select(Face).where(Face.person_id == person_id).limit(1)
        )).scalar()
        person.thumbnail_face_id = another.id if another else None


async def reassign_face(
    db: AsyncSession, user: User, face_id: str, target_person_id: Optional[str]
) -> dict:
    """Reassign a face: to an existing person, a brand-new person ("new"),
    or to no one (None = remove from its group)."""
    stmt = select(Face).join(Asset).where(and_(Face.id == face_id, Asset.user_id == user.id))
    face = (await db.execute(stmt)).scalar_one_or_none()
    if not face:
        raise HTTPException(status_code=404, detail="Face not found")

    old_person_id = face.person_id

    if target_person_id == "new":
        new_person = Person(user_id=user.id, name=None, thumbnail_face_id=face.id, face_count=1)
        db.add(new_person)
        await db.flush()
        face.person_id = new_person.id
    elif target_person_id is None:
        face.person_id = None
    else:
        target = await _get_person_or_404(db, target_person_id, user.id)
        face.person_id = target.id
        await db.flush()
        target.face_count = (await db.execute(
            select(func.count(Face.id)).where(Face.person_id == target.id)
        )).scalar() or 0
        if not target.thumbnail_face_id:
            target.thumbnail_face_id = face.id

    if old_person_id and old_person_id != face.person_id:
        await _refresh_person_after_removal(db, old_person_id, face_id)

    await db.commit()
    return {"message": "Face reassigned successfully", "new_person_id": face.person_id}


async def dissolve_person(db: AsyncSession, user: User, person_id: str) -> dict:
    """Discard a whole unnamed group ("bu bir kişi kümesi değil") - unassigns
    every face in it (they go back to the unclustered pool, so a future
    RECLUSTER can regroup them properly) and deletes the Person record,
    rather than just hiding a group that shouldn't have existed at all."""
    person = await _get_person_or_404(db, person_id, user.id)

    await db.execute(
        update(Face).where(Face.person_id == person_id).values(person_id=None)
    )
    await db.delete(person)
    await db.commit()

    return {"message": "Grup dağıtıldı"}


async def delete_person_with_assets(db: AsyncSession, user: User, person_id: str) -> dict:
    """Move every photo this person appears in to the trash, then delete the
    person group itself.

    The photos go to the TRASH, not permanent deletion - this removes a lot
    at once (and a photo of this person may well have other people in it
    too), so it stays recoverable from the trash for the normal retention
    window like any other delete.

    Scoped through a subquery rather than fetching the asset ids and
    passing them back in an IN() list, which would hit SQLite's
    bound-parameter ceiling for a prolific person (see utils/sql_utils.py).
    """
    from datetime import datetime, timezone

    person = await _get_person_or_404(db, person_id, user.id)

    asset_ids_subq = (
        select(Face.asset_id)
        .where(Face.person_id == person_id)
        .scalar_subquery()
    )

    result = await db.execute(
        update(Asset)
        .where(and_(
            Asset.id.in_(asset_ids_subq),
            Asset.user_id == user.id,
            Asset.is_trashed == False,
        ))
        .values(is_trashed=True, trashed_at=datetime.now(timezone.utc))
    )
    trashed = result.rowcount or 0

    # The faces themselves go with the person - their photos are in the
    # trash, so leaving the detections behind would just have a future
    # RECLUSTER rebuild the very group that was explicitly deleted.
    await db.execute(delete(Face).where(Face.person_id == person_id))
    await db.delete(person)
    await db.commit()

    return {"message": f"{trashed} fotoğraf çöp kutusuna taşındı, kişi silindi", "trashed": trashed}


async def suggest_person_names(db: AsyncSession, user: User, query: str = "") -> list:
    """Existing person names for the naming autocomplete - so assigning a
    face to someone already in the library is a pick from a list rather
    than retyping (and risking "Ahmet" vs "ahmet " becoming two people).

    Ordered by face_count so the people who actually appear most come
    first, which is what a short suggestion list should surface.
    """
    conditions = [Person.user_id == user.id, Person.name.isnot(None)]
    if query.strip():
        conditions.append(Person.name.ilike(f"%{query.strip()}%"))

    stmt = (
        select(Person.name, Person.face_count)
        .where(and_(*conditions))
        .order_by(Person.face_count.desc())
        .limit(10)
    )
    rows = (await db.execute(stmt)).all()
    # Distinct on name - two separate groups can legitimately carry the
    # same name (not yet merged), and the suggestion list shouldn't show
    # the same name twice.
    seen = set()
    out = []
    for name, count in rows:
        if name in seen:
            continue
        seen.add(name)
        out.append({"name": name, "face_count": count})
    return out


async def delete_face(db: AsyncSession, user: User, face_id: str) -> dict:
    """Delete a Face detection outright ("bu bir yüz değil") - the detector
    got it wrong, so unlike reassign/unassign this removes it from the pool
    entirely instead of leaving it around as an unassigned face."""
    import os

    stmt = select(Face).join(Asset).where(and_(Face.id == face_id, Asset.user_id == user.id))
    face = (await db.execute(stmt)).scalar_one_or_none()
    if not face:
        raise HTTPException(status_code=404, detail="Face not found")

    old_person_id = face.person_id
    embedding_path = face.embedding_path

    await db.delete(face)

    if old_person_id:
        await _refresh_person_after_removal(db, old_person_id, face_id)

    await db.commit()

    if embedding_path:
        try:
            os.remove(embedding_path)
        except OSError:
            pass

    return {"message": "Yüz kaydı silindi"}
