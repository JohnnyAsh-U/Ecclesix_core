from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from src.database.models import AuditLogs
from typing import List, Optional
from datetime import datetime


class AuditService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def list_audit_logs(
        self,
        limit: int = 100,
        offset: int = 0,
        admin: Optional[str] = None,
        action: Optional[str] = None,
    ) -> List[AuditLogs]:
        """List audit logs with optional filtering"""
        query = select(AuditLogs)

        if admin:
            query = query.where(AuditLogs.admin == admin)
        if action:
            query = query.where(AuditLogs.action == action)

        query = query.order_by(desc(AuditLogs.created_at)).limit(limit).offset(offset)
        result = await self.session.execute(query)
        return result.scalars().all()

    async def get_audit_log(self, log_id: int) -> Optional[AuditLogs]:
        """Get a single audit log by ID"""
        query = select(AuditLogs).where(AuditLogs.id == log_id)
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_logs_by_admin(self, admin: str, limit: int = 50) -> List[AuditLogs]:
        """Get all audit logs for a specific admin"""
        query = (
            select(AuditLogs)
            .where(AuditLogs.admin == admin)
            .order_by(desc(AuditLogs.created_at))
            .limit(limit)
        )
        result = await self.session.execute(query)
        return result.scalars().all()
