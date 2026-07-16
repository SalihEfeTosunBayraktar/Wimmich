"""Precomputed "this photo looks like that one" relationships (CLIP
embedding cosine similarity), built by the SIMILARITY job - the viewer's
"benzer fotoğraflar" badge reads this table instead of re-scanning every
image's embedding live on every open."""
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Index

from database import Base
from models.common import generate_uuid, utcnow


class SimilarAsset(Base):
    __tablename__ = "similar_assets"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    asset_id = Column(String(36), ForeignKey("assets.id", ondelete="CASCADE"), nullable=False)
    similar_asset_id = Column(String(36), ForeignKey("assets.id", ondelete="CASCADE"), nullable=False)
    score = Column(Float, nullable=False)
    created_at = Column(DateTime, default=utcnow)

    __table_args__ = (
        Index("ix_similar_assets_asset_id", "asset_id"),
    )
