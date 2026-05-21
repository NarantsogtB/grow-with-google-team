from fastapi import APIRouter, Query, HTTPException, status
from app.database import Database
from app.models.doctors import DoctorCreate, DoctorResponse, DoctorListResponse,DoctorUpdate, DoctorUpdateResponse
from app.controllers.doctors import create_new_doctor, get_doctor_by_id, get_doctors, update_doctor
from app.exceptions import DoctorAlreadyExistsError, DoctorNotFoundError, DoctorNotActiveError, WebAppError
from uuid import UUID


router = APIRouter(prefix='/doctors', tags=['Doctors'])


@router.post('/', status_code=status.HTTP_201_CREATED)
def register_doctor(db: Database, doctor: DoctorCreate) -> DoctorResponse:
    try:
        return create_new_doctor(db, doctor)
    except DoctorAlreadyExistsError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error occurred")


@router.get("/", response_model=DoctorListResponse)
def read_all_doctors(
    db: Database, 
    page: int = Query(1, ge=1, description="Page number"), 
    size: int = Query(10, ge=10, le=100, description="Items size per page")
):
    try:
        doctors, total = get_doctors(db, page, size)
        return {
            "items": doctors,
            "total": total,
            "page": page,
            "size": size
        }
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error occurred")
    

@router.get("/{doctor_id}")
def read_doctor_by_id(db: Database, doctor_id: UUID) -> DoctorResponse:
    try:
        return get_doctor_by_id(db, doctor_id)
    except DoctorNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except DoctorNotActiveError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except WebAppError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error occurred")
    
@router.put("/{doctor_id}")
def modify_doctor(db: Database, doctor_id:UUID, doctor_data:DoctorUpdate) -> DoctorUpdateResponse:
    try:
        updated_doctor = update_doctor(db,doctor_id,doctor_data)
        return DoctorUpdateResponse(
            message="Мэдээлэл амжилттай шинэчлэлээ",
            data=updated_doctor
        )
    except DoctorNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))