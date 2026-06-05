from datetime import datetime
from uuid import uuid4

from sqlalchemy import (Column, Date, DateTime, ForeignKey, Integer, String,
                        Time)
from sqlalchemy.dialects.postgresql import UUID

from app.models.base import Base


class DailyVisitPlan(Base):
    __tablename__ = "daily_visit_plans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    date = Column(Date, nullable=False, index=True)
    doctor_id = Column(
        UUID(as_uuid=True), ForeignKey("doctors.id"), nullable=False, index=True
    )
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    visit_order = Column(Integer, nullable=False)
    estimated_time = Column(Time, nullable=True)
    status = Column(String(20), default="pending")  # pending / confirmed / declined
    created_at = Column(DateTime, default=datetime.utcnow)
