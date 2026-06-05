from typing import List, Tuple

from app.database import Database
from app.models import Doctor
from app.utils.logger import logger


def get_doctors(db: Database, page: int = 1, size: int = 10) -> Tuple[List[Doctor], int]:
    offset = (page - 1) * size
    total_count = db.query(Doctor).count()
    try:
        doctors = db.query(Doctor).offset(offset).limit(size).all()
        return doctors, total_count
    except Exception as e:
        logger.exception(f"Датабаззаас эмч нарын мэдээллийг авахад ноцтой алдаа гарлаа: {str(e)}")
        raise e
