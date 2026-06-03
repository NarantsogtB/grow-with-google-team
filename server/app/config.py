from pydantic_settings import SettingsConfigDict, BaseSettings

class Settings(BaseSettings):
    DATABASE_URL:str
    JWT_SECRET:str
    PROJECT_NAME:str = "Family-medical API"
    PROJECT_VERSION: str = "0.1.0"
    ENV: str
    
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8')
    
    telegram_bot_token: str | None = None
    app_public_url: str | None = None

settings = Settings()