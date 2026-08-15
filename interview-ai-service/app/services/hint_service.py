import logging
import google.generativeai as genai
from app.core.settings import settings
from app.schemas.hint import HintRequest, HintResponse

logger = logging.getLogger("app")

class HintService:
    def __init__(self):
        try:
            self.model = genai.GenerativeModel(settings.GEMINI_MODEL)
            self.is_ready = True
        except Exception as e:
            logger.error("Failed to initialize GenerativeModel for hints: %s", str(e))
            self.is_ready = False

    def generate_hint(self, request: HintRequest) -> HintResponse:
        """Generates a subtle, helpful hint using Gemini or a smart dynamic fallback if offline/rate-limited."""
        
        # Fallback if Gemini key is missing or model not ready
        if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "YOUR_GEMINI_API_KEY" or not self.is_ready:
            return HintResponse(hint=self.get_mock_hint(request))

        # Assemble prompt with chat history and question context
        history_lines = []
        for chat in request.chat_history:
            role = "Candidate" if chat.get("role") == "user" else "Interviewer"
            history_lines.append(f"{role}: {chat.get('text')}")
        history_str = "\n".join(history_lines)

        prompt = f"""
        You are a supportive, elite technical interviewer. A candidate is currently answering this question:
        "{request.question_text}"
        
        Expected Concepts/Keywords:
        {", ".join(request.expected_keywords) if request.expected_keywords else "None specified"}
        
        Here is the chat history so far in the hint assistant:
        {history_str}
        
        Provide a subtle, encouraging hint. 
        - DO NOT give the complete solution or write source code answers.
        - Give a conceptual pointer or point them in the right direction (e.g. guide them towards the expected keywords).
        - Keep your response brief, friendly, and under 3 sentences.
        """

        try:
            response = self.model.generate_content(prompt)
            hint_text = response.text.strip()
            return HintResponse(hint=hint_text)
        except Exception as e:
            logger.error("Error during Gemini hint generation: %s. Falling back to mock hint.", str(e))
            return HintResponse(hint=self.get_mock_hint(request))

    def get_mock_hint(self, request: HintRequest) -> str:
        """Generates a dynamic mock hint based on the question keywords."""
        keywords = request.expected_keywords
        if not keywords:
            return "Try to think about the core design patterns or architectures that apply to this problem."
            
        # Select the keyword that hasn't been heavily discussed in history
        history_str = "".join([c.get("text", "").lower() for c in request.chat_history]).lower()
        undiscussed_keywords = [kw for kw in keywords if kw.lower() not in history_str]
        
        target_kw = undiscussed_keywords[0] if undiscussed_keywords else keywords[0]
        
        return f"Consider how you would incorporate the concept of '{target_kw}' to structure your solution here."

hint_service = HintService()
