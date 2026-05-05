"""
Billing Plans endpoints proxy to Django.
Handles billing plan CRUD operations and plan management.
"""

import logging
from typing import Any, Dict, List
from fastapi import APIRouter, Depends, Request
from src.core.dependencies import get_django_client, DjangoClient
from src.core.internal_urls import (
    PLANS_LIST,
    PLANS_CREATE,
    PLANS_DETAIL,
)

logger = logging.getLogger(__name__)

plans_router = APIRouter(prefix="/plans", tags=["plans"])


def get_user_role(request: Request) -> str:
    """Extract user role from request context. Defaults to 'mod' (restrictive)."""
    role = getattr(request.state, "user_role", "mod")
    if role not in ["admin", "mod"]:
        role = "mod"
    return role


@plans_router.get("")
async def list_billing_plans(
    client: DjangoClient = Depends(get_django_client),
    request: Request = None,
) -> List[Dict[str, Any]]:
    """List all billing plans from Django."""
    role = get_user_role(request)
    return await client.get(PLANS_LIST, role=role)


@plans_router.post("")
async def create_billing_plan(
    plan_data: Dict[str, Any],
    client: DjangoClient = Depends(get_django_client),
    request: Request = None,
) -> Dict[str, Any]:
    """Create a new billing plan in Django."""
    role = get_user_role(request)
    return await client.post(PLANS_CREATE, role=role, json=plan_data)


@plans_router.get("/{plan_id}")
async def get_billing_plan(
    plan_id: int,
    client: DjangoClient = Depends(get_django_client),
    request: Request = None,
) -> Dict[str, Any]:
    """Get billing plan details from Django."""
    role = get_user_role(request)
    return await client.get(PLANS_DETAIL.format(plan_id=plan_id), role=role)
