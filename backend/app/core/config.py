import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from backend/ or repo root if present
_here = Path(__file__).resolve().parents[2]
for candidate in [_here / ".env", _here.parent / ".env"]:
    if candidate.exists():
        load_dotenv(candidate)
        break


class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./athens.db")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "dev-only-insecure-secret-change-me")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_EXPIRE_MINUTES: int = int(os.getenv("JWT_EXPIRE_MINUTES", "480"))
    BLOCKCHAIN_PROVIDER: str = os.getenv("BLOCKCHAIN_PROVIDER", "mock")
    CORS_ORIGINS: list[str] = [
        o.strip() for o in os.getenv(
            "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
        ).split(",") if o.strip()
    ]
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))


settings = Settings()
