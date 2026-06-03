from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_get_visitations_empty():
    response = client.get("/api/v1/visitations/")

    assert response.status_code == 200
    assert response.json() == []


def test_telegram_webhook_empty_payload():
    response = client.post("/api/v1/telegram/webhook", json={})

    assert response.status_code == 200
    assert response.json() == {"ok": True}