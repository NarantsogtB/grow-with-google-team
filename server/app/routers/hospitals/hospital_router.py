from uuid import UUID

from app.controllers.hospital import (
    create_new_hospital,
    get_hospital_by_id,
    get_hospitals,
    update_hospital,
)
from app.database import Database
from app.exceptions import (
    HospitalAlreadyExistError,
    HospitalNotFoundError,
    HospitalUpdateEmptyError,
    WebAppError,
)
from app.models.hospitals import (
    HospitalCreate,
    HospitalListResponse,
    HospitalResponse,
    HospitalUpdate,
    HospitalUpdateResponse,
)
from fastapi import APIRouter, HTTPException, Query, status

router = APIRouter(prefix="/hospitals", tags=["Hospitals"])


@router.post("/", status_code=status.HTTP_201_CREATED)
def register_hospital(db: Database, hospital_data: HospitalCreate) -> HospitalResponse:
    try:
        return create_new_hospital(db, hospital_data)
    except HospitalAlreadyExistError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error occurred",
        )


@router.get("/", status_code=status.HTTP_200_OK, response_model=HospitalListResponse)
def read_all_hospitals(
    db: Database,
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=10, le=100, description="Items size per page"),
):
    try:
        hospitals, total = get_hospitals(db, page, size)
        return {"items": hospitals, "total": total, "page": page, "size": size}
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error occurred",
        )


@router.get("/{hospital_id}", status_code=status.HTTP_200_OK)
def read_hospital_by_id(db: Database, hospital_id: UUID) -> HospitalResponse:
    try:
        return get_hospital_by_id(db, hospital_id)
    except HospitalNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except WebAppError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error occured",
        )


@router.put("/{hospital_id}", status_code=status.HTTP_200_OK)
def modify_hospital(
    db: Database, hospital_id: UUID, hospital_data: HospitalUpdate
) -> HospitalUpdateResponse:
    try:
        updated_hospital = update_hospital(db, hospital_id, hospital_data)
        return HospitalUpdateResponse(
            message="Мэдээлэл амжилттай шинэчлэлээ", data=updated_hospital
        )
    except HospitalNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except HospitalUpdateEmptyError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except WebAppError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error occurred",
        )
