"""MemoryVideo model - auto-generated Ken Burns/crossfade slideshow videos
built from a user's "on this day" or "past week" photos."""
import json
from sqlalchemy import Column, String, Integer, Text, DateTime, Boolean

from database import Base
from models.common import generate_uuid, utcnow


class MemoryVideo(Base):
    __tablename__ = "memory_videos"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), nullable=False, index=True)
    # DAILY (today's "N years ago" group) or WEEKLY (past 7 days' highlights).
    kind = Column(String(20), nullable=False)
    # Which entry in video_style_service.VIDEO_STYLES built this - kept per
    # row (not just read from the user's current setting) so a user who
    # changes their style preference later doesn't retroactively mislabel
    # videos generated under a previous style.
    style = Column(String(30), nullable=False)
    title = Column(String(255), nullable=False)
    # Dedup key the generator checks before doing any work, e.g.
    # "daily:2026-08-04:3" (today's date + years_ago) or "weekly:2026-W31" -
    # unique per (user_id, source_key) so the periodic scheduler waking up
    # repeatedly, or a manual "generate now" alongside it, can never produce
    # two videos for the same underlying photo group.
    source_key = Column(String(100), nullable=False, index=True)
    asset_ids_json = Column(Text, nullable=True)
    video_path = Column(String(500), nullable=True)
    thumb_path = Column(String(500), nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    # PENDING while the job is running, READY once the file exists, FAILED
    # if ffmpeg errored out - surfaced in the UI instead of a video card
    # silently never appearing.
    status = Column(String(20), default="PENDING", nullable=False)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow)

    @property
    def asset_ids(self):
        if self.asset_ids_json:
            try:
                return json.loads(self.asset_ids_json)
            except (json.JSONDecodeError, TypeError):
                return []
        return []

    @asset_ids.setter
    def asset_ids(self, value):
        self.asset_ids_json = json.dumps(value) if value else None
