"""Records an asset the user chose to dismiss from visual-duplicate ("Similar
Photos") grouping - per-asset rather than per-group, since a cluster's
membership (and therefore any group-level hash) shifts as new photos are
added, which would otherwise let a dismissed group silently reappear."""
from sqlalchemy import Column, String, DateTime, ForeignKey, UniqueConstraint

from database import Base
from models.common import generate_uuid, utcnow


class IgnoredSimilarAsset(Base):
    __tablename__ = "ignored_similar_assets"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    asset_id = Column(String(36), ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime, default=utcnow)

    __table_args__ = (
        UniqueConstraint("user_id", "asset_id", name="uq_ignored_similar_user_asset"),
    )
