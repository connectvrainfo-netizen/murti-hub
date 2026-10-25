import os
import secrets
from typing import List, Union
from pydantic_settings import BaseSettings
from pydantic import Field, field_validator

KNOWN_INSECURE_SECRETS = {
    "amol-murti-secret-key-jaipur-2026-bhandar",
    "secret",
    "changeme",
    "admin123",
    "your-jwt-secret-key",
    "supersecret"
}

class Settings(BaseSettings):
    APP_NAME: str = "Amol Marble Murti Bhandar API"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = Field(default=False, env="DEBUG")
    ENVIRONMENT: str = Field(default="production", env="ENVIRONMENT")
    
    # Server Host & Port
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Supabase Configuration
    # Set these in your .env file or environment variables
    SUPABASE_URL: str = Field(default="", env="SUPABASE_URL")
    SUPABASE_KEY: str = Field(default="", env="SUPABASE_KEY")
    SUPABASE_SERVICE_ROLE_KEY: str = Field(default="", env="SUPABASE_SERVICE_ROLE_KEY")
    
    # Security & JWT for Admin Auth (Fail-closed in production if unset or known insecure)
    JWT_SECRET: str = Field(default="", env="JWT_SECRET")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=480, env="ACCESS_TOKEN_EXPIRE_MINUTES") # 8 hours
    
    # Default Admin Credentials (Configured exclusively outside source control)
    ADMIN_EMAIL: str = Field(default="", env="ADMIN_EMAIL")
    ADMIN_PASSWORD: str = Field(default="", env="ADMIN_PASSWORD")
    
    # CORS Origins (Allow explicit, minimal frontend origins)
    CORS_ORIGINS: List[str] = [
        "https://murti-hub.vercel.app",
        "https://murti-hub-neon.vercel.app",
        "https://murti-hub-5.onrender.com",
        "https://amolmurtibhandar.com",
        "https://www.amolmurtibhandar.com",
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]
    
    # Media Storage Folder (for local uploads fallback)
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
    
    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v
    
    class Config:
        env_file = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
        env_file_encoding = "utf-8"
        extra = "allow"

    def initialize_security(self):
        """
        Validates security settings and fails closed in production when requirements are unmet.
        In development/test, provides an ephemeral high-entropy secret if none is configured.
        """
        is_prod = self.ENVIRONMENT.lower() in ["production", "prod"]
        
        # Check JWT_SECRET
        if not self.JWT_SECRET or self.JWT_SECRET in KNOWN_INSECURE_SECRETS:
            if is_prod:
                raise RuntimeError(
                    "FATAL SECURITY CONFIGURATION ERROR: JWT_SECRET must be explicitly set to a "
                    "cryptographically strong secret (min 32 characters) outside source control. "
                    "Known default and empty secrets are prohibited."
                )
            else:
                # Ephemeral high-entropy secret for local dev/testing
                self.JWT_SECRET = secrets.token_hex(32)

settings = Settings()
settings.initialize_security()
