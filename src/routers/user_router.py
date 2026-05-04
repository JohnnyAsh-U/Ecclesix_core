from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from src.schemas.user_schema import CreateUserSchema, UserSchema
from src.schemas.roles import ADMIN
from src.database.models import Roles
from src.core.dependencies import require_roles, get_user_service
from src.services import user_service
from src.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["users"])


@router.post("/", response_model=UserSchema, dependencies=[Depends(require_roles(ADMIN))])
async def create_user(payload: CreateUserSchema, user_service: UserService = Depends(get_user_service)):
    role = Roles.Mod
    return await user_service.create_user(payload.username, payload.password, payload.email, role)


@router.delete("/{user_id}", dependencies=[Depends(require_roles(ADMIN))])
async def delete_user(user_id: UUID, user_service: UserService = Depends(get_user_service)):
    return await user_service.delete_user(user_id)


@router.post("/{user_id}/deactivate", response_model=UserSchema, dependencies=[Depends(require_roles(ADMIN))])
async def deactivate_user(user_id: UUID, user_service: UserService = Depends(get_user_service)):
    return await user_service.deactivate_user(user_id)


@router.post("/{user_id}/activate", response_model=UserSchema, dependencies=[Depends(require_roles(ADMIN))])
async def reactivate_user(user_id: UUID, user_service: UserService = Depends(get_user_service)):
    return await user_service.reactivate_user(user_id)


@router.get("/", response_model=List[UserSchema], dependencies=[Depends(require_roles(ADMIN))])
async def list_users(user_service: UserService = Depends(get_user_service)):
    return await user_service.list_users()
