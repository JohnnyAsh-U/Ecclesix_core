import hashlib
import logging
from datetime import datetime, timedelta
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.config import get_settings
from src.core.dependencies import get_backup_service


logger = logging.getLogger(__name__)



scheduler = AsyncIOScheduler(
    jobstores={
        'default': SQLAlchemyJobStore(url=get_settings().DATABASE_URL)
    },
    job_defaults={
        'coalesce': True,
        'max_instances': 1,
        'misfire_grace_time': 600,  # 10 minutes
    },
    timezone="UTC"
)



def _staggered_time(tenant_schema: str) -> dict:
    """Calculate a staggered time for scheduling backup jobs based on tenant schema."""
    # Use a hash of the tenant schema to determine a unique time offset
    hash_value = int(hashlib.sha256(tenant_schema.encode()).hexdigest(), 16)
    offset_minutes = hash_value % get_settings().BACKUP_WINDOW_MINUTES  # Offset within the backup window
    hour = (2 + offset_minutes // 60) % 24  # Start at 2 AM UTC plus offset
    minute = offset_minutes % 60
    return {
        "hour": hour,  # Run at calculated hour UTC
        "minute": minute,  # Run at calculated minute UTC
    }
    
    
def register_tenant_backup_job(tenant_schema: str) -> None:
    """Register a backup job for a tenant with a staggered schedule."""
    
    backup_service = get_backup_service()
    job_id = f"backup_{tenant_schema}"
    schedule_time = _staggered_time(tenant_schema)
    
    # Remove existing job if it exists
    existing_job = scheduler.get_job(job_id)
    if existing_job:
        scheduler.remove_job(job_id)
        logger.info(f"Removed existing backup job for tenant '{tenant_schema}'")
    
    # Schedule new backup job
    scheduler.add_job(
        func=backup_service.run_tenant_backup,
        trigger="cron",
        id=job_id,
        **schedule_time,
        args=[tenant_schema],
        replace_existing=True
    )
    logger.info(f"Registered backup job for tenant '{tenant_schema}' at {schedule_time['hour']}:{schedule_time['minute']} UTC")
    
    
    
def register_full_backup_job() -> None:
    """Register a full backup job that runs once daily at a fixed time."""
    
    backup_service = get_backup_service()
    job_id = "backup_full"
    
    # Remove existing job if it exists
    existing_job = scheduler.get_job(job_id)
    if existing_job:
        scheduler.remove_job(job_id)
        logger.info("Removed existing full backup job")
    
    # Schedule new full backup job to run daily at 0:30 AM UTC
    scheduler.add_job(
        func=backup_service.run_full_backup,
        trigger="cron",
        id=job_id,
        hour=0,  # Run at 0 AM UTC
        minute=30,
        replace_existing=True
    )
    logger.info("Registered full backup job to run daily at 0:30 UTC")
    
async def bootstrap_all_backup_jobs(db: AsyncSession):
    "On application startup, register backup jobs for all tenants and the full backup job."
    from sqlalchemy import select
    
    from src.database.models import TenantBackupConfig
    
    # Only load tenant configs that are actual tenants (exclude the __full__ marker)
    result = await db.execute(
        select(TenantBackupConfig).where(TenantBackupConfig.tenant_schema != "__full__")
    )
    tenant_configs = result.scalars().all()
    for config in tenant_configs:
        register_tenant_backup_job(config.tenant_schema)
    register_full_backup_job()
    logger.info(f"Bootstrapped backup jobs for {len(tenant_configs)} tenants and full backup")
    
