from pydantic import BaseModel, Field
from typing import Optional
from .user_schema import UserSchema


class LoginResponseSchema(BaseModel):
    access_token: Optional[str] = Field(None, description="JWT access token when login completes")
    user: UserSchema = Field(..., description="Authenticated user details")
    requires_2fa: bool = Field(False, description="Whether a TOTP code is required before issuing session tokens")
    needs_2fa_setup: bool = Field(False, description="Whether the admin must first configure TOTP on the web app")
    temp_token: Optional[str] = Field(None, description="Short-lived token used during TOTP verification")
    detail: Optional[str] = Field(None, description="Additional login instructions")


class TokenSchema(BaseModel):
    access_token: str = Field(..., description="JWT access token")
    user : UserSchema = Field(..., description="Authenticated user details")
    class Config:
        json_schema_extra = {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            }
        }
        
class TwoFactorVerifyRequest(BaseModel):
    temp_token: str = Field(..., description="Short-lived token returned by the login endpoint")
    code: str = Field(..., min_length=6, max_length=8, description="Authenticator app TOTP code")


class TwoFactorCodeRequest(BaseModel):
    code: str = Field(..., min_length=6, max_length=8, description="Authenticator app TOTP code")


class TwoFactorSetupResponseSchema(BaseModel):
    secret: str = Field(..., description="Base32 TOTP secret")
    otpauth_url: str = Field(..., description="otpauth provisioning URL used to render a QR code")
    detail: str = Field(..., description="Instruction message for the user")


class MeUpdate(BaseModel):
    username: Optional[str] = Field(None, description="The user's first name")
    email: Optional[str] = Field(None, description="The user's email address")
    phone: Optional[str] = Field(None, description="The user's telephone number")

    class Config:
        from_attributes = True
        
