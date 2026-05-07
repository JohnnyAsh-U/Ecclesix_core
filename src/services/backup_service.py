import logging
import os
import subprocess
from typing import Dict, Any, List
from urllib.parse import urlparse

from starlette.responses import FileResponse
from src.database.models import BackupStatus, BackupType, TenantBackupConfig
from src.core.storage import ObjectStorageClient
from asyncio import Semaphore
from src.core.config import get_settings
from sqlalchemy.ext.asyncio import AsyncSession
from src.database.models import BackupJob
from datetime import datetime, timedelta
from sqlalchemy import select, desc
from fastapi import HTTPException, status
from uuid import uuid4, UUID



logger = logging.getLogger(__name__)

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
            "--data-only",
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
            
            # Parse database parameters
            db_params = self._parse_database_url()
            
            # Execute pg_restore command with proper parameters
            cmd = [
                "pg_restore",
                "--format=custom",
                "--no-owner",
                "--no-privileges",
                f"--host={db_params['host']}",
                f"--port={db_params['port']}",
                f"--username={db_params['user']}",
                f"--dbname={db_params['dbname']}",
                local_path,
                "--data-only",
            ]
            
            # Set environment variables for secure password passing
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
        
        prefix = f"backups/tenants/{tenant_schema}/"
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
                    
    async def purge_old_full_backups(self, retention_days: int):
        """Permanently delete full backup files from object storage that are older than the retention period."""
        
        prefix = "backups/full/"
        cutoff_date = datetime.utcnow() - timedelta(days=retention_days)
        paginator = self.list_files(prefix=prefix)
        
        async for page in paginator:
            for file in page.get("Contents", []):
                key = file["Key"]
                last_modified = file["LastModified"]
                
                if last_modified < cutoff_date:
                    logger.info(f"Purging old full backup '{key}' last modified on {last_modified}")
                    self.delete_file(key)
                    logger.info(f"Deleted old full backup '{key}'")
                    
                    
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
                    # "next_schedule": config.next_backup_at.isoformat() if config and config.next_backup_at else None,
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
            result = await self.db.execute(
                select(BackupJob)
                .where(BackupJob.tenant_schema == tenant_schema)
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
            
    async def delete_backup(self, backup_id: str):
        """Delete a backup record and its associated file from storage."""
        try:
            result = await self.db.execute(
                select(BackupJob).where(BackupJob.id == UUID(backup_id))
            )
            backup = result.scalars().first()
            
            if not backup:
                logger.error(f"Backup '{backup_id}' not found for deletion")
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Backup not found",
                )
            
            if backup.storage_path:
                self.delete_file(backup.storage_path)
                logger.info(f"Deleted backup file '{backup.storage_path}' for backup '{backup_id}'")
            
            await self.db.delete(backup)
            await self.db.commit()
            logger.info(f"Deleted backup record '{backup_id}' from database")
            return {"message": "Backup deleted successfully"}
        except HTTPException:
            raise
        except ValueError:
            logger.error(f"Invalid backup ID format: '{backup_id}'")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid backup ID format",
            )
        except Exception as e:
            logger.error(f"Error deleting backup '{backup_id}': {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete backup",
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
            
    async def download_backup(self, backup_id: str) -> FileResponse:
        """Download a backup file from object storage and return the local file path."""
        try:
            result = await self.db.execute(
                select(BackupJob).where(BackupJob.id == UUID(backup_id))
            )
            backup = result.scalars().first()
            
            if not backup:
                logger.error(f"Backup '{backup_id}' not found for download")
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Backup not found",
                )
            
            if not backup.storage_path:
                logger.error(f"Backup '{backup_id}' has no associated storage path for download")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Backup file not found in storage",
                )
            
            local_file_path = self.download_file(backup.storage_path)
            logger.info(f"Downloaded backup '{backup_id}' to local path '{local_file_path}'")
            return FileResponse(
                local_file_path,
                filename=f"{backup.tenant_schema}_{backup.id}.dump",
                media_type="application/octet-stream",
            )
        
        except HTTPException:
            raise
        except ValueError:
            logger.error(f"Invalid backup ID format: '{backup_id}' for download")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid backup ID format",
            )
        except Exception as e:
            logger.error(f"Error downloading backup '{backup_id}': {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to download backup",
            )
            
    