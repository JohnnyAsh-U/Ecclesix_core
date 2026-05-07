from datetime import datetime
from alembic.environment import Optional
from pydantic import BaseModel, UUID4
from src.database.models import BackupStatus, BackupType

class BackupJobOut(BaseModel):
    id: UUID4
    tenant_schema: str
    status: BackupStatus
    backup_type: BackupType
    storage_path: Optional[str]
    size_bytes: Optional[int]
    error_message: Optional[str]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True
        
        
class TriggerBackupIn(BaseModel):
    tenant_schema: str
    backup_type: BackupType = BackupType.schema
    
