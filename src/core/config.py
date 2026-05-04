import os
from pydantic import BaseModel
from dotenv import load_dotenv
load_dotenv()


class Settings(BaseModel):
  DATABASE_URL: str
  REDIS_URL: str
  ACCESS_SECRET_KEY: str
  REFRESH_SECRET_KEY: str
  ALGORITHM: str = "HS256"
  ACCESS_TOKEN_EXPIRE_MINUTES: int = 7 * 24 * 60
  REFRESH_TOKEN_EXPIRE_MINUTES: int = 7 * 24 * 60
  CORS_ORIGINS: list[str]
  ALLOWED_HOSTS: list[str]
  APP_NAME: str = "Ecclesix Core API"
  APP_VERSION: str = "1.0.0"
  PROD: bool = False

  class Config:
    env_file = ".env"

def get_settings() -> Settings:
    return Settings(
        DATABASE_URL=os.getenv("DATABASE_URL", "sqlite:///./test.db"),
        ACCESS_SECRET_KEY=os.getenv("ACCESS_SECRET_KEY", "your-access-secret-key"),
        REFRESH_SECRET_KEY=os.getenv("REFRESH_SECRET_KEY", "your-refresh-secret-key"),
        CORS_ORIGINS=os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(","),
        ALLOWED_HOSTS=os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1").split(","),
        PROD=os.getenv("PROD", "false").lower() == "true",
        REDIS_URL=os.getenv("REDIS_URL", "redis://localhost:6379/0"),
    )