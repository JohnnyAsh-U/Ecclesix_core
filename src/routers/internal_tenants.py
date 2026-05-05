"""
Tenant Management endpoints proxy to Django.
Handles tenant CRUD operations, activation, deactivation, and domain management.
"""

import logging
from typing import Any, Dict, List
from fastapi import APIRouter, Depends
from src.core.dependencies import get_django_client, DjangoClient, require_roles
from src.database.models import Admin as User
from src.schemas.tenant_schema import TenantCreate
from src.core.internal_urls import (
    TENANTS_LIST,
    TENANTS_CREATE,
    TENANTS_DETAIL,
    TENANTS_ACTIVATE,
    TENANTS_DEACTIVATE,
    TENANTS_DOMAINS,
)
from src.schemas.roles import ADMIN, MOD

logger = logging.getLogger(__name__)

tenants_router = APIRouter(prefix="/tenants", tags=["tenants"])


@tenants_router.get("")
async def list_tenants(
    client: DjangoClient = Depends(get_django_client),
    user: User = Depends(require_roles(ADMIN, MOD)),
) -> List[Dict[str, Any]]:
    """List all tenants from Django."""
    return await client.get(TENANTS_LIST, role=user.role)


@tenants_router.post("")
async def create_tenant(
    tenant: TenantCreate,
    client: DjangoClient = Depends(get_django_client),
    user: User = Depends(require_roles(ADMIN, MOD)),
) -> Dict[str, Any]:
    """Validate tenant creation payload, then proxy to Django internal API."""
    # payload = tenant.dict()
    # # ensure schema_name exists (Django view accepts empty string default)
    # if not payload.get("schema_name"):
    #     # derive schema_name from domain if not provided
    #     payload["schema_name"] = payload.get("domain").replace('.', '_')

    return await client.post(TENANTS_CREATE, role=user.role, json=tenant.dict())


@tenants_router.get("/{tenant_id}")
async def get_tenant_detail(
    tenant_id: int,
    client: DjangoClient = Depends(get_django_client),
    user: User = Depends(require_roles(ADMIN, MOD)),
) -> Dict[str, Any]:
    """Get tenant details from Django."""
    return await client.get(TENANTS_DETAIL.format(tenant_id=tenant_id), role=user.role)


@tenants_router.post("/{tenant_id}/activate")
async def activate_tenant(
    tenant_id: int,
    client: DjangoClient = Depends(get_django_client),
    user: User = Depends(require_roles(ADMIN, MOD)),
) -> Dict[str, Any]:
    """Activate a tenant in Django."""
    return await client.post(TENANTS_ACTIVATE.format(tenant_id=tenant_id), role=user.role)


@tenants_router.post("/{tenant_id}/deactivate")
async def deactivate_tenant(
    tenant_id: int,
    client: DjangoClient = Depends(get_django_client),
    user: User = Depends(require_roles(ADMIN, MOD)),
) -> Dict[str, Any]:
    """Deactivate a tenant in Django."""
    return await client.post(TENANTS_DEACTIVATE.format(tenant_id=tenant_id), role=user.role)


@tenants_router.get("/{tenant_id}/domains")
async def get_tenant_domains(
    tenant_id: int,
    client: DjangoClient = Depends(get_django_client),
    user: User = Depends(require_roles(ADMIN, MOD)),
) -> List[Dict[str, Any]]:
    """Get domains for a tenant from Django."""
    return await client.get(TENANTS_DOMAINS.format(tenant_id=tenant_id), role=user.role)


@tenants_router.post("/{tenant_id}/domains")
async def add_tenant_domain(
    tenant_id: int,
    domain_data: Dict[str, Any],
    client: DjangoClient = Depends(get_django_client),
    user: User = Depends(require_roles(ADMIN, MOD)),
) -> Dict[str, Any]:
    """Add a domain to a tenant via Django internal API."""
    return await client.post(TENANTS_DOMAINS.format(tenant_id=tenant_id), role=user.role, json=domain_data)


@tenants_router.delete("/{tenant_id}/domains")
async def remove_tenant_domain(
    tenant_id: int,
    domain_data: Dict[str, Any],
    client: DjangoClient = Depends(get_django_client),
    user: User = Depends(require_roles(ADMIN, MOD)),
) -> Dict[str, Any]:
    """Remove a domain from a tenant via Django internal API."""
    return await client.delete(TENANTS_DOMAINS.format(tenant_id=tenant_id), role=user.role, json=domain_data)
