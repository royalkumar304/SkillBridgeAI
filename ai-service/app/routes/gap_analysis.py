from fastapi import APIRouter
from app.schemas.skill_schemas import GapAnalysisRequest, GapAnalysisResponse, CourseRecommendation
from app.services.mock_matcher import analyze_gap

router = APIRouter(tags=["Gap Analysis"])

@router.post("/analyze-skill-gap", response_model=GapAnalysisResponse)
def analyze_skill_gap(payload: GapAnalysisRequest):
    result = analyze_gap(
        target_role=payload.target_role,
        acquired_skills=payload.acquired_skills
    )

    courses = [CourseRecommendation(**c) for c in result["recommended_courses"]]

    return GapAnalysisResponse(
        success=True,
        target_role=result["target_role"],
        readiness_score=result["readiness_score"],
        gap_percentage=result["gap_percentage"],
        acquired_skills=result["acquired_skills"],
        missing_critical_skills=result["missing_critical_skills"],
        recommended_courses=courses
    )

