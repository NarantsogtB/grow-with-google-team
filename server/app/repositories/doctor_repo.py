# =============================================================================
# DOCTOR REPOSITORY — app/repositories/doctor_repo.py
# =============================================================================
# Consolidates 4 old controller files into one async repository class:
#   create_new_doctor.py     → create()  (inherited) + get_by_phone()
#   get_doctors.py           → get_all() (inherited)
#   get_doctor_by_id.py      → get_active_by_id()
#   update_doctor.py         → update()
#
# KEY IMPROVEMENT: Converted from synchronous `db.query()` to async `select()`.
# The old controllers used db.query(Doctor) which blocks the event loop.
# =============================================================================

import logging
from typing import Optional
from uuid import UUID

from app.exceptions import (
    DoctorAlreadyExistsError,
    DoctorNotActiveError,
    DoctorNotFoundError,
    DoctorUpdateEmptyError,
)
from app.models.doctor import Doctor
from app.repositories.base import BaseRepository
from app.schemas.doctor import DoctorUpdate
from sqlalchemy import delete as sql_delete
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

logger = logging.getLogger(__name__)


class DoctorRepository(BaseRepository[Doctor]):
    """
    Async repository for Doctor data access.

    Preserves all existing business rules from the old controllers:
    - Duplicate phone check on create
    - Active status check on read-by-id
    - Empty update payload rejection
    """

    def __init__(self, db: AsyncSession) -> None:
        super().__init__(Doctor, db)

    async def get_by_phone(self, phone: str) -> Optional[Doctor]:
        """Check if a phone number is already registered."""
        result = await self.db.execute(select(Doctor).where(Doctor.phone == phone))
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> Optional[Doctor]:
        """Look up a doctor by email address (used for login)."""
        result = await self.db.execute(select(Doctor).where(Doctor.email == email))
        return result.scalar_one_or_none()

    async def get_active_by_id(self, doctor_id: UUID) -> Doctor:
        """
        Fetch a doctor by ID and validate they exist AND are active.

        Raises:
            DoctorNotFoundError: if no doctor with this ID
            DoctorNotActiveError: if doctor exists but is_active=False

        WHY EAGER LOAD hospital?
        Without joinedload, accessing doctor.hospital after this method returns
        would trigger a lazy SQL query — but in async mode, lazy loading
        causes a "greenlet_spawn has not been called" error.
        """
        result = await self.db.execute(
            select(Doctor)
            .options(joinedload(Doctor.hospital))  # prevents N+1 / async lazy-load error
            .where(Doctor.id == doctor_id)
        )
        doctor = result.scalar_one_or_none()

        if doctor is None:
            logger.error("Doctor %s not found in database", doctor_id)
            raise DoctorNotFoundError(doctor_id=doctor_id)

        if doctor.is_active is False:
            logger.warning("Doctor %s is inactive", doctor_id)
            raise DoctorNotActiveError(doctor_id=str(doctor_id))

        return doctor

    async def create_with_validation(self, doctor_data) -> Doctor:
        """
        Create a new doctor after checking phone uniqueness.

        Raises DoctorAlreadyExistsError if the phone number is taken.
        """
        from app.core.security import hash_password

        existing = await self.get_by_phone(doctor_data.phone)
        if existing:
            logger.warning("Duplicate doctor phone: %s", doctor_data.phone)
            raise DoctorAlreadyExistsError(phone=doctor_data.phone)

        data = doctor_data.model_dump(exclude={"password"})
        new_doctor = Doctor(**data, password=hash_password(doctor_data.password))
        return await self.create(new_doctor)

    async def update(self, doctor_id: UUID, doctor_data: DoctorUpdate) -> Doctor:
        """
        Update doctor fields using SQLAlchemy UPDATE ... RETURNING.

        RETURNING clause fetches the updated row in one round-trip instead of:
          UPDATE ... then SELECT ...  (two round-trips)

        Raises:
            DoctorUpdateEmptyError: if no fields were provided
            DoctorNotFoundError: if doctor_id doesn't exist
        """
        update_dict = doctor_data.model_dump(exclude_unset=True)

        if not update_dict:
            raise DoctorUpdateEmptyError()

        stmt = update(Doctor).where(Doctor.id == doctor_id).values(**update_dict).returning(Doctor)

        result = await self.db.execute(stmt)
        updated_doctor = result.scalar_one_or_none()

        if updated_doctor is None:
            raise DoctorNotFoundError(doctor_id=doctor_id)

        await self.db.flush()
        logger.info("Doctor %s updated successfully", doctor_id)
        return updated_doctor

    async def delete(self, doctor_id: UUID) -> None:
        """Permanently remove a doctor from the database."""
        result = await self.db.execute(sql_delete(Doctor).where(Doctor.id == doctor_id))
        if result.rowcount == 0:
            raise DoctorNotFoundError(doctor_id=doctor_id)
        await self.db.flush()
        logger.info("Doctor %s deleted", doctor_id)
