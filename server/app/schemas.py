from pydantic import BaseModel


class PatientBase(BaseModel):
    name: str
    phone: str
    telegram_id: str | None = None
    address: str | None = None
    risk_level: str = "low"


class PatientCreate(PatientBase):
    pass


class PatientResponse(PatientBase):
    id: int

    class Config:
        from_attributes = True