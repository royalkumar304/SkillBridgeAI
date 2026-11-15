from fastapi import APIRouter
from datetime import datetime, timezone

router = APIRouter(tags=["Health"])

@router.get("/health")
def get_health():
    return {
        "service": "SkillBridge AI Microservice",
        "status": "HEALTHY",
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "active_models": [
            "mock-skill-extractor-v1",
            "weighted-job-matcher-v1",
            "role-gap-analyzer-v1"
        ],
        "framework": "FastAPI + Pydantic v2"
    }

