from uuid import UUID

from app.database import Database
from app.exceptions import HospitalNotFoundError, HospitalUpdateEmptyError
from app.models import Hospital
from app.models.hospitals import HospitalUpdate
from app.utils.logger import logger
from sqlalchemy import update


def update_hospital(db: Database, hospital_id: UUID, hospital_data: HospitalUpdate) -> Hospital:
    """Modify hospital info"""
    logger.info(f"{hospital_id} - тай эмнэлэгийн мэдээллийг шинэчлэх хүсэлт ирлээ")
    update_dict = hospital_data.model_dump(exclude_unset=True)

    if not update_dict:
        logger.warning(
            f"{hospital_id} - тай эмнэлэгийн мэдээллийг хоосон талбараар шинэчлэх гэж байна"
        )
        raise HospitalUpdateEmptyError()

    stmt = (
        update(Hospital).where(Hospital.id == hospital_id).values(**update_dict).returning(Hospital)
    )

    result = db.execute(stmt)

    updated_hospital = result.scalar()

    if updated_hospital is None:
        logger.warning(f"{hospital_id} - тай эмнэлэг бүртэгдээгүй байна")
        raise HospitalNotFoundError(hospital_id)

    db.commit()
    logger.info(f"{hospital_id} - тай эмнэлэгийн мэдээллийг амжилттай шинэчлэлээ")
    return updated_hospital
