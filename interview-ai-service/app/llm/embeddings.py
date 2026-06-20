import logging
import random
from typing import List
import google.generativeai as genai
from app.core.settings import settings

logger = logging.getLogger("app")

# Ensure API key is configured
if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "YOUR_GEMINI_API_KEY":
    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
    except Exception as e:
        logger.error("Failed configuring Gemini SDK in EmbeddingService: %s", str(e))
else:
    logger.warning("GEMINI_API_KEY not set. Embedding service will run in mock vector mode.")

class EmbeddingService:
    def __init__(self):
        # Using Google's standard high performance embedding model (768 dimensions)
        self.model = settings.GEMINI_EMBEDDING_MODEL
        self.dimension = 768

    def get_embedding(self, text: str, is_query: bool = False) -> List[float]:
        """Generates a dense vector embedding for a single text string."""
        if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "YOUR_GEMINI_API_KEY":
            return self._get_mock_embedding()

        # Google recommendations: use retrieval_query for search terms and retrieval_document for indexing
        task_type = "retrieval_query" if is_query else "retrieval_document"
        try:
            result = genai.embed_content(
                model=self.model,
                content=text,
                task_type=task_type
            )
            return result["embedding"]
        except Exception as e:
            logger.error("Gemini embedding failure: %s. Falling back to mock vector.", str(e))
            return self._get_mock_embedding()

    def get_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """Generates dense vector embeddings for a list of text strings in a single batch query."""
        if not texts:
            return []

        if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "YOUR_GEMINI_API_KEY":
            return [self._get_mock_embedding() for _ in texts]

        try:
            # Efficient batch call
            result = genai.embed_content(
                model=self.model,
                content=texts,
                task_type="retrieval_document"
            )
            return result["embedding"]
        except Exception as e:
            logger.error("Gemini batch embedding failure: %s. Falling back to mock vectors.", str(e))
            return [self._get_mock_embedding() for _ in texts]

    def _get_mock_embedding(self) -> List[float]:
        """Generates a pseudo-random mock embedding vector of 768 dimensions for local tests."""
        return [random.uniform(-0.1, 0.1) for _ in range(self.dimension)]

embedding_service = EmbeddingService()
