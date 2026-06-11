from pydantic import BaseModel, Field
from typing import Literal


class EmissionInput(BaseModel):
    activity_data: float = Field(..., gt=0, description="Amount of activity (e.g. kWh, litres, km)")
    activity_unit: str = Field(..., description="Unit of activity data")
    emission_factor: float = Field(..., gt=0, description="kg CO2e per unit")
    scope: Literal["1", "2", "3"]
    category: str


class EmissionResult(BaseModel):
    co2e_kg: float
    co2e_tonnes: float
    scope: Literal["1", "2", "3"]
    category: str
    activity_data: float
    activity_unit: str
    emission_factor: float


class BatchEmissionInput(BaseModel):
    records: list[EmissionInput]


class BatchEmissionResult(BaseModel):
    results: list[EmissionResult]
    total_co2e_kg: float
    total_co2e_tonnes: float
