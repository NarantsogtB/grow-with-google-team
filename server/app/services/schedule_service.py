# =============================================================================
# SCHEDULE SERVICE — app/services/schedule_service.py
# =============================================================================
# Business logic for doctor weekly schedule operations.
# Also serves as the bridge between the LangGraph schedule agent and the DB.
# =============================================================================

import logging
from typing import List
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.schedule_repo import ScheduleRepository
from app.schemas.schedule import (DoctorWeeklyScheduleCreate,
                                  DoctorWeeklyScheduleResponse,
                                  DoctorWeeklyScheduleUpdate)

logger = logging.getLogger(__name__)


class ScheduleService:
    """
    Orchestrates schedule operations using ScheduleRepository.

    This service is also called by:
    - app/tools/schedule_tools.py (reorder_schedule_tool)
    - The Telegram bot webhook when a patient replies with their availability

    By going through the service layer, all callers (HTTP endpoints, AI tools,
    Telegram bot) share the same validation and business rules.
    """

    def __init__(self, db: AsyncSession) -> None:
        self.repo = ScheduleRepository(db)

    async def create(
        self, data: DoctorWeeklyScheduleCreate
    ) -> DoctorWeeklyScheduleResponse:
        """Create a new schedule template, validating the doctor exists first."""
        try:
            schedule = await self.repo.create_with_doctor_validation(data)
            return DoctorWeeklyScheduleResponse.model_validate(schedule)
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

    async def get_all(self) -> List[DoctorWeeklyScheduleResponse]:
        """List all schedule templates (no pagination — schedules per doctor are small)."""
        schedules, _ = await self.repo.get_all(page=1, size=1000)
        return [DoctorWeeklyScheduleResponse.model_validate(s) for s in schedules]

    async def get_by_id(self, schedule_id: UUID) -> DoctorWeeklyScheduleResponse:
        """Fetch a single schedule by ID."""
        try:
            schedule = await self.repo.get_by_id_or_raise(schedule_id)
            return DoctorWeeklyScheduleResponse.model_validate(schedule)
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

    async def get_by_doctor(
        self, doctor_id: UUID
    ) -> List[DoctorWeeklyScheduleResponse]:
        """Fetch all schedule templates for a specific doctor."""
        schedules = await self.repo.get_by_doctor_id(doctor_id)
        return [DoctorWeeklyScheduleResponse.model_validate(s) for s in schedules]

    async def update(
        self, schedule_id: UUID, data: DoctorWeeklyScheduleUpdate
    ) -> DoctorWeeklyScheduleResponse:
        """Update schedule fields."""
        try:
            schedule = await self.repo.update(schedule_id, data)
            return DoctorWeeklyScheduleResponse.model_validate(schedule)
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

    async def delete(self, schedule_id: UUID) -> dict:
        """Delete a schedule template."""
        try:
            schedule = await self.repo.get_by_id_or_raise(schedule_id)
            await self.repo.delete(schedule)
            logger.info("Schedule %s deleted", schedule_id)
            return {
                "message": "Doctor weekly schedule deleted successfully",
                "success": True,
            }
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
