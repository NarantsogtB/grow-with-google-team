from datetime import time
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.common_types.enums import DayOfWeekEnum


class DoctorWeeklyScheduleBase(BaseModel):
    """
    Эмчийн 7 хоног бүр давтагдах гэрийн эргэлтийн хуваарийн үндсэн schema.
    """

    doctor_id: UUID
    day_of_week: DayOfWeekEnum
    start_time: time
    end_time: time
    max_patients: int = Field(default=5, gt=0)
    is_active: bool = True

    @field_validator("end_time")
    @classmethod
    def validate_end_time(cls, end_time_value, info):
        """
        Дуусах цаг нь эхлэх цагаас хойш байх ёстой.
        Жишээ:
        - Зөв: 14:00 - 17:00
        - Буруу: 17:00 - 14:00
        """

        start_time_value = info.data.get("start_time")

        if start_time_value and end_time_value <= start_time_value:
            raise ValueError("end_time нь start_time-аас хойш байх ёстой")

        return end_time_value


class DoctorWeeklyScheduleCreate(DoctorWeeklyScheduleBase):
    pass


class DoctorWeeklyScheduleUpdate(BaseModel):
    """
    Бүх талбар Optional байна.
    Учир нь update хийх үед зөвхөн өөрчлөх талбараа явуулж болно.
    """

    day_of_week: Optional[DayOfWeekEnum] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    max_patients: Optional[int] = Field(default=None, gt=0)
    is_active: Optional[bool] = None

    @field_validator("end_time")
    @classmethod
    def validate_end_time(cls, end_time_value, info):

        start_time_value = info.data.get("start_time")

        if start_time_value and end_time_value and end_time_value <= start_time_value:
            raise ValueError("end_time нь start_time-аас хойш байх ёстой")

        return end_time_value


class DoctorWeeklyScheduleResponse(DoctorWeeklyScheduleBase):
    id: UUID

    # Pydantic V2 style — replaces the deprecated `class Config`
    model_config = ConfigDict(from_attributes=True)
