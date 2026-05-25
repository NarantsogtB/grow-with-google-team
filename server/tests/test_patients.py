from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

#FastAPI TestClient ашиглаж шалгана
def test_create_patient():
    response = client.post(
        "/patients/",
        json={
            "name": "Test Patient",
            "phone": "99112235",
            "telegram_id": "123456",
            "address": "Test address",
            "age": 65,
            "gender": "MALE",
            "medical_history": "Diabetes",
            "anamnesis": "Толгой өвдөж байна",
            "symptoms": "Халуурсан",
            "is_active": True,
            "action_type": "REGULAR_CHECK",
            "guardian_phone": "99887766",
            "patient_type": "ELDERLY",
            "registration_number": "АБ12345680",
            "location_coordinates": "47.918873,106.917701",
            "risk_level": "low",
            "last_visit_at": None,
        },
    )

    print(response.status_code)
    print(response.json())

    assert response.status_code == 200

#GET /patients/ test нэмнэ  
def test_get_patients():
    response = client.get("/patients/")

    assert response.status_code == 200
    assert isinstance(response.json(), list)
    
    
def test_get_patient_by_id():
    create_response = client.post(
        "/patients/",
        json={
            "name": "Single Patient",
            "phone": "99112236",
            "registration_number": "АБ12345681",
        },
    )

    assert create_response.status_code == 200

    created_patient = create_response.json()
    patient_id = created_patient["id"]

    response = client.get(f"/patients/{patient_id}")

    assert response.status_code == 200

    data = response.json()
    assert data["id"] == patient_id
    assert data["name"] == "Single Patient"
    assert data["phone"] == "99112236"
    

#Байхгүй patient ID шалгах test
def test_get_patient_not_found():
    response = client.get("/patients/999999")

    assert response.status_code == 404
    assert response.json()["detail"] == "Patient not found"
    

#Давхардсан phone шалгах test
def test_create_patient_duplicate_phone():
    payload = {
        "name": "Duplicate Patient",
        "phone": "99112237",
        "registration_number": "АБ12345682",
    }

    first_response = client.post("/patients/", json=payload)
    assert first_response.status_code == 200

    second_response = client.post(
        "/patients/",
        json={
            "name": "Duplicate Patient 2",
            "phone": "99112237",
            "registration_number": "АБ12345683",
        },
    )

    assert second_response.status_code == 400
    assert second_response.json()["detail"] == "Patient with this phone already exists"