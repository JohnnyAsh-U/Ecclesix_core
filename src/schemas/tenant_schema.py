from typing import Optional, Annotated
from pydantic import BaseModel, EmailStr, Field

NonEmptyStr = Annotated[str, Field(min_length=1)]

class TenantCreate(BaseModel):
    name: NonEmptyStr
    church_name: NonEmptyStr
    domain: NonEmptyStr
    superadmin_email: EmailStr
    schema_name: Optional[NonEmptyStr] = None
    plan: Optional[str] = None
    billing_cycle: Optional[str] = "monthly"
    email: Optional[EmailStr] = None
    phone: Optional[str] = None

    class Config:
        from_attributes = True
