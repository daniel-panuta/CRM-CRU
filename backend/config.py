import os

from pydantic_settings import BaseSettings


def parse_cors_origins(raw_value: str | None = None) -> list[str]:
    value = (raw_value or os.getenv("CORS_ORIGINS", "")).strip()
    origins = [origin.strip() for origin in value.split(",") if origin.strip()]
    if origins:
        return origins
    return ["http://localhost:5173", "http://127.0.0.1:5173"]


class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://neondb_owner:npg_HmB4ALo6XOhc@ep-odd-pine-za85cpww.c-2.eu-west-2.aws.neon.tech/neondb?ssl=require"
    )
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-key-change-in-prod")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    SMTP_SERVER: str = os.getenv("SMTP_SERVER", "localhost")
    SMTP_PORT: int = 1025  # Mailhog default
    ADMIN_EMAIL: str = os.getenv("ADMIN_EMAIL", "admin@crmcontacte.local")
    ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD", "admin123")
    ADMIN_NAME: str = os.getenv("ADMIN_NAME", "System Admin")
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "")


settings = Settings()
