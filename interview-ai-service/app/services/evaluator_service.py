import logging
import json
import google.generativeai as genai
from app.core.settings import settings
from app.schemas.evaluator import AnswerEvaluationRequest, AnswerEvaluationResponse
from app.llm.gemini_client import resilient_generate_content

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

            response = resilient_generate_content(
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
        """Performs advanced local heuristic and keyword evaluation when offline/rate-limited."""
        if not request.answerText or not request.answerText.strip():
            return AnswerEvaluationResponse(
                technicalScore=0,
                communicationScore=0,
                depthScore=0,
                completenessScore=0,
                feedback="No answer was provided. The question was skipped by the candidate.",
                score=0
            )
            
        ans_clean = request.answerText.strip()
        ans_lower = ans_clean.lower()
        
        # Detect skipped/dunno answers
        skip_phrases = ["don't know", "dont know", "do not know", "no idea", "skip", "pass", "unsure", "not sure", "forgot", "have no idea"]
        is_skipped = any(phrase in ans_lower for phrase in skip_phrases) or len(ans_clean) < 8
        if is_skipped:
            return AnswerEvaluationResponse(
                technicalScore=0,
                communicationScore=2,
                depthScore=0,
                completenessScore=0,
                feedback="The candidate chose to skip this question or stated they did not know the answer.",
                score=1
            )
            
        # Match keywords
        matched = []
        unmatched = []
        if request.expectedKeywords:
            for kw in request.expectedKeywords:
                import re
                pattern = r'\b' + re.escape(kw.lower()) + r'\b'
                if re.search(pattern, ans_lower) or kw.lower() in ans_lower:
                    matched.append(kw)
                else:
                    unmatched.append(kw)
                    
        # Calculate technical accuracy based on matched keywords ratio
        total_kws = len(request.expectedKeywords) if request.expectedKeywords else 0
        if total_kws > 0:
            kw_ratio = len(matched) / total_kws
            tech = int(4 + (kw_ratio * 6))
        else:
            tech = 7 if len(ans_clean) > 80 else (6 if len(ans_clean) > 40 else 5)
            
        # Evaluate depth based on length and explanatory conjunctions
        conjunctions = ["because", "allows", "which means", "for example", "used to", "creates", "helps to", "stores", "manages", "since", "therefore", "thus"]
        conjunction_count = sum(1 for word in conjunctions if word in ans_lower)
        
        depth = 5
        if len(ans_clean) > 150:
            depth += 2
        elif len(ans_clean) > 80:
            depth += 1
            
        if conjunction_count >= 3:
            depth += 2
        elif conjunction_count >= 1:
            depth += 1
            
        depth = min(depth, 10)
        
        # Communication score based on length and structure
        comm = 8 if len(ans_clean) > 60 else (7 if len(ans_clean) > 30 else 6)
        if ans_clean[0].isupper() and (ans_clean.endswith(".") or ans_clean.endswith("?") or ans_clean.endswith("!")):
            comm = min(comm + 1, 10)
            
        # Completeness based on covered keywords and answer depth
        if total_kws > 0:
            comp = int(3 + (len(matched) / total_kws * 6))
            if depth >= 7:
                comp = min(comp + 1, 10)
        else:
            comp = 7 if len(ans_clean) > 80 else 6
            
        # Compile natural, high-quality customized feedback
        if total_kws > 0:
            if len(matched) == total_kws:
                feedback = f"Excellent! Your answer is highly complete and accurately covers all key concepts: {', '.join(matched)}. You demonstrated a strong understanding and solid depth of explanation."
            elif len(matched) > 0:
                missing_str = f" To improve, make sure to also explain how it relates to: {', '.join(unmatched)}." if unmatched else ""
                feedback = f"Good attempt! You correctly mentioned key terms: {', '.join(matched)}.{missing_str} Your response shows a good foundation but could benefit from a bit more technical details."
            else:
                feedback = f"Your answer is structured but misses the core concepts of the question. You should research the following keywords: {', '.join(unmatched)} to align with the expected explanation."
        else:
            if len(ans_clean) > 100:
                feedback = "Great response! You provided a detailed answer with good structure. The explanation shows clear conceptual understanding."
            else:
                feedback = "Your answer is correct but quite brief. Try to elaborate on how the concept works and provide examples to show greater depth."
                
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
