"""
Health Check endpoints for system monitoring.
Verifies connectivity and status of the Django backend.
"""

import logging
from typing import Any, Dict
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from src.core.dependencies import get_django_client, DjangoClient
from src.core.internal_urls import HEALTH_DJANGO

logger = logging.getLogger(__name__)

health_router = APIRouter(prefix="/health", tags=["health"])


@health_router.get("/django")
async def django_health_check(
    client: DjangoClient = Depends(get_django_client),
) -> Dict[str, Any]:
    """
    Health check endpoint that pings Django API.
    
    Returns:
        {
            "status": "healthy" | "unhealthy",
            "django_url": "http://localhost:8000",
            "timestamp": "2024-01-01T00:00:00Z"
        }
    """
    is_healthy = await client.health_check()
    
    return {
        "status": "healthy" if is_healthy else "unhealthy",
        "django_url": client._settings.DJANGO_BASE_URL,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
