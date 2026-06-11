"""
Trinity Nix — QA
AC-P2-06: FastAPI POST /calculate returns CO2e for sample payload
"""
import pytest
from fastapi.testclient import TestClient
from apps.esg-engine.main import app  # noqa: use pytest with package import

# Use httpx-based TestClient (sync)
client = TestClient(app)


def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_calculate_single():
    """AC-P2-06"""
    payload = {
        "activity_data": 100.0,
        "activity_unit": "kWh",
        "emission_factor": 0.20493,
        "scope": "2",
        "category": "electricity",
    }
    res = client.post("/calculate", json=payload)
    assert res.status_code == 200
    body = res.json()
    assert abs(body["co2e_kg"] - 20.493) < 0.001
    assert body["scope"] == "2"


def test_calculate_batch():
    payload = {
        "records": [
            {"activity_data": 50.0, "activity_unit": "litre", "emission_factor": 2.51, "scope": "1", "category": "diesel"},
            {"activity_data": 200.0, "activity_unit": "kWh", "emission_factor": 0.20493, "scope": "2", "category": "electricity"},
        ]
    }
    res = client.post("/calculate/batch", json=payload)
    assert res.status_code == 200
    body = res.json()
    assert len(body["results"]) == 2
    assert body["total_co2e_kg"] > 0
