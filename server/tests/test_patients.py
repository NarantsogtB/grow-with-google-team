import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_create_patient():
    response = client.post(
        "/patients/",
        json={
            "full_name": "Test Patient",
            "phone_number": "99112235",
            "password": "password123",
            "telegram_chat_id": "123456",
            "address_text": "Test address",
            "latitude": 47.918873,
            "longitude": 106.917701,
        },
    )
    # Шинээр үүссэн тул 201 байх ёстой
    assert response.status_code == 201
    
    data = response.json()
    assert data["full_name"] == "Test Patient"
    assert data["phone_number"] == "99112235"
    assert data["telegram_chat_id"] == "123456"
    assert data["address_text"] == "Test address"
    assert data["latitude"] == 47.918873
    assert data["longitude"] == 106.917701
    assert "id" in data
    assert "created_at" in data

def test_get_patient_by_id():
    create_response = client.post(
        "/patients/",
        json={
            "full_name": "Single Patient",
            "phone_number": "99112236",
            "address_text": "Single patient address",
            "password": "password123",
            "telegram_chat_id": "123457",
            "latitude": 47.918000,
            "longitude": 106.917700,
        },
    )
    # Шинээр үүссэн тул 201
    assert create_response.status_code == 201
    
    created_patient = create_response.json()
    patient_id = created_patient["id"]
    
    response = client.get(f"/patients/{patient_id}")
    # Датаг зөвхөн уншиж (GET) байгаа тул 200 OK ирнэ!
    assert response.status_code == 200
    
    data = response.json()
    assert data["id"] == patient_id
    assert data["full_name"] == "Single Patient"

def test_create_patient_duplicate_phone():
    payload = {
        "full_name": "Duplicate Patient",
        "phone_number": "99112237",
        "address_text": "Duplicate patient address",
        "password": "password123",
        "telegram_chat_id": "123458",
        "latitude": 47.918873,
        "longitude": 106.917701,
    }
    
    first_response = client.post("/patients/", json=payload)
    # Анхных нь амжилттай үүснэ
    assert first_response.status_code == 201
    
    second_response = client.post(
        "/patients/",
        json={
            "full_name": "Duplicate Patient 2",
            "phone_number": "99112237",  # Ижил утас
            "password": "password123",
            "address_text": "Duplicate patient second address",
            "telegram_chat_id": "123459",
            "latitude": 47.918900,
            "longitude": 106.917900,
        },
    )
    # Ижил утастай хэрэгдэгч оруулахад FastAPI валидацийн 422 алдаа өгч байна
    assert second_response.status_code == 422