from httpx import AsyncClient


async def test_get_doctors_empty(client: AsyncClient):
    """When no doctors in database, it should return an empty list"""
    response = await client.get("/doctors/")
    assert response.status_code == 200
    assert response.json()["items"] == []


async def test_get_doctors_success(client: AsyncClient, faker):
    """Should return a list of doctors when database has data"""
    doctor_1 = {
        "first_name": faker.first_name(),
        "last_name": faker.last_name(),
        "gender": "FEMALE",
        "phone": str(faker.random_int(60000000, 69999999)),
        "email": faker.unique.email(),
        "assigned_sector": "01",
        "role": "GENERAL",
        "telegram_id": str(faker.random_int(min=100000000, max=999999999)),
        "is_active": True,
        "hospital_id": None,
    }
    doctor_2 = {
        "first_name": faker.first_name(),
        "last_name": faker.last_name(),
        "gender": "MALE",
        "phone": str(faker.random_int(60000000, 69999999)),
        "email": faker.unique.email(),
        "assigned_sector": "02",
        "role": "GENERAL",
        "telegram_id": str(faker.random_int(min=100000000, max=999999999)),
        "is_active": True,
        "hospital_id": None,
    }

    await client.post("/doctors/", json=doctor_1)
    await client.post("/doctors/", json=doctor_2)

    response = await client.get("/doctors/")
    assert response.status_code == 200
    response_data = response.json()
    doctors_list = response_data["items"]
    assert isinstance(doctors_list, list)
    assert len(doctors_list) >= 2

    retrieved_phones = [doc["phone"] for doc in doctors_list]
    assert doctor_1["phone"] in retrieved_phones
    assert doctor_2["phone"] in retrieved_phones
