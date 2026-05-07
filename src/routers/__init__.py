from fastapi import APIRouter

from .backup_router import backup_router

# Import individual routers from this package and include them on a single
# `api_router` so the application can import one router cleanly from `src.routers`.
from .auth_router import router as auth_router
from .user_router import router as user_router
from .metrics_router import metrics_router


api_router = APIRouter()
api_router.include_router(auth_router, tags=["auth"])
api_router.include_router(user_router, tags=["users"])
api_router.include_router(metrics_router, tags=["metrics"])
api_router.include_router(backup_router, tags=["backups"])

__all__ = [
    "auth_router",
    'user_router',
    'metrics_router',
    'backup_router'
]