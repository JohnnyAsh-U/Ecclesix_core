"""
Billing endpoints proxy to Django.
Handles billing records, payment management, and financial operations.
"""

import logging
from typing import Any, Dict, List
from fastapi import APIRouter, Depends, Query
from src.core.dependencies import get_django_client, DjangoClient, require_roles
from src.database.models import Admin as User
from src.core.internal_urls import (
    BILLINGS_RECENT,
    BILLINGS_FILTER,
    BILLINGS_STATS,
    BILLINGS_CREATE,
    BILLINGS_CHANGE_PLAN,
)
from src.schemas.roles import ADMIN, MOD

logger = logging.getLogger(__name__)

billing_router = APIRouter(prefix="/billings", tags=["billing"])


@billing_router.get("/recent")
async def get_recent_billings(
    client: DjangoClient = Depends(get_django_client),
    user: User = Depends(require_roles(ADMIN, MOD)),
) -> List[Dict[str, Any]]:
    """Get recent billing records from Django."""
    return await client.get(BILLINGS_RECENT, role=user.role)


@billing_router.get("/stats")
async def get_billing_stats(
    client: DjangoClient = Depends(get_django_client),
    user: User = Depends(require_roles(ADMIN, MOD)),
) -> Dict[str, Any]:
    """Get billing statistics from Django."""
    return await client.get(BILLINGS_STATS, role=user.role)


@billing_router.get("/filter")
async def filter_billings(
    month: int = Query(..., description="Month for filtering (1-12)"),
    year: int = Query(..., description="Year for filtering (e.g. 2024)"),
    client: DjangoClient = Depends(get_django_client),
    user: User = Depends(require_roles(ADMIN, MOD)),
) -> List[Dict[str, Any]]:
    """Filter billing records in Django."""
    url = f"{BILLINGS_FILTER}?month={month}&year={year}"
    return await client.get(url, role=user.role)


@billing_router.post("/create")
async def create_billing(
    billing_data: Dict[str, Any],
    client: DjangoClient = Depends(get_django_client),
    user: User = Depends(require_roles(ADMIN, MOD)),
) -> Dict[str, Any]:
    """Create a new billing record in Django."""
    return await client.post(BILLINGS_CREATE, role=user.role, json=billing_data)


@billing_router.post("/change-plan")
async def change_billing_plan(
    payload: Dict[str, Any],
    client: DjangoClient = Depends(get_django_client),
    user: User = Depends(require_roles(ADMIN, MOD)),
) -> Dict[str, Any]:
    """Change a tenant's billing plan in Django."""
    return await client.post(BILLINGS_CHANGE_PLAN, role=user.role, json=payload)

