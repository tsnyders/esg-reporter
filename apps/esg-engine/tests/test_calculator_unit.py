"""
Trinity Nix — QA
Unit tests for calculator service (no HTTP layer)
"""
from apps.esg_engine.schemas import EmissionInput
from apps.esg_engine.services.calculator import calculate


def test_co2e_calculation():
    record = EmissionInput(
        activity_data=100.0,
        activity_unit="kWh",
        emission_factor=0.20493,
        scope="2",
        category="electricity",
    )
    result = calculate(record)
    assert abs(result.co2e_kg - 20.493) < 0.001
    assert abs(result.co2e_tonnes - 0.020493) < 0.000001


def test_scope_1_diesel():
    record = EmissionInput(
        activity_data=50.0,
        activity_unit="litre",
        emission_factor=2.51,
        scope="1",
        category="diesel",
    )
    result = calculate(record)
    assert abs(result.co2e_kg - 125.5) < 0.001
