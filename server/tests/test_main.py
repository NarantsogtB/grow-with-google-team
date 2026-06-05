import os
import sys

from fastapi.testclient import TestClient

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.main import app  # noqa: E402

client = TestClient(app)


def test_helth_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {
        "message": "server is running",
        "status": "online",
        "version": "0.2.0",
    }
