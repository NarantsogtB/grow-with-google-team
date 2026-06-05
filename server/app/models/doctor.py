# =============================================================================
# DOCTOR MODEL — app/models/doctor.py
# =============================================================================
# Flat model file — moved from models/doctors/doctor_models.py
# Table definition is IDENTICAL to the original to avoid Alembic drift.
# =============================================================================

import uuid

from app.models.base import Base
from app.models.enums import DoctorRoleEnum, GenderEnum
from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func


class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)

    # Enum stored as named PostgreSQL type ("doctor_gender_enum") so Alembic
    # can track it separately from the Python enum class
    gender = Column(Enum(GenderEnum, name="doctor_gender_enum"))

    phone = Column(String, nullable=False, unique=True, index=True)
    email = Column(String, nullable=False, unique=True)
    role = Column(
        Enum(DoctorRoleEnum, name="doctor_role_enum"),
        default=DoctorRoleEnum.GENERAL,
    )

    # Sector of the city this doctor covers (e.g., "14" for Нийслэлийн 14-р хороо)
    assigned_sector = Column(String, nullable=False)

    telegram_id = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_available = Column(Boolean, default=True)
    password = Column(String, nullable=True, default=None)

    # Foreign key to hospitals table
    hospital_id = Column(UUID(as_uuid=True), ForeignKey("hospitals.id"))

    # ORM relationship: doctor.hospital → Hospital object
    # lazy="select" means it only loads when accessed (default behavior)
    hospital = relationship("Hospital", back_populates="doctors")

    # A doctor can have multiple weekly schedule templates
    # cascade="all, delete-orphan" → deleting a doctor also deletes their schedules
    weekly_schedules = relationship(
        "DoctorWeeklySchedule",
        back_populates="doctor",
        cascade="all, delete-orphan",
    )

    # Timestamps: server_default uses DB-level NOW() for reliability
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
