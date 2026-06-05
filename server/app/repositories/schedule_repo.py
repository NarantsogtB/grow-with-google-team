# =============================================================================
# SCHEDULE REPOSITORY — app/repositories/schedule_repo.py
# =============================================================================
# Async repository for DoctorWeeklySchedule data access.
# Consolidates doctor_weekly_schedule_controller.py into one class.
#
# IMPORTANT: Uses the SECOND (correct) create definition from the old controller
# — the one that validates the doctor exists before creating the schedule.
# The first (duplicate) definition without doctor validation was removed in Phase 1.
# =============================================================================

import logging
from typing import List
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.doctor import Doctor
from app.models.schedule import DoctorWeeklySchedule
from app.repositories.base import BaseRepository
from app.schemas.schedule import (DoctorWeeklyScheduleCreate,
                                  DoctorWeeklyScheduleUpdate)

logger = logging.getLogger(__name__)


class ScheduleRepository(BaseRepository[DoctorWeeklySchedule]):
    """Async repository for DoctorWeeklySchedule data access."""

    def __init__(self, db: AsyncSession) -> None:
        super().__init__(DoctorWeeklySchedule, db)

    async def get_by_id_or_raise(self, schedule_id: UUID) -> DoctorWeeklySchedule:
        """Fetch schedule by ID or raise 404-triggering exception."""
        schedule = await self.get_by_id(schedule_id)
        if not schedule:
            # We raise a plain ValueError here — the endpoint converts it to HTTPException
            raise ValueError(f"Doctor weekly schedule {schedule_id} not found")
        return schedule

    async def get_by_doctor_id(self, doctor_id: UUID) -> List[DoctorWeeklySchedule]:
        """Fetch all schedule templates for a specific doctor."""
        result = await self.db.execute(
            select(DoctorWeeklySchedule).where(
                DoctorWeeklySchedule.doctor_id == doctor_id
            )
        )
        return list(result.scalars().all())

    async def create_with_doctor_validation(
        self,
        schedule_data: DoctorWeeklyScheduleCreate,
    ) -> DoctorWeeklySchedule:
        """
        Create a schedule template after verifying the doctor exists.

        Why validate the doctor?
        Without this check, we could create a schedule referencing a non-existent
        doctor. The FK constraint would also prevent this, but we want to return
        a clear 404 message rather than a raw DB constraint error.
        """
        # Verify doctor exists — raises nothing if found, we check ourselves
        doctor_result = await self.db.execute(
            select(Doctor).where(Doctor.id == schedule_data.doctor_id)
        )
        doctor = doctor_result.scalar_one_or_none()

        if not doctor:
            raise ValueError(f"Doctor {schedule_data.doctor_id} not found")

        new_schedule = DoctorWeeklySchedule(**schedule_data.model_dump())
        return await self.create(new_schedule)

    async def update(
        self,
        schedule_id: UUID,
        schedule_data: DoctorWeeklyScheduleUpdate,
    ) -> DoctorWeeklySchedule:
        """Update schedule fields. Only sends changed fields (exclude_unset=True)."""
        schedule = await self.get_by_id_or_raise(schedule_id)

        for field, value in schedule_data.model_dump(exclude_unset=True).items():
            setattr(schedule, field, value)

        await self.db.flush()
        await self.db.refresh(schedule)
        logger.info("Schedule %s updated", schedule_id)
        return schedule
