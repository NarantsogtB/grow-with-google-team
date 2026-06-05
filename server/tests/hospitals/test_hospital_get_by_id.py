from uuid import uuid4

from app.common_types.enums import HealthcareLevelEnum
from httpx import AsyncClient


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


async def test_get_hospital_by_id_success(client: AsyncClient, faker):
    """It should return hospital data by matched id"""
    payload = _hospital_payload(faker)
    create_resp = await client.post("/hospitals/", json=payload)
    assert create_resp.status_code == 201
    hospital_id = create_resp.json()["id"]

    response = await client.get(f"/hospitals/{hospital_id}")
    data = response.json()
    assert response.status_code == 200
    assert data["id"] == hospital_id
    assert data["hospital_name"] == payload["hospital_name"]
    assert data["hospital_phone"] == payload["hospital_phone"]
    assert data["address"] == payload["address"]


async def test_get_hospital_by_id_notfound(client: AsyncClient):
    """It should throw not found error when hospital id wrong"""
    response = await client.get(f"/hospitals/{uuid4()}")
    assert response.status_code == 404
    assert "олдсонгүй" in response.json()["detail"]


async def test_get_hospital_by_id_fail(client: AsyncClient):
    """It should throw bad request error when hospital id is invalid"""
    response = await client.get("/hospitals/None")
    assert response.status_code == 422
