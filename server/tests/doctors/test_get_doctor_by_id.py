from uuid import uuid4

from fastapi import status
from httpx import AsyncClient


def _doctor_payload(faker) -> dict:
    return {
        "first_name": faker.first_name(),
        "last_name": faker.last_name(),
        "gender": "MALE",
        "phone": str(faker.random_int(60000000, 69999999)),
        "email": faker.unique.email(),
        "assigned_sector": "01",
        "role": "GENERAL",
        "telegram_id": str(faker.random_int(100000000, 999999999)),
        "is_active": True,
        "hospital_id": None,
    }


async def test_read_doctor_by_id_success(client: AsyncClient, faker):
    """Doctor info success it will return status code 200"""
    create_resp = await client.post("/doctors/", json=_doctor_payload(faker))
    assert create_resp.status_code == status.HTTP_201_CREATED
    doctor_id = create_resp.json()["id"]

    response = await client.get(f"/doctors/{doctor_id}")
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["id"] == doctor_id


async def test_read_doctor_by_id_not_found(client: AsyncClient):
    """Doctor not found router will raise DoctorNotFound error with 404"""
    response = await client.get(f"/doctors/{uuid4()}")
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "олдсонгүй" in response.json()["detail"].lower()


async def test_read_doctor_by_id_not_active(client: AsyncClient, faker):
    """When doctor is_active is False router throw DoctorNotActiveError with 400"""
    # DoctorCreate does not expose is_active — create active first, then deactivate via PUT
    create_resp = await client.post("/doctors/", json=_doctor_payload(faker))
    assert create_resp.status_code == status.HTTP_201_CREATED
    doctor_id = create_resp.json()["id"]

    deactivate_resp = await client.put(f"/doctors/{doctor_id}", json={"is_active": False})
    assert deactivate_resp.status_code == 200

    response = await client.get(f"/doctors/{doctor_id}")
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "бүртгэл идэвхгүй" in response.json()["detail"].lower()
