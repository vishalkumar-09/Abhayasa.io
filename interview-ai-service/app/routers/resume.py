from fastapi import APIRouter, File, UploadFile, HTTPException
from app.services.parser_service import parser_service
from app.schemas.parser import ResumeParsingResponse

router = APIRouter(prefix="/resumes", tags=["Resumes"])

@router.post("/parse", response_model=ResumeParsingResponse)
async def parse_resume(file: UploadFile = File(...)):
    """Exposes POST /api/v1/resumes/parse to upload a PDF resume and extract structured JSON data."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Invalid file format. Only PDF resumes are supported.")
        
    try:
        file_content = await file.read()
        return parser_service.parse_resume_pdf(file_content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error parsing resume: {str(e)}")
