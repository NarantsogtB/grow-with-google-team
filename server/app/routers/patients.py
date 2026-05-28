from uuid import UUID

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Patient
from app.schemas import PatientCreate, PatientResponse

router = APIRouter(prefix="/patients", tags=["Patients"])


@router.post("/", response_model=PatientResponse)
def create_patient(patient: PatientCreate, db: Session = Depends(get_db)):
    existing_patient = (
        db.query(Patient)
        .filter(Patient.phone_number == patient.phone_number)
        .first()
    )

    if existing_patient:
        raise HTTPException(
            status_code=400,
            detail="Patient with this phone already exists",
        )

    new_patient = Patient(
        full_name=patient.full_name,
        phone_number=patient.phone_number,
        telegram_chat_id=patient.telegram_chat_id,
        address_text=patient.address_text,
        latitude=patient.latitude,
        longitude=patient.longitude,
    )

    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)

    return new_patient


@router.get("/", response_model=list[PatientResponse])
def get_patients(db: Session = Depends(get_db)):
    return db.query(Patient).all()


@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(patient_id: UUID, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()

    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    return patient