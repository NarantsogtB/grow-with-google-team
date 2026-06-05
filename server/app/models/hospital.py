# =============================================================================
# HOSPITAL MODEL — app/models/hospital.py
# =============================================================================
# Flat model file — moved from models/hospitals/hospital_models.py
# =============================================================================

import uuid

from app.models.base import Base
from app.models.enums import HealthcareLevelEnum
from sqlalchemy import Boolean, Column, DateTime, Enum, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func


class Hospital(Base):
    __tablename__ = "hospitals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    hospital_name = Column(String, nullable=False)

    # Phone used as unique identifier for duplicate-check on creation
    hospital_phone = Column(String, nullable=False, unique=True, index=True)

    address = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)

    # Mongolian healthcare level (PRIMARY = өрхийн эмнэлэг)
    level = Column(
        Enum(HealthcareLevelEnum, name="hospital_level_enum"),
        default=HealthcareLevelEnum.PRIMARY,
    )

    # One hospital → many doctors
    doctors = relationship("Doctor", back_populates="hospital", cascade="all, delete-orphan")

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
