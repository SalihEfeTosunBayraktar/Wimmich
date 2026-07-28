"""Admin action audit trail - a record of who did what, kept separate from
the actions' own tables (User, config files, etc.) so it survives even
when the thing acted on is later deleted (e.g. the user themselves)."""
import json
from sqlalchemy import Column, String, Text, DateTime, ForeignKey

from database import Base
from models.common import generate_uuid, utcnow


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    actor_user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    # Denormalized so the log entry stays readable ("admin@x.com did Y")
    # even after the actor account itself is deleted later.
    actor_email = Column(String(255), nullable=False)
    action = Column(String(100), nullable=False, index=True)  # e.g. "user.delete", "config.update"
    target_type = Column(String(50), nullable=True)
    target_id = Column(String(255), nullable=True)
    detail_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow, index=True)

    @property
    def detail(self):
        if self.detail_json:
            try:
                return json.loads(self.detail_json)
            except (json.JSONDecodeError, TypeError):
                return None
        return None

    @detail.setter
    def detail(self, value):
        self.detail_json = json.dumps(value) if value is not None else None
