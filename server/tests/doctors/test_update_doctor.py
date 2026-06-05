from uuid import uuid4

import pytest
from httpx import AsyncClient


def _doctor_payload(faker) -> dict:
    return {
        "first_name": "Бат",
        "last_name": "Болд",
        "gender": "MALE",
        "phone": str(faker.random_int(60000000, 69999999)),
        "email": faker.unique.email(),
        "role": "GENERAL",
        "is_active": True,
        "assigned_sector": "01",
        "telegram_id": str(faker.random_int(100000000, 999999999)),
        "hospital_id": None,
    }


async def test_update_doctor_empty(client: AsyncClient):
    """When no field from frontend it should raise empty error"""
    response = await client.put(f"/doctors/{uuid4()}", json={})
    assert response.status_code == 400
    assert "detail" in response.json()


async def test_update_doctor_notfound(client: AsyncClient, faker):
    """It should throw not found error when wrong id"""
    response = await client.put(
        f"/doctors/{uuid4()}",
        json={"first_name": faker.first_name(), "last_name": faker.last_name()},
    )
    assert response.status_code == 404
    assert "олдсонгүй" in response.json()["detail"]


async def test_update_doctor_success(client: AsyncClient, faker):
    """It should return 200 code when update data is not empty and id match"""
    create_resp = await client.post("/doctors/", json=_doctor_payload(faker))
    assert create_resp.status_code == 201
    doctor_id = create_resp.json()["id"]

    update_data = {"first_name": faker.first_name(), "last_name": faker.last_name()}
    response = await client.put(f"/doctors/{doctor_id}", json=update_data)
    data = response.json()
    assert response.status_code == 200
    assert "амжилттай" in data["message"]
    assert data["data"]["first_name"] == update_data["first_name"]
    assert data["data"]["last_name"] == update_data["last_name"]


async def test_update_doctor_fail(client: AsyncClient, faker):
    """It should throw server error with 500 code"""
    create_resp = await client.post("/doctors/", json=_doctor_payload(faker))
    assert create_resp.status_code == 201
    doctor_id = create_resp.json()["id"]

    response = await client.put(
        f"/doctors/{doctor_id}", json={"first_name": None, "last_name": None}
    )
    data = response.json()
    assert response.status_code == 500
    assert "server error" in data["detail"]
