from fastapi import FastAPI, BackgroundTasks, Depends
from pydantic import BaseModel
from .core.security import verify_premium_security
from .services.ai_brain import SupremeCourtAI
from .services.telemetry import FleetOperations

app = FastAPI(title="JWordenAI Master OS", version="3.0.0-Enterprise")

class ScopeRequest(BaseModel):
    state: str
    project_scope: str

class TelemetryPing(BaseModel):
    truck_id: str
    asphalt_temp_f: float
    delay_minutes: int

@app.post("/api/v1/ai/compliance")
def check_compliance(req: ScopeRequest, security: dict = Depends(verify_premium_security)):
    result = SupremeCourtAI.analyze_codes(req.state, req.project_scope)
    return {"status": "success", "tenant": security["tenant_id"], "analysis": result}

@app.post("/api/v1/iot/truck-ping")
def truck_ping(req: TelemetryPing, background_tasks: BackgroundTasks):
    action = FleetOperations.calculate_thermal_decay(req.asphalt_temp_f, req.delay_minutes)
    return {"status": "logged", "truck": req.truck_id, "operational_directive": action}