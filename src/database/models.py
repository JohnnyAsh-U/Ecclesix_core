# Backend developed by John Ashimedua; https://github.com/JohnnyAsh-U

from sqlalchemy import Column, Date, DateTime, Index, Integer, String, ForeignKey, Enum, Boolean, UUID
from sqlalchemy.orm import relationship
from .session import Base
from datetime import datetime
import enum


class Roles(str, enum.Enum):
    admin = "admin"
    mod = "mod"

class Admin(Base):
    __tablename__ = "users"
    id = Column(UUID, primary_key=True, index=True)
    username = Column(String(100), nullable=False)
    email = Column(String(100), nullable=False, unique=True)
    phone = Column(String(20), nullable=True)
    password = Column(String(100), nullable=False)
    is_2fa_enabled = Column(Boolean, nullable=False, default=False)
    totp_secret = Column(String(64), nullable=True)
    role = Column(Enum(Roles), nullable=False, default=Roles.mod)
    is_active = Column(Boolean, nullable=False, default=True)
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)


    __table_args__ = (
        Index('idx_username', 'username', unique=True),
    )
    
    
    
    
class BackupStatus(str, enum.Enum):
    pending = "pending"
    running = "running"
    success = "success"
    failed = "failed"
    
class BackupType(str, enum.Enum):
    full = "full"
    schema = "schema"
    
    
class BackupJob(Base):
    __tablename__ = "backup_jobs"
    
    id = Column(UUID, primary_key=True, index=True)
    tenant_schema = Column(String(100), nullable=False)
    status = Column(Enum(BackupStatus), nullable=False, default=BackupStatus.pending)
    backup_type = Column(Enum(BackupType), default=BackupType.schema, nullable=False)
    storage_path = Column(String(255), nullable=True)
    size_bytes = Column(Integer, nullable=True)
    error_message = Column(String(255), nullable=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    

class TenantBackupConfig(Base):
    __tablename__ = "tenant_backup_configs"
    
    id = Column(UUID, primary_key=True, index=True)
    tenant_name = Column(String(100), nullable=False)
    tenant_schema = Column(String(100), nullable=False, unique=True)
    enabled = Column(Boolean, nullable=False, default=True)
    retention_days = Column(Integer, nullable=False, default=30)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)  
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)  
    
    
class AuditLogs(Base):
    __tablename__ = "audits"
    
    id = Column(Integer, primary_key=True, index=True)
    admin = Column(String(100), nullable=False)
    action = Column(String(255), nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)