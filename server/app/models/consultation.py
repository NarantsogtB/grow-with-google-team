from datetime import datetime
from uuid import uuid4

from sqlalchemy import Column, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID

from app.models.base import Base


class Consultation(Base):
    __tablename__ = "consultations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    doctor_id = Column(
        UUID(as_uuid=True), ForeignKey("doctors.id"), nullable=True, index=True
    )
    patient_id = Column(
        UUID(as_uuid=True), ForeignKey("patients.id"), nullable=True, index=True
    )
    patient_name = Column(String(200), nullable=True)
    transcription = Column(Text, nullable=True)
    soap_s = Column(Text, nullable=True)
    soap_o = Column(Text, nullable=True)
    soap_a = Column(Text, nullable=True)
    soap_p = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
