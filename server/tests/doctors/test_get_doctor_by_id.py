
from uuid import uuid4
from fastapi import status
from fastapi.testclient import TestClient
from app.models.doctors import Doctor
from app.main import app

client=TestClient(app)

def test_read_doctor_by_id_success(db_session, faker):
    """Doctor info success it will return status code 200"""
    doctor_id = uuid4()
    
    db_doctor = Doctor(
        id=doctor_id,
        first_name=faker.first_name(),
        last_name=faker.last_name(),
        gender="MALE",
        phone=str(faker.random_int(60000000, 69999999)),
        email=faker.unique.email(),
        assigned_sector="01",
        role="GENERAL",
        telegram_id=str(faker.random_int(100000000, 999999999)),
        is_active=True
    )
    db_session.add(db_doctor)
    db_session.commit()
    
    response = client.get(f"/doctors/{doctor_id}")
    
    assert response.status_code == status.HTTP_200_OK
    response_data = response.json()
    assert response_data["first_name"] == db_doctor.first_name
    assert response_data["phone"] == db_doctor.phone


def test_read_doctor_by_id_not_found():
    """Doctor not found router will raise DoctorNotFound error with 404"""
    random_id = uuid4()
    

    response = client.get(f"/doctors/{random_id}")
    
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "олдсонгүй" in response.json()["detail"].lower()


def test_read_doctor_by_id_not_active(db_session, faker):
    """When doctor is_active is False router throw DoctorNotActiveError with 400"""
    doctor_id = uuid4()
    
    inactive_doctor = Doctor(
        id=doctor_id,
        first_name=faker.first_name(),
        last_name=faker.last_name(),
        gender="FEMALE",
        phone=str(faker.random_int(60000000, 69999999)),
        email=faker.unique.email(),
        assigned_sector="02",
        role="GENERAL",
        telegram_id=str(faker.random_int(100000000, 999999999)),
        is_active=False
    )
    db_session.add(inactive_doctor)
    db_session.commit()
    
    response = client.get(f"/doctors/{doctor_id}")
    
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "бүртгэл идэвхгүй" in response.json()["detail"].lower()