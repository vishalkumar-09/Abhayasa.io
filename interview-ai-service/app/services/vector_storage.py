import logging
import uuid
from qdrant_client.http.models import PointStruct

from app.rag.chunking import chunk_text
from app.llm.embeddings import embedding_service
from app.vector_db.qdrant_client import qdrant_connector

logger = logging.getLogger("app")

class VectorStorageService:
    def store_resume(self, resume_id: int, resume_text: str) -> bool:
        """Splits resume text, generates vectors, and indexes them in Qdrant.
        
        Uses deterministic UUIDs derived from resume ID and chunk index to ensure 
        idempotency (re-running this method overwrites existing chunks instead of duplicating).
        """
        if not resume_text or not resume_text.strip():
            logger.warning("Attempted to index empty text for resume_id: %d", resume_id)
            return False

        # 1. Chunk the resume text
        chunks = chunk_text(resume_text)
        if not chunks:
            logger.warning("No chunks generated for resume_id: %d", resume_id)
            return False

        logger.info("Generated %d chunks for resume_id: %d", len(chunks), resume_id)

        # 2. Generate embeddings in a batch call
        vectors = embedding_service.get_embeddings_batch(chunks)
        if not vectors or len(vectors) != len(chunks):
            logger.error("Failed to generate correct batch embeddings count for resume_id: %d", resume_id)
            return False

        # 3. Build Qdrant points
        points = []
        for idx, (chunk, vector) in enumerate(zip(chunks, vectors)):
            # Generate deterministic UUID (namespace based on resume ID and chunk index)
            point_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"interviewforge_resume_{resume_id}_chunk_{idx}"))
            
            points.append(
                PointStruct(
                    id=point_id,
                    vector=vector,
                    payload={
                        "resume_id": resume_id,
                        "text": chunk,
                        "chunk_index": idx
                    }
                )
            )

        # 4. Upsert points into Qdrant vector database
        return qdrant_connector.upsert_points(points)

# Singleton instance
vector_storage_service = VectorStorageService()
