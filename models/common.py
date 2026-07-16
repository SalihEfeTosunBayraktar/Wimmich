"""Shared helpers for SQLAlchemy models."""
import uuid
from datetime import datetime, timezone


def generate_uuid():
    return str(uuid.uuid4())


def utcnow():
    return datetime.now(timezone.utc)
