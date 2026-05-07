"""
Metrics router for infrastructure and API statistics.
Proxies Prometheus metrics queries for monitoring dashboards.
"""

import logging
from typing import Any, Dict
from fastapi import APIRouter, Depends
from src.schemas.roles import ADMIN, MOD
from src.core.dependencies import require_roles
from src.database.models import Admin as User
from src.services.metrics_service import PrometheusService

logger = logging.getLogger(__name__)

metrics_router = APIRouter(prefix="/metrics", tags=["metrics"])

# Instantiate Prometheus service
prometheus_service = PrometheusService()


@metrics_router.get("/requests/hourly")
async def get_requests_hourly(
    user: User = Depends(require_roles(ADMIN, MOD)),
) -> Dict[str, Any]:
    """Get request count per hour for the last 12 hours."""
    return prometheus_service.get_requests_per_hour()


@metrics_router.get("/requests/daily")
async def get_requests_daily(
    user: User = Depends(require_roles(ADMIN, MOD)),
) -> Dict[str, Any]:
    """Get request count per day for the last 7 days."""
    return prometheus_service.get_requests_per_day()


@metrics_router.get("/requests/tenants-hourly")
async def get_requests_tenants_hourly(
    user: User = Depends(require_roles(ADMIN, MOD)),
) -> Dict[str, Any]:
    """Get request count per tenant per hour for the last 12 hours."""
    return prometheus_service.get_requests_per_tenant_hour()


@metrics_router.get("/requests/tenants-daily")
async def get_requests_tenants_daily(
    user: User = Depends(require_roles(ADMIN, MOD)),
) -> Dict[str, Any]:
    """Get request count per tenant per day for the last 7 days."""
    return prometheus_service.get_requests_per_tenant_day()


@metrics_router.get("/requests/summary")
async def get_requests_summary(
    user: User = Depends(require_roles(ADMIN, MOD)),
) -> Dict[str, Any]:
    """Get summary of request statistics for the last 7 days."""
    return prometheus_service.get_requests_summary()


@metrics_router.get("/cpu")
async def get_cpu_usage(
    user: User = Depends(require_roles(ADMIN, MOD)),
) -> Dict[str, Any]:
    """Get current and average CPU usage."""
    return prometheus_service.get_cpu_usage()


@metrics_router.get("/memory")
async def get_memory_usage(
    user: User = Depends(require_roles(ADMIN, MOD)),
) -> Dict[str, Any]:
    """Get current and average memory usage."""
    return prometheus_service.get_memory_usage()


@metrics_router.get("/disk")
async def get_disk_usage(
    user: User = Depends(require_roles(ADMIN, MOD)),
) -> Dict[str, Any]:
    """Get current disk usage."""
    return prometheus_service.get_disk_usage()


@metrics_router.get("/latency")
async def get_api_latency(
    user: User = Depends(require_roles(ADMIN, MOD)),
) -> Dict[str, Any]:
    """Get API latency statistics (percentiles)."""
    return prometheus_service.get_api_latency()
