from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql://petcloud:petcloud_local@localhost:5432/petcloud"
    cors_origins: list[str] = ["http://localhost:5173"]
    jwt_secret: str = "CHANGE-ME-IN-PRODUCTION-USE-A-LONG-RANDOM-SECRET"
    jwt_exp_minutes: int = 60 * 24
    s3_bucket: str | None = None
    aws_region: str = "us-east-1"


@lru_cache
def get_settings() -> Settings:
    return Settings()
