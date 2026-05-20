from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from app.common_types.enums import GenderEnum, DoctorRoleEnum
from datetime import datetime

class DoctorBase(BaseModel):
    first_name: str = Field(..., min_length=2)
    last_name: str = Field(..., min_length=2)
    gender: GenderEnum 
    phone: str = Field(..., min_length=8, max_length=15)
    email: EmailStr = Field(..., min_length=2)
    role: DoctorRoleEnum = DoctorRoleEnum.GENERAL
    assigned_sector: str = Field(..., max_length=2)
    telegram_id: Optional[str] = None
    hospital_id: Optional[str] = None


class DoctorCreate(DoctorBase):
    pass

class DoctorUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    gender: Optional[GenderEnum] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[DoctorRoleEnum] = None
    assigned_sector: Optional[str] = None
    is_active: Optional[bool] = None
    is_available: Optional[bool] = None
    telegram_id: Optional[str] = None
    hospital_id: Optional[str] = None

class DoctorDeleteResponse(BaseModel):
    message: str
    success: bool

class DoctorResponse(DoctorBase):
    id: str
    is_active: bool
    is_available: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True  