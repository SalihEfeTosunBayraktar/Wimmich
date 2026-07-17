"""Person Router - Face Recognition Results"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import User, Person, Face, Asset
from auth import get_current_user
from services import face_management_service, face_clustering_service
from utils.serializers import asset_to_dict

router = APIRouter(prefix="/api/people", tags=["people"])


class PersonUpdateRequest(BaseModel):
    name: Optional[str] = None
    is_hidden: Optional[bool] = None


class MergeRequest(BaseModel):
    source_person_id: str
    target_person_id: str


class FaceReassignRequest(BaseModel):
    target_person_id: Optional[str] = None


def _face_thumb_url(face_id: Optional[str]) -> Optional[str]:
    return f"/api/assets/faces/{face_id}" if face_id else None


def _person_to_dict(p: Person) -> dict:
    return {
        "id": p.id,
        "name": p.name or "Bilinmeyen Kişi",
        "face_count": p.face_count,
        "is_hidden": p.is_hidden,
        "thumbnail_url": _face_thumb_url(p.thumbnail_face_id),
    }


@router.get("")
async def list_people(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all recognized people, split into named people, an "unknown
    pool" (unnamed groups, whether still pending a name or dismissed via
    "Tanımıyorum" - both land in the same pool instead of being scattered),
    and a hidden group kept separate from both so a hidden person doesn't
    quietly count as unnamed/dismissed for the naming queue either."""
    stmt = select(Person).where(Person.user_id == user.id).order_by(Person.face_count.desc())
    persons = list((await db.execute(stmt)).scalars().all())

    visible = [p for p in persons if not p.is_hidden]
    hidden = [p for p in persons if p.is_hidden]
    named = [p for p in visible if p.name]
    unknown = [p for p in visible if not p.name]

    return {
        "people": [_person_to_dict(p) for p in named],
        "unknown_pool": [_person_to_dict(p) for p in unknown],
        "hidden": [_person_to_dict(p) for p in hidden],
    }


@router.get("/naming-queue")
async def naming_queue(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Unnamed person groups needing a name, largest first, each with an
    optional suggested match ("bu kişi X mi?") against an existing named person."""
    queue = await face_clustering_service.get_naming_queue(db, user.id)
    return {
        "queue": [
            {
                "id": item["id"],
                "face_id": item["thumbnail_face_id"],
                "face_count": item["face_count"],
                "thumbnail_url": _face_thumb_url(item["thumbnail_face_id"]),
                "suggested_person": item.get("suggested_person"),
            }
            for item in queue
        ]
    }


@router.get("/{person_id}")
async def get_person(
    person_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get person details with their photos and detected faces."""
    result = await db.execute(
        select(Person).where(and_(Person.id == person_id, Person.user_id == user.id))
    )
    person = result.scalar_one_or_none()
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")

    stmt = (
        select(Asset)
        .join(Face, Face.asset_id == Asset.id)
        .where(and_(Face.person_id == person_id, Asset.is_trashed == False))
        .order_by(func.coalesce(Asset.taken_at, Asset.created_at).desc())
    )
    assets = list((await db.execute(stmt)).scalars().all())

    faces = list((await db.execute(
        select(Face).where(Face.person_id == person_id)
    )).scalars().all())

    return {
        "id": person.id,
        "name": person.name or "Bilinmeyen Kişi",
        "face_count": person.face_count,
        "is_hidden": person.is_hidden,
        "thumbnail_url": _face_thumb_url(person.thumbnail_face_id),
        "faces": [
            {
                "id": f.id,
                "asset_id": f.asset_id,
                "x": f.x, "y": f.y, "w": f.w, "h": f.h,
                "thumbnail_url": _face_thumb_url(f.id),
            }
            for f in faces
        ],
        "assets": [asset_to_dict(a) for a in assets],
    }


@router.put("/{person_id}")
async def update_person(
    person_id: str,
    req: PersonUpdateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update person (name, hidden status)."""
    result = await db.execute(
        select(Person).where(and_(Person.id == person_id, Person.user_id == user.id))
    )
    person = result.scalar_one_or_none()
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")

    if req.name is not None and req.name.strip():
        new_name = req.name.strip()
        # Naming a group with a name that already belongs to another person
        # should merge into them (it's the same person, not a second one
        # with the same name) rather than just relabeling this group.
        existing = await db.execute(
            select(Person).where(and_(
                Person.user_id == user.id,
                Person.id != person_id,
                func.lower(Person.name) == new_name.lower(),
            ))
        )
        existing_person = existing.scalar_one_or_none()
        if existing_person:
            return await face_management_service.merge_people(db, user, person_id, existing_person.id)
        person.name = new_name
    if req.is_hidden is not None:
        person.is_hidden = req.is_hidden

    await db.commit()
    return {"message": "Person updated", "name": person.name}


@router.post("/merge")
async def merge_people(
    req: MergeRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Merge two people into one."""
    return await face_management_service.merge_people(
        db, user, req.source_person_id, req.target_person_id
    )


@router.post("/faces/{face_id}/reassign")
async def reassign_face(
    face_id: str,
    req: FaceReassignRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Reassign a face to a different person (or a new person, or unassigned)."""
    return await face_management_service.reassign_face(
        db, user, face_id, req.target_person_id
    )


@router.delete("/faces/{face_id}")
async def delete_face(
    face_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a face detection outright ("bu bir yüz değil") - removes it
    from the pool entirely rather than just unassigning it."""
    return await face_management_service.delete_face(db, user, face_id)


@router.post("/{person_id}/dissolve")
async def dissolve_person(
    person_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Discard a whole unnamed group ("bu bir kişi değil") - unassigns its
    faces back to the unclustered pool and deletes the group."""
    return await face_management_service.dissolve_person(db, user, person_id)
