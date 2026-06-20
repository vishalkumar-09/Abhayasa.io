from fastapi import APIRouter, HTTPException
from app.schemas.evaluator import AnswerEvaluationRequest, AnswerEvaluationResponse
from app.services.evaluator_service import answer_evaluator_service

router = APIRouter(tags=["Answer Evaluation"])

@router.post("/evaluate-answer", response_model=AnswerEvaluationResponse)
def evaluate_answer(request: AnswerEvaluationRequest):
    """Exposes POST /api/v1/evaluate-answer to rate candidate responses.
    
    Evaluates:
    - Technical Accuracy
    - Communication
    - Depth
    - Completeness
    Returns structured scoring and feedback, including an aggregated average score.
    """
    try:
        return answer_evaluator_service.evaluate_answer(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to evaluate answer: {str(e)}")
