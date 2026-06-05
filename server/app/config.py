from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Read from the DATABASE= key in .env (the legacy key name used by this project).
    # We use a single alias — NOT AliasChoices — so that a DATABASE_URL shell env var
    # (e.g., one accidentally exported with postgresql+asyncpg://) cannot override this.
    # The sync create_engine in app/database.py requires psycopg2 (no +asyncpg).
    DATABASE_URL: str = Field(alias="DATABASE")
    JWT_SECRET: str
    PROJECT_NAME: str = "Family-medical API"
    PROJECT_VERSION: str = "0.1.0"
    ENV: str = "development"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        # extra='ignore' prevents ValidationError when .env contains keys
        # that only the new app/core/config.py cares about (GOOGLE_API_KEY, etc.)
        extra="ignore",
    )


settings = Settings()
