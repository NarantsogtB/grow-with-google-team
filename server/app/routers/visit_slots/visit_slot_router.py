from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.controllers.visit_slots.visit_slot_controller import (
    create_visit_slot,
    get_visit_slots,
    get_visit_slot_by_id,
    get_visit_slots_by_doctor_id,
    update_visit_slot,
    delete_visit_slot,
)
from app.models.visit_slots.visit_slot_schemas import (
    VisitSlotCreate,
    VisitSlotUpdate,
)

router = APIRouter(
    prefix="/visit-slots",
    tags=["Visit Slots"],
)


@router.post("/")
def create_slot(
    slot_data: VisitSlotCreate,
    db: Session = Depends(get_db),
):
    return create_visit_slot(db, slot_data)


@router.get("/")
def get_all_slots(
    db: Session = Depends(get_db),
):
    return get_visit_slots(db)


@router.get("/{slot_id}")
def get_slot(
    slot_id: UUID,
    db: Session = Depends(get_db),
):
    return get_visit_slot_by_id(db, slot_id)


@router.get("/doctor/{doctor_id}")
def get_doctor_slots(
    doctor_id: UUID,
    db: Session = Depends(get_db),
):
    return get_visit_slots_by_doctor_id(db, doctor_id)


@router.put("/{slot_id}")
def update_slot(
    slot_id: UUID,
    slot_data: VisitSlotUpdate,
    db: Session = Depends(get_db),
):
    return update_visit_slot(
        db,
        slot_id,
        slot_data,
    )


@router.delete("/{slot_id}")
def delete_slot(
    slot_id: UUID,
    db: Session = Depends(get_db),
):
    return delete_visit_slot(db, slot_id)