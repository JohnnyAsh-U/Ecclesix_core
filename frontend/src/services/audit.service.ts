import api  from '@/config/api'
import { AuditLogsUrl, AuditLogUrl, AuditLogsByAdminUrl } from '@/utils/constant'

export interface AuditLogSchema {
  id: number
  admin: string
  action: string
  resource?: string
  tenant_schema?: string
  details?: string
  created_at: string
}

export const auditService = {
  listAuditLogs: (limit: number = 100, offset: number = 0, admin?: string, action?: string) => {
    const params = new URLSearchParams()
    params.append('limit', limit.toString())
    params.append('offset', offset.toString())
    if (admin) params.append('admin', admin)
    if (action) params.append('action', action)
    return api.get<AuditLogSchema[]>(`${AuditLogsUrl}?${params.toString()}`)
  },

  getAuditLog: (logId: number) => api.get<AuditLogSchema>(AuditLogUrl(logId)),

  getLogsByAdmin: (adminName: string, limit: number = 50) =>
    api.get<AuditLogSchema[]>(`${AuditLogsByAdminUrl(adminName)}?limit=${limit}`),
}
