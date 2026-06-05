# =============================================================================
# HOSPITALS ENDPOINT — app/api/v1/endpoints/hospitals.py
# =============================================================================
# Async rewrite of app/routers/hospitals/hospital_router.py
# =============================================================================

import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import Database
from app.exceptions import (
    HospitalAlreadyExistError,
    HospitalNotFoundError,
    HospitalUpdateEmptyError,
    WebAppError,
)
from app.repositories.hospital_repo import HospitalRepository
from app.schemas.common import PaginatedResponse
from app.schemas.hospital import (
    HospitalCreate,
    HospitalResponse,
    HospitalUpdate,
    HospitalUpdateResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/hospitals", tags=["Hospitals"])


@router.post("/", status_code=status.HTTP_201_CREATED, response_model=HospitalResponse)
async def register_hospital(
    hospital_data: HospitalCreate,
    db: Database,
):
    try:
        repo = HospitalRepository(db)
        return await repo.create_with_validation(hospital_data)
    except HospitalAlreadyExistError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception:
        logger.exception("Unexpected error registering hospital")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")


@router.get("/", response_model=PaginatedResponse[HospitalResponse])
async def read_all_hospitals(
    db: Database,
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
):
    try:
        repo = HospitalRepository(db)
        hospitals, total = await repo.get_all(page=page, size=size)
        return PaginatedResponse(items=hospitals, total=total, page=page, size=size)
    except Exception:
        logger.exception("Unexpected error listing hospitals")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")


@router.get("/{hospital_id}", response_model=HospitalResponse)
async def read_hospital_by_id(
    hospital_id: UUID,
    db: Database,
):
    try:
        repo = HospitalRepository(db)
        return await repo.get_by_id_or_raise(hospital_id)
    except HospitalNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except WebAppError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception:
        logger.exception("Unexpected error fetching hospital %s", hospital_id)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")


@router.delete("/{hospital_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_hospital(hospital_id: UUID, db: Database):
    try:
        repo = HospitalRepository(db)
        await repo.delete(hospital_id)
    except HospitalNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception:
        logger.exception("Unexpected error deleting hospital %s", hospital_id)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")


@router.put("/{hospital_id}", response_model=HospitalUpdateResponse)
async def modify_hospital(
    hospital_id: UUID,
    hospital_data: HospitalUpdate,
    db: Database,
):
    try:
        repo = HospitalRepository(db)
        updated = await repo.update(hospital_id, hospital_data)
        return HospitalUpdateResponse(message="Мэдээлэл амжилттай шинэчлэлээ", data=updated)
    except HospitalNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except HospitalUpdateEmptyError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except WebAppError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception:
        logger.exception("Unexpected error updating hospital %s", hospital_id)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")
