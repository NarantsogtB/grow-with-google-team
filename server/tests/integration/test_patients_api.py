# =============================================================================
# INTEGRATION TESTS: PATIENTS API — tests/integration/test_patients_api.py
# =============================================================================
# Integration tests test the FULL REQUEST-RESPONSE CYCLE:
#   HTTP request → FastAPI routing → Pydantic validation → Service → Repository → DB
#
# Unlike unit tests (which test individual functions in isolation), integration
# tests verify that all the pieces work TOGETHER correctly.
#
# WHAT WE TEST HERE:
#   1. Happy path: successful registration returns correct shape
#   2. Security: password never appears in any response
#   3. JWT: login returns a real 3-part JWT, not the old mock string
#   4. Pagination: list endpoint returns paginated structure
#   5. Validation: duplicate phone returns 400 with meaningful message
#   6. Authentication: login with wrong credentials returns 401
#
# Faker generates realistic test data so tests don't rely on hardcoded strings.
# =============================================================================

import uuid

import pytest
from app.core.security import create_access_token
from app.models.doctor import Doctor
from app.models.enums import DoctorRoleEnum, GenderEnum
from faker import Faker

fake = Faker()


async def _doctor_auth_header(db_session) -> dict:
    """Create a doctor in the test DB and return an Authorization header."""
    doctor = Doctor(
        id=uuid.uuid4(),
        first_name="Тест",
        last_name="Эмч",
        gender=GenderEnum.MALE,
        phone=f"9{str(uuid.uuid4().int)[:7]}",
        email=f"doc_{uuid.uuid4().hex[:8]}@test.mn",
        role=DoctorRoleEnum.GENERAL,
        assigned_sector="14",
        is_active=True,
        is_available=True,
    )
    db_session.add(doctor)
    await db_session.flush()
    token = create_access_token(str(doctor.id))
    return {"Authorization": f"Bearer {token}"}


# ── TEST DATA FACTORY ──────────────────────────────────────────────────────────


def make_patient_payload(phone: str = None) -> dict:
    """Generate realistic patient registration data using Faker."""
    return {
        "full_name": fake.name(),
        # Mongolian phone numbers are 8 digits starting with 9 or 8
        "phone_number": phone or f"9{fake.numerify('####### ')}".strip(),
        "password": "SecurePassword123!",
        "address_text": fake.address(),
        "telegram_chat_id": None,
        "latitude": float(fake.latitude()),
        "longitude": float(fake.longitude()),
    }


# ── REGISTRATION TESTS ─────────────────────────────────────────────────────────


class TestPatientRegistration:

    @pytest.mark.asyncio
    async def test_register_success_returns_201(self, client):
        """Happy path: valid registration returns HTTP 201 Created."""
        response = await client.post("/api/v1/patients/", json=make_patient_payload())
        assert response.status_code == 201

    @pytest.mark.asyncio
    async def test_register_response_has_id_and_name(self, client):
        """Response body must include `id` and `full_name` fields."""
        payload = make_patient_payload()
        response = await client.post("/api/v1/patients/", json=payload)
        data = response.json()

        assert "id" in data, "Response must include the patient's UUID"
        assert "full_name" in data
        assert data["full_name"] == payload["full_name"]

    @pytest.mark.asyncio
    async def test_register_password_never_in_response(self, client):
        """
        CRITICAL SECURITY TEST: The patient's password (even hashed) must
        NEVER appear in any API response.
        """
        response = await client.post("/api/v1/patients/", json=make_patient_payload())
        data = response.json()

        assert (
            "password" not in data
        ), "SECURITY VIOLATION: password field was returned in registration response"

    @pytest.mark.asyncio
    async def test_register_duplicate_phone_returns_400(self, client):
        """
        Registering the same phone number twice must return 400 Bad Request.
        The error message should be in Mongolian.
        """
        phone = "99112233"
        await client.post("/api/v1/patients/", json=make_patient_payload(phone=phone))
        response = await client.post("/api/v1/patients/", json=make_patient_payload(phone=phone))

        assert response.status_code == 400
        detail = response.json()["detail"]
        assert len(detail) > 0, "Error detail should not be empty"

    @pytest.mark.asyncio
    async def test_register_missing_required_fields_returns_422(self, client):
        """
        Sending incomplete data should return 422 Unprocessable Entity.
        422 means Pydantic validation rejected the input.
        """
        response = await client.post("/api/v1/patients/", json={"full_name": "Only Name"})
        assert response.status_code == 422


