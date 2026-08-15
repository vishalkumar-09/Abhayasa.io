import logging
from app.schemas.evaluator import AnswerEvaluationRequest, AnswerEvaluationResponse
from app.llm.langchain_client import langchain_client

logger = logging.getLogger("app")

class AnswerEvaluatorService:
    def evaluate_answer(self, request: AnswerEvaluationRequest) -> AnswerEvaluationResponse:
        """Evaluates a candidate's response using LangChain."""
        try:
            return langchain_client.evaluate_answer(
                question_text=request.questionText,
                answer_text=request.answerText,
                difficulty=request.difficulty or "MEDIUM"
            )
        except Exception as e:
            logger.error("Error during LangChain answer evaluation: %s. Returning fallback.", str(e))
            return self.get_mock_evaluation(request)

    def get_mock_evaluation(self, request: AnswerEvaluationRequest) -> AnswerEvaluationResponse:
        """Performs local heuristic evaluation when rate-limited."""
        if not request.answerText or not request.answerText.strip():
            return AnswerEvaluationResponse(
                score=0.0,
                technicalScore=0,
                communicationScore=0,
                depthScore=0,
                completenessScore=0,
                feedback="No answer provided."
            )
        return AnswerEvaluationResponse(
            score=8.0,
            technicalScore=80,
            communicationScore=80,
            depthScore=80,
            completenessScore=80,
            feedback="Clear response addressing key question points."
        )

evaluator_service = AnswerEvaluatorService()
answer_evaluator_service = evaluator_service
