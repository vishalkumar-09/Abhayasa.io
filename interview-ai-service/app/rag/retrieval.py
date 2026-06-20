import logging
from typing import List, Dict, Any
from qdrant_client.http.models import Filter, FieldCondition, MatchValue

from app.llm.embeddings import embedding_service
from app.vector_db.qdrant_client import qdrant_connector

logger = logging.getLogger("app")

class RetrievalService:
    def retrieve_context(self, query: str, limit: int = 4, resume_id: int = None) -> List[Dict[str, Any]]:
        """Queries Qdrant to retrieve semantically matching text chunks based on the query.
        
        Args:
            query (str): The search query or question.
            limit (int): Maximum number of matching chunks to return.
            resume_id (int, optional): Restrict search to this specific resume. Used for data isolation.
            
        Returns:
            List[Dict[str, Any]]: List of retrieved documents with payload text and similarity score.
        """
        if not query or not query.strip():
            return []

        # 1. Generate embedding vector for the search query (flagged as a query task type)
        query_vector = embedding_service.get_embedding(query, is_query=True)

        # 2. Build tenant or resume boundary filter if specified
        query_filter = None
        if resume_id is not None:
            query_filter = Filter(
                must=[
                    FieldCondition(
                        key="resume_id",
                        match=MatchValue(value=resume_id)
                    )
                ]
            )

        # 3. Perform vector search in Qdrant
        hits = qdrant_connector.search(
            query_vector=query_vector,
            limit=limit,
            query_filter=query_filter
        )

        # 4. Map hit data structures to standard dictionaries
        results = []
        for hit in hits:
            results.append({
                "text": hit.payload.get("text", ""),
                "resume_id": hit.payload.get("resume_id"),
                "chunk_index": hit.payload.get("chunk_index"),
                "score": hit.score
            })
            
        logger.info("Retrieved %d relevant context points for query '%s' (filter resume_id: %s)", len(results), query[:30], resume_id)
        return results

# Singleton instance
retrieval_service = RetrievalService()
