from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any

class SkillDetail(BaseModel):
    name: str
    category: str
    matched_alias: str
    frequency: int
    confidence: float
    evidence: str

class PipelineMetadata(BaseModel):
    pipeline_type: str = "RULE_BASED_TAXONOMY_NORMALIZER"
    is_trained_ai: bool = False
    disclaimer: str

class SkillExtractRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Raw text from parsed resume or project summary")

class SkillExtractResponse(BaseModel):
    success: bool = True
    extracted_skills: List[str]
    skill_details: List[SkillDetail]
    confidence_scores: Dict[str, float]
    total_count: int
    pipeline_metadata: PipelineMetadata

class PDFUploadResponse(BaseModel):
    success: bool = True
    filename: str
    page_count: int
    character_count: int
    parsing_status: str
    extracted_text_preview: str
    extracted_skills: List[str]
    skill_details: List[SkillDetail]
    pipeline_metadata: PipelineMetadata

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
