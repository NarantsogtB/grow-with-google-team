from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.models import GenderEnum, PatientTypeEnum, ActionTypeEnum


class PatientBase(BaseModel):
    name: str
    phone: str
    telegram_id: Optional[str] = None
    address: Optional[str] = None

    age: Optional[int] = None
    gender: Optional[GenderEnum] = None

    medical_history: Optional[str] = None
    anamnesis: Optional[str] = None
    symptoms: Optional[str] = None

    is_active: bool = True
    action_type: Optional[ActionTypeEnum] = None

    guardian_phone: Optional[str] = None
    patient_type: PatientTypeEnum = PatientTypeEnum.REGULAR #Өвчтөний төрөл явуулахгүй бол автоматаар Regular болно.

    registration_number: Optional[str] = None
    location_coordinates: Optional[str] = None

    risk_level: str = "low"
    last_visit_at: Optional[datetime] = None


class PatientCreate(PatientBase):
    pass


class PatientResponse(PatientBase):
    id: int
    uuid: str
    created_at: datetime

    class Config: #SQLAlchemy object → Pydantic response → JSON
        from_attributes = True