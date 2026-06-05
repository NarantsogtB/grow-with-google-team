from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.visitations.visitation_models import VisitStatus


class VisitationBase(BaseModel):
    doctor_id: UUID
    patient_id: UUID
    slot_id: UUID


class VisitationCreate(VisitationBase):
    pass


class VisitationUpdateStatus(BaseModel):
    status: VisitStatus


class VisitationUpdateSequence(BaseModel):
    sequence_order: int | None = None


class VisitationResponse(VisitationBase):
    id: UUID
    status: VisitStatus
    token: str
    sequence_order: int | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)