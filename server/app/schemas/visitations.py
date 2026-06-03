from datetime import datetime
from typing import Optional, Literal
from uuid import UUID

from pydantic import BaseModel


class VisitationBase(BaseModel):
    doctor_id: UUID
    patient_id: UUID
    slot_id: UUID


class VisitationCreate(VisitationBase):
    pass


class VisitationUpdateStatus(BaseModel):
    status: Literal["pending", "confirmed", "canceled", "completed"]


class VisitationUpdateSequence(BaseModel):
    sequence_order: int


class VisitationResponse(VisitationBase):
    id: UUID
    status: str
    token: str
    sequence_order: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True