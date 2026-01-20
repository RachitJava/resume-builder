from pydantic_settings import BaseSettings
from typing import List, Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # API Settings
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    DEBUG: bool = False
    API_TITLE: str = "AI Intelligence API"
    API_VERSION: str = "1.0.0"
    
    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"
    
    # Default AI Provider
    DEFAULT_AI_PROVIDER: str = "groq"
    
    # Groq Configuration
    GROQ_API_KEY: Optional[str] = None
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    GROQ_MAX_TOKENS: int = 2000
    
    # Ollama Configuration
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.1:latest"
    OLLAMA_TIMEOUT: int = 60
    
    # OpenAI Configuration
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4-turbo-preview"
    OPENAI_MAX_TOKENS: int = 2000
    
    # Anthropic Configuration
    ANTHROPIC_API_KEY: Optional[str] = None
    ANTHROPIC_MODEL: str = "claude-3-sonnet-20240229"
    ANTHROPIC_MAX_TOKENS: int = 2000
    
    # Redis Cache
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: Optional[str] = None
    ENABLE_CACHING: bool = True
    CACHE_TTL_SECONDS: int = 3600
    
    # Cost Management
    MAX_TOKENS_PER_REQUEST: int = 2000
    ENABLE_TOKEN_BUDGET: bool = True
    DAILY_TOKEN_BUDGET: int = 1000000
    MONTHLY_TOKEN_BUDGET: int = 30000000
    
    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_PER_HOUR: int = 1000
    
    # Interview Engine
    DEFAULT_INTERVIEW_DURATION_MINUTES: int = 30
    MAX_QUESTIONS_PER_INTERVIEW: int = 20
    ENABLE_ADAPTIVE_DIFFICULTY: bool = True
    
    # Security
    API_KEY_HEADER: str = "X-API-Key"
    REQUIRE_API_KEY: bool = False
    ALLOWED_API_KEYS: str = ""
    
    # Monitoring
    LOG_LEVEL: str = "INFO"
    ENABLE_METRICS: bool = True
    METRICS_PORT: int = 9090
    
    # Integration
    RESUME_BUILDER_API_URL: str = "http://localhost:8080/api"
    QUESTION_BANK_SYNC_ENABLED: bool = True
    
    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
    
    @property
    def allowed_api_keys_list(self) -> List[str]:
        if not self.ALLOWED_API_KEYS:
            return []
        return [key.strip() for key in self.ALLOWED_API_KEYS.split(",")]
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
