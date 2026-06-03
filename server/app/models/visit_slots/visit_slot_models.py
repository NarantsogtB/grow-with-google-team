from sqlalchemy import Column, Date, Time, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from app.database import Base


class VisitSlot(Base):
    __tablename__ = "visit_slots"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )

    doctor_id = Column(
        UUID(as_uuid=True),
        ForeignKey("doctors.id"),  # <-- users.id биш, doctors.id
        nullable=False,
    )

    date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    is_booked = Column(Boolean, default=False)

    doctor = relationship("Doctor")