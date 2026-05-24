from fastapi.testclient import TestClient
from app.models import Doctor
from app.main import app
from uuid import uuid4

client = TestClient(app)

def test_update_doctor_empty(db_session):
    """When no field from frontend it should raise empty error"""
    
    existing_doctor = Doctor(
        id=uuid4(),
        first_name="Бат",
        last_name="Болд",
        gender="MALE",
        phone="99112233",
        email="bat@hospital.mn",
        role="GENERAL",
        is_active=True,
        assigned_sector="01",
        telegram_id="0101010123",
        hospital_id=None
    )
    db_session.add(existing_doctor)
    db_session.commit()
    db_session.refresh(existing_doctor)
    
    
    empty_doctor_data = {}
    
    response = client.put(f"/doctors/{existing_doctor.id}", json=empty_doctor_data)
    response_data = response.json()
    assert response.status_code == 400
    assert "detail" in response_data
        
def test_update_doctor_notfound(db_session, faker):
    """It should be throw not found error when wrong id"""
    
    wrong_doctor_id = uuid4()
    doctor_data = {
        "first_name": faker.first_name(),
        "last_name": faker.last_name(),
    }
    
    response=client.put(f"/doctors/{wrong_doctor_id}", json=doctor_data)
    response_data = response.json()
    assert response.status_code == 404
    assert "олдсонгүй" in response_data['detail']
    

def test_update_doctor_success(db_session, faker):
    """It should return 200 code when update data is not empty and id match"""
    
    existing_doctor = Doctor(
        id=uuid4(),
        first_name="Бат",
        last_name="Болд",
        gender="MALE",
        phone="99112233",
        email="bat@hospital.mn",
        role="GENERAL",
        is_active=True,
        assigned_sector="01",
        telegram_id="0101010123",
        hospital_id=None
    )
    db_session.add(existing_doctor)
    db_session.commit()
    db_session.refresh(existing_doctor)
    
    
    update_doctor_data = {
        "first_name": faker.first_name(),
        "last_name": faker.last_name(),
    }
    
    response = client.put(f"/doctors/{existing_doctor.id}", json=update_doctor_data)
    response_data = response.json()
    assert response.status_code == 200
    assert "амжилттай" in response_data["message"]
    assert update_doctor_data["first_name"] in response_data["data"]["first_name"]
    assert update_doctor_data["last_name"] in response_data["data"]["last_name"]

def test_update_doctor_fail(db_session, faker):
    """It should throw server error with 500 code"""
    existing_doctor = Doctor(
        id=uuid4(),
        first_name="Бат",
        last_name="Болд",
        gender="MALE",
        phone="99112233",
        email="bat@hospital.mn",
        role="GENERAL",
        is_active=True,
        assigned_sector="01",
        telegram_id="0101010123",
        hospital_id=None
    )
    db_session.add(existing_doctor)
    db_session.commit()
    db_session.refresh(existing_doctor)
    
    
    update_doctor_data = {
        "first_name": None,
        "last_name": None
    }
    
    response = client.put(f"/doctors/{existing_doctor.id}", json=update_doctor_data)
    response_data = response.json()
    assert response.status_code == 500
    assert "server error" in response_data["detail"]