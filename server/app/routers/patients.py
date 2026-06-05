import logging
from datetime import datetime, timedelta, timezone
from uuid import UUID

from app.config import settings
from app.database import get_db
from app.models.patients.patient_models import Patient
from app.schemas import LoginRequest, PatientCreate, PatientResponse
from fastapi import APIRouter, Depends, HTTPException, Query, status
from jose import jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

# Suppress verbose bcrypt deprecation warnings from passlib
logging.getLogger("passlib").setLevel(logging.ERROR)

router = APIRouter(prefix="/patients", tags=["Patients & Auth"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _create_access_token(subject: str) -> str:
    """
    Create a real signed JWT token.

    How it works:
    1. We build a "payload" — a Python dict with two fields:
       - "sub" (subject): the patient's UUID, so we know WHO the token belongs to
       - "exp" (expiry): a Unix timestamp 24 hours from now
    2. We sign it with our JWT_SECRET key using HS256 algorithm (HMAC-SHA256)
    3. The result is a 3-part dot-separated string: header.payload.signature
       e.g. "eyJ0eXAi.eyJzdWIi.HMAC_signature"

    Anyone with the secret key can verify the signature — so the backend
    can trust that a token it receives was genuinely issued by itself.
    """
    expire = datetime.now(timezone.utc) + timedelta(hours=24)
    payload = {"sub": subject, "exp": expire}
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")


# 1. БҮРТГЭЛ ХИЙХ API — Register
@router.post("/", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def create_patient(patient: PatientCreate, db: Session = Depends(get_db)):
    # Check if this phone number is already registered
    existing_patient = (
        db.query(Patient).filter(Patient.phone_number == patient.phone_number).first()
    )

    if existing_patient:
        raise HTTPException(
            status_code=400,
            detail="Patient with this phone already exists",
        )

    # Hash the password before storing — NEVER store plain-text passwords
    hashed_pwd = pwd_context.hash(patient.password)

    new_patient = Patient(
        full_name=patient.full_name,
        phone_number=patient.phone_number,
        telegram_chat_id=patient.telegram_chat_id,
        address_text=patient.address_text,
        latitude=patient.latitude,
        longitude=patient.longitude,
        password=hashed_pwd,
    )

    db.add(new_patient)
    try:
        # Commit writes the INSERT to the database permanently.
        # If anything goes wrong (DB down, constraint violation, etc.)
        # we rollback so the session is left in a clean state.
        db.commit()
        db.refresh(new_patient)
    except Exception as e:
        db.rollback()
        logging.getLogger(__name__).exception("Database error during patient creation: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Өгөгдлийн санд алдаа гарлаа. Дахин оролдоно уу.",
        )

    return new_patient


# 2. НЭВТРЭХ API — Login
@router.post("/login")
def login_patient(payload: LoginRequest, db: Session = Depends(get_db)):
    # Fetch patient by phone number
    patient = db.query(Patient).filter(Patient.phone_number == payload.phone_number).first()

    # Verify both existence and password in one check to prevent
    # user enumeration attacks (attacker can't tell if phone doesn't exist vs wrong password)
    if not patient or not pwd_context.verify(payload.password, patient.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Утасны дугаар эсвэл нууц үг буруу байна",
        )

    # Generate a real signed JWT — 3 dot-separated parts (header.payload.signature)
    access_token = _create_access_token(subject=str(patient.id))

    return {
        "message": "Login successful",
        "patient_id": patient.id,
        "full_name": patient.full_name,
        "address_text": patient.address_text,
        "access_token": access_token,
        "token_type": "bearer",
    }


# 3. ЖАГСААЛТ ХАРАХ API — List patients (paginated)
@router.get("/", response_model=list[PatientResponse])
def get_patients(
    # Pagination prevents loading ALL rows into memory at once.
    # page=1 means "first page", size=10 means "10 records per page".
    # ge=1 and le=100 are validation constraints (min 1, max 100).
    page: int = Query(default=1, ge=1, description="Хуудасны дугаар"),
    size: int = Query(default=10, ge=1, le=100, description="Нэг хуудсанд харуулах тоо"),
    db: Session = Depends(get_db),
):
    offset = (page - 1) * size  # e.g. page=2, size=10 → skip first 10 rows
    return db.query(Patient).offset(offset).limit(size).all()


# 4. ID-АЙД ХАРАХ API — Get single patient
@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(patient_id: UUID, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()

    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    return patient
