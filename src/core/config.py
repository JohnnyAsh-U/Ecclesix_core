import os
from pydantic import BaseModel
from dotenv import load_dotenv
load_dotenv()


class Settings(BaseModel):
  PORT: int
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

  # Django client integration
  DJANGO_BASE_URL: str = "http://localhost:8000"
  INTERNAL_API_SECRET_ADMIN: str
  INTERNAL_API_SECRET_MOD: str
  DJANGO_REQUEST_TIMEOUT: int = 10  # seconds
  DJANGO_RETRY_MAX_ATTEMPTS: int = 3
  DJANGO_RETRY_DELAY: float = 1.0  # seconds
  
  
  # OBJECT STORAGE
  S3_ENDPOINT_URL: str 
  S3_ACCESS_KEY: str 
  S3_SECRET_KEY: str 
  S3_REGION: str 
  S3_BUCKET_NAME: str
  
  
  
  # Backup windows minutes
  BACKUP_WINDOW_MINUTES: int = 60
  BACKUP_CONCURRENCY_LIMIT: int = 3
  
  # Backup DB CREDENTIALS
  BACKUP_DB_HOST: str 
  BACKUP_DB_PORT: int
  BACKUP_DB_USER: str
  BACKUP_DB_PASSWORD: str
  BACKUP_DB_NAME: str

  class Config:
    env_file = ".env"

def get_settings() -> Settings:
    return Settings(
        PORT=os.getenv("PORT", "8080"),
        DATABASE_URL=os.getenv("DATABASE_URL", "sqlite:///./test.db"),
        ACCESS_SECRET_KEY=os.getenv("ACCESS_SECRET_KEY", "your-access-secret-key"),
        REFRESH_SECRET_KEY=os.getenv("REFRESH_SECRET_KEY", "your-refresh-secret-key"),
        CORS_ORIGINS=os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(","),
        ALLOWED_HOSTS=os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1").split(","),
        PROD=os.getenv("PROD", "false").lower() == "true",
        REDIS_URL=os.getenv("REDIS_URL", "redis://localhost:6379/0"),
        DJANGO_BASE_URL=os.getenv("DJANGO_BASE_URL", "http://localhost:8000"),
        INTERNAL_API_SECRET_ADMIN=os.getenv("INTERNAL_API_SECRET_ADMIN", "admin-secret-key"),
        INTERNAL_API_SECRET_MOD=os.getenv("INTERNAL_API_SECRET_MOD", "mod-secret-key"),
        DJANGO_REQUEST_TIMEOUT=int(os.getenv("DJANGO_REQUEST_TIMEOUT", "10")),
        DJANGO_RETRY_MAX_ATTEMPTS=int(os.getenv("DJANGO_RETRY_MAX_ATTEMPTS", "3")),
        DJANGO_RETRY_DELAY=float(os.getenv("DJANGO_RETRY_DELAY", "1.0")),
        S3_ENDPOINT_URL=os.getenv("S3_ENDPOINT_URL", "http://localhost:9000"),
        S3_ACCESS_KEY=os.getenv("S3_ACCESS_KEY", "your-s3-access-key"),
        S3_SECRET_KEY=os.getenv("S3_SECRET_KEY", "your-s3-secret-key"),
        S3_REGION=os.getenv("S3_REGION", "us-east-1"),
        S3_BUCKET_NAME=os.getenv("S3_BUCKET_NAME", "your-s3-bucket-name"),
        
        BACKUP_DB_HOST=os.getenv("BACKUP_DB_HOST", "localhost"),
        BACKUP_DB_PORT=int(os.getenv("BACKUP_DB_PORT", "5432")),
        BACKUP_DB_USER=os.getenv("BACKUP_DB_USER", "backup_user"),
        BACKUP_DB_PASSWORD=os.getenv("BACKUP_DB_PASSWORD", "backup_password"),
        BACKUP_DB_NAME=os.getenv("BACKUP_DB_NAME", "backup_db"),
    )