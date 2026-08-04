"""OCR job handler - extracts text from screenshot/document assets via
Tesseract, so search can match text visible IN a photo, not just its
filename/metadata. Mirrors categorize_handler.py's scoping pattern (assets
that already have a prerequisite - there CLIP embeddings, here a
screenshot/document smart_category - and haven't been processed yet).
"""
import asyncio
from sqlalchemy import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

import config
from models import Asset, Job
from services.job_core import check_job_cancelled, gather_cancellable
from utils.image_utils import _open_any_image
from utils.path_utils import resolve_data_path
from utils.ocr_setup import OCR_AVAILABLE
from utils.log import info, warn, success

# Only these categories are ever worth OCR-ing - running it over the whole
# library (vacation photos, pets, etc.) would burn CPU on thousands of
# images with no text in them for zero benefit, since Tesseract has no fast
# "does this even have text" pre-check.
OCR_CATEGORIES = ("screenshot", "document")

# A result longer than this is truncated before saving - protects against a
# dense multi-page document producing a multi-megabyte OCR dump that bloats
# the DB and is more than any realistic search snippet needs anyway.
MAX_OCR_TEXT_LENGTH = 20000


def _run_ocr(path: str) -> str:
    import pytesseract
    with _open_any_image(path) as img:
        return pytesseract.image_to_string(img)


async def handle_job_ocr(db: AsyncSession, job: Job):
    if not OCR_AVAILABLE:
        warn("JOB", "OCR: Tesseract not installed - skipping (see utils/ocr_setup.py).")
        return

    data = job.data or {}
    scoped_user_id = data.get("user_id")

    conditions = [
        Asset.smart_category.in_(OCR_CATEGORIES),
        Asset.ocr_text.is_(None),
        Asset.is_trashed == False,
    ]
    if scoped_user_id:
        conditions.append(Asset.user_id == scoped_user_id)

    result = await db.execute(select(Asset).where(and_(*conditions)))
    assets = list(result.scalars().all())

    total = len(assets)
    if total == 0:
        info("JOB", "OCR: nothing to process - no screenshot/document assets awaiting OCR.")
        return

    info("JOB", f"Running OCR on {total} asset(s)...")

    from services.job_concurrency_service import get_effective_concurrency
    concurrency = get_effective_concurrency()

    processed = 0
    for batch_start in range(0, total, concurrency):
        batch = assets[batch_start:batch_start + concurrency]
        await check_job_cancelled(db, job.id)

        paths = []
        for asset in batch:
            resolved = resolve_data_path(asset.file_path, config.UPLOAD_DIR)
            paths.append(str(resolved) if resolved and resolved.exists() else None)

        results = await gather_cancellable(
            db, job.id,
            [asyncio.to_thread(_run_ocr, p) if p else asyncio.sleep(0, result=None) for p in paths],
        )

        for asset, text_result in zip(batch, results):
            processed += 1
            if isinstance(text_result, Exception) or text_result is None:
                # Empty string (not left NULL) so a missing/unreadable file
                # doesn't get retried by every future OCR run forever - see
                # models/asset.py's ocr_text docstring for the NULL-vs-""
                # distinction this relies on.
                asset.ocr_text = ""
                continue
            asset.ocr_text = text_result.strip()[:MAX_OCR_TEXT_LENGTH]

        job.progress = int(processed / total * 100)
        await db.commit()
        # See clip_handler.py's identical expunge.
        for asset in batch:
            db.expunge(asset)

    success("JOB", f"OCR completed: {processed}/{total} asset(s) processed")
