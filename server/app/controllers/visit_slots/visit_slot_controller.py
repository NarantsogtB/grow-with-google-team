from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db  # төслийн чинь зам өөр байж болно

from app.models.visit_slots.visit_slot_models import VisitSlot
from app.models.visit_slots.visit_slot_schemas import (
    VisitSlotCreate,
    VisitSlotUpdate,
)
from app.models.doctors.doctor_models import Doctor

router = APIRouter(
    prefix="/visit-slots",
    tags=["Visit Slots"]
)


@router.post("/")
def create_visit_slot(
    slot_data: VisitSlotCreate,
    db: Session = Depends(get_db),
):
    doctor = db.query(Doctor).filter(
        Doctor.id == slot_data.doctor_id
    ).first()

    if not doctor:
        raise HTTPException(
            status_code=404,
            detail="Doctor not found",
        )

    new_slot = VisitSlot(**slot_data.model_dump())

    db.add(new_slot)
    db.commit()
    db.refresh(new_slot)

    return new_slot


@router.get("/")
def get_visit_slots(
    db: Session = Depends(get_db),
):
    return db.query(VisitSlot).all()


@router.get("/{slot_id}")
def get_visit_slot_by_id(
    slot_id: UUID,
    db: Session = Depends(get_db),
):
    slot = db.query(VisitSlot).filter(
        VisitSlot.id == slot_id
    ).first()

    if not slot:
        raise HTTPException(
            status_code=404,
            detail="Visit slot not found",
        )

    return slot


@router.get("/doctor/{doctor_id}")
def get_visit_slots_by_doctor_id(
    doctor_id: UUID,
    db: Session = Depends(get_db),
):
    return (
        db.query(VisitSlot)
        .filter(VisitSlot.doctor_id == doctor_id)
        .all()
    )


@router.put("/{slot_id}")
def update_visit_slot(
    slot_id: UUID,
    slot_data: VisitSlotUpdate,
    db: Session = Depends(get_db),
):
    slot = db.query(VisitSlot).filter(
        VisitSlot.id == slot_id
    ).first()

    if not slot:
        raise HTTPException(
            status_code=404,
            detail="Visit slot not found",
        )

    update_data = slot_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(slot, field, value)

    db.commit()
    db.refresh(slot)

    return slot


@router.delete("/{slot_id}")
def delete_visit_slot(
    slot_id: UUID,
    db: Session = Depends(get_db),
):
    slot = db.query(VisitSlot).filter(
        VisitSlot.id == slot_id
    ).first()

    if not slot:
        raise HTTPException(
            status_code=404,
            detail="Visit slot not found",
        )

    db.delete(slot)
    db.commit()

    return {
        "message": "Visit slot deleted successfully"
    }