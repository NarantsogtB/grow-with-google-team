import pytest
from httpx import AsyncClient


async def test_create_patient(client: AsyncClient):
    response = await client.post(
        "/patients/",
        json={
            "full_name": "Test Patient",
            "phone_number": "99112235",
            "password": "password123",
            "telegram_chat_id": "123456",
            "address_text": "Test address",
            "latitude": 47.918873,
            "longitude": 106.917701,
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["full_name"] == "Test Patient"
    assert data["phone_number"] == "99112235"
    assert data["telegram_chat_id"] == "123456"
    assert data["address_text"] == "Test address"
    assert data["latitude"] == 47.918873
    assert data["longitude"] == 106.917701
    assert "id" in data
    assert "created_at" in data


async def test_get_patient_by_id(client: AsyncClient):
    create_response = await client.post(
        "/patients/",
        json={
            "full_name": "Single Patient",
            "phone_number": "99112236",
            "address_text": "Single patient address",
            "password": "password123",
            "telegram_chat_id": "123457",
            "latitude": 47.918000,
            "longitude": 106.917700,
        },
    )
    assert create_response.status_code == 201
    patient_id = create_response.json()["id"]

    response = await client.get(f"/patients/{patient_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == patient_id
    assert data["full_name"] == "Single Patient"


async def test_create_patient_duplicate_phone(client: AsyncClient):
    payload = {
        "full_name": "Duplicate Patient",
        "phone_number": "99112237",
        "address_text": "Duplicate patient address",
        "password": "password123",
        "telegram_chat_id": "123458",
        "latitude": 47.918873,
        "longitude": 106.917701,
    }
    first_response = await client.post("/patients/", json=payload)
    assert first_response.status_code == 201

    second_response = await client.post(
        "/patients/",
        json={
            "full_name": "Duplicate Patient 2",
            "phone_number": "99112237",
            "password": "password123",
            "address_text": "Duplicate patient second address",
            "telegram_chat_id": "123459",
            "latitude": 47.918900,
            "longitude": 106.917900,
        },
    )
    assert second_response.status_code == 400
