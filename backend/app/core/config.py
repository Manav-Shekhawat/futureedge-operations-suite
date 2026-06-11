import os
from typing import List, Union
from pydantic import AnyHttpUrl, BeforeValidator, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing_extensions import Annotated

def parse_cors(v: Union[str, List[str]]) -> List[str]:
    if isinstance(v, str) and not v.startswith("["):
        return [i.strip() for i in v.split(",")]
    elif isinstance(v, (list, str)):
        return v
    raise ValueError(v)

class Settings(BaseSettings):
    PROJECT_NAME: str = "FutureEdge Backend"
    API_V1_STR: str = "/api/v1"
    
    # Security
    JWT_SECRET: str = "supersecretjwtkeythatshouldbechangedinproduction12345!"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database
    DATABASE_URL: str = "sqlite:///./futureedge.db"
    
    # Gemini AI API
    GEMINI_API_KEY: str = ""
    
    # CORS Origins
    BACKEND_CORS_ORIGINS: Annotated[
        Union[List[str], str], BeforeValidator(parse_cors)
    ] = ["http://localhost:5173", "http://localhost:3000"]

    ENVIRONMENT: str = "development"

    @model_validator(mode="after")
    def validate_production_security(self) -> "Settings":
        if self.ENVIRONMENT == "production":
            if not self.JWT_SECRET or self.JWT_SECRET == "supersecretjwtkeythatshouldbechangedinproduction12345!":
                raise ValueError("Insecure JWT_SECRET detected! A strong, unique JWT_SECRET environment variable must be set in production mode.")
            if not self.GEMINI_API_KEY:
                raise ValueError("GEMINI_API_KEY is missing! Google Gemini API key is required in production mode.")
        return self

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()
