from fastapi import APIRouter
from app.schemas.career_schemas import (
    JobSkillGapRequest,
    JobSkillGapResponse,
    CareerReadinessRequest,
    CareerReadinessResponse,
    ReadinessBreakdown,
)
from app.services.career_intelligence import (
    evaluate_job_skill_gap,
    evaluate_career_readiness,
)

router = APIRouter(prefix="/career-intelligence", tags=["Career Intelligence"])

@router.post("/job-gap", response_model=JobSkillGapResponse)
def get_job_skill_gap(payload: JobSkillGapRequest):
    result = evaluate_job_skill_gap(
        student_skills=[s.model_dump() for s in payload.student_skills],
        job_required_skills=[j.model_dump() for j in payload.job_required_skills],
        job_preferred_skills=[p.model_dump() for p in (payload.job_preferred_skills or [])],
    )
    return JobSkillGapResponse(
        success=True,
        skill_coverage=result["skill_coverage"],
        matched_skills=result["matched_skills"],
        partially_matched_skills=result["partially_matched_skills"],
        missing_skills=result["missing_skills"],
        actionable_suggestions=result["actionable_suggestions"],
        learning_path=result["learning_path"],
    )

@router.post("/readiness", response_model=CareerReadinessResponse)
def get_career_readiness(payload: CareerReadinessRequest):
    result = evaluate_career_readiness(
        target_role=payload.target_role,
        student_skills=[s.model_dump() for s in payload.student_skills],
        student_cgpa=payload.student_cgpa,
        projects=payload.projects,
        experience=payload.experience,
        profile_complete_percent=payload.profile_complete_percent,
    )
    return CareerReadinessResponse(
        success=True,
        sufficient_data=result["sufficient_data"],
        readiness_score=result["readiness_score"],
        target_role=result["target_role"],
        message=result["message"],
        breakdown=ReadinessBreakdown(**result["breakdown"]),
        matched_benchmark_skills=result["matched_benchmark_skills"],
        missing_benchmark_skills=result["missing_benchmark_skills"],
        improvement_areas=result["improvement_areas"],
    )
