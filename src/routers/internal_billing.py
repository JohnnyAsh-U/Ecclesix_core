"""
Billing endpoints proxy to Django.
Handles billing records, payment management, and financial operations.
"""

import logging
from typing import Any, Dict, List
from fastapi import APIRouter, Depends, Request
from src.core.dependencies import get_django_client, DjangoClient
from src.core.internal_urls import (
    BILLINGS_RECENT,
    BILLINGS_FILTER,
    BILLINGS_CREATE,
    BILLINGS_CANCEL,
)

logger = logging.getLogger(__name__)

billing_router = APIRouter(prefix="/billings", tags=["billing"])


def get_user_role(request: Request) -> str:
    """Extract user role from request context. Defaults to 'mod' (restrictive)."""
    role = getattr(request.state, "user_role", "mod")
    if role not in ["admin", "mod"]:
        role = "mod"
    return role


@billing_router.get("/recent")
async def get_recent_billings(
    client: DjangoClient = Depends(get_django_client),
    request: Request = None,
) -> List[Dict[str, Any]]:
    """Get recent billing records from Django."""
    role = get_user_role(request)
    return await client.get(BILLINGS_RECENT, role=role)


@billing_router.post("/filter")
async def filter_billings(
    filter_data: Dict[str, Any],
    client: DjangoClient = Depends(get_django_client),
    request: Request = None,
) -> Dict[str, Any]:
    """Filter billing records in Django."""
    role = get_user_role(request)
    return await client.post(BILLINGS_FILTER, role=role, json=filter_data)


@billing_router.post("/create")
async def create_billing(
    billing_data: Dict[str, Any],
    client: DjangoClient = Depends(get_django_client),
    request: Request = None,
) -> Dict[str, Any]:
    """Create a new billing record in Django."""
    role = get_user_role(request)
    return await client.post(BILLINGS_CREATE, role=role, json=billing_data)


@billing_router.post("/{payment_id}/cancel")
async def cancel_billing(
    payment_id: int,
    client: DjangoClient = Depends(get_django_client),
    request: Request = None,
) -> Dict[str, Any]:
    """Cancel a billing payment in Django."""
    role = get_user_role(request)
    return await client.post(BILLINGS_CANCEL.format(payment_id=payment_id), role=role)
