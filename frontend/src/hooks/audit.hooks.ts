import { useQuery } from '@tanstack/react-query'
import { auditService } from '@/services/audit.service'

export const useListAuditLogsQuery = (
  limit: number = 100,
  offset: number = 0,
  admin?: string,
  action?: string
) => {
  return useQuery({
    queryKey: ['audit-logs', limit, offset, admin, action],
    queryFn: async () => {
      const response = await auditService.listAuditLogs(limit, offset, admin, action)
      return response.data
    },
  })
}

export const useGetAuditLogQuery = (logId: number) => {
  return useQuery({
    queryKey: ['audit-log', logId],
    queryFn: async () => {
      const response = await auditService.getAuditLog(logId)
      return response.data
    },
  })
}

export const useGetLogsByAdminQuery = (adminName: string, limit: number = 50) => {
  return useQuery({
    queryKey: ['audit-logs-by-admin', adminName, limit],
    queryFn: async () => {
      const response = await auditService.getLogsByAdmin(adminName, limit)
      return response.data
    },
  })
}
