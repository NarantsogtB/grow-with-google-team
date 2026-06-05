from datetime import datetime
from typing import Optional
from uuid import UUID

from app.api.deps import Database
from app.models.consultation import Consultation
from app.repositories.consultation_repo import ConsultationRepository
from fastapi import APIRouter, Query
from pydantic import BaseModel, ConfigDict

router = APIRouter(prefix="/consultations", tags=["Consultations"])


class ConsultationCreate(BaseModel):
    doctor_id: Optional[UUID] = None
    patient_id: Optional[UUID] = None
    patient_name: Optional[str] = None
    transcription: Optional[str] = None
    soap_s: Optional[str] = None
    soap_o: Optional[str] = None
    soap_a: Optional[str] = None
    soap_p: Optional[str] = None


class ConsultationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    doctor_id: Optional[UUID] = None
    patient_id: Optional[UUID] = None
    patient_name: Optional[str] = None
    transcription: Optional[str] = None
    soap_s: Optional[str] = None
    soap_o: Optional[str] = None
    soap_a: Optional[str] = None
    soap_p: Optional[str] = None
    created_at: datetime


@router.post("/", response_model=ConsultationResponse)
async def create_consultation(body: ConsultationCreate, db: Database):
    obj = Consultation(
        doctor_id=body.doctor_id,
        patient_id=body.patient_id,
        patient_name=body.patient_name,
        transcription=body.transcription,
        soap_s=body.soap_s,
        soap_o=body.soap_o,
        soap_a=body.soap_a,
        soap_p=body.soap_p,
    )
    created = await ConsultationRepository(db).create(obj)
    return created


@router.get("/", response_model=dict)
async def list_consultations(
    db: Database,
    doctor_id: Optional[UUID] = Query(default=None),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
):
    repo = ConsultationRepository(db)
    if doctor_id:
        items, total = await repo.get_by_doctor(doctor_id, page, size)
    else:
        items, total = await repo.get_all_paginated(page, size)

    return {
        "items": [ConsultationResponse.model_validate(c).model_dump() for c in items],
        "total": total,
        "page": page,
        "size": size,
    }
