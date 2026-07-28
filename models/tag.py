"""Free-text tags for organizing assets beyond albums/smart-categories -
a plain many-to-many, scoped per-user like everything else (two users
can each have their own "vacation" tag without colliding)."""
from sqlalchemy import Column, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

from database import Base
from models.common import generate_uuid, utcnow


class Tag(Base):
    __tablename__ = "tags"
    __table_args__ = (UniqueConstraint("user_id", "name", name="uq_tag_user_name"),)

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False, index=True)
    created_at = Column(DateTime, default=utcnow)


class AssetTag(Base):
    __tablename__ = "asset_tags"

    asset_id = Column(String(36), ForeignKey("assets.id", ondelete="CASCADE"), primary_key=True)
    tag_id = Column(String(36), ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True)

    tag = relationship("Tag")
