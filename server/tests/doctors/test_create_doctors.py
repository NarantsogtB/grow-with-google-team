import pytest
from httpx import AsyncClient

from app.common_types.enums import DoctorRoleEnum, GenderEnum


async def test_register_doctor_success(client: AsyncClient, faker):
    """Doctor create success with Faker"""
    mock_doctor_data = {
        "first_name": faker.first_name(),
        "last_name": faker.last_name(),
        "gender": faker.random_element(
            elements=(GenderEnum.MALE.value, GenderEnum.FEMALE.value)
        ),
        "phone": str(faker.random_int(min=50000000, max=99999999)),
        "email": faker.unique.email(),
        "role": faker.random_element(
            elements=(
                DoctorRoleEnum.GENERAL.value,
                DoctorRoleEnum.PEDIATRICIAN.value,
                DoctorRoleEnum.NURSE.value,
            )
        ),
        "assigned_sector": f"{faker.random_int(1, 50):02d}",
        "telegram_id": str(faker.random_int(min=100000000, max=999999999)),
        "is_active": True,
        "hospital_id": None,
    }

    response = await client.post("/doctors/", json=mock_doctor_data)
    assert response.status_code == 201
    data = response.json()
    assert data["first_name"] == mock_doctor_data["first_name"]
    assert data["last_name"] == mock_doctor_data["last_name"]
    assert data["phone"] == mock_doctor_data["phone"]
    assert data["email"] == mock_doctor_data["email"]
    assert data["assigned_sector"] == mock_doctor_data["assigned_sector"]
    assert "id" in data
    assert isinstance(data["id"], str)
    assert data["is_active"] is True
    assert data["is_available"] is True
    assert data["created_at"] is not None
    assert "updated_at" in data


async def test_register_doctor_duplicate_phone(client: AsyncClient, faker):
    """When insert duplicate phone number it will raise HTTP error"""
    duplicate_phone = str(faker.random_int(min=50000000, max=99999999))

    doctor_data_1 = {
        "first_name": faker.first_name(),
        "last_name": faker.last_name(),
        "gender": GenderEnum.MALE.value,
        "phone": duplicate_phone,
        "email": faker.unique.email(),
        "assigned_sector": "01",
        "role": DoctorRoleEnum.GENERAL.value,
        "telegram_id": str(faker.random_int(min=100000000, max=999999999)),
        "is_active": True,
        "hospital_id": None,
    }
    doctor_data_2 = {
        "first_name": faker.first_name(),
        "last_name": faker.last_name(),
        "gender": GenderEnum.FEMALE.value,
        "phone": duplicate_phone,
        "email": faker.unique.email(),
        "assigned_sector": "02",
        "role": DoctorRoleEnum.GENERAL.value,
        "telegram_id": str(faker.random_int(min=100000000, max=999999999)),
        "is_active": True,
        "hospital_id": None,
    }

    success_response = await client.post("/doctors/", json=doctor_data_1)
    assert success_response.status_code == 201

    failed_response = await client.post("/doctors/", json=doctor_data_2)
    assert failed_response.status_code == 400
    assert (
        failed_response.json()["detail"]
        == f"{doctor_data_2['phone']} энэ утасны дугаартай эмч бүртгэлтэй байна."
    )
