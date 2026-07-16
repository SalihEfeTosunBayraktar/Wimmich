"""FACE job handler - detect faces in image assets."""
import asyncio
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

import config
from models import Asset, Face, Job
from services.job_core import check_job_cancelled
from services.face_clustering_service import cluster_user_faces


async def handle_job_face(db: AsyncSession, job: Job):
    """Detect faces in assets."""
    from services.ml_service import detect_faces, save_embedding, FACE_AVAILABLE

    data = job.data or {}
    asset_id = data.get("asset_id")
    user_id = data.get("user_id")

    if asset_id:
        assets_query = select(Asset).where(Asset.id == asset_id)
    else:
        assets_query = select(Asset).where(
            and_(
                Asset.file_type == "IMAGE",
                Asset.is_trashed == False,
                Asset.user_id == user_id,
            )
        )

    result = await db.execute(assets_query)
    assets = list(result.scalars().all())

    total = len(assets)
    processed = 0

    # Detection now runs on GPU via facenet-pytorch/torch, which (unlike the
    # old dlib-based detector - see FACE_DETECT_CONCURRENCY comment in
    # config.py) tolerates concurrent calls fine, so a small batch runs at
    # once instead of one image at a time.
    for batch_start in range(0, total, config.FACE_DETECT_CONCURRENCY):
        batch = assets[batch_start:batch_start + config.FACE_DETECT_CONCURRENCY]
        await check_job_cancelled(db, job.id)

        to_detect = []
        for asset in batch:
            face_result = await db.execute(
                select(Face).where(Face.asset_id == asset.id).limit(1)
            )
            if face_result.scalar_one_or_none():
                processed += 1
                continue
            to_detect.append(asset)

        results = await asyncio.gather(
            *[asyncio.to_thread(detect_faces, asset.file_path) for asset in to_detect],
            return_exceptions=True,
        )

        for asset, faces in zip(to_detect, results):
            processed += 1
            if isinstance(faces, Exception):
                print(f"[JOB] Face detection failed for asset {asset.id}: {faces}")
                continue

            for face_idx, face_data in enumerate(faces):
                emb_path = str(config.ML_DIR / f"face_{asset.id}_{face_idx}.npy")
                save_embedding(face_data["embedding"], emb_path)

                face = Face(
                    asset_id=asset.id,
                    x=face_data["x"],
                    y=face_data["y"],
                    w=face_data["w"],
                    h=face_data["h"],
                    embedding_path=emb_path,
                    confidence=face_data.get("confidence"),
                )
                db.add(face)

        job.progress = int(processed / total * 100) if total > 0 else 100
        await db.commit()

    # The OpenCV Haar Cascade fallback only locates faces - its crude embedding
    # (a resized grayscale patch) isn't discriminative enough to reliably tell
    # different people apart, so only cluster into named Person groups when
    # the real face_recognition library is available.
    if user_id and FACE_AVAILABLE:
        await cluster_user_faces(db, user_id)
