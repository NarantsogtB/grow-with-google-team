# =============================================================================
# PATIENTS ENDPOINT — app/api/v1/endpoints/patients.py
# =============================================================================
# Thin HTTP layer: validate input → call service → return response.
# No business logic or direct DB queries here.
# =============================================================================

from typing import Optional
from uuid import UUID

from app.api.deps import CurrentDoctor, CurrentPatient, Database
from app.schemas.common import PaginatedResponse
from app.schemas.patient import (
    LoginRequest,
    LoginResponse,
    PatientCreate,
    PatientResponse,
    PatientUpdate,
)
from app.services.patient_service import PatientService
from fastapi import APIRouter, HTTPException, Query, status

router = APIRouter(prefix="/patients", tags=["Patients & Auth"])


@router.post("/", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
async def register_patient(data: PatientCreate, db: Database):
    """
    Register a new patient account.

    The service layer handles:
    - Phone uniqueness check (returns 400 if taken)
    - Password hashing (bcrypt)
    """
    service = PatientService(db)
    return await service.register(data)


@router.post("/login", response_model=LoginResponse)
async def login_patient(payload: LoginRequest, db: Database):
    """
    Authenticate a patient and return a signed JWT access token.

    The returned `access_token` should be stored by the client and sent as:
        Authorization: Bearer <token>
    on every subsequent request to protected endpoints.
    """
    service = PatientService(db)
    return await service.login(payload.phone_number, payload.password)


@router.get("/me", response_model=PatientResponse)
async def get_my_profile(current_patient: CurrentPatient):
    """Return the authenticated patient's own profile."""
    return current_patient


@router.put("/me", response_model=PatientResponse)
async def update_my_profile(data: PatientUpdate, db: Database, current_patient: CurrentPatient):
    """Partially update the authenticated patient's own profile."""
    from app.repositories.patient_repo import PatientRepository

    repo = PatientRepository(db)
    return await repo.update(current_patient, data.model_dump(exclude_none=True))


@router.get("/", response_model=PaginatedResponse[PatientResponse])
async def list_patients(
    db: Database,
    current_doctor: CurrentDoctor,
    page: int = Query(default=1, ge=1, description="Хуудасны дугаар"),
    size: int = Query(default=10, ge=1, le=100, description="Нэг хуудсанд харуулах тоо"),
    q: Optional[str] = Query(default=None, description="Нэр эсвэл утасны дугаараар хайх"),
):
    from app.repositories.patient_repo import PatientRepository

    repo = PatientRepository(db)
    sector = current_doctor.assigned_sector
    if q:
        items, total = await repo.search_in_sector(q=q, sector=sector, page=page, size=size)
    else:
        items, total = await repo.get_by_sector(sector=sector, page=page, size=size)
    return PaginatedResponse(items=items, total=total, page=page, size=size)


@router.put("/{patient_id}", response_model=PatientResponse)
async def update_patient(patient_id: UUID, data: PatientUpdate, db: Database):
    """Update a patient's data (for doctor/admin use, e.g. linking telegram_chat_id)."""
    from app.repositories.patient_repo import PatientRepository

    repo = PatientRepository(db)
    patient = await repo.get_by_id(patient_id)
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Өвчтөн олдсонгүй")
    return await repo.update(patient, data.model_dump(exclude_none=True))


@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient(patient_id: UUID, db: Database):
    """Fetch a single patient by their UUID."""
    from app.repositories.patient_repo import PatientRepository

    repo = PatientRepository(db)
    patient = await repo.get_by_id(patient_id)

    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient {patient_id} not found",
        )

    return patient
