"""Records "this photo doesn't belong in this smart category" feedback -
see services/smart_category_service.py. Each correction's asset CLIP
embedding acts as a negative example: future/other classifications that
land too close to it get vetoed away from that category."""
from sqlalchemy import Column, String, DateTime, ForeignKey, UniqueConstraint

from database import Base
from models.common import generate_uuid, utcnow


class CategoryCorrection(Base):
    __tablename__ = "category_corrections"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    asset_id = Column(String(36), ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(String(30), nullable=False, index=True)
    created_at = Column(DateTime, default=utcnow)

    __table_args__ = (
        UniqueConstraint("asset_id", "category", name="uq_category_correction_asset_category"),
    )
