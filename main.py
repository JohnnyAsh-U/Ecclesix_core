# Backend developed by John Ashimedua; https://github.com/JohnnyAsh-U

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from typing import List, AsyncGenerator
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from src.core.config import get_settings
from src.database.session import engine, Base
from src.routers import api_router
from src.routers.internal import internal_router
from src.core.django_client import DjangoClient
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from prometheus_fastapi_instrumentator import Instrumentator
import logging
from src.core.redis_client import redis_client
import asyncio

settings = get_settings()



logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s"
)

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["2000/hour", "50/minute"]
)

scheduler = AsyncIOScheduler()

# Async function to create tables
async def init_db():
    """Initialize database tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# Event handler for startup
async def lifespan(app: FastAPI):
    """Handle startup and shutdown events."""
    # Startup
    await init_db()
    
    # Initialize Django client
    django_client = DjangoClient.initialize(settings)
    await django_client.connect()
    logging.info("Django client initialized and connected")
        
    scheduler.start()
    print("Scheduler started")
    
    yield 
    
    # Shutdown
    await django_client.disconnect()
    logging.info("Django client disconnected")
    
    scheduler.shutdown()
    print("Scheduler shut down")
    
    
    

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url=None if settings.PROD else "/docs",
    redoc_url=None if settings.PROD else "/redoc",
    openapi_url=None if settings.PROD else "/openapi.json"
)
Instrumentator(
    should_group_status_codes=True,
    should_ignore_untemplated=True,
    # should_respect_env_var=True,
    excluded_handlers=["/metrics", "/health"],  
).instrument(app).expose(app)



app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(
    TrustedHostMiddleware, allowed_hosts=["*"]
)

# Mount static files for uploaded content
# app.mount("/api/v1/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(api_router, prefix="/api/v1")
app.include_router(internal_router, prefix="/api/v1")


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error"}
    )


@app.get("/health", response_model=List[str])
async def read_items():
    return ["item1", "item2", "item3"]