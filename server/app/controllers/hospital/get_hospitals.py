from typing import List, Tuple

from app.database import Database
from app.models import Hospital
from app.utils.logger import logger


def get_hospitals(db: Database, page: int = 1, size: int = 10) -> Tuple[List[Hospital], int]:
    offset = (page - 1) * size
    total_count = db.query(Hospital).count()
    try:
        hospitals = db.query(Hospital).offset(offset).limit(size).all()
        return hospitals, total_count
    except Exception as e:
        logger.exception(f"Датабаззаас эмч нарын мэдээллийг авахад ноцтой алдаа гарлаа: {str(e)}")
        raise e
