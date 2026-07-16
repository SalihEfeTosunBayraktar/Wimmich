"""Job handler registry - maps job_type strings to handler coroutines."""
from services.job_handlers.thumbnail_handler import handle_job_thumbnail
from services.job_handlers.clip_handler import handle_job_clip
from services.job_handlers.face_handler import handle_job_face
from services.job_handlers.scan_handler import handle_job_scan
from services.job_handlers.cleanup_handler import handle_cleanup_trash
from services.job_handlers.import_handler import handle_job_import
from services.job_handlers.geocode_handler import handle_job_geocode
from services.job_handlers.transcode_handler import handle_job_transcode
from services.job_handlers.recluster_handler import handle_job_recluster
from services.job_handlers.dupcheck_handler import handle_job_dupcheck
from services.job_handlers.categorize_handler import handle_job_categorize
from services.job_handlers.backup_handler import handle_job_backup
from services.job_handlers.similarity_handler import handle_job_similarity

JOB_HANDLERS = {
    "THUMBNAIL": handle_job_thumbnail,
    "CLIP": handle_job_clip,
    "FACE": handle_job_face,
    "SCAN": handle_job_scan,
    "IMPORT": handle_job_import,
    "GEOCODE": handle_job_geocode,
    "TRANSCODE": handle_job_transcode,
    "RECLUSTER": handle_job_recluster,
    "DUPCHECK": handle_job_dupcheck,
    "CATEGORIZE": handle_job_categorize,
    "BACKUP": handle_job_backup,
    "SIMILARITY": handle_job_similarity,
}

__all__ = ["JOB_HANDLERS", "handle_cleanup_trash"]
