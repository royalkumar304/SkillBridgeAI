from fastapi import APIRouter, HTTPException
from app.schemas.skill_schemas import SkillExtractRequest, SkillExtractResponse
from app.services.mock_extractor import extract_skills_from_text

router = APIRouter(tags=["Skills"])

@router.post("/extract-skills", response_model=SkillExtractResponse)
def extract_skills(payload: SkillExtractRequest):
    if not payload.text or not payload.text.strip():
        raise HTTPException(status_code=422, detail="Resume text content cannot be blank")

    skills, confidence = extract_skills_from_text(payload.text)
    return SkillExtractResponse(
        success=True,
        extracted_skills=skills,
        confidence_scores=confidence,
        extraction_mode="DAY1_MOCK_CATALOGUE",
        disclaimer="Day 1 Baseline Mock. Will be coupled to spaCy/PyMuPDF in subsequent phase."
    )

