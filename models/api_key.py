"""Long-lived API keys for external clients - scripts, integrations, or a
future mobile app - that need to authenticate without going through the
interactive login flow a JWT assumes (email/password, hours-long expiry,
refresh on next login). A key is shown once at creation and never stored or
retrievable in raw form again; only its SHA-256 hash lives here."""
from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship

from database import Base
from models.common import generate_uuid, utcnow


class ApiKey(Base):
    __tablename__ = "api_keys"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    key_hash = Column(String(64), unique=True, nullable=False, index=True)
    # First few characters of the raw key, kept so the user can tell keys
    # apart in the list ("wmk_ab12cd34...") without the secret itself ever
    # being displayed again.
    key_prefix = Column(String(16), nullable=False)
    created_at = Column(DateTime, default=utcnow)
    last_used_at = Column(DateTime, nullable=True)
    revoked = Column(Boolean, default=False)

    user = relationship("User")
