from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from src.core.config import get_settings

Base = declarative_base()

database_url = get_settings().DATABASE_URL


engine = create_async_engine(
    database_url, 
    pool_size=10,
    max_overflow=20,
    pool_timeout=20,
    pool_recycle=300,
    pool_pre_ping=True,
    pool_use_lifo=True,
    echo=False,
    pool_reset_on_return='rollback',
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)