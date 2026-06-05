# =============================================================================
# HOSPITAL SCHEMAS — app/schemas/hospital.py
# =============================================================================
# Moved from app/models/hospitals/hospital_schemas.py (content unchanged).
# =============================================================================

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import HealthcareLevelEnum


class HospitalBase(BaseModel):
    hospital_name: str = Field(..., min_length=2)
    hospital_phone: str = Field(..., min_length=8, max_length=15)
    address: str = Field(..., min_length=2)
    level: HealthcareLevelEnum = HealthcareLevelEnum.PRIMARY


class HospitalCreate(HospitalBase):
    pass


class HospitalUpdate(BaseModel):
    """All fields optional — only send what needs changing."""

    hospital_name: Optional[str] = None
    hospital_phone: Optional[str] = None
    address: Optional[str] = None
    level: Optional[HealthcareLevelEnum] = None


class HospitalResponse(HospitalBase):
    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class HospitalUpdateResponse(BaseModel):
    message: str
    data: HospitalResponse

    model_config = ConfigDict(from_attributes=True)


class HospitalDeleteResponse(BaseModel):
    message: str
    success: bool
