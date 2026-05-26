from app.main import app
from fastapi.testclient import TestClient
from app.models import Hospital
from uuid import uuid4, UUID

from app.common_types.enums import HealthcareLevelEnum

client = TestClient(app)

def test_get_hospital_by_id_success(db_session, faker):
    """It should return hospital data by matched id"""
    
    
    hospital_data = {
        "hospital_name": f"{faker.company()} Hospital",
        "hospital_phone": str(faker.random_int(min=70000000, max=79999999)),
        "address": faker.address(),
        "is_active":True,
        "level":faker.random_element(elements=(HealthcareLevelEnum.PRIMARY.value, HealthcareLevelEnum.SECONDARY.value, HealthcareLevelEnum.TERTIARY.value)),
    }
    
    response_post = client.post("/hospitals/", json=hospital_data)
    
    response_data_post = response_post.json()
    
    response = client.get(f"/hospitals/{response_data_post["id"]}")
    response_data = response.json()
    assert response.status_code == 200
    assert response_data["id"] == response_data_post["id"]
    assert response_data["hospital_name"] == hospital_data["hospital_name"]
    assert response_data["hospital_phone"] == hospital_data["hospital_phone"]
    assert response_data["address"] == hospital_data["address"]

def test_get_hospital_by_id_notfound(db_session, faker):
    """It should throw not found error when hospital id wrong"""
    
    hospital_id = uuid4()
    
    response = client.get(f'/hospitals/{hospital_id}')
    response_data = response.json()
    assert response.status_code == 404
    assert "олдсонгүй" in response_data['detail']
    
def test_get_hospital_by_id_fail(db_session, faker):
    """It should throw bad request error when hospital id empty"""
    hospital_id = None
    response = client.get(f"/hospitals/{hospital_id}")
    assert response.status_code == 422