from pydantic import BaseModel, Field
from typing import List, Dict, Optional

class JobRequiredSkill(BaseModel):
    name: str
    weight: float = Field(default=20.0, ge=1.0, le=100.0)
    minimum_level: str = "beginner"

class JobMatchRequest(BaseModel):
    student_skills: List[str] = Field(default_factory=list)
    job_required_skills: List[JobRequiredSkill] = Field(..., min_length=1)
    student_cgpa: float = Field(..., ge=0.0, le=10.0)
    job_min_cgpa: float = Field(default=6.0, ge=0.0, le=10.0)

class MatchBreakdown(BaseModel):
    skill_match_score: float
    cgpa_score: float

class JobMatchResponse(BaseModel):
    success: bool = True
    match_percentage: float
    cgpa_eligible: bool
    matched_skills: List[str]
    missing_skills: List[str]
    breakdown: MatchBreakdown
    recommendation_summary: str
    model_version: str = "v1-deterministic-mock"

