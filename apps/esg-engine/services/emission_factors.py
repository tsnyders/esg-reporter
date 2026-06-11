"""
IPCC AR6 / DEFRA 2024 emission factors lookup.
Values in kg CO2e per unit.
"""

FACTORS: dict[str, float] = {
    # Electricity (DEFRA UK grid 2024)
    "kwh_electricity_uk": 0.20493,
    "kwh_electricity_za": 0.95490,   # South Africa — Eskom 2023
    # Natural gas
    "kwh_natural_gas": 0.18299,
    "m3_natural_gas": 2.04000,
    # Diesel
    "litre_diesel": 2.51000,
    # Petrol
    "litre_petrol": 2.31000,
    # Air travel (per km)
    "km_flight_short_haul": 0.15500,
    "km_flight_long_haul": 0.19500,
}


def lookup(activity_unit: str, category: str) -> float | None:
    """
    Returns kg CO2e per unit or None if not found.
    Caller may override via explicit emission_factor in request.
    """
    key = f"{activity_unit.lower()}_{category.lower().replace(' ', '_')}"
    return FACTORS.get(key)
