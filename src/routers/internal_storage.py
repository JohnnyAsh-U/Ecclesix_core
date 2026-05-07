"""
Storage endpoints proxy to Django.
Handles church storage information and storage management.
"""

import logging
from typing import Any, Dict, List
from fastapi import APIRouter, Depends, Request
from src.schemas.roles import ADMIN, MOD
from src.core.dependencies import get_django_client, DjangoClient, require_roles
from src.core.internal_urls import (
    TENANTS_STORAGE_LIST,
    TENANTS_STORAGE_STAT,
)
from src.database.models import Admin as User

logger = logging.getLogger(__name__)

storage_router = APIRouter(prefix="/storage", tags=["storage"])


@storage_router.get("")
async def list_tenants_storage(
    client: DjangoClient = Depends(get_django_client),
    user : User = Depends(require_roles(ADMIN, MOD)),
) -> List[Dict[str, Any]]:
    """List tenant storage information from Django."""
    return await client.get(TENANTS_STORAGE_LIST, role=user.role)


@storage_router.get('/stats')
async def storage_stats(
    client: DjangoClient = Depends(get_django_client),
    user : User = Depends(require_roles(ADMIN, MOD)),
) -> Dict[str, Any]:
    """Get overall storage statistics from Django."""
    return await client.get(TENANTS_STORAGE_STAT, role=user.role)

