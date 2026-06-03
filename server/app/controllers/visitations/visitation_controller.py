import secrets
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.visitations.visitation_models import Visitation, VisitStatus
from app.models.visit_slots.visit_slot_models import VisitSlot
from app.models.patients.patient_models import Patient
from app.utils.telegram_client import send_visit_message


async def create_visitation(db: Session, data):
    slot = db.query(VisitSlot).filter(VisitSlot.id == data.slot_id).first()

    if not slot:
        raise HTTPException(status_code=404, detail="Visit slot not found")

    if slot.is_booked:
        raise HTTPException(status_code=400, detail="This slot is already booked")

    if slot.doctor_id != data.doctor_id:
        raise HTTPException(
            status_code=400,
            detail="This slot does not belong to this doctor",
        )

    patient = db.query(Patient).filter(Patient.id == data.patient_id).first()

    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    token = secrets.token_urlsafe(32)

    visitation = Visitation(
        doctor_id=data.doctor_id,
        patient_id=data.patient_id,
        slot_id=data.slot_id,
        status=VisitStatus.PENDING,
        token=token,
    )

    slot.is_booked = True

    db.add(visitation)
    db.commit()
    db.refresh(visitation)

    if patient.telegram_chat_id:
        await send_visit_message(
            chat_id=patient.telegram_chat_id,
            patient_name=patient.full_name,
            visit_date=str(slot.date),
            start_time=str(slot.start_time),
            end_time=str(slot.end_time),
            token=token,
        )

    return visitation

def get_visitations(db: Session):
    return db.query(Visitation).all()

def get_visitation(db: Session, visitation_id: UUID):
    visitation = db.query(Visitation).filter(Visitation.id == visitation_id).first()

    if not visitation:
        raise HTTPException(status_code=404, detail="Visitation not found")

    return visitation


def update_visitation_status(db: Session, visitation_id: UUID, status: VisitStatus):
    visitation = get_visitation(db, visitation_id)
    visitation.status = status

    db.commit()
    db.refresh(visitation)

    return visitation


def update_visitation_sequence(
    db: Session,
    visitation_id: UUID,
    sequence_order: int | None,
):
    visitation = get_visitation(db, visitation_id)
    visitation.sequence_order = sequence_order

    db.commit()
    db.refresh(visitation)

    return visitation


def confirm_by_token(db: Session, token: str):
    visitation = db.query(Visitation).filter(Visitation.token == token).first()

    if not visitation:
        raise HTTPException(status_code=404, detail="Invalid token")

    visitation.status = VisitStatus.CONFIRMED

    db.commit()
    db.refresh(visitation)

    return visitation


def cancel_by_token(db: Session, token: str):
    visitation = db.query(Visitation).filter(Visitation.token == token).first()

    if not visitation:
        raise HTTPException(status_code=404, detail="Invalid token")

    visitation.status = VisitStatus.CANCELED

    if visitation.slot:
        visitation.slot.is_booked = False

    db.commit()
    db.refresh(visitation)

    return visitation