"""Login session tracking - a bare JWT has no server-side concept of
"currently valid logins" to list or kill, so there'd otherwise be no way
for a user to see "is someone else logged into my account" or revoke a
device that's no longer theirs (a friend's borrowed phone, a lost laptop)
without changing their password and invalidating every session at once."""
from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship

from database import Base
from models.common import generate_uuid, utcnow


class Session(Base):
    __tablename__ = "sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    # The JWT's own "jti" claim - what a presented token is matched against
    # to find its session row (see auth.py's get_current_user).
    jti = Column(String(36), unique=True, nullable=False, index=True)
    created_at = Column(DateTime, default=utcnow)
    last_seen_at = Column(DateTime, default=utcnow)
    user_agent = Column(String(500), nullable=True)
    ip_address = Column(String(64), nullable=True)
    revoked = Column(Boolean, default=False)

    user = relationship("User")
