"""
Infrastructure & Stats endpoints proxy to Django.
Handles CPU, memory, disk, API latency, and request statistics.
"""

import logging
from typing import Any, Dict, List
from fastapi import APIRouter, Depends, Request
from src.core.dependencies import get_django_client, DjangoClient
from src.core.internal_urls import (
    STATS_REQUESTS_HOURLY,
    STATS_REQUESTS_DAILY,
    STATS_REQUESTS_TENANTS_HOURLY,
    STATS_REQUESTS_TENANTS_DAILY,
    STATS_REQUESTS_SUMMARY,
    STATS_CPU,
    STATS_MEMORY,
    STATS_DISK,
    STATS_API_LATENCY,
)

logger = logging.getLogger(__name__)

stats_router = APIRouter(prefix="/stats", tags=["stats"])


def get_user_role(request: Request) -> str:
    """Extract user role from request context. Defaults to 'mod' (restrictive)."""
    role = getattr(request.state, "user_role", "mod")
    if role not in ["admin", "mod"]:
        role = "mod"
    return role


@stats_router.get("/requests/hourly")
async def get_requests_per_hour(
    client: DjangoClient = Depends(get_django_client),
    request: Request = None,
) -> List[Dict[str, Any]]:
    """Get requests per hour statistics from Django."""
    role = get_user_role(request)
    return await client.get(STATS_REQUESTS_HOURLY, role=role)


@stats_router.get("/requests/daily")
async def get_requests_per_day(
    client: DjangoClient = Depends(get_django_client),
    request: Request = None,
) -> List[Dict[str, Any]]:
    """Get requests per day statistics from Django."""
    role = get_user_role(request)
    return await client.get(STATS_REQUESTS_DAILY, role=role)


@stats_router.get("/requests/tenants-hourly")
async def get_requests_per_tenant_hourly(
    client: DjangoClient = Depends(get_django_client),
    request: Request = None,
) -> List[Dict[str, Any]]:
    """Get requests per tenant per hour from Django."""
    role = get_user_role(request)
    return await client.get(STATS_REQUESTS_TENANTS_HOURLY, role=role)


@stats_router.get("/requests/tenants-daily")
async def get_requests_per_tenant_daily(
    client: DjangoClient = Depends(get_django_client),
    request: Request = None,
) -> List[Dict[str, Any]]:
    """Get requests per tenant per day from Django."""
    role = get_user_role(request)
    return await client.get(STATS_REQUESTS_TENANTS_DAILY, role=role)


@stats_router.get("/requests/summary")
async def get_requests_summary(
    client: DjangoClient = Depends(get_django_client),
    request: Request = None,
) -> Dict[str, Any]:
    """Get requests summary from Django."""
    role = get_user_role(request)
    return await client.get(STATS_REQUESTS_SUMMARY, role=role)


@stats_router.get("/cpu")
async def get_cpu_usage(
    client: DjangoClient = Depends(get_django_client),
    request: Request = None,
) -> Dict[str, Any]:
    """Get CPU usage statistics from Django."""
    role = get_user_role(request)
    return await client.get(STATS_CPU, role=role)


@stats_router.get("/memory")
async def get_memory_usage(
    client: DjangoClient = Depends(get_django_client),
    request: Request = None,
) -> Dict[str, Any]:
    """Get memory usage statistics from Django."""
    role = get_user_role(request)
    return await client.get(STATS_MEMORY, role=role)


@stats_router.get("/disk")
async def get_disk_usage(
    client: DjangoClient = Depends(get_django_client),
    request: Request = None,
) -> Dict[str, Any]:
    """Get disk usage statistics from Django."""
    role = get_user_role(request)
    return await client.get(STATS_DISK, role=role)


@stats_router.get("/api-latency")
async def get_api_latency(
    client: DjangoClient = Depends(get_django_client),
    request: Request = None,
) -> Dict[str, Any]:
    """Get API latency statistics from Django."""
    role = get_user_role(request)
    return await client.get(STATS_API_LATENCY, role=role)
