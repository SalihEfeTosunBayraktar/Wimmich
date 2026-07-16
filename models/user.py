"""User model."""
from sqlalchemy import Column, String, Integer, Boolean, DateTime
from sqlalchemy.orm import relationship

from database import Base
from models.common import generate_uuid, utcnow


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    is_admin = Column(Boolean, default=False)
    storage_quota_mb = Column(Integer, default=0)  # 0 = unlimited
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)
    profile_image_path = Column(String(500), nullable=True)
    is_approved = Column(Boolean, default=False)

    # Relationships
    assets = relationship("Asset", back_populates="user", cascade="all, delete-orphan")
    albums = relationship("Album", back_populates="user", cascade="all, delete-orphan")
    persons = relationship("Person", back_populates="user", cascade="all, delete-orphan")
    shared_links = relationship("SharedLink", back_populates="user", cascade="all, delete-orphan")
