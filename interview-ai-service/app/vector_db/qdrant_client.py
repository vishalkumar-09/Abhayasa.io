import logging
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams, PointStruct
from app.core.settings import settings

logger = logging.getLogger("app")

class QdrantConnector:
    def __init__(self):
        self.collection_name = "resume_chunks"
        self.vector_size = 768
        
        # Initialize connection with safe in-memory fallback
        try:
            self.client = QdrantClient(
                host=settings.QDRANT_HOST,
                port=settings.QDRANT_PORT,
                api_key=settings.QDRANT_API_KEY if settings.QDRANT_API_KEY else None,
                timeout=5.0
            )
            # Query collections to verify network connectivity
            self.client.get_collections()
            logger.info("Successfully connected to Qdrant cluster at %s:%d", settings.QDRANT_HOST, settings.QDRANT_PORT)
            self.mock_mode = False
        except Exception as e:
            logger.warning(
                "Qdrant cluster unreachable: %s. Falling back to in-memory Qdrant database.",
                str(e)
            )
            # Fallback to local in-memory Qdrant instance (Fully functional vector storage in RAM)
            self.client = QdrantClient(location=":memory:")
            self.mock_mode = True
            logger.info("Local in-memory Qdrant client initialized successfully.")

        # Ensure collection is created
        self._init_collection()

    def _init_collection(self) -> None:
        try:
            # Check if collection exists
            exists = self.client.collection_exists(self.collection_name)
            if not exists:
                logger.info("Collection '%s' does not exist. Creating collection...", self.collection_name)
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(
                        size=self.vector_size,
                        distance=Distance.COSINE
                    )
                )
                logger.info("Collection '%s' created successfully.", self.collection_name)
        except Exception as e:
            logger.error("Failed to initialize Qdrant collection: %s", str(e))

    def upsert_points(self, points: list[PointStruct]) -> bool:
        """Upserts a list of vector points with payloads into the collection."""
        try:
            self.client.upsert(
                collection_name=self.collection_name,
                points=points
            )
            logger.info("Successfully upserted %d points into Qdrant collection '%s'.", len(points), self.collection_name)
            return True
        except Exception as e:
            logger.error("Failed to upsert points into Qdrant: %s", str(e))
            return False

    def search(self, query_vector: list[float], limit: int = 5, query_filter = None) -> list:
        """Performs cosine similarity semantic search on the vector collection with optional filtering."""
        try:
            response = self.client.query_points(
                collection_name=self.collection_name,
                query=query_vector,
                limit=limit,
                query_filter=query_filter
            )
            return response.points
        except Exception as e:
            logger.error("Failed to search Qdrant collection: %s", str(e))
            return []

# Singleton instance
qdrant_connector = QdrantConnector()
