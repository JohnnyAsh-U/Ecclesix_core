from fastapi import APIRouter

# Import individual routers from this package and include them on a single
# `api_router` so the application can import one router cleanly from `src.routers`.
from .auth_router import router as auth_router
from .user_router import router as user_router


api_router = APIRouter()
api_router.include_router(auth_router, tags=["auth"])
api_router.include_router(user_router, tags=["users"])

__all__ = [
    "auth_router",
]