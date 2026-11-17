from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any

class SkillInput(BaseModel):
    name: str
    level: str = "beginner"

class JobSkillRequirement(BaseModel):
    name: str
    weight: float = 20.0
    minimum_level: str = "beginner"

class PreferredSkill(BaseModel):
    name: str

class JobSkillGapRequest(BaseModel):
    student_skills: List[SkillInput] = Field(default_factory=list)
    job_required_skills: List[JobSkillRequirement] = Field(default_factory=list)
    job_preferred_skills: Optional[List[PreferredSkill]] = Field(default_factory=list)

class LearningResource(BaseModel):
    skill: str
    level: str
    title: str
    provider: str
    description: str
    estimated_hours: int
    source_url: str
    priority: str = "MEDIUM"

class JobSkillGapResponse(BaseModel):
    success: bool = True
    skill_coverage: float
    matched_skills: List[Dict[str, Any]]
    partially_matched_skills: List[Dict[str, Any]]
    missing_skills: List[Dict[str, Any]]
    actionable_suggestions: List[str]
    learning_path: List[LearningResource]

class CareerReadinessRequest(BaseModel):
    target_role: str = "Full Stack Developer"
    student_skills: List[SkillInput] = Field(default_factory=list)
    student_cgpa: Optional[float] = None
    projects: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    experience: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    profile_complete_percent: float = 0.0

class ReadinessBreakdown(BaseModel):
    skill_coverage_score: float
    practical_evidence_score: float
    academic_completeness_score: float

class CareerReadinessResponse(BaseModel):
    success: bool = True
    sufficient_data: bool
    readiness_score: float
    target_role: str
    message: str
    breakdown: ReadinessBreakdown
    matched_benchmark_skills: List[str]
    missing_benchmark_skills: List[str]
    improvement_areas: List[str]
