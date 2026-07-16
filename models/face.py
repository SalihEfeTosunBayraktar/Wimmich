"""Face recognition models: Person (a recognized identity) and Face (a detection)."""
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from database import Base
from models.common import generate_uuid, utcnow


class Person(Base):
    __tablename__ = "persons"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=True)
    thumbnail_face_id = Column(String(36), nullable=True)
    is_hidden = Column(Boolean, default=False)
    face_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    user = relationship("User", back_populates="persons")
    faces = relationship("Face", back_populates="person")


class Face(Base):
    __tablename__ = "faces"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    asset_id = Column(String(36), ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, index=True)
    person_id = Column(String(36), ForeignKey("persons.id", ondelete="SET NULL"), nullable=True, index=True)

    # Face bounding box (normalized 0-1)
    x = Column(Float, nullable=False)
    y = Column(Float, nullable=False)
    w = Column(Float, nullable=False)
    h = Column(Float, nullable=False)

    # Embedding
    embedding_path = Column(String(1000), nullable=True)

    # Confidence
    confidence = Column(Float, nullable=True)

    created_at = Column(DateTime, default=utcnow)

    asset = relationship("Asset", back_populates="faces")
    person = relationship("Person", back_populates="faces")
