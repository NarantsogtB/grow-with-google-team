from uuid import UUID

from app.database import Database
from app.exceptions import HospitalNotFoundError
from app.models import Hospital
from app.utils.logger import logger


def get_hospital_by_id(db: Database, hospital_id: UUID) -> Hospital:
    """Find hospital by id from database"""
    logger.info(f"{hospital_id} - тай эмнэлэгийн мэдээлэл авах хүсэлт ирлээ")
    hospital = db.query(Hospital).where(Hospital.id == hospital_id).first()

    if hospital is None:
        logger.error(f"{hospital_id} - тай эмнэлэг датабаззаас олдсонгүй")
        raise HospitalNotFoundError(hospital_id)

    return hospital
