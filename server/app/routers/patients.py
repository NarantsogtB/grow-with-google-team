from uuid import UUID
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from app.database import get_db
from app.models.patients.patient_models import Patient  
from app.schemas import PatientCreate, PatientResponse, LoginRequest 

router = APIRouter(prefix="/patients", tags=["Patients & Auth"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 1. ЖИНХЭНЭ БҮРТГЭЛ ХИЙХ API
@router.post("/", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
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

    # Нууц үгийг хаш хийж кодлох
    hashed_pwd = pwd_context.hash(patient.password)

    new_patient = Patient(
        full_name=patient.full_name,
        phone_number=patient.phone_number,
        telegram_chat_id=patient.telegram_chat_id,
        address_text=patient.address_text,
        latitude=patient.latitude,
        longitude=patient.longitude,
        password=hashed_pwd,  # Модел руу хаш хийсэн нууц үгээ хийлээ
    )

    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)

    return new_patient

# 2. ЖИНХЭНЭ ЛОГИН ХИЙХ API
@router.post("/login")
def login_patient(payload: LoginRequest, db: Session = Depends(get_db)):
    # Утасны дугаараар нь хэрэглэгчийг хайх
    patient = db.query(Patient).filter(Patient.phone_number == payload.phone_number).first()
    
    # Хэрэглэгч олдохгүй эсвэл нууц үг нь таарахгүй бол алдаа буцаана
    if not patient or not pwd_context.verify(payload.password, patient.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Утасны дугаар эсвэл нууц үг буруу байна"
        )
    
    return {
        "message": "Login successful",
        "patient_id": patient.id,
        "full_name": patient.full_name,
        "address_text": patient.address_text,
        "access_token": f"mock_jwt_token_for_{patient.id}",  # Фронтод зориулсан түр токен
        "token_type": "bearer"
    }

# 3. Бүх патиентуудыг харах
@router.get("/", response_model=list[PatientResponse])
def get_patients(db: Session = Depends(get_db)):
    return db.query(Patient).all()

# 4. ID-аар харах
@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(patient_id: UUID, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()

    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    return patient