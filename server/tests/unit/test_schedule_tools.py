# =============================================================================
# UNIT TESTS: SCHEDULE TOOLS — tests/unit/test_schedule_tools.py
# =============================================================================
# Tests for the deterministic schedule reorder tool.
#
# These tests use the real DB session (via db_session fixture) because
# reorder_schedule_tool interacts with the database.
# The db_session fixture provides an isolated in-memory SQLite database.
# =============================================================================

import uuid
from datetime import time

import pytest
from app.models.doctor import Doctor
from app.models.enums import DayOfWeekEnum, DoctorRoleEnum, GenderEnum
from app.models.schedule import DoctorWeeklySchedule
from app.tools.schedule_tools import get_daily_schedule_summary, reorder_schedule_tool


async def _create_test_doctor(db_session) -> Doctor:
    """Helper: create a minimal doctor in the test DB."""
    doctor = Doctor(
        id=uuid.uuid4(),
        first_name="Тест",
        last_name="Эмч",
        gender=GenderEnum.MALE,
        phone=f"9{str(uuid.uuid4().int)[:7]}",  # unique phone
        email=f"test_{uuid.uuid4().hex[:8]}@clinic.mn",
        role=DoctorRoleEnum.GENERAL,
        assigned_sector="14",
        is_active=True,
        is_available=True,
    )
    db_session.add(doctor)
    await db_session.flush()
    await db_session.refresh(doctor)
    return doctor


async def _create_test_schedule(
    db_session,
    doctor_id: uuid.UUID,
    max_patients: int = 5,
    is_active: bool = True,
) -> DoctorWeeklySchedule:
    """Helper: create a schedule template in the test DB."""
    schedule = DoctorWeeklySchedule(
        id=uuid.uuid4(),
        doctor_id=doctor_id,
        day_of_week=DayOfWeekEnum.MONDAY,
        start_time=time(9, 0),
        end_time=time(12, 0),
        max_patients=max_patients,
        is_active=is_active,
    )
    db_session.add(schedule)
    await db_session.flush()
    await db_session.refresh(schedule)
    return schedule


class TestReorderScheduleTool:
    """Tests for reorder_schedule_tool."""

    @pytest.mark.asyncio
    async def test_schedule_not_found_returns_error_dict(self, db_session):
        """
        When the schedule_id doesn't exist, the tool should return a structured
        error dict — NOT raise an exception.
        This is intentional: LangGraph tools should always return dicts.
        """
        nonexistent_id = uuid.uuid4()
        patient_id = uuid.uuid4()

        result = await reorder_schedule_tool(nonexistent_id, patient_id, db_session)

        # Should return structured error, not raise
        assert result["success"] is False
        assert "not found" in result["error"].lower()
        assert str(nonexistent_id) == result["schedule_id"]

    @pytest.mark.asyncio
    async def test_active_schedule_decrements_capacity(self, db_session):
        """
        When a patient is removed from an active schedule, max_patients should
        decrease by 1 and the tool should return success.
        """
        doctor = await _create_test_doctor(db_session)
        schedule = await _create_test_schedule(db_session, doctor.id, max_patients=5)
        original_capacity = schedule.max_patients

        patient_id = uuid.uuid4()

        result = await reorder_schedule_tool(schedule.id, patient_id, db_session)

        assert result["success"] is True
        assert result["remaining_capacity"] == original_capacity - 1
        assert str(patient_id) == result["removed_patient_id"]
        assert "message" in result

    @pytest.mark.asyncio
    async def test_inactive_schedule_returns_error(self, db_session):
        """
        Reordering an inactive schedule should return success=False with
        an informative error message.
        """
        doctor = await _create_test_doctor(db_session)
        schedule = await _create_test_schedule(
            db_session, doctor.id, max_patients=3, is_active=False
        )

        result = await reorder_schedule_tool(schedule.id, uuid.uuid4(), db_session)

        assert result["success"] is False
        assert "inactive" in result["error"].lower()

    @pytest.mark.asyncio
    async def test_zero_capacity_schedule_not_decremented(self, db_session):
        """
        A schedule with 0 max_patients should not go negative.
        """
        doctor = await _create_test_doctor(db_session)
        schedule = await _create_test_schedule(db_session, doctor.id, max_patients=0)

        result = await reorder_schedule_tool(schedule.id, uuid.uuid4(), db_session)

        # Should succeed but capacity stays at 0 (not -1)
        assert result["success"] is True
        assert result["remaining_capacity"] >= 0


class TestGetDailyScheduleSummary:
    """Tests for get_daily_schedule_summary."""

    @pytest.mark.asyncio
    async def test_returns_empty_for_new_doctor(self, db_session):
        """A brand-new doctor with no schedules should return an empty list."""
        doctor = await _create_test_doctor(db_session)
        result = await get_daily_schedule_summary(doctor.id, db_session)
        assert result == []

    @pytest.mark.asyncio
    async def test_returns_only_active_schedules(self, db_session):
        """Only active schedules should be returned."""
        doctor = await _create_test_doctor(db_session)

        # Create one active and one inactive schedule
        await _create_test_schedule(db_session, doctor.id, is_active=True)
        await _create_test_schedule(db_session, doctor.id, is_active=False)

        result = await get_daily_schedule_summary(doctor.id, db_session)

        # Only the active one should appear
        assert len(result) == 1
        assert "schedule_id" in result[0]
        assert "day_of_week" in result[0]
