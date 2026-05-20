from typing import Optional
from pydantic import BaseModel, Field
from app.common_types.enums import HealthcareLevelEnum
from datetime import datetime


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
    id: str
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True