import logging
import json
import google.generativeai as genai
from app.core.settings import settings
from app.schemas.evaluator import AnswerEvaluationRequest, AnswerEvaluationResponse

logger = logging.getLogger("app")

class AnswerEvaluatorService:
    def __init__(self):
        try:
            self.model = genai.GenerativeModel(settings.GEMINI_MODEL)
            self.is_ready = True
        except Exception as e:
            logger.error("Failed to initialize GenerativeModel: %s", str(e))
            self.is_ready = False

    def evaluate_answer(self, request: AnswerEvaluationRequest) -> AnswerEvaluationResponse:
        """Evaluates a candidate's response using the Gemini API based on technical correctness, clarity, depth, and keywords."""
        
        # Check if API key is configured, else fallback to mock evaluation
        if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "YOUR_GEMINI_API_KEY" or not self.is_ready:
            logger.info("Gemini API not configured. Returning mock answer evaluation.")
            return self.get_mock_evaluation(request)

        prompt = f"""
        You are a senior technical interviewer. Evaluate the candidate's answer to the interview question.
        
        Question:
        {request.questionText}
        
        Expected Keywords/Context:
        {", ".join(request.expectedKeywords) if request.expectedKeywords else "[None specified]"}
        
        Candidate's Answer:
        {request.answerText}
        
        Evaluate the answer strictly based on these four criteria (assigning 0 to 10 for each):
        1. Technical Accuracy: Is the description technically correct?
        2. Communication: Is the answer well-articulated, clear, and professional?
        3. Depth: Does the candidate explain the underlying mechanisms, context, or edge cases?
        4. Completeness: Does the answer directly address all parts of the question and include expected concepts?
        
        Provide constructive feedback summarizing strengths, missed points, and how to improve.
        """

        try:
            # Enforce structured JSON schemas
            generation_config = {
                "response_mime_type": "application/json",
                "response_schema": AnswerEvaluationResponse
            }

            response = self.model.generate_content(
                prompt,
                generation_config=generation_config
            )

            data = json.loads(response.text)
            
            # Map score to the mathematical average of the four scores
            tech = data.get("technicalScore", 5)
            comm = data.get("communicationScore", 5)
            depth = data.get("depthScore", 5)
            comp = data.get("completenessScore", 5)
            
            average_score = int(round((tech + comm + depth + comp) / 4))
            data["score"] = average_score
            
            return AnswerEvaluationResponse(**data)

        except Exception as e:
            logger.error("Error during Gemini answer evaluation: %s. Falling back to mock evaluation.", str(e))
            return self.get_mock_evaluation(request)

    def get_mock_evaluation(self, request: AnswerEvaluationRequest) -> AnswerEvaluationResponse:
        """Performs simple local keyword matching to simulate dynamic evaluations when offline."""
        ans_lower = request.answerText.lower()
        matched = []
        if request.expectedKeywords:
            for kw in request.expectedKeywords:
                if kw.lower() in ans_lower:
                    matched.append(kw)

        # Base scores
        match_count = len(matched)
        if not request.answerText or not request.answerText.strip():
            tech = 0
            comm = 0
            depth = 0
            comp = 0
            feedback = "No answer was provided by the candidate."
        else:
            if match_count == 0:
                tech = 5
                comm = 7
                depth = 4
                comp = 4
                feedback = "The answer is clear but lacks technical accuracy and fails to reference any expected core keywords."
            elif match_count == 1:
                tech = 7
                comm = 8
                depth = 6
                comp = 7
                feedback = f"Good attempt. You correctly mentioned '{matched[0]}'. To improve, explain the concept with more technical depth."
            elif match_count == 2:
                tech = 8
                comm = 8
                depth = 8
                comp = 8
                feedback = f"Great response! You covered key concepts: {', '.join(matched)}. Your explanation had good technical accuracy and clarity."
            else:
                tech = 9
                comm = 9
                depth = 9
                comp = 9
                feedback = f"Excellent! Comprehensive answer covering: {', '.join(matched)}. Demonstrated outstanding communication and depth."

        average_score = int(round((tech + comm + depth + comp) / 4))

        return AnswerEvaluationResponse(
            technicalScore=tech,
            communicationScore=comm,
            depthScore=depth,
            completenessScore=comp,
            feedback=feedback,
            score=average_score
        )

# Singleton instance
answer_evaluator_service = AnswerEvaluatorService()
