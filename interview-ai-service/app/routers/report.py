from fastapi import APIRouter, HTTPException
from app.schemas.report import ReportGenerationRequest, ReportGenerationResponse
from app.services.report_service import report_generator_service

router = APIRouter(tags=["Report Generation"])

@router.post("/generate-report", response_model=ReportGenerationResponse)
def generate_report(request: ReportGenerationRequest):
    """Exposes POST /api/v1/generate-report to compile mock interview transcripts.
    
    Generates:
    - Overall Score
    - Qualitative Summary
    - Demonstrated Strengths
    - Identified Weaknesses
    - Missing Technical Concepts
    - Actionable Improvement Roadmap
    """
    try:
        return report_generator_service.generate_interview_report(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate report: {str(e)}")
