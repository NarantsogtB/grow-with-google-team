from datetime import datetime
from typing import List, Optional
from uuid import UUID

from app.common_types.enums import HealthcareLevelEnum
from pydantic import BaseModel, ConfigDict, Field


class HospitalBase(BaseModel):
    hospital_name: str = Field(..., min_length=2)
    hospital_phone: str = Field(..., min_length=8, max_length=15)
    address: str = Field(..., min_length=2)
    level: HealthcareLevelEnum = HealthcareLevelEnum.PRIMARY


class HospitalCreate(HospitalBase):
    pass


class HospitalUpdate(BaseModel):
    hospital_name: Optional[str] = None
    hospital_phone: Optional[str] = None
    address: Optional[str] = None
    level: Optional[HealthcareLevelEnum] = None


class HospitalDeleteResponse(BaseModel):
    message: str
    success: bool


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


class HospitalListResponse(BaseModel):
    items: List[HospitalResponse]
    total: int
    page: int
    size: int
