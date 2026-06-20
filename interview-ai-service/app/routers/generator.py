from fastapi import APIRouter, HTTPException
from app.schemas.generator import QuestionGenerationRequest, QuestionGenerationResponse
from app.services.generator_service import question_generator_service

router = APIRouter(tags=["Question Generation"])

@router.post("/generate-questions", response_model=QuestionGenerationResponse)
def generate_questions(request: QuestionGenerationRequest):
    """Exposes POST /api/v1/generate-questions to generate exactly 45 structured questions.
    
    Generates:
    - 20 Resume-based questions
    - 20 Technical questions
    - 3 DSA questions
    - 2 HR behavior questions
    """
    try:
        return question_generator_service.generate_interview_questions(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate questions: {str(e)}")
