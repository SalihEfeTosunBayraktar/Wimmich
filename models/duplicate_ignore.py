"""Records a duplicate-checksum group the user chose to skip (not the same
files, just "leave this group alone") so it stops showing up on the
duplicates page without deleting anything."""
from sqlalchemy import Column, String, DateTime, ForeignKey, UniqueConstraint

from database import Base
from models.common import generate_uuid, utcnow


class IgnoredDuplicateGroup(Base):
    __tablename__ = "ignored_duplicate_groups"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    checksum = Column(String(64), nullable=False, index=True)
    created_at = Column(DateTime, default=utcnow)

    __table_args__ = (
        UniqueConstraint("user_id", "checksum", name="uq_ignored_dup_user_checksum"),
    )
