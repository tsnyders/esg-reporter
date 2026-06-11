from fastapi import APIRouter
from ..schemas import EmissionInput, EmissionResult, BatchEmissionInput, BatchEmissionResult
from ..services.calculator import calculate

router = APIRouter(prefix="/calculate", tags=["calculate"])


@router.post("", response_model=EmissionResult)
async def calculate_single(payload: EmissionInput) -> EmissionResult:
    return calculate(payload)


@router.post("/batch", response_model=BatchEmissionResult)
async def calculate_batch(payload: BatchEmissionInput) -> BatchEmissionResult:
    results = [calculate(r) for r in payload.records]
    total_kg = sum(r.co2e_kg for r in results)
    return BatchEmissionResult(
        results=results,
        total_co2e_kg=round(total_kg, 6),
        total_co2e_tonnes=round(total_kg / 1000, 9),
    )
