from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class AuditLogSchema(BaseModel):
    id: int
    admin: str
    action: str
    resource: Optional[str] = None
    tenant_schema: Optional[str] = None
    details: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
