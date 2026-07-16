"""Job model - background job queue entries."""
import json
from sqlalchemy import Column, String, Integer, Text, DateTime

from database import Base
from models.common import generate_uuid, utcnow


class Job(Base):
    __tablename__ = "jobs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    job_type = Column(String(50), nullable=False, index=True)  # THUMBNAIL, CLIP, FACE, SCAN, CLEANUP
    status = Column(String(20), default="PENDING", index=True)  # PENDING, RUNNING, COMPLETED, FAILED
    data_json = Column(Text, nullable=True)  # JSON payload
    result_json = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    progress = Column(Integer, default=0)  # 0-100
    created_at = Column(DateTime, default=utcnow)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    @property
    def data(self):
        if self.data_json:
            try:
                return json.loads(self.data_json)
            except (json.JSONDecodeError, TypeError):
                return {}
        return {}

    @data.setter
    def data(self, value):
        self.data_json = json.dumps(value) if value else None
