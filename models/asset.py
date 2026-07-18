"""Asset model (photos/videos)."""
import json
import math
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey,
    BigInteger, Index,
)
from sqlalchemy.orm import relationship

from database import Base
from models.common import generate_uuid, utcnow


class Asset(Base):
    __tablename__ = "assets"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    file_path = Column(String(1000), nullable=False)
    file_name = Column(String(500), nullable=False)
    original_file_name = Column(String(500), nullable=False)
    file_type = Column(String(10), nullable=False)  # IMAGE, VIDEO
    mime_type = Column(String(100), nullable=True)
    file_size = Column(BigInteger, default=0)
    checksum = Column(String(64), nullable=True, index=True)

    # Dimensions
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    duration_seconds = Column(Float, nullable=True)  # video duration

    # Dates
    taken_at = Column(DateTime, nullable=True, index=True)
    created_at = Column(DateTime, default=utcnow, index=True)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    # Location
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    city = Column(String(255), nullable=True)
    country = Column(String(255), nullable=True)

    # Status
    is_favorite = Column(Boolean, default=False, index=True)
    is_archived = Column(Boolean, default=False, index=True)
    is_trashed = Column(Boolean, default=False, index=True)
    trashed_at = Column(DateTime, nullable=True)

    # Zero-shot content category (screenshot/document/nature/pet/...),
    # assigned by comparing the CLIP embedding to a fixed set of category
    # text prompts - see services/smart_category_service.py. Null until the
    # CATEGORIZE job runs (needs clip_embedding_path to already be set).
    smart_category = Column(String(30), nullable=True, index=True)

    # EXIF (stored as JSON string)
    exif_data = Column(Text, nullable=True)

    # Thumbnails
    thumb_small_path = Column(String(1000), nullable=True)
    thumb_medium_path = Column(String(1000), nullable=True)
    thumb_large_path = Column(String(1000), nullable=True)
    # Set when thumbnail generation was attempted and failed for every size
    # (e.g. a video with no decodable video stream - ffmpeg can never
    # extract a frame from it) - lets the bulk THUMBNAIL job stop retrying
    # a permanently-doomed file every single run instead of burning up to
    # 30s x 3 sizes on it forever. Cleared again on any successful attempt.
    thumbnail_failed_at = Column(DateTime, nullable=True)

    # ML
    clip_embedding_path = Column(String(1000), nullable=True)
    ml_processed = Column(Boolean, default=False)

    # Encoded video path
    encoded_video_path = Column(String(1000), nullable=True)

    # External library source
    is_external = Column(Boolean, default=False)
    external_path = Column(String(1000), nullable=True)
    # Top-level folder a "Reference" mode import was pointed at (e.g.
    # "D:\Photos\2020"), not the individual file's own path - lets assets
    # from the same import be listed/removed as one group instead of only
    # one file at a time. Null for copy-mode imports/uploads and for
    # anything imported before this column existed.
    reference_root = Column(String(1000), nullable=True, index=True)

    # Backup: when this asset's file was last included in a completed
    # media backup archive - see services/backup_service.py. Null means
    # never backed up, which is what makes each backup run incremental
    # (only assets with backed_up_at IS NULL get archived).
    backed_up_at = Column(DateTime, nullable=True, index=True)

    # Relationships
    user = relationship("User", back_populates="assets")
    faces = relationship("Face", back_populates="asset", cascade="all, delete-orphan")
    album_links = relationship("AlbumAsset", back_populates="asset", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_assets_user_taken", "user_id", "taken_at"),
        Index("ix_assets_user_created", "user_id", "created_at"),
        Index("ix_assets_location", "latitude", "longitude"),
    )

    @property
    def exif_dict(self):
        if self.exif_data:
            try:
                data = json.loads(self.exif_data)
                if isinstance(data, dict):
                    clean_data = {}
                    for k, v in data.items():
                        if isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
                            clean_data[k] = None
                        else:
                            clean_data[k] = v
                    return clean_data
                return data
            except (json.JSONDecodeError, TypeError):
                return {}
        return {}

    @exif_dict.setter
    def exif_dict(self, value):
        self.exif_data = json.dumps(value) if value else None

    @property
    def display_date(self):
        return self.taken_at or self.created_at
