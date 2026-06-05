from datetime import datetime
from typing import Optional, Literal
from uuid import UUID

from pydantic import BaseModel


class PatientBase(BaseModel):
    full_name: str
    phone_number: str
    telegram_chat_id: Optional[str] = None
    address_text: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class PatientCreate(PatientBase):
    password: str  # Хэрэглэгч бүртгүүлэхэд фронтоос нууц үгийг нь хүлээж авна


class PatientResponse(PatientBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    phone_number: str
    password: str