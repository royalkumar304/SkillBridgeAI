from pydantic import BaseModel, Field
from typing import List, Dict, Optional

class SkillExtractRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Raw text from parsed resume or input portfolio")

class SkillExtractResponse(BaseModel):
    success: bool = True
    extracted_skills: List[str]
    confidence_scores: Dict[str, float]
    extraction_mode: str = "DAY1_MOCK_CATALOGUE"
    disclaimer: str = "Day 1 Baseline Mock. Will be coupled to spaCy/PyMuPDF in subsequent phase."

class GapAnalysisRequest(BaseModel):
    target_role: str = Field(..., min_length=2, description="Target career role (e.g., Full Stack Developer)")
    acquired_skills: List[str] = Field(default_factory=list, description="Currently held skills")

class CourseRecommendation(BaseModel):
    skill: str
    title: str
    estimated_hours: int

class GapAnalysisResponse(BaseModel):
    success: bool = True
    target_role: str
    readiness_score: float
    gap_percentage: float
    acquired_skills: List[str]
    missing_critical_skills: List[str]
    recommended_courses: List[CourseRecommendation]