# ── LOGIN TESTS ────────────────────────────────────────────────────────────────


class TestPatientLogin:

    async def _register_patient(self, client, phone: str, password: str) -> dict:
        """Helper: register a patient and return their data."""
        payload = make_patient_payload(phone=phone)
        payload["password"] = password
        response = await client.post("/api/v1/patients/", json=payload)
        assert response.status_code == 201
        return response.json()

    @pytest.mark.asyncio
    async def test_login_success_returns_200(self, client):
        """Happy path: correct credentials return 200 OK."""
        phone = "99000001"
        password = "TestPassword99!"
        await self._register_patient(client, phone, password)

        response = await client.post(
            "/api/v1/patients/login",
            json={"phone_number": phone, "password": password},
        )
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_login_returns_real_jwt_not_mock(self, client):
        """
        CRITICAL SECURITY TEST: The access_token must be a real signed JWT
        (3 dot-separated base64 parts), not the old mock string.

        Old broken behavior: "mock_jwt_token_for_<uuid>"
        Required behavior:   "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI...".

        A real JWT always has EXACTLY 3 parts separated by dots.
        """
        phone = "99000002"
        password = "TestPassword99!"
        await self._register_patient(client, phone, password)

        response = await client.post(
            "/api/v1/patients/login",
            json={"phone_number": phone, "password": password},
        )
        data = response.json()

        token = data["access_token"]

        # Verify it's a real JWT structure
        parts = token.split(".")
        assert len(parts) == 3, f"Expected JWT with 3 dot-separated parts, got: '{token[:50]}...'"

        # Verify the old mock pattern is gone
        assert not token.startswith(
            "mock_jwt_token_for_"
        ), "Mock JWT token is still being returned — security fix not applied"

    @pytest.mark.asyncio
    async def test_login_wrong_password_returns_401(self, client):
        """Wrong password must return 401 Unauthorized (not 400 or 500)."""
        phone = "99000003"
        await self._register_patient(client, phone, "correct_password")

        response = await client.post(
            "/api/v1/patients/login",
            json={"phone_number": phone, "password": "wrong_password"},
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_login_nonexistent_phone_returns_401(self, client):
        """
        Non-existent phone number returns 401 (same as wrong password).
        This prevents user enumeration: attacker can't tell if the phone
        is registered or not based on the error response.
        """
        response = await client.post(
            "/api/v1/patients/login",
            json={"phone_number": "00000000", "password": "anypassword"},
        )
        assert response.status_code == 401


# ── LIST/PAGINATION TESTS ──────────────────────────────────────────────────────


class TestPatientList:

    @pytest.mark.asyncio
    async def test_list_returns_paginated_structure(self, client, db_session):
        """
        GET /patients must return a paginated response structure.
        The old bug was returning a raw list (unbounded query).
        The fix returns {items: [...], total: N, page: 1, size: 10}.
        Requires doctor auth — endpoint now filters by doctor's assigned_sector.
        """
        headers = await _doctor_auth_header(db_session)
        response = await client.get("/api/v1/patients/", headers=headers)
        assert response.status_code == 200

        data = response.json()
        assert "items" in data, "Response must have 'items' key"
        assert "total" in data, "Response must have 'total' key"
        assert "page" in data, "Response must have 'page' key"
        assert "size" in data, "Response must have 'size' key"

    @pytest.mark.asyncio
    async def test_list_respects_size_parameter(self, client, db_session):
        """GET /patients?size=2 must return at most 2 items per page."""
        headers = await _doctor_auth_header(db_session)
        # Register 3 patients in the same sector as the doctor ("14")
        for _ in range(3):
            payload = make_patient_payload()
            payload["sector"] = "14"
            await client.post("/api/v1/patients/", json=payload)

        response = await client.get("/api/v1/patients/?page=1&size=2", headers=headers)
        data = response.json()

        assert len(data["items"]) <= 2, "size parameter must be respected"
        assert data["size"] == 2
