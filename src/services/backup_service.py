import logging
import os
import subprocess
from typing import Dict, Any, List

from starlette.responses import FileResponse
from src.database.models import BackupStatus, BackupType, TenantBackupConfig
from src.core.storage import ObjectStorageClient
from asyncio import Semaphore
from src.core.config import get_settings
from src.core.dependencies import get_backup_service
from src.database.session import AsyncSessionLocal
from sqlalchemy.ext.asyncio import AsyncSession
from src.database.models import BackupJob
from datetime import datetime, timedelta
from sqlalchemy import select, desc, text
import re, hashlib
from fastapi import HTTPException, status
import json
from uuid import uuid4, UUID
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore



logger = logging.getLogger(__name__)

url = get_settings().DATABASE_URL.replace("+asyncpg", "").replace("aiomysql", "")


scheduler = AsyncIOScheduler(
    jobstores={
        'default': SQLAlchemyJobStore(url=url)
    },
    job_defaults={
        'coalesce': True,
        'max_instances': 1,
        'misfire_grace_time': 600,  # 10 minutes
    },
    timezone="UTC"
)


# Global semaphore — shared across all backup tasks
backup_semaphore = Semaphore(get_settings().BACKUP_CONCURRENCY_LIMIT)



class BackupService(ObjectStorageClient):
    """Service to manage backups of application data to object storage."""
    
    def __init__(self, db: AsyncSession):
        super().__init__()
        self.db = db
    
    def _parse_database_url(self) -> Dict[str, Any]:
        """Parse DATABASE_URL to extract connection parameters for pg_dump."""
        settings = get_settings()
        
        return {
            'user': settings.BACKUP_DB_USER,
            'password': settings.BACKUP_DB_PASSWORD,
            'host': settings.BACKUP_DB_HOST,
            'port': settings.BACKUP_DB_PORT,
            'dbname': settings.BACKUP_DB_NAME,
        }
    
    def _build_pg_dump_cmd(self, backup_type: BackupType, tenant_schema: str, local_path: str) -> tuple[list[str], Dict[str, str]]:
        """
        Construct the pg_dump command and environment variables.
        Returns tuple of (command, env_vars).
        """
        db_params = self._parse_database_url()
        
        cmd = [
            "pg_dump",
            "--format=custom",
            "--no-owner",
            "--no-privileges",
            f"--host={db_params['host']}",
            f"--port={db_params['port']}",
            f"--username={db_params['user']}",
            f"--file={local_path}",
        ]
        
        if backup_type == BackupType.schema:
            cmd += ["--schema", tenant_schema]
        
        # Add database name as positional argument
        cmd.append(db_params['dbname'])
        
        # Set password via environment variable for security
        env = os.environ.copy()
        if db_params['password']:
            env['PGPASSWORD'] = db_params['password']
        
        return cmd, env
    
    
    async def _execute_backup(self, backup_type: BackupType, tenant_schema: str, db: AsyncSession) -> BackupJob:
        """Execute the backup process and return the local file path of the backup."""
        # Implementation to execute pg_dump command and handle backup file creation
        
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        filename = f"{tenant_schema}_{timestamp}.dump"
        local_path = f"/tmp/{filename}"
        
        if backup_type == BackupType.schema:
            s3_key = f"backups/tenants/{tenant_schema}/{filename}"
            logger.info(f"Starting schema backup for tenant '{tenant_schema}' to '{local_path}'")
        else:
            s3_key = f"backups/full/{filename}"
            logger.info(f"Starting full backup for tenant '{tenant_schema}' to '{local_path}'")
        
        
        job = BackupJob(
            id=uuid4(),
            tenant_schema=tenant_schema,
            backup_type=backup_type,
            status=BackupStatus.running,
            started_at=datetime.utcnow()
        )
        
        db.add(job)
        await db.commit()
        await db.refresh(job)
        
        try:
            cmd, env = self._build_pg_dump_cmd(backup_type, tenant_schema, local_path)
            
            logger.info(f"[backup] Starting {backup_type} backup for tenant '{tenant_schema}' with command: {' '.join(cmd)}")
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=300 if backup_type == BackupType.schema else 600,
                env=env,
            )
            
            if result.returncode != 0:
                logger.error(f"pg_dump failed for tenant '{tenant_schema}' with error: {result.stderr}")
                raise RuntimeError(result.stderr.strip())
            
            # Try to upload to storage, but don't fail the backup if upload fails
            try:
                self.upload_file(local_path, s3_key)
                logger.info(f"Backup file uploaded to storage: {s3_key}")
            except Exception as upload_error:
                logger.warning(
                    f"Failed to upload backup to storage for {tenant_schema}, "
                    f"but backup file is available locally at {local_path}. "
                    f"Storage error: {str(upload_error)}. "
                    f"Check S3_ENDPOINT_URL setting (current: {get_settings().S3_ENDPOINT_URL})"
                )
                # Still mark as success locally, but note storage issue
                s3_key = None
            
            # Update job status to success and set storage_path and size_bytes
            job.status = BackupStatus.success
            job.storage_path = s3_key  # Will be None if upload failed
            job.size_bytes = os.path.getsize(local_path)
            job.completed_at = datetime.utcnow()
            await db.commit()
            
            if s3_key:
                logger.info(f"Backup successful for tenant '{tenant_schema}'. Uploaded to '{s3_key}' with size {job.size_bytes} bytes.")
            else:
                logger.info(f"Backup created locally for tenant '{tenant_schema}' ({job.size_bytes} bytes), but storage upload failed. File at: {local_path}")
            
        except Exception as e:
            logger.error(f"Backup failed for tenant '{tenant_schema}': {str(e)}")
            # Update job status to failed and set error_message
            job.status = BackupStatus.failed
            job.error_message = str(e)
            job.completed_at = datetime.utcnow()
            await db.commit()
            logger.info(f"Backup failed for tenant '{tenant_schema}': {str(e)}")
            
        finally:
            # Clean up local backup file if it exists
            if os.path.exists(local_path):
                os.remove(local_path)
                logger.info(f"Cleaned up local backup file '{local_path}' for tenant '{tenant_schema}'")
                
        await db.refresh(job)
        return job
    
    
    # Endpoint methods to trigger backups and query backup status would go here, utilizing the internal execution method above.
    async def run_tenant_backup(self, tenant_schema: str, backup_type: BackupType = None) -> BackupJob:
        """Public method to trigger a backup for a tenant schema."""
        if backup_type is None:
            backup_type = BackupType.schema
        async with backup_semaphore:
            return await self._execute_backup(backup_type, tenant_schema, self.db)
        
        
    async def run_full_backup(self) -> BackupJob:
        """Public method to trigger a full backup of the entire database."""
        async with backup_semaphore:
            return await self._execute_backup(BackupType.full, "__full__", self.db)
    
    
    async def restore_from_backup(self, backup_id: str, tenant_schema: str, storage_path: str) -> Dict[str, Any]:
        """Restore a database from a backup file in object storage."""
        try:
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            local_path = f"/tmp/restore_{backup_id}_{timestamp}.dump"
            
            logger.info(f"Starting restore for tenant '{tenant_schema}' from backup {backup_id}")
            
            # Download backup file from storage
            self.download_file(storage_path, local_path)
            logger.info(f"Downloaded backup file to {local_path}")
            
            # Validate that we are not restoring a full backup via this method
            if tenant_schema == "__full__" or tenant_schema == 'public':
                logger.error(f"Attempted to restore full/public backup via schema restore: {backup_id}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Restoring full or public database backups is not supported via this endpoint",
                )

            # Basic validation of tenant schema to avoid SQL injection and invalid identifiers
            if not re.match(r'^[a-zA-Z0-9_]+$', tenant_schema):
                logger.error(f"Invalid schema name provided for restore: '{tenant_schema}'")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid tenant schema name",
                )

            # Parse database parameters
            db_params = self._parse_database_url()

            # Before restoring schema-level backup, drop and recreate the schema
            # on the backup database defined by db_params (run via psql so it targets the backup DB)
            try:
                sql = f'DROP SCHEMA IF EXISTS "{tenant_schema}" CASCADE; CREATE SCHEMA "{tenant_schema}";'
                psql_cmd = [
                    "psql",
                    f"--host={db_params['host']}",
                    f"--port={db_params['port']}",
                    f"--username={db_params['user']}",
                    f"--dbname={db_params['dbname']}",
                    "-c",
                    sql,
                ]
                env = os.environ.copy()
                if db_params.get('password'):
                    env['PGPASSWORD'] = db_params['password']

                logger.info(f"Preparing schema '{tenant_schema}' on backup DB {db_params['host']}:{db_params['port']}/{db_params['dbname']}")
                result = subprocess.run(psql_cmd, capture_output=True, text=True, env=env, timeout=60)
                if result.returncode != 0:
                    logger.error(f"psql schema prepare failed: {result.stderr}")
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f"Failed to prepare schema on backup DB: {result.stderr.strip()}",
                    )
                logger.info(f"Dropped and recreated schema '{tenant_schema}' on backup DB before restore")
            except HTTPException:
                raise
            except Exception as schema_err:
                logger.error(f"Failed to prepare schema '{tenant_schema}' for restore: {schema_err}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to prepare schema for restore: {str(schema_err)}",
                )

            # Execute pg_restore command with proper parameters
            cmd = [
                "pg_restore",
                "--format=custom",
                "--no-owner",
                "--no-privileges",
                f"--schema={tenant_schema}",
                f"--host={db_params['host']}",
                f"--port={db_params['port']}",
                f"--username={db_params['user']}",
                f"--dbname={db_params['dbname']}",
                local_path,
            ]
            
            # # Set environment variables for secure password passing
            env = os.environ.copy()
            if db_params['password']:
                env['PGPASSWORD'] = db_params['password']
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=600, env=env)
            
            if result.returncode != 0:
                logger.error(f"pg_restore failed for tenant '{tenant_schema}': {result.stderr}")
                raise RuntimeError(result.stderr.strip())
            
            logger.info(f"Restore completed successfully for tenant '{tenant_schema}' from backup {backup_id}")
            return {
                "success": True,
                "message": f"Restore completed for {tenant_schema}",
                "backup_id": backup_id,
            }
            
        except Exception as e:
            logger.error(f"Restore failed for tenant '{tenant_schema}' from backup {backup_id}: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "backup_id": backup_id,
            }
        finally:
            # Clean up local file
            if os.path.exists(local_path):
                os.remove(local_path)
                logger.info(f"Cleaned up restore file '{local_path}'")

    
    
    def download_file(self, storage_path: str, local_path: str = None) -> str:
        """Download a file from object storage to local filesystem."""
        if local_path is None:
            local_path = f"/tmp/download_{os.path.basename(storage_path)}"
        
        logger.info(f"Downloading file from storage: {storage_path} to {local_path}")
        # Use parent ObjectStorageClient's download_file method
        super().download_file(storage_path, local_path)
        return local_path
        
    
    async def purge_old_backups(self, tenant_schema: str, retention_days: int):
        """Permanently delete backup files from object storage that are older than the retention period."""
        
        prefix = f"backups/tenants/{tenant_schema}/" if tenant_schema != '__full__' else "backups/full/"
        cutoff_date = datetime.utcnow() - timedelta(days=retention_days)
        paginator = self.list_files(prefix=prefix)
        
        
        async for page in paginator:
            for file in page.get("Contents", []):
                key = file["Key"]
                last_modified = file["LastModified"]
                
                if last_modified < cutoff_date:
                    logger.info(f"Purging old backup '{key}' for tenant '{tenant_schema}' last modified on {last_modified}")
                    self.delete_file(key)
                    logger.info(f"Deleted old backup '{key}' for tenant '{tenant_schema}'")
                    
          
    async def purge_all_old_backups(self):
        """Purge old backups for all tenants using each tenant's configured retention_days.

        If `include_full` is True, also purge full backups older than `full_retention_days`.
        """
        try:
            # Load tenant backup configs that are enabled
            result = await self.db.execute(
                select(TenantBackupConfig).where(TenantBackupConfig.enabled == True)
            )
            configs = result.scalars().all()

            for cfg in configs:
                try:
                    retention = int(cfg.retention_days or 30)
                except Exception:
                    retention = 30

                logger.info(f"Purging backups for tenant '{cfg.tenant_schema}' older than {retention} days")
                try:
                    prefix = f"backups/tenants/{cfg.tenant_schema}/" if cfg.tenant_schema != '__full__' else "backups/full/"
                    cutoff_date = datetime.utcnow() - timedelta(days=retention)
                    paginator = self.list_files(prefix=prefix)
                    
                    
                    async for page in paginator:
                        for file in page.get("Contents", []):
                            key = file["Key"]
                            last_modified = file["LastModified"]
                            
                            if last_modified < cutoff_date:
                                logger.info(f"Purging old backup '{key}' for tenant '{cfg.tenant_schema}' last modified on {last_modified}")
                                self.delete_file(key)
                                logger.info(f"Deleted old backup '{key}' for tenant '{cfg.tenant_schema}'")
                                
                except Exception as e:
                    logger.error(f"Failed to purge backups for tenant '{cfg.tenant_schema}': {e}")

            logger.info("Completed purge of old backups based on tenant configurations")
        except Exception as e:
            logger.error(f"Error while purging old backups: {e}")
            raise
                    
    # Method to query backup status and history for tenants
    async def get_all_tenant_backups(self):
        
        try:
            results = await self.db.execute(
                select(TenantBackupConfig).order_by(TenantBackupConfig.tenant_schema)
            )
            tenants = results.scalars().all()
            
            backup_info = []
            
            for tenant in tenants:
                latest_backup = await self.db.execute(
                    select(BackupJob)
                    .where(BackupJob.tenant_schema == tenant.tenant_schema)
                    .order_by(desc(BackupJob.created_at))
                    .limit(1)
                )
                latest = latest_backup.scalars().first()

                
                backup_info.append({
                    "tenant_id": tenant.id,
                    "tenant_name": tenant.tenant_name,
                    "tenant_schema": tenant.tenant_schema,
                    "last_backup": latest.completed_at.isoformat() if latest else None,
                    "size_bytes": latest.size_bytes if latest else 0,
                    "status": latest.status if latest else "never_backed_up",
                })
                
            return backup_info
        except Exception as e:
            logger.error(f"Error fetching backup info: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to fetch backup information",
            )
    
    async def get_tenant_backups(self, tenant_schema: str) -> List[BackupJob]:
        """Get all backups for a specific tenant, ordered by most recent first."""
        try:
            # Return backups for the tenant from the last 30 days
            cutoff = datetime.utcnow() - timedelta(days=30)
            result = await self.db.execute(
                select(BackupJob)
                .where(BackupJob.tenant_schema == tenant_schema)
                .where(BackupJob.created_at >= cutoff)
                .order_by(desc(BackupJob.created_at))
            )
            backups = result.scalars().all()
            logger.info(f"Retrieved {len(backups)} backups for tenant '{tenant_schema}'")
            return backups
        except Exception as e:
            logger.error(f"Error fetching backups for tenant '{tenant_schema}': {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to fetch backup information",
            )
            
    
    async def backup_tenant(self, tenant_schema: str) -> BackupJob:
        """Public method to trigger a backup for a tenant schema."""
        
        try:
            result = await self.db.execute(
                select(TenantBackupConfig).where(TenantBackupConfig.tenant_schema == tenant_schema)
            )
            
            tenant = result.scalars().first()
            
            if not tenant:
                logger.error(f"Tenant '{tenant_schema}' not found for backup")
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Tenant '{tenant_schema}' not found",
                )
            async with backup_semaphore:
                return await self._execute_backup(BackupType.schema, tenant_schema, self.db)
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error initiating backup for tenant '{tenant_schema}': {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to initiate backup",
            )
            
    
    async def restore_backup(self, backup_id: str) -> Dict[str, Any]:
        """Restore a database from a backup file in object storage."""
        try:
            result = await self.db.execute(
                select(BackupJob).where(BackupJob.id == UUID(backup_id))
            )
            backup = result.scalars().first()
            
            if not backup:
                logger.error(f"Backup '{backup_id}' not found for restore")
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Backup not found",
                )
            
            if not backup.storage_path:
                logger.error(f"Backup '{backup_id}' has no associated storage path for restore")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Backup file not found in storage",
                )
            
            return await self.restore_from_backup(backup_id, backup.tenant_schema, backup.storage_path)
        except HTTPException:
            raise
        except ValueError:
            logger.error(f"Invalid backup ID format: '{backup_id}' for restore")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid backup ID format",
            )
        except Exception as e:
            logger.error(f"Error restoring from backup '{backup_id}': {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to restore from backup",
            )
            
    async def generate_download_url(self, backup_id: str, admin: str) -> Dict[str, Any]:
        """Generate a presigned download URL for a backup and write an audit log entry.

        Returns dict with url and expires_in_seconds.
        """
        try:
            result = await self.db.execute(
                select(BackupJob).where(BackupJob.id == UUID(backup_id))
            )
        except ValueError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid backup ID format")

        backup = result.scalars().first()
        if not backup:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Backup not found")

        if backup.status != BackupStatus.success:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Backup is not available for download")

        if not backup.storage_path:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Backup has no storage path")

        s3_key = backup.storage_path
        expires = 300

        # Use ObjectStorageClient helper to generate presigned URL
        try:
            url = self.download_url(s3_key, expires=expires)
        except Exception as e:
            logger.error(f"Failed to generate presigned URL for backup {backup_id}: {str(e)}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to generate presigned URL")

        # Write audit log entry
        try:
            from src.database.models import AuditLogs

            details = json.dumps({"s3_key": s3_key, "expires_in": expires})
            audit = AuditLogs(
                admin=admin,
                action="backup.download_url_issued",
                resource=f"backup:{backup_id}",
                tenant_schema=backup.tenant_schema,
                details=details,
            )
            self.db.add(audit)
            await self.db.commit()
        except Exception as e:
            logger.warning(f"Failed to write audit log for backup download URL: {str(e)}")

        return {
            "url": url,
            "expires_in_seconds": expires,
            "warning": "This URL grants temporary access to the backup file and will expire in 300 seconds. Do not share.",
        }
            
    @staticmethod
    def staggered_time(tenant_schema: str) -> dict:
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
        
    @staticmethod
    def register_tenant_backup_job(tenant_schema: str) -> None:
        """Register a backup job for a tenant with a staggered schedule."""
        
        job_id = f"backup_{tenant_schema}"
        schedule_time = BackupService.staggered_time(tenant_schema)
        
        # Remove existing job if it exists
        existing_job = scheduler.get_job(job_id)
        if existing_job:
            scheduler.remove_job(job_id)
            logger.info(f"Removed existing backup job for tenant '{tenant_schema}'")
        
        # Schedule new backup job
        scheduler.add_job(
            func=_tenant_backup_job,
            trigger="cron",
            id=job_id,
            **schedule_time,
            args=[tenant_schema],
            replace_existing=True,
        )
        
        logger.info(f"Registered backup job for tenant '{tenant_schema}' at {schedule_time['hour']}:{schedule_time['minute']} UTC")
        
        
        
    @staticmethod
    def register_full_backup_job() -> None:
        """Register a full backup job that runs once daily at a fixed time."""

        job_id = "backup_full"

        # Remove existing job if it exists
        existing_job = scheduler.get_job(job_id)
        if existing_job:
            scheduler.remove_job(job_id)
            logger.info("Removed existing full backup job")

        # Schedule new full backup job to run daily at 0:30 AM UTC
        scheduler.add_job(
            func=_full_backup_job,
            trigger="cron",
            id=job_id,
            hour=4,  # Run at 4 AM UTC
            minute=30,  # Run at 30 minutes past the hour
            replace_existing=True,
        )
        logger.info("Registered full backup job to run daily at 4:30 UTC")

    @staticmethod
    def unregister_tenant_backup_job(tenant_schema: str) -> None:
        """Unregister (remove) a scheduled backup job for a tenant schema."""
        job_id = f"backup_{tenant_schema}"
        existing_job = scheduler.get_job(job_id)
        if existing_job:
            scheduler.remove_job(job_id)
            logger.info(f"Unregistered backup job for tenant '{tenant_schema}'")
        else:
            logger.info(f"No backup job found to unregister for tenant '{tenant_schema}'")
            
    
    @staticmethod
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
            BackupService.register_tenant_backup_job(config.tenant_schema)
        BackupService.register_full_backup_job()
        logger.info(f"Bootstrapped backup jobs for {len(tenant_configs)} tenants and full backup")
        

        
# Job wrappers that create a fresh AsyncSession and BackupService per invocation
async def _tenant_backup_job(tenant_schema: str):
    async with AsyncSessionLocal() as db:
        service = BackupService(db)
        await service.run_tenant_backup(tenant_schema)


async def _full_backup_job():
    async with AsyncSessionLocal() as db:
        service = BackupService(db)
        await service.run_full_backup()
                
    