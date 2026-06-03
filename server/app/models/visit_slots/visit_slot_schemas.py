from datetime import date, time
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class VisitSlotBase(BaseModel):
    """
    Эргэлтийн бодит цагийн слотын үндсэн schema[cite: 17].
    """
    doctor_id: UUID  # Хариуцсан эмч 
    date: date       # Хуанлийн бодит огноо 
    start_time: time # Слотын эхлэх цаг 
    end_time: time   # Слотын дуусах цаг 
    is_booked: bool = False # Өвчтөн хуваарилагдсан эсэх 

    @field_validator("end_time")
    @classmethod
    def validate_end_time(cls, end_time_value, info):
        """
        Дуусах цаг нь эхлэх цагаас хойш байх ёстой.
        """
        start_time_value = info.data.get("start_time")

        if start_time_value and end_time_value <= start_time_value:
            raise ValueError("end_time нь start_time-аас хойш байх ёстой")

        return end_time_value


class VisitSlotCreate(VisitSlotBase):
    pass


class VisitSlotUpdate(BaseModel):
    doctor_id: Optional[UUID] = None
    date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    is_booked: Optional[bool] = None

    @field_validator("end_time")
    @classmethod
    def validate_end_time(cls, end_time_value, info):
        start_time_value = info.data.get("start_time")

        if start_time_value and end_time_value and end_time_value <= start_time_value:
            raise ValueError("end_time нь start_time-аас хойш байх ёстой")

        return end_time_value


class VisitSlotResponse(VisitSlotBase):
    """
    API-аас хариу буцаахад ашиглах schema.
    """
    id: UUID  # Слотын ID 

    class Config:
        from_attributes = True