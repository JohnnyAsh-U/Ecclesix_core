"""
Tenant Migrations endpoints proxy to Django.
Handles migration status, execution, and state management.
"""

import logging
from typing import Any, Dict, List
from fastapi import APIRouter, Depends, Request
from src.schemas.roles import ADMIN, MOD
from src.core.dependencies import get_django_client, DjangoClient, require_roles
from src.core.internal_urls import (
    MIGRATIONS_SUMMARY,
    MIGRATIONS_RUN,
    MIGRATIONS_STATE,
)
from src.database.models import Admin as User

logger = logging.getLogger(__name__)

migrations_router = APIRouter(prefix="/migrations", tags=["migrations"])



@migrations_router.get("")
async def get_migrations_summary(
    client: DjangoClient = Depends(get_django_client),
    user: User = Depends(require_roles(ADMIN, MOD)),
) -> List[Dict[str, Any]]:
    """Get migration summary for all tenants from Django."""
    return await client.get(MIGRATIONS_SUMMARY, role=user.role)



@migrations_router.post("/{tenant_id}/migrate")
async def run_tenant_migration(
    tenant_id: int,
    client: DjangoClient = Depends(get_django_client),
    user: User = Depends(require_roles(ADMIN, MOD)),
) -> Dict[str, Any]:
    """Run migration for a specific tenant schema."""
    return await client.post(MIGRATIONS_RUN.format(tenant_id=tenant_id), role=user.role)


@migrations_router.get("/{tenant_id}/migration-state")
async def get_tenant_migration_state(
    tenant_id: int,
    client: DjangoClient = Depends(get_django_client),
    user: User = Depends(require_roles(ADMIN, MOD)),
) -> Dict[str, Any]:
    """Get migration state for a specific tenant schema."""
    return await client.get(MIGRATIONS_STATE.format(tenant_id=tenant_id), role=user.role)




