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


async def test_update_hospital_success(client: AsyncClient, faker):
    """It should return 200 code when update data is not empty and id match"""
    create_resp = await client.post("/hospitals/", json=_hospital_payload(faker))
    assert create_resp.status_code == 201
    hospital_id = create_resp.json()["id"]

    update_data = {
        "hospital_name": f"{faker.company()} Hospital",
        "hospital_phone": str(faker.random_int(min=70000000, max=79999999)),
    }
    response = await client.put(f"/hospitals/{hospital_id}", json=update_data)
    data = response.json()
    assert response.status_code == 200
    assert "амжилттай" in data["message"]
    assert data["data"]["hospital_name"] == update_data["hospital_name"]
    assert data["data"]["hospital_phone"] == update_data["hospital_phone"]


async def test_update_hospital_empty(client: AsyncClient):
    """When no field from frontend it should raise empty error"""
    response = await client.put(f"/hospitals/{uuid4()}", json={})
    data = response.json()
    assert response.status_code == 400
    assert "хоосон талбараар" in data["detail"]


async def test_update_hospital_notfound(client: AsyncClient, faker):
    """It should throw not found error when wrong id"""
    update_data = {
        "hospital_name": f"{faker.company()} Hospital",
        "hospital_phone": str(faker.random_int(min=70000000, max=79999999)),
    }
    response = await client.put(f"/hospitals/{uuid4()}", json=update_data)
    assert response.status_code == 404
    assert "олдсонгүй" in response.json()["detail"]


async def test_update_hospital_fail(client: AsyncClient, faker):
    """It should throw server error with 500 code"""
    create_resp = await client.post("/hospitals/", json=_hospital_payload(faker))
    assert create_resp.status_code == 201
    hospital_id = create_resp.json()["id"]

    response = await client.put(
        f"/hospitals/{hospital_id}",
        json={"hospital_name": None, "hospital_phone": None},
    )
    data = response.json()
    assert response.status_code == 500
    assert "server error" in data["detail"]
