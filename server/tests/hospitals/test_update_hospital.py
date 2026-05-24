from app.main import app
from fastapi.testclient import TestClient
from app.models import Hospital
from uuid import uuid4

from app.common_types.enums import HealthcareLevelEnum


client = TestClient(app)

def test_update_hospital_success(db_session, faker):
     """It should return 200 code when update data is not empty and id match"""
     
     existing_hospital=Hospital(
        id = uuid4(),
        hospital_name = f"{faker.company()} Hospital",
        hospital_phone = str(faker.random_int(min=70000000, max=79999999)),
        address= faker.address(),
        is_active=True,
        level = faker.random_element(elements=(HealthcareLevelEnum.PRIMARY.value, HealthcareLevelEnum.SECONDARY.value, HealthcareLevelEnum.TERTIARY.value))
     )
     
     db_session.add(existing_hospital)
     db_session.commit()
     db_session.refresh(existing_hospital)
     
     update_hospital_data = {
         "hospital_name": f"{faker.company()} hospital",
         "hospital_phone": str(faker.random_int(min=70000000, max=79999999)),
     }
     
     response = client.put(f"/hospitals/{existing_hospital.id}", json=update_hospital_data)
     response_data = response.json()
     assert response.status_code == 200
     assert "амжилттай" in response_data["message"]
     assert update_hospital_data["hospital_name"] == response_data["data"]["hospital_name"]
     assert update_hospital_data["hospital_phone"] == response_data["data"]["hospital_phone"]
    
def test_update_hospital_empty(db_session, faker):
    """When no field from frontend it should raise empty error"""
    
    existing_hospital=Hospital(
        id = uuid4(),
        hospital_name = f"{faker.company()} Hospital",
        hospital_phone = str(faker.random_int(min=70000000, max=79999999)),
        address= faker.address(),
        is_active=True,
        level = faker.random_element(elements=(HealthcareLevelEnum.PRIMARY.value, HealthcareLevelEnum.SECONDARY.value, HealthcareLevelEnum.TERTIARY.value))
     )
     
    db_session.add(existing_hospital)
    db_session.commit()
    db_session.refresh(existing_hospital)
    
    empty_hospital_data = {}
    
    response = client.put(f"/hospitals/{existing_hospital.id}", json=empty_hospital_data)
    response_data =response.json()
    assert response.status_code == 400
    assert "хоосон талбараар" in response_data["detail"]

def test_update_hospital_notfound(db_session, faker):
    """It should be throw not found error when wrong id"""
    
    wrong_hospital_id = uuid4()
    
    update_hospital_data = {
         "hospital_name": f"{faker.company()} hospital",
         "hospital_phone": str(faker.random_int(min=70000000, max=79999999)),
     }
    
    response = client.put(f"/hospitals/{wrong_hospital_id}", json=update_hospital_data)
    response_data = response.json()
    assert response.status_code == 404
    assert "олдсонгүй" in response_data['detail']


def test_update_hospital_fail(db_session, faker):
    """It should throw server error with 500 code"""
    
    existing_hospital=Hospital(
        id = uuid4(),
        hospital_name = f"{faker.company()} Hospital",
        hospital_phone = str(faker.random_int(min=70000000, max=79999999)),
        address= faker.address(),
        is_active=True,
        level = faker.random_element(elements=(HealthcareLevelEnum.PRIMARY.value, HealthcareLevelEnum.SECONDARY.value, HealthcareLevelEnum.TERTIARY.value))
     )
    
    db_session.add(existing_hospital)
    db_session.commit()
    db_session.refresh(existing_hospital)
    
    update_hospital_data = {
         "hospital_name": None,
         "hospital_phone": None
    }
    
    response = client.put(f"/hospitals/{existing_hospital.id}" , json=update_hospital_data)
    response_data = response.json()
    assert response.status_code == 500
    assert "server error" in response_data["detail"]