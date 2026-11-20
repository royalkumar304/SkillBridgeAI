from fastapi import APIRouter, HTTPException, UploadFile, File
from app.schemas.skill_schemas import (
    SkillExtractRequest,
    SkillExtractResponse,
    PDFUploadResponse,
    SkillDetail,
    PipelineMetadata,
)
from app.services.skill_extractor import extract_skills_pipeline
from app.services.pdf_parser import extract_text_from_pdf_bytes, PDFParseError

router = APIRouter(tags=["Skills & Resume"])

MAX_PDF_SIZE_BYTES = 5 * 1024 * 1024  # 5 Megabytes

@router.post("/extract-skills", response_model=SkillExtractResponse)
def extract_skills(payload: SkillExtractRequest):
    if not payload.text or not payload.text.strip():
        raise HTTPException(status_code=422, detail="Text content cannot be blank.")

    result = extract_skills_pipeline(payload.text)

    skill_details = [SkillDetail(**s) for s in result["skill_details"]]
    confidence_map = {s["name"]: s["confidence"] for s in result["skill_details"]}

    metadata = PipelineMetadata(
        pipeline_type=result["pipeline_type"],
        is_trained_ai=result["is_trained_ai"],
        disclaimer=result["disclaimer"]
    )

    return SkillExtractResponse(
        success=True,
        extracted_skills=result["extracted_skills"],
        skill_details=skill_details,
        confidence_scores=confidence_map,
        total_count=result["total_count"],
        pipeline_metadata=metadata
    )

@router.post("/upload-resume-pdf", response_model=PDFUploadResponse)
async def upload_resume_pdf(file: UploadFile = File(...)):
    # 1. Validate file extension and MIME type
    filename = file.filename or "resume.pdf"
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type for '{filename}'. Only PDF documents (.pdf) are supported."
        )

    # Validate content-type if provided
    if file.content_type and file.content_type != "application/pdf" and file.content_type != "application/octet-stream":
        raise HTTPException(
            status_code=400,
            detail=f"Invalid MIME type '{file.content_type}'. Expected 'application/pdf'."
        )

    # 2. Read bytes and check size
    file_bytes = await file.read()
    if not file_bytes or len(file_bytes.strip()) == 0:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty. Please upload a valid non-empty PDF."
        )

    if len(file_bytes) > MAX_PDF_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds maximum allowed size of 5MB. Uploaded size: {len(file_bytes) / (1024*1024):.2f}MB"
        )

    # 3. Parse PDF with PyMuPDF
    try:
        parsed_pdf = extract_text_from_pdf_bytes(file_bytes, filename=filename)
    except PDFParseError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal PDF parser failure: {str(e)}")

    extracted_text = parsed_pdf["text"]

    # 4. Run real NLP & keyword taxonomy pipeline on parsed text
    pipeline_result = extract_skills_pipeline(extracted_text)

    skill_details = [SkillDetail(**s) for s in pipeline_result["skill_details"]]
    preview = extracted_text[:300] + ("..." if len(extracted_text) > 300 else "")

    metadata = PipelineMetadata(
        pipeline_type=pipeline_result["pipeline_type"],
        is_trained_ai=pipeline_result["is_trained_ai"],
        disclaimer=pipeline_result["disclaimer"]
    )

    return PDFUploadResponse(
        success=True,
        filename=filename,
        page_count=parsed_pdf["page_count"],
        character_count=parsed_pdf["character_count"],
        parsing_status="completed",
        extracted_text_preview=preview,
        extracted_skills=pipeline_result["extracted_skills"],
        skill_details=skill_details,
        pipeline_metadata=metadata
    )
