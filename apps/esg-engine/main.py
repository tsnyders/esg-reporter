from fastapi import FastAPI
from .routers.calculate import router as calculate_router

app = FastAPI(
    title="ESG Carbon Engine",
    description="CO2e calculation engine — IPCC AR6 / DEFRA emission factors",
    version="0.1.0",
)


@app.get("/health")
async def health():
    return {"status": "ok"}


app.include_router(calculate_router)
