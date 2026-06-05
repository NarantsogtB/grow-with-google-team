# =============================================================================
# DOCTOR WEEKLY SCHEDULE MODEL — app/models/schedule.py
# =============================================================================
# Flat model file — moved from models/doctor_weekly_schedules/…_models.py
#
# This model represents the TEMPLATE for a doctor's recurring weekly schedule.
# For example: "Every Monday, 09:00-12:00, max 5 patients"
#
# It does NOT store individual appointments — it stores the repeating pattern.
# Individual time slots would be generated from this template on a daily basis.
# =============================================================================

from uuid import uuid4

from sqlalchemy import Boolean, Column, Enum, ForeignKey, Integer, Time
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import Base
from app.models.enums import DayOfWeekEnum


class DoctorWeeklySchedule(Base):
    __tablename__ = "doctor_weekly_schedules"

    # Unique ID for this schedule template
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)

    # Which doctor this schedule belongs to
    # ForeignKey ensures you can't create a schedule for a non-existent doctor
    doctor_id = Column(UUID(as_uuid=True), ForeignKey("doctors.id"), nullable=False)

    # Which day of the week (Monday–Friday)
    day_of_week = Column(Enum(DayOfWeekEnum), nullable=False)

    # Visit window start and end times (e.g., 09:00 and 12:00)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)

    # Maximum number of home visits scheduled in this time window
    max_patients = Column(Integer, nullable=False, default=5)

    # If False, no visits are scheduled for this day/time window
    # (e.g., doctor on leave or temporary suspension)
    is_active = Column(Boolean, nullable=False, default=True)

    # ORM back-reference: schedule.doctor → Doctor object
    doctor = relationship("Doctor", back_populates="weekly_schedules")
