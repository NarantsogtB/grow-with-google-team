import enum
from datetime import datetime
from uuid import uuid4

from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class VisitStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELED = "canceled"
    COMPLETED = "completed"


class Visitation(Base):
    __tablename__ = "visitations"

    id = Column(UUID(as_uuid=True), default=uuid4, primary_key=True)

    doctor_id = Column(UUID(as_uuid=True), ForeignKey("doctors.id"), nullable=False)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    slot_id = Column(UUID(as_uuid=True), ForeignKey("visit_slots.id"), nullable=False, unique=True)

    status = Column(
        Enum(VisitStatus),
        default=VisitStatus.PENDING,
        nullable=False
    )

    token = Column(String, unique=True, nullable=False, index=True)
    sequence_order = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    doctor = relationship("Doctor")
    patient = relationship("Patient")
    slot = relationship("VisitSlot")