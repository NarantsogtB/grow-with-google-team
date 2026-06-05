# =============================================================================
# PATIENT REPOSITORY — app/repositories/patient_repo.py
# =============================================================================
# All database operations for Patient records.
# Business logic (uniqueness checks, password hashing) lives in the service layer.
# =============================================================================

from typing import List, Optional, Tuple

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.patient import Patient
from app.repositories.base import BaseRepository


class PatientRepository(BaseRepository[Patient]):
    """
    Repository for Patient data access.

    Inherits from BaseRepository:
        get_by_id(id)              → Patient | None
        get_all(page, size)        → (list[Patient], total_count)
        create(patient_obj)        → Patient (flushed, with ID)
        delete(patient_obj)        → None

    Additional methods below are specific to Patient's domain needs.
    """

    def __init__(self, db: AsyncSession) -> None:
        # Pass the Patient model class and session to the generic base
        super().__init__(Patient, db)

    async def update(self, patient: Patient, data: dict) -> Patient:
        """Partially update a patient — only sets keys present in `data`."""
        for key, value in data.items():
            setattr(patient, key, value)
        await self.db.flush()
        await self.db.refresh(patient)
        return patient

    async def get_by_phone(self, phone_number: str) -> Optional[Patient]:
        """
        Look up a patient by phone number.
        Used for:
        1. Duplicate check during registration
        2. Credential lookup during login
        """
        result = await self.db.execute(
            select(Patient).where(Patient.phone_number == phone_number)
        )
        return result.scalar_one_or_none()

    async def search(self, q: str, page: int, size: int) -> Tuple[List[Patient], int]:
        """Search patients by name or phone number (ILIKE, PostgreSQL)."""
        pattern = f"%{q}%"
        offset = (page - 1) * size
        where = or_(
            Patient.full_name.ilike(pattern),
            Patient.phone_number.ilike(pattern),
        )
        total = (
            await self.db.execute(
                select(func.count()).select_from(Patient).where(where)
            )
        ).scalar()
        rows = (
            await self.db.execute(
                select(Patient).where(where).offset(offset).limit(size)
            )
        ).scalars().all()
        return list(rows), total

    async def get_by_telegram_chat_id(self, chat_id: str) -> Optional[Patient]:
        result = await self.db.execute(
            select(Patient).where(Patient.telegram_chat_id == chat_id)
        )
        return result.scalar_one_or_none()

    async def get_with_telegram(self) -> List[Patient]:
        """Return all patients that have a Telegram chat ID set."""
        rows = (
            await self.db.execute(
                select(Patient).where(Patient.telegram_chat_id.isnot(None))
            )
        ).scalars().all()
        return list(rows)

    async def get_by_sector(self, sector: str, page: int, size: int) -> Tuple[List[Patient], int]:
        """Filter patients by geographic sector (matches doctor.assigned_sector)."""
        offset = (page - 1) * size
        total = (
            await self.db.execute(
                select(func.count()).select_from(Patient).where(Patient.sector == sector)
            )
        ).scalar()
        rows = (
            await self.db.execute(
                select(Patient).where(Patient.sector == sector).offset(offset).limit(size)
            )
        ).scalars().all()
        return list(rows), total
