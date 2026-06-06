# =============================================================================
# DEPENDENCY INJECTION — app/api/deps.py
# =============================================================================
# FastAPI's dependency injection system (Depends) lets us declare reusable
# "prerequisites" for endpoints. Instead of duplicating auth logic in every
# endpoint function, we declare it once here and inject it where needed.
#
# HOW FASTAPI DEPENDENCIES WORK:
#   @router.get("/me")
#   async def get_my_profile(current_patient = Depends(get_current_patient)):
#       return current_patient   ← FastAPI runs get_current_patient() first
#
# The dependency runs before the endpoint body. If it raises an HTTPException,
# the endpoint never runs and the error is returned to the client.
#
# DEPENDENCY CHAIN:
#   get_current_patient
#       └── Depends(bearer_scheme)  ← extracts Bearer token from Authorization header
#       └── Depends(get_db)         ← provides an AsyncSession
#           └── (yields session from AsyncSessionLocal)
# =============================================================================

from typing import Annotated

from app.core.database import get_db  # async get_db from new core module
from app.core.security import decode_access_token
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

# HTTPBearer reads the "Authorization: Bearer <token>" header automatically.
# If the header is missing or malformed, FastAPI returns 403 before our code runs.
bearer_scheme = HTTPBearer()

# Type alias for cleaner endpoint signatures.
# Instead of: db: AsyncSession = Depends(get_db)
# You can write: db: Database
Database = Annotated[AsyncSession, Depends(get_db)]


async def get_current_patient(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
):
    """
    Auth dependency: validates the JWT and returns the authenticated patient.

    Step by step:
    1. HTTPBearer extracts the token string from "Authorization: Bearer <token>"
    2. We call decode_access_token() which verifies the JWT signature and expiry
    3. If valid, we get back the patient's UUID string
    4. We query the DB to confirm the patient still exists (could have been deleted)
    5. We return the Patient ORM object — the endpoint receives it ready to use

    Usage:
        @router.get("/my-schedule")
        async def my_schedule(patient = Depends(get_current_patient)):
            return patient.full_name
    """
    # Decode the JWT — raises JWTError if invalid or expired
    try:
        patient_id = decode_access_token(credentials.credentials)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Токен хүчингүй эсвэл хугацаа дууссан байна",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Import here to avoid circular imports:
    # deps.py → patient_repo.py → models/patient.py → models/base.py (clean chain)
    # If we imported at module level, startup import order could cause issues.
    from app.repositories.patient_repo import PatientRepository

    patient = await PatientRepository(db).get_by_id(patient_id)

    if not patient:
        # Token decoded but the subject no longer exists in the DB (e.g. the
        # patient was deleted, or the DB was re-seeded). Treat this as an
        # auth failure (401) — NOT a 404 — so the frontend's 401 interceptor
        # can clear the stale token and bounce the user back to /login.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Хэрэглэгч олдсонгүй — дахин нэвтэрнэ үү",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return patient


# Pre-built type alias for authenticated endpoints.
# Usage: async def my_endpoint(patient: CurrentPatient):
CurrentPatient = Annotated[object, Depends(get_current_patient)]


async def get_current_doctor(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
):
    """Auth dependency for doctor-authenticated endpoints (admin panel)."""
    try:
        doctor_id = decode_access_token(credentials.credentials)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Токен хүчингүй эсвэл хугацаа дууссан байна",
            headers={"WWW-Authenticate": "Bearer"},
        )

    from app.repositories.doctor_repo import DoctorRepository

    doctor = await DoctorRepository(db).get_by_id(doctor_id)

    if not doctor:
        # Same reasoning as get_current_patient: stale token → 401 (not 404)
        # so the admin frontend can auto-clear it and redirect to /login.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Эмч олдсонгүй — дахин нэвтэрнэ үү",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return doctor


CurrentDoctor = Annotated[object, Depends(get_current_doctor)]
