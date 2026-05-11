from fastapi.testclient import TestClient
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.main import app

client = TestClient(app)

def test_helth_check():
    response=client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message":"server is running", "status":"online", "version":"v1"} 