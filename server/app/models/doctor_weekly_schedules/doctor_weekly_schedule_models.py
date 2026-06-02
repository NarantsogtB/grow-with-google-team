from uuid import uuid4

from sqlalchemy import Boolean, Column, Enum, ForeignKey, Integer, Time
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base
from app.common_types.enums import DayOfWeekEnum


class DoctorWeeklySchedule(Base):
    __tablename__ = "doctor_weekly_schedules"

    # Schedule бүрийн давтагдахгүй ID
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)

    # Schedule аль эмчид хамаарахыг заана
    doctor_id = Column(UUID(as_uuid=True), ForeignKey("doctors.id"), nullable=False)

    # Долоо хоногийн аль өдөр гэдгийг хадгална
    day_of_week = Column(Enum(DayOfWeekEnum), nullable=False)

    start_time = Column(Time, nullable=False)

    end_time = Column(Time, nullable=False)

    max_patients = Column(Integer, nullable=False, default=5)

    # Schedule идэвхтэй эсэх
    # False бол энэ schedule-ээс slot үүсгэхгүй
    is_active = Column(Boolean, nullable=False, default=True)

    # Нэг эмч олон weekly schedule-тэй байж болно
    doctor = relationship("Doctor", back_populates="weekly_schedules")