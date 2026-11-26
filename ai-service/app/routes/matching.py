from fastapi import APIRouter
from app.schemas.matching_schemas import JobMatchRequest, JobMatchResponse, MatchBreakdown
from app.services.mock_matcher import calculate_job_match

router = APIRouter(tags=["Matching"])

@router.post("/match-jobs", response_model=JobMatchResponse)
def match_job(payload: JobMatchRequest):
    result = calculate_job_match(
        student_skills=payload.student_skills,
        job_required_skills=payload.job_required_skills,
        student_cgpa=payload.student_cgpa,
        job_min_cgpa=payload.job_min_cgpa
    )

    return JobMatchResponse(
        success=True,
        match_percentage=result["match_percentage"],
        cgpa_eligible=result["cgpa_eligible"],
        matched_skills=result["matched_skills"],
        missing_skills=result["missing_skills"],
        breakdown=MatchBreakdown(**result["breakdown"]),
        recommendation_summary=result["recommendation_summary"],
        model_version="v1-deterministic-engine"
    )

