import api from '@/config/api'

export interface TenantBackup {
  tenant_id: number
  tenant_name: string
  schema_name: string
  next_schedule: string | null
  last_backup: string | null
  size_bytes: number
  status: string
}

export interface BackupJob {
  id: string
  tenant_schema: string
  backup_type: string
  status: string
  storage_path: string | null
  size_bytes: number
  error_message: string | null
  started_at: string
  completed_at: string | null
  created_at: string
}

export const backupService = {
  // Get all tenants with backup info
  async listTenantBackups() {
    const response = await api.get<TenantBackup[]>(
      '/api/v1/internal/backups'
    )
    return response.data
  },

  // Trigger on-demand backup for a specific tenant
  async backupTenant(tenantName: string) {
    const response = await api.post(
      `/api/v1/internal/backups/tenant/${tenantName}`
    )
    return response.data
  },

  // Trigger full database backup
  async backupFull() {
    const response = await api.post('/api/v1/internal/backups/full')
    return response.data
  },

  // Delete a backup
  async deleteBackup(backupId: string) {
    const response = await api.delete(
      `/api/v1/internal/backups/${backupId}`
    )
    return response.data
  },

  // Restore from a backup
  async restoreBackup(backupId: string) {
    const response = await api.post(
      `/api/v1/internal/backups/${backupId}/restore`
    )
    return response.data
  },

  // Download a backup file
  async downloadBackup(backupId: string) {
    const response = await api.get(
      `/api/v1/internal/backups/${backupId}/download`,
      { responseType: 'blob' }
    )
    return response.data
  },
}
