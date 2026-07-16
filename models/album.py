"""Album models: Album, its asset links, and its user shares."""
from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

from database import Base
from models.common import generate_uuid, utcnow


class Album(Base):
    __tablename__ = "albums"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    cover_asset_id = Column(String(36), nullable=True)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    user = relationship("User", back_populates="albums")
    asset_links = relationship("AlbumAsset", back_populates="album", cascade="all, delete-orphan")
    shared_users = relationship("AlbumUser", back_populates="album", cascade="all, delete-orphan")


class AlbumAsset(Base):
    __tablename__ = "album_assets"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    album_id = Column(String(36), ForeignKey("albums.id", ondelete="CASCADE"), nullable=False, index=True)
    asset_id = Column(String(36), ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, index=True)
    added_at = Column(DateTime, default=utcnow)

    album = relationship("Album", back_populates="asset_links")
    asset = relationship("Asset", back_populates="album_links")

    __table_args__ = (
        UniqueConstraint("album_id", "asset_id", name="uq_album_asset"),
    )


class AlbumUser(Base):
    __tablename__ = "album_users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    album_id = Column(String(36), ForeignKey("albums.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    can_edit = Column(Boolean, default=False)
    added_at = Column(DateTime, default=utcnow)

    album = relationship("Album", back_populates="shared_users")
    user = relationship("User")

    __table_args__ = (
        UniqueConstraint("album_id", "user_id", name="uq_album_user"),
    )
