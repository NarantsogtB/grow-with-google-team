from datetime import date, time
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict

from app.api.deps import Database
from app.models.daily_visit_plan import DailyVisitPlan
from app.repositories.daily_visit_plan_repo import DailyVisitPlanRepository
from app.repositories.patient_repo import PatientRepository

router = APIRouter(prefix="/visit-plans", tags=["Visit Plans"])


class VisitPlanCreate(BaseModel):
    date: date
    doctor_id: UUID
    patient_id: UUID
    visit_order: int
    estimated_time: Optional[time] = None


class VisitPlanResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    date: date
    doctor_id: UUID
    patient_id: UUID
    visit_order: int
    estimated_time: Optional[time] = None
    status: str
    # Enriched patient fields (None if patient not found)
    patient_name: Optional[str] = None
    patient_phone: Optional[str] = None
    patient_address: Optional[str] = None
    patient_latitude: Optional[float] = None
    patient_longitude: Optional[float] = None
    has_telegram: bool = False


async def _enrich(plan: DailyVisitPlan, db) -> dict:
    data = {
        "id": plan.id,
        "date": plan.date,
        "doctor_id": plan.doctor_id,
        "patient_id": plan.patient_id,
        "visit_order": plan.visit_order,
        "estimated_time": plan.estimated_time,
        "status": plan.status,
        "patient_name": None,
        "patient_phone": None,
        "patient_address": None,
        "patient_latitude": None,
        "patient_longitude": None,
        "has_telegram": False,
    }
    patient = await PatientRepository(db).get_by_id(str(plan.patient_id))
    if patient:
        data["patient_name"] = patient.full_name
        data["patient_phone"] = patient.phone_number
        data["patient_address"] = patient.address_text
        data["patient_latitude"] = patient.latitude
        data["patient_longitude"] = patient.longitude
        data["has_telegram"] = bool(patient.telegram_chat_id)
    return data


@router.post("/", response_model=VisitPlanResponse)
async def create_visit_plan(body: VisitPlanCreate, db: Database):
    plan = DailyVisitPlan(
        date=body.date,
        doctor_id=body.doctor_id,
        patient_id=body.patient_id,
        visit_order=body.visit_order,
        estimated_time=body.estimated_time,
    )
    created = await DailyVisitPlanRepository(db).create(plan)
    return await _enrich(created, db)


@router.get("/{visit_date}", response_model=List[VisitPlanResponse])
async def list_visit_plans(visit_date: date, db: Database):
    plans = await DailyVisitPlanRepository(db).get_by_date(visit_date)
    return [await _enrich(p, db) for p in plans]


@router.delete("/{plan_id}")
async def delete_visit_plan(plan_id: UUID, db: Database):
    repo = DailyVisitPlanRepository(db)
    plan = await repo.get_by_id(plan_id)
    if not plan:
        raise HTTPException(404, "Төлөвлөгөө олдсонгүй")
    await repo.delete(plan)
    return {"ok": True}
