from app.database import Database
from app.models import Doctor
from app.models.doctors import DoctorUpdate
from app.utils.logger import logger
from uuid import UUID
from sqlalchemy import update

from app.exceptions import DoctorNotFoundError, DoctorUpdateEmptyError

def update_doctor(db: Database, doctor_id: UUID, doctor_data: DoctorUpdate) -> Doctor:
    """Эмчийн мэдээллийг шинэчлээд, шинэчлэгдсэн датаг шууд буцаана (Drizzle-style + RETURNING)"""
    
    update_dict = doctor_data.model_dump(exclude_unset=True)
    
    if not update_dict:
       raise DoctorUpdateEmptyError()

    stmt = (
        update(Doctor)
        .where(Doctor.id == doctor_id)
        .values(**update_dict)
        .returning(Doctor)
    )
    
    result = db.execute(stmt)
    updated_doctor = result.scalar() 
    
    if updated_doctor is None:
        raise DoctorNotFoundError(doctor_id=doctor_id)
        
    db.commit()
    return updated_doctor