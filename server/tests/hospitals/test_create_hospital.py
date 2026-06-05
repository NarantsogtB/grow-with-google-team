import pytest
from httpx import AsyncClient
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.common_types.enums import HealthcareLevelEnum


def _hospital_payload(faker) -> dict:
    return {
        "hospital_name": f"{faker.company()} Hospital",
        "hospital_phone": str(faker.random_int(min=70000000, max=79999999)),
        "address": faker.address(),
        "is_active": True,
        "level": faker.random_element(
            elements=(
                HealthcareLevelEnum.PRIMARY.value,
                HealthcareLevelEnum.SECONDARY.value,
                HealthcareLevelEnum.TERTIARY.value,
            )
        ),
    }


async def test_register_hospital_success(client: AsyncClient, faker):
    """Hospital create success return Hospital with Faker"""
    payload = _hospital_payload(faker)
    response = await client.post("/hospitals/", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["hospital_name"] == payload["hospital_name"]
    assert data["hospital_phone"] == payload["hospital_phone"]
    assert data["address"] == payload["address"]
    assert data["level"] == payload["level"]
    assert "id" in data
    assert isinstance(data["id"], str)
    assert data["is_active"] is True
    assert data["created_at"] is not None


async def test_register_hospital_duplicate_phone(client: AsyncClient, faker):
    """When insert duplicate phone number it will raise HTTP error"""
    duplicate_phone = str(faker.random_int(min=70000000, max=79999999))

    hospital_1 = {**_hospital_payload(faker), "hospital_phone": duplicate_phone}
    hospital_2 = {**_hospital_payload(faker), "hospital_phone": duplicate_phone}

    success_response = await client.post("/hospitals/", json=hospital_1)
    assert success_response.status_code == 201

    failed_response = await client.post("/hospitals/", json=hospital_2)
    assert failed_response.status_code == 400
    assert (
        failed_response.json()["detail"]
        == f"{duplicate_phone} энэ дугаартай эмнэлэг бүртгэлтэй байна."
    )


async def test_register_hospital_rollback_on_exception(
    client: AsyncClient, faker, monkeypatch
):
    """It should throw exception error when database connection failed"""
    rollback_called = False

    def mock_rollback(*args, **kwargs):
        nonlocal rollback_called
        rollback_called = True

    def mock_commit_error(*args, **kwargs):
        raise SQLAlchemyError("Хадгалах үед бааз уналаа!")

    monkeypatch.setattr(Session, "commit", mock_commit_error)
    monkeypatch.setattr(Session, "rollback", mock_rollback)

    payload = {
        **_hospital_payload(faker),
        "hospital_phone": str(faker.random_int(min=80000000, max=99999999)),
    }
    response = await client.post("/hospitals/", json=payload)
    assert response.status_code == 500
    assert rollback_called is True


async def test_register_hospital_phone_int(client: AsyncClient, faker):
    """It should throw status code 422 when phone number is int"""
    payload = {
        "hospital_name": f"{faker.company()} Hospital",
        "hospital_phone": faker.random_int(min=80000000, max=99999999),
        "address": faker.street_address(),
        "is_active": True,
        "level": "PRIMARY",
    }
    response = await client.post("/hospitals/", json=payload)
    assert response.status_code == 422
