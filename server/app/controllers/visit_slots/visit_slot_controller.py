from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.doctors.doctor_models import Doctor
from app.models.visit_slots.visit_slot_models import VisitSlot
from app.models.visit_slots.visit_slot_schemas import VisitSlotCreate, VisitSlotUpdate


def create_visit_slot(db: Session, slot_data: VisitSlotCreate):
    doctor = db.query(Doctor).filter(Doctor.id == slot_data.doctor_id).first()

    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    visit_slot = VisitSlot(
        doctor_id=slot_data.doctor_id,
        date=slot_data.date,
        start_time=slot_data.start_time,
        end_time=slot_data.end_time,
        is_booked=slot_data.is_booked,
    )

    db.add(visit_slot)
    db.commit()
    db.refresh(visit_slot)

    return visit_slot


def get_visit_slots(db: Session):
    return db.query(VisitSlot).all()


def get_visit_slot(db: Session, slot_id: UUID):
    visit_slot = db.query(VisitSlot).filter(VisitSlot.id == slot_id).first()

    if not visit_slot:
        raise HTTPException(status_code=404, detail="Visit slot not found")

    return visit_slot


def get_visit_slots_by_doctor(db: Session, doctor_id: UUID):
    return db.query(VisitSlot).filter(VisitSlot.doctor_id == doctor_id).all()


def update_visit_slot(db: Session, slot_id: UUID, slot_data: VisitSlotUpdate):
    visit_slot = get_visit_slot(db, slot_id)

    update_data = slot_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(visit_slot, field, value)

    db.commit()
    db.refresh(visit_slot)

    return visit_slot


def delete_visit_slot(db: Session, slot_id: UUID):
    visit_slot = get_visit_slot(db, slot_id)

    db.delete(visit_slot)
    db.commit()

    return {"message": "Visit slot deleted successfully"}

def get_visit_slot_by_id(db: Session, slot_id: UUID):
    return get_visit_slot(db, slot_id)


def get_visit_slots_by_doctor_id(db: Session, doctor_id: UUID):
    return get_visit_slots_by_doctor(db, doctor_id)