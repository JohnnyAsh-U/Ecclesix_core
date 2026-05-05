"""
Tenant Migrations endpoints proxy to Django.
Handles migration status, execution, and state management.
"""

import logging
from typing import Any, Dict, List
from fastapi import APIRouter, Depends, Request
from src.core.dependencies import get_django_client, DjangoClient
from src.core.internal_urls import (
    MIGRATIONS_SUMMARY,
    MIGRATIONS_RUN,
    MIGRATIONS_STATE,
)

logger = logging.getLogger(__name__)

migrations_router = APIRouter(prefix="/tenants/migrations", tags=["migrations"])


def get_user_role(request: Request) -> str:
    """Extract user role from request context. Defaults to 'mod' (restrictive)."""
    role = getattr(request.state, "user_role", "mod")
    if role not in ["admin", "mod"]:
        role = "mod"
    return role


@migrations_router.get("")
async def get_migrations_summary(
    client: DjangoClient = Depends(get_django_client),
    request: Request = None,
) -> List[Dict[str, Any]]:
    """Get migration summary for all tenants from Django."""
    role = get_user_role(request)
    return await client.get(MIGRATIONS_SUMMARY, role=role)


@migrations_router.post("/{schema_name}/migrate")
async def run_tenant_migration(
    schema_name: str,
    client: DjangoClient = Depends(get_django_client),
    request: Request = None,
) -> Dict[str, Any]:
    """Run migration for a specific tenant schema."""
    role = get_user_role(request)
    return await client.post(MIGRATIONS_RUN.format(schema_name=schema_name), role=role)


@migrations_router.get("/{schema_name}/migration-state")
async def get_tenant_migration_state(
    schema_name: str,
    client: DjangoClient = Depends(get_django_client),
    request: Request = None,
) -> Dict[str, Any]:
    """Get migration state for a specific tenant schema."""
    role = get_user_role(request)
    return await client.get(MIGRATIONS_STATE.format(schema_name=schema_name), role=role)
