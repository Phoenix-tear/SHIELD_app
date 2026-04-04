from fastapi import FastAPI
from pydantic import BaseModel
from dynamic_pricing_ml import calculate_weekly_premium
from touchless_claims import process_touchless_claim

app = FastAPI(title="SHIELD AI Services")

class PremiumRequest(BaseModel):
    weather_idx: float
    surge_multiplier: float
    zone_risk_score: float

class ClaimRequest(BaseModel):
    rider_note: str
    image_path: str = None

@app.post("/api/ml/calculate_premium")
def get_premium(req: PremiumRequest):
    """Endpoint for Next/Node backend to fetch dynamic weekly premium multiplier."""
    multiplier = calculate_weekly_premium(req.weather_idx, req.surge_multiplier, req.zone_risk_score)
    return {"premium_multiplier": multiplier}

@app.post("/api/ml/touchless_claim")
def evaluate_claim(req: ClaimRequest):
    """Endpoint for instant AI evaluation of claims."""
    result = process_touchless_claim(req.rider_note, req.image_path)
    return result

# Run with: uvicorn app:app --port 8000
