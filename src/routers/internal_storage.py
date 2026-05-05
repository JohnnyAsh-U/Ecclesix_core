"""
Storage endpoints proxy to Django.
Handles church storage information and storage management.
"""

import logging
from typing import Any, Dict, List
from fastapi import APIRouter, Depends, Request
from src.core.dependencies import get_django_client, DjangoClient
from src.core.internal_urls import (
    STORAGE_CHURCHES,
    STORAGE_SUMMARY,
)

logger = logging.getLogger(__name__)

storage_router = APIRouter(prefix="/storage", tags=["storage"])


def get_user_role(request: Request) -> str:
    """Extract user role from request context. Defaults to 'mod' (restrictive)."""
    role = getattr(request.state, "user_role", "mod")
    if role not in ["admin", "mod"]:
        role = "mod"
    return role


@storage_router.get("/churches")
async def list_churches_storage(
    client: DjangoClient = Depends(get_django_client),
    request: Request = None,
) -> List[Dict[str, Any]]:
    """List church storage information from Django."""
    role = get_user_role(request)
    return await client.get(STORAGE_CHURCHES, role=role)


@storage_router.get("/summary")
async def get_storage_summary(
    client: DjangoClient = Depends(get_django_client),
    request: Request = None,
) -> Dict[str, Any]:
    """Get storage summary from Django."""
    role = get_user_role(request)
    return await client.get(STORAGE_SUMMARY, role=role)
