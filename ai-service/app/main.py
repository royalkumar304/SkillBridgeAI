from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.health import router as health_router
from app.routes.skills import router as skills_router
from app.routes.matching import router as matching_router
from app.routes.gap_analysis import router as gap_router
from app.routes.career_intelligence import router as career_router

app = FastAPI(
    title="SkillBridge AI Microservice",
    description="Intelligent Skill Extraction, Job Matching, and Gap Analysis Engine for SIH 2026 (SIH26044)",
    version="1.0.0",
)

# Configure CORS for integration with Express Backend and React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(health_router)
app.include_router(skills_router)
app.include_router(matching_router)
app.include_router(gap_router)
app.include_router(career_router)

@app.get("/")
def read_root():
    return {
        "service": "SkillBridge AI Microservice",
        "status": "ONLINE",
        "docs_url": "/docs",
        "redoc_url": "/redoc",
        "version": "1.0.0",
        "description": "Day 1 Baseline Microservice for SkillBridge AI"
    }

