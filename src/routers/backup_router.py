"""
Backup management router for tenant and full database backups.
Handles backup operations: create, delete, restore, download.
"""

import logging
from typing import Any, Dict, List
from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from uuid import UUID

from src.database.models import BackupJob, TenantBackupConfig
from src.services.backup_service import BackupService
from src.core.dependencies import require_roles, get_backup_service
from src.schemas.roles import ADMIN, MOD
from src.schemas.backup_schema import BackupJobOut

logger = logging.getLogger(__name__)

backup_router = APIRouter(prefix="/backups", tags=["backups"])


@backup_router.get("")
async def get_all_tenants_backups(
    user = Depends(require_roles(ADMIN, MOD)),
    backup_service: BackupService = Depends(get_backup_service),
) -> List[Dict[str, Any]]:
    """Get backup information for all tenants (tenant_name, next_schedule, last_backup, size)."""
    return await backup_service.get_all_tenant_backups()


@backup_router.get("/{tenant_schema}")
async def get_tenant_backups(
    tenant_schema: str,
    user = Depends(require_roles(ADMIN, MOD)),
    backup_service: BackupService = Depends(get_backup_service),
) -> List[BackupJobOut]:
    """Get all backups for a specific tenant."""
    return await backup_service.get_tenant_backups(tenant_schema)


@backup_router.post("/tenant/{tenant_schema}", status_code=202, response_model=BackupJobOut)
async def backup_tenant(
    tenant_schema: str,
    backup_service: BackupService = Depends(get_backup_service),
    user = Depends(require_roles(ADMIN, MOD)),
) -> BackupJob:
    """Trigger an on-demand backup for a specific tenant."""
    return await backup_service.backup_tenant(tenant_schema)


@backup_router.post("/full", status_code=202)
async def backup_full_database(
    background_tasks: BackgroundTasks,
    backup_service: BackupService = Depends(get_backup_service),
    user = Depends(require_roles(ADMIN, MOD)),
) -> Dict[str, Any]:
    """Trigger a full database backup."""
    background_tasks.add_task(backup_service.run_full_backup)
    logger.info("Full database backup job queued")
    return {"message": "Full database backup job queued"}


@backup_router.delete("/{backup_id}", status_code=200)
async def delete_backup(
    backup_id: str,
    user = Depends(require_roles(ADMIN, MOD)),
    backup_service: BackupService = Depends(get_backup_service),
) -> Dict[str, Any]:
    """Delete a backup by ID."""
    return await backup_service.delete_backup(backup_id)


@backup_router.post("/{backup_id}/restore", status_code=202)
async def restore_backup(
    backup_id: str,
    user = Depends(require_roles(ADMIN, MOD)),
    backup_service: BackupService = Depends(get_backup_service),
) -> Dict[str, Any]:
    """Restore a database from a backup."""
    return await backup_service.restore_backup(backup_id)


@backup_router.get("/{backup_id}/download")
async def download_backup(
    backup_id: str,
    background_tasks: BackgroundTasks,
    user = Depends(require_roles(ADMIN, MOD)),
    backup_service: BackupService = Depends(get_backup_service),
) -> FileResponse:
    """Download a backup file."""
    file_response = await backup_service.download_backup(backup_id)
    # Clean up the temporary downloaded file after sending it
    import os
    background_tasks.add_task(lambda path: os.path.exists(path) and os.remove(path), file_response.path)
    return file_response