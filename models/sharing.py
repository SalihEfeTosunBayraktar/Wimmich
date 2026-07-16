"""SharedLink model - public share links for assets/albums."""
import json
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship

from database import Base
from models.common import generate_uuid, utcnow


class SharedLink(Base):
    __tablename__ = "shared_links"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    key = Column(String(64), unique=True, nullable=False, index=True)
    link_type = Column(String(10), nullable=False)  # ASSET, ALBUM
    album_id = Column(String(36), ForeignKey("albums.id", ondelete="CASCADE"), nullable=True)
    asset_ids_json = Column(Text, nullable=True)  # JSON array of asset IDs
    password_hash = Column(String(255), nullable=True)
    expires_at = Column(DateTime, nullable=True)
    allow_download = Column(Boolean, default=True)
    allow_upload = Column(Boolean, default=False)
    description = Column(Text, nullable=True)
    view_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=utcnow)

    user = relationship("User", back_populates="shared_links")

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
