from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    PROJECT_NAME: str = "Interview Forge AI Service"
    API_V1_STR: str = "/api/v1"
    LOG_LEVEL: str = "INFO"
    
    # Multi-LLM Provider API Keys
    GEMINI_API_KEY: str = Field(default="", validation_alias="GEMINI_API_KEY")
    GEMINI_MODEL: str = Field(default="gemini-2.0-flash", validation_alias="GEMINI_MODEL")
    GEMINI_EMBEDDING_MODEL: str = Field(default="models/gemini-embedding-001", validation_alias="GEMINI_EMBEDDING_MODEL")
    
    OPENAI_API_KEY: str = Field(default="", validation_alias="OPENAI_API_KEY")
    GROQ_API_KEY: str = Field(default="", validation_alias="GROQ_API_KEY")
    ANTHROPIC_API_KEY: str = Field(default="", validation_alias="ANTHROPIC_API_KEY")
    
    # Qdrant Vector DB Configuration
    QDRANT_HOST: str = Field(default="localhost", validation_alias="QDRANT_HOST")
    QDRANT_PORT: int = Field(default=6333, validation_alias="QDRANT_PORT")
    QDRANT_API_KEY: str = Field(default="", validation_alias="QDRANT_API_KEY")
    
    # JWT Secret Key for parsing/decoding tokens if needed
    JWT_SECRET: str = Field(
        default="9a4f2c8d3b7a1e5f8c3d6b2a1f4e7d9c0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d",
        validation_alias="JWT_SECRET"
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
