import os
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.routes.health import router as health_router
from app.routes.skills import router as skills_router
from app.routes.matching import router as matching_router
from app.routes.gap_analysis import router as gap_router
from app.routes.career_intelligence import router as career_router
from app.dependencies import verify_service_key

load_dotenv()

environment = os.getenv("ENVIRONMENT", "development").lower()
is_production = environment == "production"

# In production, disable interactive Swagger/OpenAPI docs
docs_url = None if is_production else "/docs"
redoc_url = None if is_production else "/redoc"
openapi_url = None if is_production else "/openapi.json"

app = FastAPI(
    title="SkillBridge AI Microservice",
    description="Intelligent Skill Extraction, Job Matching, and Gap Analysis Engine for SIH 2026 (SIH26044)",
    version="1.0.0",
    docs_url=docs_url,
    redoc_url=redoc_url,
    openapi_url=openapi_url,
)

# Startup validation for INTERNAL_SERVICE_KEY
@app.on_event("startup")
async def startup_security_checks():
    from app.dependencies import get_expected_service_key
    get_expected_service_key()

# Parse allowed origins from environment
raw_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5001"
)
allowed_origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]

# Configure CORS with strict explicit origin whitelist
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Internal-Service-Key"],
)

# Public Endpoints (Health & Baseline check)
app.include_router(health_router)

# Protected Endpoints (Requires valid X-Internal-Service-Key)
app.include_router(skills_router, dependencies=[Depends(verify_service_key)])
app.include_router(matching_router, dependencies=[Depends(verify_service_key)])
app.include_router(gap_router, dependencies=[Depends(verify_service_key)])
app.include_router(career_router, dependencies=[Depends(verify_service_key)])

@app.get("/")
def read_root():
    return {
        "service": "SkillBridge AI Microservice",
        "status": "ONLINE",
        "docs_url": "/docs",
        "redoc_url": "/redoc",
        "version": "1.0.0",
        "description": "Secured AI Microservice for SkillBridge AI"
    }

