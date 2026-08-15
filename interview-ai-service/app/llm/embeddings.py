import logging
import random
from typing import List
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from app.core.settings import settings

logger = logging.getLogger("app")

def get_primary_api_key() -> str:
    raw_keys = settings.GEMINI_API_KEY or ""
    keys = [k.strip() for k in raw_keys.split(",") if k.strip() and k.strip() != "YOUR_GEMINI_API_KEY"]
    return keys[0] if keys else ""

class EmbeddingService:
    """
    Embedding service for InterviewForge powered by LangChain's GoogleGenerativeAIEmbeddings.
    Generates 768-dimensional dense vector embeddings for RAG retrieval in Qdrant.
    """
    def __init__(self):
        self.dimension = 768
        self.model_name = settings.GEMINI_EMBEDDING_MODEL or "models/text-embedding-004"
        self.api_key = get_primary_api_key()
        
        if self.api_key:
            try:
                self.embeddings = GoogleGenerativeAIEmbeddings(
                    model=self.model_name,
                    google_api_key=self.api_key
                )
                self.is_ready = True
            except Exception as e:
                logger.error("Failed to initialize LangChain GoogleGenerativeAIEmbeddings: %s", str(e))
                self.is_ready = False
        else:
            logger.warning("GEMINI_API_KEY not set. LangChain EmbeddingService running in mock mode.")
            self.is_ready = False

    def get_embedding(self, text: str, is_query: bool = False) -> List[float]:
        """Generates a dense vector embedding for a single text query or document chunk via LangChain."""
        if not self.is_ready or not text or not text.strip():
            return self._get_mock_embedding()

        try:
            if is_query:
                return self.embeddings.embed_query(text)
            else:
                docs = self.embeddings.embed_documents([text])
                return docs[0] if docs else self._get_mock_embedding()
        except Exception as e:
            logger.error("LangChain embedding failure: %s. Falling back to mock vector.", str(e))
            return self._get_mock_embedding()

    def get_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """Generates dense vector embeddings for a list of text document chunks via LangChain."""
        if not texts:
            return []

        if not self.is_ready:
            return [self._get_mock_embedding() for _ in texts]

        try:
            return self.embeddings.embed_documents(texts)
        except Exception as e:
            logger.error("LangChain batch embedding failure: %s. Falling back to mock vectors.", str(e))
            return [self._get_mock_embedding() for _ in texts]

    def _get_mock_embedding(self) -> List[float]:
        """Generates a pseudo-random mock embedding vector of 768 dimensions for offline fallback."""
        return [random.uniform(-0.1, 0.1) for _ in range(self.dimension)]

embedding_service = EmbeddingService()
