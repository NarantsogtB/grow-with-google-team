from app.main import app
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from fastapi.testclient import TestClient
from app.common_types.enums import HealthcareLevelEnum

client = TestClient(app)

def test_register_hospital_success(db_session, faker):
    """Hospital create success return Hospital with Faker"""

    mock_hospital_data = {
        "hospital_name": f"{faker.company()} Hospital",
        "hospital_phone": str(faker.random_int(min=70000000, max=79999999)),
        "address": faker.address(),
        "is_active":True,
        "level":faker.random_element(elements=(HealthcareLevelEnum.PRIMARY.value, HealthcareLevelEnum.SECONDARY.value, HealthcareLevelEnum.TERTIARY.value)),
    }
    
    response = client.post("/hospitals/", json=mock_hospital_data)
    
    assert response.status_code == 201
    response_data = response.json()
    assert response_data["hospital_name"] == mock_hospital_data["hospital_name"]
    assert response_data["hospital_phone"] == mock_hospital_data["hospital_phone"]
    assert response_data["address"] == mock_hospital_data["address"]
    assert response_data["level"] == mock_hospital_data["level"]
    assert "id" in response_data
    assert isinstance(response_data["id"], str)
    assert response_data["is_active"] is True
    assert "created_at" in response_data
    assert response_data["created_at"] is not None
    assert response_data["created_at"] is not None

def test_register_hospital_duplicate_phone(db_session, faker):
    """When insert duplicate phone number it will raise HTTP error"""
    
    duplicate_phone = str(faker.random_int(min=70000000, max=79999999))
    
    hospital_data_1={
        "hospital_name": f"{faker.company()} Hospital",
        "hospital_phone": duplicate_phone,
        "address": faker.address(),
        "is_active":True,
        "level":faker.random_element(elements=(HealthcareLevelEnum.PRIMARY.value, HealthcareLevelEnum.SECONDARY.value, HealthcareLevelEnum.TERTIARY.value)),
    }
    
    hospital_data_2={
        "hospital_name": f"{faker.company()} Hospital",
        "hospital_phone": duplicate_phone,
        "address": faker.address(),
        "is_active":True,
        "level":faker.random_element(elements=(HealthcareLevelEnum.PRIMARY.value, HealthcareLevelEnum.SECONDARY.value, HealthcareLevelEnum.TERTIARY.value)),
    }
    
    success_response = client.post("/hospitals/", json=hospital_data_1)
    assert success_response.status_code == 201
    failed_response = client.post("/hospitals/", json=hospital_data_2)
    
    assert failed_response.status_code == 400
    assert failed_response.json()["detail"] ==f"{hospital_data_2['hospital_phone']} энэ дугаартай эмнэлэг бүртгэлтэй байна."
    
def test_register_hospital_rollback_on_exception(db_session, faker, monkeypatch):
    """It should throw exception error when database connection failed"""
    rollback_called = False
    
    def mock_rollback(*args, **kwargs):
        nonlocal rollback_called
        rollback_called = True

    def mock_commit_error(*args, **kwargs):
        raise SQLAlchemyError("Хадгалах үед бааз уналаа!")

    monkeypatch.setattr(Session, "commit", mock_commit_error)  
    
    monkeypatch.setattr(Session, "rollback", mock_rollback)

    mock_hospital_data = {
        "hospital_name": f"{faker.company()} Hospital",
        "hospital_phone": str(faker.random_int(min=80000000, max=99999999)),
        "address": faker.street_address(),
        "is_active": True,
        "level": "PRIMARY"
    }

    response = client.post("/hospitals/", json=mock_hospital_data)

    assert response.status_code == 500
    assert rollback_called is True, "Алдаа гарахад db.rollback() дуудагдсангүй!"
    
def test_register_hospital_phone_int(db_session, faker):
    """it should throw status code 422 when phone number is int"""
    
    mock_hospital_data = {
        "hospital_name": f"{faker.company()} Hospital",
        "hospital_phone": faker.random_int(min=80000000, max=99999999),
        "address": faker.street_address(),
        "is_active": True,
        "level": "PRIMARY"
    }
    
    response = client.post("/hospitals/", json=mock_hospital_data)
    assert response.status_code == 422
    
    