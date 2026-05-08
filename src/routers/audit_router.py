from fastapi import APIRouter, Depends, Query
from typing import List
from src.schemas.audit_schema import AuditLogSchema
from src.services.audit_service import AuditService
from src.core.dependencies import get_audit_service, require_roles
from src.schemas.roles import ADMIN

router = APIRouter(prefix="/audit-logs", tags=["audit-logs"])




@router.get("", response_model=List[AuditLogSchema], dependencies=[Depends(require_roles(ADMIN))])
async def list_audit_logs(
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    admin: str = Query(None),
    action: str = Query(None),
    audit_service: AuditService = Depends(get_audit_service),
):
    """Get audit logs with optional filtering by admin or action"""
    return await audit_service.list_audit_logs(
        limit=limit, offset=offset, admin=admin, action=action
    )


@router.get("/{log_id}", response_model=AuditLogSchema, dependencies=[Depends(require_roles(ADMIN))])
async def get_audit_log(
    log_id: int,
    audit_service: AuditService = Depends(get_audit_service),
):
    """Get a single audit log by ID"""
    return await audit_service.get_audit_log(log_id)


@router.get("/admin/{admin_name}", response_model=List[AuditLogSchema], dependencies=[Depends(require_roles(ADMIN))])
async def get_logs_by_admin(
    admin_name: str,
    limit: int = Query(50, ge=1, le=500),
    audit_service: AuditService = Depends(get_audit_service),
):
    """Get all audit logs for a specific admin"""
    return await audit_service.get_logs_by_admin(admin_name, limit=limit)
