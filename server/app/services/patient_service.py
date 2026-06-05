# =============================================================================
# PATIENT SERVICE — app/services/patient_service.py
# =============================================================================
# Business logic for patient-related operations.
#
# WHY A SERVICE LAYER between endpoints and repositories?
# - Endpoints should only know about HTTP (request/response, status codes)
# - Repositories should only know about the database (SQL queries)
# - Services own the BUSINESS RULES:
#     "A patient can only register if their phone number is unique"
#     "A password must be hashed before storing"
#     "A login token should include the patient's UUID as the subject"
#
# This separation means if we later add a CLI command or a background task
# that creates patients, they can reuse the service layer without duplicating
# the HTTP-unaware business rules.
# =============================================================================

import logging

from app.core.security import create_access_token, hash_password, verify_password
from app.models.patient import Patient
from app.repositories.patient_repo import PatientRepository
from app.schemas.patient import LoginResponse, PatientCreate
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


class PatientService:
    """
    Orchestrates patient operations using PatientRepository + security helpers.

    Usage in endpoints:
        service = PatientService(db)
        patient = await service.register(PatientCreate(...))
    """

    def __init__(self, db: AsyncSession) -> None:
        self.repo = PatientRepository(db)

    async def register(self, data: PatientCreate) -> Patient:
        """
        Register a new patient.

        Business rules enforced:
        1. Phone number must be unique (raises 400 if taken)
        2. Password is hashed with bcrypt before storage (raises 500 on DB error)

        Returns the newly created Patient ORM object.
        """
        # Rule 1: phone uniqueness
        existing = await self.repo.get_by_phone(data.phone_number)
        if existing:
            logger.warning("Registration attempt with duplicate phone: %s", data.phone_number)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Энэ утасны дугаар бүртгэлтэй байна. Нэвтрэнэ үү.",
            )

        # Rule 2: hash password
        hashed = hash_password(data.password)

        # Build the ORM object — exclude the plain-text password, use hashed one
        patient = Patient(
            **data.model_dump(exclude={"password"}),
            password=hashed,
        )

        logger.info("Registering new patient: %s", data.phone_number)
        return await self.repo.create(patient)

    async def login(self, phone_number: str, password: str) -> LoginResponse:
        """
        Authenticate a patient and return a real JWT access token.

        Why combine existence + password check in one step?
        If we raised "user not found" separately from "wrong password",
        an attacker could determine whether a phone number is registered
        by observing which error they get. Returning the same 401 for both
        cases is called "user enumeration prevention".
        """
        patient = await self.repo.get_by_phone(phone_number)

        # Both "not found" and "wrong password" return the same 401 response
        if not patient or not verify_password(password, patient.password):
            logger.warning("Failed login attempt for phone: %s", phone_number)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Утасны дугаар эсвэл нууц үг буруу байна",
            )

        # Create a real signed JWT (3-part dot-separated string)
        token = create_access_token(subject=str(patient.id))
        logger.info("Patient %s logged in successfully", patient.id)

        return LoginResponse(
            message="Login successful",
            patient_id=patient.id,
            full_name=patient.full_name,
            address_text=patient.address_text,
            access_token=token,
            token_type="bearer",
        )
