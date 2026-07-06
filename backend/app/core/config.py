from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    APP_NAME: str = "CareerForge"
    APP_ENV: str = "development"
    SECRET_KEY: str = "dev-secret-key-CHANGE-IN-PRODUCTION"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24h

    DATABASE_URL: str = "postgresql+asyncpg://postgres:password@db:5432/careerforge"
    SYNC_DATABASE_URL: str = "postgresql://postgres:password@db:5432/careerforge"

    # Ollama — local LLM inference, no API key required
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.2:3b"

    # GitHub token is optional — only needed for GitHub skill verification page
    GITHUB_TOKEN: str = ""

    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:5173"

    # FIX: validate SECRET_KEY is not default in production
    @property
    def is_production(self) -> bool:
        return self.APP_ENV == "production"

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]

    model_config = {"env_file": ".env", "extra": "ignore"}


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
