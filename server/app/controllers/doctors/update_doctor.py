from uuid import UUID

from sqlalchemy import update

from app.database import Database
from app.exceptions import DoctorNotFoundError, DoctorUpdateEmptyError
from app.models import Doctor
from app.models.doctors import DoctorUpdate
from app.utils.logger import logger


def update_doctor(db: Database, doctor_id: UUID, doctor_data: DoctorUpdate) -> Doctor:
    """modify doctors info and status"""
    logger.info(f"{doctor_id} - тай эмчийн мэдээллийг шинэчлэх хүсэлт ирлээ")
    update_dict = doctor_data.model_dump(exclude_unset=True)

    if not update_dict:
        logger.warning(
            f"{doctor_id} - тай эмчийн мэдээллийг хоосон талбараар шинэчлэх гэж байна"
        )
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
        logger.warning(f"{doctor_id} - тай эмч бүртэгдээгүй байна")
        raise DoctorNotFoundError(doctor_id=doctor_id)

    db.commit()
    logger.info(f"{doctor_id} - тай эмчийн мэдээллийг амжилттай шинэчлэлээ")
    return updated_doctor
