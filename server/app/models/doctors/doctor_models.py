from sqlalchemy import Column, String, DateTime, Boolean, Enum, func, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base
from app.common_types.enums import GenderEnum, DoctorRoleEnum

import uuid


class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    gender = Column(Enum(GenderEnum, name="doctor_gender_enum"))
    phone = Column(String, nullable=False, unique=True, index=True)
    email = Column(String, nullable=False, unique=True)
    role = Column(Enum(DoctorRoleEnum, name="doctor_role_enum"), default=DoctorRoleEnum.GENERAL)
    assigned_sector = Column(String, nullable=False)
    telegram_id = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_available = Column(Boolean, default=True)
    password = Column(String, nullable=True, default=None)

    hospital_id = Column(UUID(as_uuid=True), ForeignKey("hospitals.id"))
    hospital = relationship("Hospital", back_populates="doctors")

    # Нэг эмч олон weekly schedule-тэй байж болно
    weekly_schedules = relationship(
        "DoctorWeeklySchedule",
        back_populates="doctor",
        cascade="all, delete-orphan",
    )

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    
    visit_slots = relationship("VisitSlot", back_populates="doctor")
    visitations = relationship("Visitation", back_populates="doctor")