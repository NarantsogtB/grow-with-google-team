from fastapi.testclient import TestClient
from app.common_types.enums import GenderEnum, DoctorRoleEnum
from app.main import app


client = TestClient(app)

def test_register_doctor_success(db_session, faker):
    """Doctor create success with Faker"""
    
    mock_doctor_data = {
        "first_name": faker.first_name(),
        "last_name": faker.last_name(),
        "gender": faker.random_element(elements=(GenderEnum.MALE.value, GenderEnum.FEMALE.value)),
        "phone": str(faker.random_int(min=50000000, max=99999999)),
        "email": faker.unique.email(),
        "role": faker.random_element(elements=(DoctorRoleEnum.GENERAL.value, DoctorRoleEnum.PEDIATRICIAN.value, DoctorRoleEnum.NURSE.value)),
        "assigned_sector":f"{faker.random_int(1, 50):02d}",
        "telegram_id": str(faker.random_int(min=100000000, max=999999999)),
        "is_active": True,
        "hospital_id": None
    }
    
    response = client.post("/doctors/", json=mock_doctor_data)
    
    assert response.status_code == 201
    response_data = response.json()
    assert response_data["first_name"] == mock_doctor_data["first_name"]
    assert response_data["last_name"] == mock_doctor_data["last_name"]
    assert response_data["phone"] == mock_doctor_data["phone"]
    assert response_data["email"] == mock_doctor_data["email"]
    assert response_data["assigned_sector"] == mock_doctor_data["assigned_sector"]
    assert "id" in response_data
    assert isinstance(response_data["id"], str)
    assert response_data["is_active"] is True
    assert response_data["is_available"] is True
    assert "created_at" in response_data
    assert response_data["created_at"] is not None
    assert "updated_at" in response_data
    
def test_register_doctor_duplicate_phone(db_session, faker):
    """When insert duplicate phone number it will raise HTTP error"""
    
    duplicate_phone = str(faker.random_int(min=50000000, max=99999999))
    
    doctor_data_1 = {
        "first_name": faker.first_name(),
        "last_name": faker.last_name(),
        "gender": GenderEnum.MALE.value,
        "phone": duplicate_phone,
        "email": faker.unique.email(),
        "assigned_sector": "01"
    }
    
    doctor_data_2 = {
        "first_name": faker.first_name(),
        "last_name": faker.last_name(),
        "gender": GenderEnum.FEMALE.value,
        "phone": duplicate_phone,
        "email": faker.unique.email(),
        "assigned_sector": "02"
    }
    
    success_response = client.post("/doctors/", json=doctor_data_1)
    assert success_response.status_code == 201
    
    failed_response = client.post("/doctors/", json=doctor_data_2)
    
    assert failed_response.status_code == 400
    assert failed_response.json()['detail'] == f"{doctor_data_2['phone']} энэ утасны дугаартай эмч бүртгэлтэй байна."