from httpx import AsyncClient


async def test_get_hospitals_empty(client: AsyncClient):
    """It should return empty list when db has no hospitals"""
    response = await client.get("/hospitals/")
    assert response.status_code == 200
    assert response.json()["items"] == []


async def test_get_hospitals_success(client: AsyncClient, faker):
    """It should return hospitals list from db"""
    hospital_1 = {
        "hospital_name": f"{faker.company()} Hospital",
        "hospital_phone": str(faker.random_int(min=70000000, max=79999999)),
        "address": faker.address(),
        "is_active": True,
        "level": "PRIMARY",
    }
    hospital_2 = {
        "hospital_name": f"{faker.company()} Hospital",
        "hospital_phone": str(faker.random_int(min=70000000, max=79999999)),
        "address": faker.address(),
        "is_active": True,
        "level": "SECONDARY",
    }

    await client.post("/hospitals/", json=hospital_1)
    await client.post("/hospitals/", json=hospital_2)

    response = await client.get("/hospitals/")
    assert response.status_code == 200
    hospital_list = response.json()["items"]
    assert isinstance(hospital_list, list)
    assert len(hospital_list) >= 2

    retrieved_phones = [h["hospital_phone"] for h in hospital_list]
    assert hospital_1["hospital_phone"] in retrieved_phones
    assert hospital_2["hospital_phone"] in retrieved_phones
