# Backend developed by John Ashimedua; https://github.com/JohnnyAsh-U

from contextlib import asynccontextmanager

from typing import List
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import select
from src.services.backup_service import BackupService, scheduler
from src.core.config import get_settings
from src.database.session import AsyncSessionLocal, AsyncSessionLocal, engine, Base
from src.database.models import TenantBackupConfig, Admin, Roles
from src.core.security import SecurityManager
from src.routers import api_router
from src.routers.internal import internal_router
from src.core.django_client import DjangoClient
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
import logging
from uuid import uuid4

settings = get_settings()



logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s"
)

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["2000/hour", "50/minute"]
)

# scheduler = AsyncIOScheduler()

# Async function to create tables
async def init_db():
    """Initialize database tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# Async function to initialize full backup config
async def init_full_backup_config():
    """Ensure __full__ backup config exists with default settings."""
    async with AsyncSessionLocal() as db:
        # Check if __full__ config exists
        result = await db.execute(
            select(TenantBackupConfig).where(TenantBackupConfig.tenant_schema == "__full__")
        )
        
        # Check if public tenant exist
        public_tenant = await db.execute(
            select(TenantBackupConfig).where(TenantBackupConfig.tenant_schema == "public")
        )
        
        public_tenant_res = public_tenant.scalars().first()
        config = result.scalars().first()
        
        if not public_tenant_res:
            # Create public tenant with default
            public_tenant = TenantBackupConfig(
                id = uuid4(),
                tenant_name = "Public Schema",
                tenant_schema = "public",
                enabled=True,
                retention_days = 30
            )
            db.add(public_tenant)
            await db.commit()
            logging.info("Created public schema config")
        else:
            logging.info("Public schema config already exists")
        
        if not config:
            # Create __full__ backup config with defaults
            config = TenantBackupConfig(
                id=uuid4(),
                tenant_name="DB Full Backup",
                tenant_schema="__full__",
                enabled=True,
                retention_days=30
            )
            db.add(config)
            await db.commit()
            logging.info("Created default __full__ backup config with retention_days=30 and enabled=True")
        else:
            logging.info("__full__ backup config already exists")

# Async function to initialize default admin user
async def init_default_admin():
    """Ensure a default admin user exists with password '1234'."""
    async with AsyncSessionLocal() as db:
        # Check if any admin user exists
        result = await db.execute(
            select(Admin).where(Admin.role == Roles.admin)
        )
        admin_user = result.scalars().first()
        
        if not admin_user:
            # Create default admin user
            security_manager = SecurityManager()
            hashed_password = security_manager.get_password_hash("1234")
            
            admin_user = Admin(
                id=uuid4(),
                username="admin",
                email="support@ecclesix.com",
                password=hashed_password,
                role=Roles.admin,
                is_active=True,
                is_2fa_enabled=False
            )
            db.add(admin_user)
            await db.commit()
            logging.info("Created default admin user with username='admin' and password='1234'")
        else:
            logging.info("Admin user already exists")

# Event handler for startup
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown events."""
    # Startup
    await init_db()
    await init_full_backup_config()
    await init_default_admin()
    
    # Initialize Django client
    django_client = DjangoClient.initialize(settings)
    await django_client.connect()
    logging.info("Django client initialized and connected")
    
    async with AsyncSessionLocal() as db:
        await BackupService.bootstrap_all_backup_jobs(db)
        
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="localhost", port=settings.PORT, reload= not settings.PROD)