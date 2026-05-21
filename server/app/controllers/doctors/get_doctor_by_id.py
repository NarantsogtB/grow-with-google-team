from app.database import Database
from app.models import Doctor
from app.utils.logger import logger
from uuid import UUID

from app.exceptions import DoctorNotActiveError, DoctorNotFoundError


def get_doctor_by_id(db: Database, doctor_id: UUID) -> Doctor:
    """Find doctor by id from database"""
    logger.info(f"{doctor_id} - ийн мэдээлэл авах хүсэлт ирлээ")  
    existing_doctor = db.query(Doctor).where(Doctor.id == doctor_id).first()
    
    if existing_doctor is None:  
        logger.error(f"{doctor_id} - тай эмч дататбаззаас олдсонгүй.")  
        raise DoctorNotFoundError(doctor_id=doctor_id)
        
    if hasattr(existing_doctor, 'is_active') and existing_doctor.is_active is False:  
        logger.warning(f"{existing_doctor.id} - тэй эмчийн статус идэвхгүй байна.")  
        raise DoctorNotActiveError(doctor_id=str(doctor_id))
    
    return existing_doctor
