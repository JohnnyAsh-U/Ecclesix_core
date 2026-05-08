from datetime import timedelta
from typing import Annotated
from fastapi import Body, Depends, HTTPException, Request, Request, status, APIRouter, Response, Header
from src.database.models import Admin
from src.schemas.roles import ADMIN, MOD
from ..schemas.auth_schema import (
    TokenSchema,
    LoginResponseSchema,
    TwoFactorVerifyRequest,
    TwoFactorCodeRequest,
    TwoFactorSetupResponseSchema,
    MeUpdate,
)
from ..schemas.user_schema import UserSchema
from src.core.dependencies import get_current_user, require_roles
from src.core.security import security_manager
from src.services.auth_service import AuthService
from src.core.dependencies import get_auth_service
from fastapi.security import OAuth2PasswordRequestForm


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponseSchema)
async def login(
    response:Response,
    form_data: OAuth2PasswordRequestForm = Depends(), 
    auth_service: AuthService = Depends(get_auth_service),
):
    result = await auth_service.authenticate_and_create_tokens(
        form_data.username, form_data.password
    )
    
    if result.get("refresh_token") and result.get("refresh_token_expires"):
        response.set_cookie(
            key="refresh_token",
            value=result["refresh_token"],
            httponly=True,
            max_age=result["refresh_token_expires"].total_seconds(),
        )
    return result


@router.get("/logout", dependencies=[Depends(get_current_user)])
def logout():
    response = Response()
    response.delete_cookie(key="refresh_token")
    return response


@router.get("/me", response_model=UserSchema)
def read_current_user(user=Depends(get_current_user)):
    user.has_totp_secret = bool(getattr(user, "totp_secret", None))
    return user


@router.get("/refresh", response_model=TokenSchema)
async def refresh_token(request: Request, auth_service: AuthService = Depends(get_auth_service)):
    refresh_token_value = request.cookies.get("refresh_token")
    if not refresh_token_value:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = security_manager.decode_refresh_token(refresh_token_value)
    user_id: str = payload.get("sub")
    
    result = await auth_service.refresh_access_token(user_id)
    return {"access_token": result["access_token"], "user": result["user"]}


@router.post("/verify-2fa", response_model=TokenSchema)
async def verify_two_factor(
    payload: TwoFactorVerifyRequest,
    response: Response,
    auth_service: AuthService = Depends(get_auth_service),
):
    """Verify an admin TOTP code and issue the normal session tokens."""
    result = await auth_service.verify_two_factor_and_create_tokens(payload.temp_token, payload.code)
    response.set_cookie(
        key="refresh_token",
        value=result["refresh_token"],
        httponly=True,
        max_age=result["refresh_token_expires"].total_seconds(),
    )
    return {"access_token": result["access_token"], "user": result["user"]}


@router.post("/2fa/setup", response_model=TwoFactorSetupResponseSchema, dependencies=[Depends(require_roles(ADMIN, MOD))])
async def setup_two_factor(
    current_user=Depends(require_roles(ADMIN, MOD)),
    auth_service: AuthService = Depends(get_auth_service),
):
    """Generate a TOTP secret and provisioning URL for the current admin."""
    return await auth_service.setup_two_factor(current_user)


@router.post("/2fa/enable", dependencies=[Depends(require_roles(ADMIN, MOD))])
async def enable_two_factor(
    payload: TwoFactorCodeRequest,
    current_user=Depends(require_roles(ADMIN, MOD)),
    auth_service: AuthService = Depends(get_auth_service),
):
    """Enable TOTP 2FA for the current admin after verifying the code."""
    return await auth_service.enable_two_factor(current_user, payload.code)


@router.post("/2fa/disable", dependencies=[Depends(require_roles(ADMIN, MOD))])
async def disable_two_factor(
    payload: TwoFactorCodeRequest,
    current_user=Depends(require_roles(ADMIN, MOD)),
    auth_service: AuthService = Depends(get_auth_service),
):
    """Disable TOTP 2FA for the current admin after verifying the code."""
    return await auth_service.disable_two_factor(current_user, payload.code)


@router.post("/change-password", dependencies=[Depends(get_current_user)])
async def change_password(
    old_password: Annotated[str, Body()],
    new_password: Annotated[str, Body()],
    current_user=Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service)
):
    return await auth_service.change_password(current_user, old_password, new_password)

@router.put("/me", response_model=UserSchema, dependencies=[Depends(get_current_user)])
async def update_my_profile(
    user_update: MeUpdate,
    current_user=Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service),
):
    """Update current user's profile fields and return updated user."""
    return await auth_service.update_profile(current_user, user_update)

