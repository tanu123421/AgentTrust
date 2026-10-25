from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "AgentTrust"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    
    # Database
    DATABASE_URL: str = "sqlite:///./agent_trust.db"
    
    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"
    
    # Optional LLM integration (Default: offline mode)
    LLM_PROVIDER: str = "offline"
    LLM_API_KEY: str = ""
    LLM_MODEL: str = "synthetic-evaluator-v1"
    
    # Safety limits
    MAX_TEST_CASES_PER_RUN: int = 100
    MAX_INPUT_LENGTH_CHARS: int = 20000
    TEST_TIMEOUT_SECONDS: int = 30

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

settings = Settings()
