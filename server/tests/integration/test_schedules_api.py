# =============================================================================
# INTEGRATION TESTS: SCHEDULES API — tests/integration/test_schedules_api.py
# =============================================================================

import uuid
from datetime import time

import pytest

from app.models.doctor import Doctor
from app.models.enums import DayOfWeekEnum, DoctorRoleEnum, GenderEnum


async def _create_doctor_in_db(db_session) -> str:
    """Helper: insert a doctor directly into the test DB and return their UUID string."""
    doctor = Doctor(
        id=uuid.uuid4(),
        first_name="Батсүрэн",
        last_name="Эмч",
        gender=GenderEnum.MALE,
        phone=f"9{str(uuid.uuid4().int)[:7]}",
        email=f"doc_{uuid.uuid4().hex[:8]}@hospital.mn",
        role=DoctorRoleEnum.GENERAL,
        assigned_sector="14",
        is_active=True,
        is_available=True,
    )
    db_session.add(doctor)
    await db_session.flush()
    return str(doctor.id)


class TestScheduleCreation:

    @pytest.mark.asyncio
    async def test_create_schedule_with_valid_doctor(self, client, db_session):
        """Happy path: creating a schedule for an existing doctor returns 201."""
        doctor_id = await _create_doctor_in_db(db_session)

        response = await client.post(
            "/api/v1/schedules/",
            json={
                "doctor_id": doctor_id,
                "day_of_week": "monday",
                "start_time": "09:00:00",
                "end_time": "12:00:00",
                "max_patients": 5,
                "is_active": True,
            },
        )

        assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.json()}"
        data = response.json()
        assert "id" in data
        assert data["doctor_id"] == doctor_id
        assert data["max_patients"] == 5

    @pytest.mark.asyncio
    async def test_create_schedule_with_invalid_doctor_returns_404(self, client):
        """Creating a schedule for a non-existent doctor must return 404."""
        fake_doctor_id = str(uuid.uuid4())

        response = await client.post(
            "/api/v1/schedules/",
            json={
                "doctor_id": fake_doctor_id,
                "day_of_week": "tuesday",
                "start_time": "14:00:00",
                "end_time": "17:00:00",
                "max_patients": 3,
                "is_active": True,
            },
        )

        assert response.status_code == 404, (
            f"Expected 404 for unknown doctor, got {response.status_code}"
        )

    @pytest.mark.asyncio
    async def test_invalid_time_range_returns_422(self, client, db_session):
        """
        end_time must be after start_time.
        Pydantic validator should reject end_time=09:00 when start_time=12:00.
        """
        doctor_id = await _create_doctor_in_db(db_session)

        response = await client.post(
            "/api/v1/schedules/",
            json={
                "doctor_id": doctor_id,
                "day_of_week": "wednesday",
                "start_time": "12:00:00",
                "end_time": "09:00:00",  # ← invalid: end before start
                "max_patients": 5,
                "is_active": True,
            },
        )

        # Pydantic's field_validator raises ValueError → FastAPI returns 422
        assert response.status_code == 422


class TestScheduleListing:

    @pytest.mark.asyncio
    async def test_list_schedules_returns_empty_initially(self, client):
        """Fresh database has no schedules."""
        response = await client.get("/api/v1/schedules/")
        assert response.status_code == 200
        assert response.json() == []

    @pytest.mark.asyncio
    async def test_get_by_doctor_id_returns_only_that_doctors_schedules(
        self, client, db_session
    ):
        """GET /schedules/doctor/{id} must only return schedules for that specific doctor."""
        doctor1_id = await _create_doctor_in_db(db_session)
        doctor2_id = await _create_doctor_in_db(db_session)

        # Create one schedule for each doctor
        for doctor_id in [doctor1_id, doctor2_id]:
            await client.post(
                "/api/v1/schedules/",
                json={
                    "doctor_id": doctor_id,
                    "day_of_week": "thursday",
                    "start_time": "10:00:00",
                    "end_time": "13:00:00",
                    "max_patients": 4,
                    "is_active": True,
                },
            )

        # Fetch only doctor1's schedules
        response = await client.get(f"/api/v1/schedules/doctor/{doctor1_id}")
        assert response.status_code == 200
        schedules = response.json()

        # All returned schedules must belong to doctor1 only
        assert all(s["doctor_id"] == doctor1_id for s in schedules), (
            "Doctor 2's schedule leaked into Doctor 1's schedule list"
        )
        assert len(schedules) == 1
