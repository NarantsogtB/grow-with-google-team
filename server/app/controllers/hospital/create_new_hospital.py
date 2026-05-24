from app.database import Database
from app.models import Hospital
from app.models.hospitals import HospitalCreate, HospitalResponse
from app.exceptions import HospitalAlreadyExistError
from app.utils.logger import logger


def create_new_hospital(db:Database, hospital_data:HospitalCreate) -> HospitalResponse:
    logger.info(f"{hospital_data.hospital_name}-тэй эмнэлэг үүсгэх хүсэлт ирлээ")
    existing_hospital = db.query(Hospital).where(Hospital.hospital_phone == hospital_data.hospital_phone).first()
    
    if existing_hospital:
        logger.warning(f"{hospital_data.hospital_phone} дугаартай эмнэлэг хэдийн үүссэн байна.")
        raise HospitalAlreadyExistError(hospital_data.hospital_phone)
    new_hospital = Hospital(**hospital_data.model_dump())
    db.add(new_hospital)
    try:
        db.commit()
        db.refresh(new_hospital)
        logger.info(f"{new_hospital.id} - тай эмнэлэг амжилттай үүслээ.")
        return new_hospital
    except Exception as e:
        db.rollback()
        logger.error(f"Датабааз руу хадгалахад алдаа гарлаа: {str(e)}")
        raise e
        
    