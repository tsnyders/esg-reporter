from ..schemas import EmissionInput, EmissionResult


def calculate(record: EmissionInput) -> EmissionResult:
    co2e_kg = record.activity_data * record.emission_factor
    return EmissionResult(
        co2e_kg=round(co2e_kg, 6),
        co2e_tonnes=round(co2e_kg / 1000, 9),
        scope=record.scope,
        category=record.category,
        activity_data=record.activity_data,
        activity_unit=record.activity_unit,
        emission_factor=record.emission_factor,
    )
