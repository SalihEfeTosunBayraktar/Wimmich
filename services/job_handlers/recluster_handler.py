"""RECLUSTER job handler - rebuild face clustering from scratch.

Dissolves auto-generated (unnamed) Person groups and re-clusters their faces
with the current FACE_MATCH_THRESHOLD; user-named people are preserved and
freed faces can re-match against them. This is the recovery path when a past
clustering pass produced bad groups (wrong merges/splits).
"""
from sqlalchemy.ext.asyncio import AsyncSession

from models import Job
from services.face_clustering_service import recluster_user_faces
from services.face_service import FACE_AVAILABLE


async def handle_job_recluster(db: AsyncSession, job: Job):
    if not FACE_AVAILABLE:
        raise RuntimeError(
            "Kişi eşleştirme için facenet-pytorch kütüphanesi gerekli - "
            "yeniden kümeleme yapılamadı."
        )

    user_id = (job.data or {}).get("user_id")
    if not user_id:
        raise ValueError("Missing user_id")

    result = await recluster_user_faces(db, user_id)
    print(
        f"[JOB] Recluster: dissolved {result['dissolved_groups']} groups, "
        f"re-assigned {result['assigned_to_existing']} faces, "
        f"created {result['new_people']} new people"
    )
