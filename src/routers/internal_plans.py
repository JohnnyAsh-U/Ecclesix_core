"""
Billing Plans endpoints proxy to Django.
Handles billing plan CRUD operations and plan management.
"""

import logging
from typing import Any, Dict, List
from src.schemas.roles import ADMIN, MOD
from src.database.models import Admin as User
from fastapi import APIRouter, Depends, Request
from src.core.dependencies import get_django_client, DjangoClient, require_roles
from src.core.internal_urls import (
    PLANS_LIST,
    PLANS_CREATE,
    PLANS_DETAIL,
)

logger = logging.getLogger(__name__)

plans_router = APIRouter(prefix="/plans", tags=["plans"])



@plans_router.get("")
async def list_billing_plans(
    client: DjangoClient = Depends(get_django_client),
    user: User = Depends(require_roles(ADMIN, MOD)),
) -> List[Dict[str, Any]]:
    """List all billing plans from Django."""
    return await client.get(PLANS_LIST, role=user.role)


@plans_router.post("")
async def create_billing_plan(
    plan_data: Dict[str, Any],
    client: DjangoClient = Depends(get_django_client),
    user: User = Depends(require_roles(ADMIN, MOD)),
) -> Dict[str, Any]:
    """Create a new billing plan in Django."""
    return await client.post(PLANS_CREATE, role=user.role, json=plan_data)


@plans_router.get("/{plan_id}")
async def get_billing_plan(
    plan_id: int,
    client: DjangoClient = Depends(get_django_client),
    user: User = Depends(require_roles(ADMIN, MOD)),
) -> Dict[str, Any]:
    """Get billing plan details from Django."""
    return await client.get(PLANS_DETAIL.format(plan_id=plan_id), role=user.role)


@plans_router.put("/{plan_id}")
async def edit_billing_plan(
    plan_id: int,
    storage_data: Dict[str, Any],
    client: DjangoClient = Depends(get_django_client),
    user: User = Depends(require_roles(ADMIN, MOD))
):
    return await client.put(PLANS_DETAIL.format(plan_id = plan_id), role=user.role, json=storage_data)


@plans_router.delete("/{plan_id}")
async def delete_billing_plan(
    plan_id: int,
    client: DjangoClient = Depends(get_django_client),
    user: User = Depends(require_roles(ADMIN, MOD))
):
    return await client.delete(PLANS_DETAIL.format(plan_id=plan_id), role=user.role)