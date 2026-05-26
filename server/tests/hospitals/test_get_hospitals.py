from fastapi.testclient import TestClient
from app.main import app

client =TestClient(app)

def test_get_hospitals_empty(db_session):
    """It should return empty list when db in no hospital"""
    
    response = client.get("/hospitals/")
    response_data = response.json()
    assert response.status_code == 200
    assert response_data["items"] == []
    
def test_get_hospitals_success(db_session, faker):
    """It should return hospitals list from db"""
    
    mock_hospital_data_1 = {
        "hospital_name": f"{faker.company()} Hospital",
        "hospital_phone": str(faker.random_int(min=70000000, max=79999999)),
        "address": faker.address(),
        "is_active":True,
        "level":"PRIMARY"
    }
    
    mock_hospital_data_2 = {
        "hospital_name": f"{faker.company()} Hospital",
        "hospital_phone": str(faker.random_int(min=70000000, max=79999999)),
        "address": faker.address(),
        "is_active":True,
        "level":"SECONDARY"
    }
    
    client.post("/hospitals/", json=mock_hospital_data_1)
    client.post("/hospitals/", json=mock_hospital_data_2)
    
    response = client.get("/hospitals/")
    hospital_list = response.json()["items"]
    assert len(hospital_list) >= 2
    assert isinstance(hospital_list, list)
    assert response.status_code == 200
    
    retrieved_phones = [hospital["hospital_phone"] for hospital in hospital_list]
    
    assert mock_hospital_data_1["hospital_phone"] in retrieved_phones
    assert mock_hospital_data_2["hospital_phone"] in retrieved_phones
    
    
    
    