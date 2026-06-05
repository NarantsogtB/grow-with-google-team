# =============================================================================
# DOCTORS ENDPOINT — app/api/v1/endpoints/doctors.py
# =============================================================================
# Async rewrite of app/routers/doctors/doctor_routers.py
# Key improvements:
#   - async def instead of def (non-blocking)
#   - AsyncSession instead of sync Session
#   - Specific exception logging (not bare except)
#   - Uses new DoctorRepository instead of 4 separate controller functions
# =============================================================================

import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import Database
from app.core.security import create_access_token, verify_password
from app.exceptions import (
    DoctorAlreadyExistsError,
    DoctorNotActiveError,
    DoctorNotFoundError,
    DoctorUpdateEmptyError,
    WebAppError,
)
from app.repositories.doctor_repo import DoctorRepository
from app.schemas.common import PaginatedResponse
from app.schemas.doctor import (
    DoctorCreate,
    DoctorLoginRequest,
    DoctorLoginResponse,
    DoctorResponse,
    DoctorUpdate,
    DoctorUpdateResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/doctors", tags=["Doctors"])


@router.post("/login", response_model=DoctorLoginResponse)
async def login_doctor(credentials: DoctorLoginRequest, db: Database):
    repo = DoctorRepository(db)
    doctor = await repo.get_by_email(credentials.email)
    if not doctor or not doctor.password:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not verify_password(credentials.password, doctor.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token(str(doctor.id))
    return DoctorLoginResponse(
        access_token=token,
        doctor_id=doctor.id,
        first_name=doctor.first_name,
        last_name=doctor.last_name,
        role=doctor.role,
        assigned_sector=doctor.assigned_sector,
    )


@router.post("/", status_code=status.HTTP_201_CREATED, response_model=DoctorResponse)
async def register_doctor(
    doctor: DoctorCreate,
    db: Database,
):
    try:
        repo = DoctorRepository(db)
        return await repo.create_with_validation(doctor)
    except DoctorAlreadyExistsError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception:
        logger.exception("Unexpected error registering doctor")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )


@router.get("/", response_model=PaginatedResponse[DoctorResponse])
async def read_all_doctors(
    db: Database,
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Items per page"),
):
    try:
        repo = DoctorRepository(db)
        doctors, total = await repo.get_all(page=page, size=size)
        return PaginatedResponse(items=doctors, total=total, page=page, size=size)
    except Exception:
        logger.exception("Unexpected error listing doctors")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )


@router.get("/{doctor_id}", response_model=DoctorResponse)
async def read_doctor_by_id(
    doctor_id: UUID,
    db: Database,
):
    try:
        repo = DoctorRepository(db)
        return await repo.get_active_by_id(doctor_id)
    except DoctorNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except DoctorNotActiveError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except WebAppError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception:
        logger.exception("Unexpected error fetching doctor %s", doctor_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )


@router.delete("/{doctor_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_doctor(doctor_id: UUID, db: Database):
    try:
        repo = DoctorRepository(db)
        await repo.delete(doctor_id)
    except DoctorNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception:
        logger.exception("Unexpected error deleting doctor %s", doctor_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )


@router.put("/{doctor_id}", response_model=DoctorUpdateResponse)
async def modify_doctor(
    doctor_id: UUID,
    doctor_data: DoctorUpdate,
    db: Database,
):
    try:
        repo = DoctorRepository(db)
        updated = await repo.update(doctor_id, doctor_data)
        return DoctorUpdateResponse(message="Мэдээлэл амжилттай шинэчлэлээ", data=updated)
    except DoctorNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except DoctorUpdateEmptyError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except WebAppError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception:
        logger.exception("Unexpected error updating doctor %s", doctor_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )
