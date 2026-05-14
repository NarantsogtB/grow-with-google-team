from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Patient
from app.schemas import PatientCreate, PatientResponse

router = APIRouter(prefix="/patients", tags=["Patients"])


@router.post("/", response_model=PatientResponse)
def create_patient(patient: PatientCreate, db: Session = Depends(get_db)):
    existing_patient = db.query(Patient).filter(Patient.phone == patient.phone).first()

    if existing_patient:
        raise HTTPException(status_code=400, detail="Patient with this phone already exists")

    new_patient = Patient(
        name=patient.name,
        phone=patient.phone,
        telegram_id=patient.telegram_id,
        address=patient.address,
        age=patient.age,
        gender=patient.gender,
        medical_history=patient.medical_history,
        anamnesis=patient.anamnesis,
        symptoms=patient.symptoms,
        is_active=patient.is_active,
        action_type=patient.action_type,
        guardian_phone=patient.guardian_phone,
        patient_type=patient.patient_type,
        registration_number=patient.registration_number,
        location_coordinates=patient.location_coordinates,
        risk_level=patient.risk_level,
        last_visit_at=patient.last_visit_at,
    )

    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)

    return new_patient


@router.get("/", response_model=list[PatientResponse])
def get_patients(db: Session = Depends(get_db)):
    return db.query(Patient).all()


@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(patient_id: int, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()

    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    return patient