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
    # Request priority (1-5, 5 highest) - only changes anything under actual
    # contention (see services/request_priority.py's PriorityGate); baked
    # into the JWT at login time same as is_admin, so a change here takes
    # effect on the user's next login, not their already-issued token.
    priority = Column(Integer, default=3, nullable=False)
    # 2FA (TOTP). totp_secret is written at /2fa/setup time but totp_enabled
    # stays False until the user actually confirms a code at /2fa/verify -
    # an abandoned setup attempt (scanned the QR, never entered a code)
    # must never silently turn on 2FA on its own.
    totp_secret = Column(String(32), nullable=True)
    totp_enabled = Column(Boolean, default=False, nullable=False)

    # Relationships
    assets = relationship("Asset", back_populates="user", cascade="all, delete-orphan")
    albums = relationship("Album", back_populates="user", cascade="all, delete-orphan")
    persons = relationship("Person", back_populates="user", cascade="all, delete-orphan")
    shared_links = relationship("SharedLink", back_populates="user", cascade="all, delete-orphan")
