from fastapi import APIRouter, HTTPException

from app.database import Database
from app.models import Patient
from app.schemas import PatientCreate, PatientResponse

router = APIRouter(prefix="/patients", tags=["Patients"])


@router.post("/", response_model=PatientResponse)
def create_patient(patient: PatientCreate, db: Database):
    existing_patient = db.query(Patient).filter(Patient.phone == patient.phone).first()

    if existing_patient:
        raise HTTPException(status_code=400, detail="Patient with this phone already exists")

    new_patient = Patient(
        name=patient.name,
        phone=patient.phone,
        telegram_id=patient.telegram_id,
        address=patient.address,
        risk_level=patient.risk_level,
    )

    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)

    return new_patient


@router.get("/", response_model=list[PatientResponse])
def get_patients(db: Database):
    return db.query(Patient).all()


@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(patient_id: int, db: Database):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()

    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    return patient