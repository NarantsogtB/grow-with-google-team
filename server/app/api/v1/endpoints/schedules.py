# =============================================================================
# SCHEDULES ENDPOINT — app/api/v1/endpoints/schedules.py
# =============================================================================
# Async rewrite of app/routers/doctor_weekly_schedules/
# =============================================================================

from typing import List
from uuid import UUID

from app.api.deps import Database
from app.schemas.schedule import (
    DoctorWeeklyScheduleCreate,
    DoctorWeeklyScheduleResponse,
    DoctorWeeklyScheduleUpdate,
)
from app.services.schedule_service import ScheduleService
from fastapi import APIRouter, status

router = APIRouter(prefix="/schedules", tags=["Doctor Weekly Schedules"])


@router.post(
    "/",
    response_model=DoctorWeeklyScheduleResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_schedule(
    data: DoctorWeeklyScheduleCreate,
    db: Database,
):
    """
    Create a new weekly schedule template for a doctor.
    Returns 404 if the doctor_id does not exist.
    """
    return await ScheduleService(db).create(data)


@router.get("/", response_model=List[DoctorWeeklyScheduleResponse])
async def list_schedules(db: Database):
    """List all weekly schedule templates."""
    return await ScheduleService(db).get_all()


@router.get("/doctor/{doctor_id}", response_model=List[DoctorWeeklyScheduleResponse])
async def list_doctor_schedules(
    doctor_id: UUID,
    db: Database,
):
    """List all schedule templates for a specific doctor."""
    return await ScheduleService(db).get_by_doctor(doctor_id)


@router.get("/{schedule_id}", response_model=DoctorWeeklyScheduleResponse)
async def get_schedule(
    schedule_id: UUID,
    db: Database,
):
    """Get a single schedule template by ID."""
    return await ScheduleService(db).get_by_id(schedule_id)


@router.put("/{schedule_id}", response_model=DoctorWeeklyScheduleResponse)
async def update_schedule(
    schedule_id: UUID,
    data: DoctorWeeklyScheduleUpdate,
    db: Database,
):
    """Update a schedule template's fields."""
    return await ScheduleService(db).update(schedule_id, data)


@router.delete("/{schedule_id}")
async def delete_schedule(
    schedule_id: UUID,
    db: Database,
):
    """Delete a schedule template."""
    return await ScheduleService(db).delete(schedule_id)
