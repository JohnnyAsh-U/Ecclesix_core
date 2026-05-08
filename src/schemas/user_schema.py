from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime


class UserSchema(BaseModel):
    id: UUID = Field(..., description="The unique identifier of the user")
    username: str = Field(..., description="The user's matricule")
    email: Optional[str] = Field(None, description="The user's email address")
    phone: Optional[str] = Field(None, description="The user's phone number")
    role: str = Field(..., description="The user's role in the system")
    is_active: bool = Field(..., description="Indicates if the user is active")
    is_2fa_enabled: bool = Field(False, description="Whether TOTP 2FA is enabled for the user")
    has_totp_secret: bool = Field(False, description="Whether a TOTP secret has been configured")
    created_at: datetime = Field(..., description="The timestamp when the user was created")

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "username": "EMP12345",
                "email": "johh@exmaple.com",
                "role": "Emp",
                "is_active": True
            }
        }



class CreateUserSchema(BaseModel):
    username: str = Field(..., description="The user's matricule")
    phone: str = Field(..., description="Phone number for the user")
    email: Optional[str] = Field(None, description="Optional email address")

    class Config:
        json_schema_extra = {
            "example": {
                "username": "EMP12345",
                "phone": "123-456-7890",
                "email": "user@example.com",
            }
        }



