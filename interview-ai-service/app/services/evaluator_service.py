import logging
from app.schemas.evaluator import AnswerEvaluationRequest, AnswerEvaluationResponse
from app.llm.langchain_client import langchain_client

logger = logging.getLogger("app")

class AnswerEvaluatorService:
    def evaluate_answer(self, request: AnswerEvaluationRequest) -> AnswerEvaluationResponse:
        try:
            return langchain_client.evaluate_answer_with_evidence(
                question_text=request.questionText,
                answer_text=request.answerText,
                expected_keywords=request.expectedKeywords or [],
                difficulty=getattr(request, 'difficulty', 'MEDIUM') or 'MEDIUM'
            )
        except Exception as e:
            logger.error("Evidence evaluation error: %s. Returning fallback.", str(e))
            return self.get_mock_evaluation(request)

    def get_mock_evaluation(self, request: AnswerEvaluationRequest) -> AnswerEvaluationResponse:
        if not request.answerText or not request.answerText.strip():
            return AnswerEvaluationResponse(
                score=0, technicalScore=0, communicationScore=0, depthScore=0, completenessScore=0,
                feedback="No answer provided.", evidenceQuote=None, missedConcepts=[], answerStrength="BLANK"
            )
        keywords = request.expectedKeywords or []
        matched = sum(1 for kw in keywords if kw.lower() in request.answerText.lower())
        missed = [kw for kw in keywords if kw.lower() not in request.answerText.lower()]
        score = min(9, 5 + matched)
        return AnswerEvaluationResponse(
            score=score, technicalScore=score*10, communicationScore=75, depthScore=score*9, completenessScore=70,
            feedback="Clear response addressing key question points.",
            evidenceQuote=None, missedConcepts=missed[:5], answerStrength="PARTIAL"
        )

evaluator_service = AnswerEvaluatorService()
answer_evaluator_service = evaluator_service
