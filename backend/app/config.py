from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    APP_NAME: str = "SynapseAI Backend"
    ENVIRONMENT: str = "development"
    GEMINI_API_KEY: str = ""
    QDRANT_HOST: str = "localhost"
    QDRANT_PORT: int = 6333
    QDRANT_COLLECTION: str = "synapse_knowledge"
    REDIS_URL: str = "redis://localhost:6379/0"
    MANIM_RENDER_QUALITY: str = "medium_quality"  # low_quality, medium_quality, high_quality
    MAX_SANDBOX_TIMEOUT_SECONDS: int = 60
    MAX_SELF_HEALING_RETRIES: int = 3
    STORAGE_PATH: str = "./media"
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://localhost:3000"
    ]

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
