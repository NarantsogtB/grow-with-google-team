# =============================================================================
# CONFIGURATION MODULE — app/core/config.py
# =============================================================================
# This file uses Pydantic BaseSettings to load environment variables from
# the .env file. Using BaseSettings instead of os.environ directly gives us:
#   1. Type validation (DATABASE_URL must be a string, not accidentally None)
#   2. Auto-loading from .env file
#   3. Override via real environment variables in production (Docker/CI)
#
# HOW TO GET THE REQUIRED API KEYS:
#   GOOGLE_API_KEY     → https://aistudio.google.com/app/apikey
#                         (Free tier: 15 req/min, 1M tokens/day with Gemini 1.5 Flash)
#   WHAT3WORDS_API_KEY → https://developer.what3words.com/public-api
#                         (Free tier: 1000 conversions/month)
#   TELEGRAM_BOT_TOKEN → Open Telegram, message @BotFather, run /newbot
#                         (Free, no rate limit for low traffic)
#   JWT_SECRET         → Run: python -c "import secrets; print(secrets.token_hex(32))"
#   DATABASE_URL       → For local dev: postgresql+asyncpg://user:pass@localhost:5432/dbname
#                         For free cloud Postgres: https://neon.tech
#
# Store all keys in server/.env — that file is in .gitignore, so it will
# NEVER be committed to GitHub. Never hardcode secrets in source code.
# =============================================================================

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # ── Database ──────────────────────────────────────────────────────────────
    # IMPORTANT: Use the async driver prefix "postgresql+asyncpg://"
    # SQLite for quick local testing: "sqlite+aiosqlite:///./dev.db"
    #
    # AliasChoices lets this field load from either DATABASE_URL= or DATABASE=
    # in the .env file — so the existing .env doesn't need to be renamed.
    DATABASE_URL: str = Field(validation_alias=AliasChoices("DATABASE_URL", "DATABASE"))

    # ── Authentication ────────────────────────────────────────────────────────
    # JWT_SECRET in .env maps to JWT_SECRET_KEY in code via `alias`.
    # This lets us use the descriptive name in code while keeping the .env key short.
    JWT_SECRET_KEY: str = Field(alias="JWT_SECRET")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_HOURS: int = 24

    # ── Google Gemini AI ──────────────────────────────────────────────────────
    # Used by the SOAP medical note agent and the orchestrator classifier.
    # GOOGLE_API_KEY in .env → GOOGLE_GEMINI_API_KEY in code (via alias)
    GOOGLE_GEMINI_API_KEY: str = Field(alias="GOOGLE_API_KEY")

    # ── What3Words (Route Optimization) ──────────────────────────────────────
    # Used by calculate_shortest_route_tool to convert W3W addresses → lat/lng.
    # Optional: leave empty string if not using the route optimization feature.
    WHAT3WORDS_API_KEY: str = ""

    # ── Telegram Bot ──────────────────────────────────────────────────────────
    # Used to send pre-visit confirmation messages to patients.
    # Optional: leave empty string if not activating the Telegram integration.
    TELEGRAM_BOT_TOKEN: str = ""

    # ── App Metadata ──────────────────────────────────────────────────────────
    PROJECT_NAME: str = "Family Medical AI API"
    PROJECT_VERSION: str = "0.2.0"
    # ENV controls:
    #   "development" → SQL query logging enabled, verbose errors returned to client
    #   "production"  → SQL logging disabled, generic error messages (hide internals)
    ENV: str = "development"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        # populate_by_name=True allows both the alias (JWT_SECRET) and the
        # Python field name (JWT_SECRET_KEY) to work when passing values.
        # Without this, only the alias would be recognized.
        populate_by_name=True,
    )


# Create a single shared instance.
# All modules import this `settings` object — it is loaded once at startup.
# Example usage: from app.core.config import settings
settings = Settings()
