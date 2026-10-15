"""Smoke tests for the starter backend."""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_returns_ok() -> None:
    response = client.get("/health")
    assert response.status_code == 200

    body = response.json()
    assert body["status"] == "ok"
    assert body["service"] == "vestora-backend"
    assert "version" in body


def test_unknown_route_returns_404() -> None:
    response = client.get("/definitely-not-a-route")
    assert response.status_code == 404


def test_cors_allows_any_loopback_port() -> None:
    """`next dev` auto-increments off 3000, so accept any loopback port."""
    response = client.get("/health", headers={"Origin": "http://localhost:5173"})
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"


def test_cors_rejects_foreign_origin() -> None:
    response = client.get("/health", headers={"Origin": "https://evil.example.com"})
    assert response.headers.get("access-control-allow-origin") is None
