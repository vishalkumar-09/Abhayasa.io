import logging
from app.schemas.hint import HintRequest, HintResponse
from app.llm.langchain_client import langchain_client

logger = logging.getLogger("app")

class HintService:
    def generate_hint(self, request: HintRequest) -> HintResponse:
        """Generates a subtle, helpful hint using LangChain."""
        try:
            user_msg = request.chat_history[-1].get("text", "") if request.chat_history else "Can you give me a hint?"
            hint_str = langchain_client.generate_hint(
                question_text=request.question_text,
                history=request.chat_history,
                user_message=user_msg
            )
            return HintResponse(hint=hint_str)
        except Exception as e:
            logger.error("Error during LangChain hint generation: %s", str(e))
            return HintResponse(hint="Think about the key data structures and algorithmic complexity needed for this question.")

hint_service = HintService()
