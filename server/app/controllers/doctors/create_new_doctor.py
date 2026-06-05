from app.database import Database
from app.exceptions import DoctorAlreadyExistsError
from app.models import Doctor
from app.models.doctors import DoctorCreate
from app.utils.logger import logger


def create_new_doctor(db: Database, doctor_data: DoctorCreate) -> Doctor:
    logger.info(f"Шинэ эмч бүртгэх хүсэлт ирлээ: {doctor_data.phone}")

    existing_doctor = db.query(Doctor).where(Doctor.phone == doctor_data.phone).first()
    if existing_doctor:
        logger.warning(f"Эмч бүртгэхэд утасны дугаар давхардлаа: {doctor_data.phone}")
        raise DoctorAlreadyExistsError(phone=doctor_data.phone)

    new_doctor = Doctor(**doctor_data.model_dump())
    db.add(new_doctor)
    try:
        db.commit()
        db.refresh(new_doctor)
        logger.info(f"Эмч амжилттай бүртгэгдлээ. ID: {new_doctor.id}")
        return new_doctor
    except Exception as e:
        db.rollback()
        logger.error(f"Датабааз руу хадгалахад алдаа гарлаа: {str(e)}")
        raise e
