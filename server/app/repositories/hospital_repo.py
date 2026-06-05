# =============================================================================
# HOSPITAL REPOSITORY — app/repositories/hospital_repo.py
# =============================================================================
# Consolidates 4 old hospital controller files into one async repository class.
# =============================================================================

import logging
from typing import Optional
from uuid import UUID

from sqlalchemy import delete as sql_delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import (
    HospitalAlreadyExistError,
    HospitalNotFoundError,
    HospitalUpdateEmptyError,
)
from app.models.hospital import Hospital
from app.repositories.base import BaseRepository
from app.schemas.hospital import HospitalUpdate

logger = logging.getLogger(__name__)


class HospitalRepository(BaseRepository[Hospital]):
    """Async repository for Hospital data access."""

    def __init__(self, db: AsyncSession) -> None:
        super().__init__(Hospital, db)

    async def get_by_phone(self, hospital_phone: str) -> Optional[Hospital]:
        """Check if a phone number is already registered."""
        result = await self.db.execute(
            select(Hospital).where(Hospital.hospital_phone == hospital_phone)
        )
        return result.scalar_one_or_none()

    async def get_by_id_or_raise(self, hospital_id: UUID) -> Hospital:
        """Fetch hospital by ID or raise HospitalNotFoundError."""
        hospital = await self.get_by_id(hospital_id)
        if hospital is None:
            logger.error("Hospital %s not found", hospital_id)
            raise HospitalNotFoundError(hospital_id)
        return hospital

    async def create_with_validation(self, hospital_data) -> Hospital:
        """Create hospital after checking phone uniqueness."""
        existing = await self.get_by_phone(hospital_data.hospital_phone)
        if existing:
            logger.warning("Duplicate hospital phone: %s", hospital_data.hospital_phone)
            raise HospitalAlreadyExistError(hospital_data.hospital_phone)

        new_hospital = Hospital(**hospital_data.model_dump())
        return await self.create(new_hospital)

    async def update(self, hospital_id: UUID, hospital_data: HospitalUpdate) -> Hospital:
        """Update hospital fields using UPDATE ... RETURNING."""
        update_dict = hospital_data.model_dump(exclude_unset=True)

        if not update_dict:
            raise HospitalUpdateEmptyError()

        stmt = (
            update(Hospital)
            .where(Hospital.id == hospital_id)
            .values(**update_dict)
            .returning(Hospital)
        )

        result = await self.db.execute(stmt)
        updated_hospital = result.scalar_one_or_none()

        if updated_hospital is None:
            raise HospitalNotFoundError(hospital_id)

        await self.db.flush()
        logger.info("Hospital %s updated successfully", hospital_id)
        return updated_hospital

    async def delete(self, hospital_id: UUID) -> None:
        """Permanently remove a hospital from the database."""
        result = await self.db.execute(
            sql_delete(Hospital).where(Hospital.id == hospital_id)
        )
        if result.rowcount == 0:
            raise HospitalNotFoundError(hospital_id)
        await self.db.flush()
        logger.info("Hospital %s deleted", hospital_id)
