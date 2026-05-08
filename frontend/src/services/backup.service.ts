import api from '@/config/api'
import {  
  BackupTenantUrl, 
  BackupPurgeUrl,
  BackupDownloadUrl, 
  BackupFullUrl, 
  BackupRestoreUrl, 
  BackupUrl,
  TenantBackupsUrl
} from '@/utils/constant'

export interface TenantBackup {
  tenant_id: number
  tenant_name: string
  tenant_schema: string
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
    const response = await api.get<TenantBackup[]>(BackupUrl)
    return response.data
  },

  // Get detailed backups for a specific tenant
  async getTenantBackups(tenantSchema: string) {
    const response = await api.get<BackupJob[]>(TenantBackupsUrl(tenantSchema))
    return response.data
  },

  // Trigger on-demand backup for a specific tenant
  async backupTenant(tenantSchema: string) {
    const response = await api.post(
      BackupTenantUrl(tenantSchema)
    )
    return response.data
  },

  // Trigger full database backup
  async backupFull() {
    const response = await api.post(BackupFullUrl)
    return response.data
  },


  // Restore from a backup
  async restoreBackup(backupId: string) {
    const response = await api.post(
      BackupRestoreUrl(backupId)
    )
    return response.data
  },

  // Download a backup file
  // Get a presigned download URL for a backup
  async getDownloadUrl(backupId: string) {
    const response = await api.post(BackupDownloadUrl(backupId))
    return response.data
  },

  // Purge old backups for all tenants; include_full and full_retention_days are optional
  async purgeBackups() {
    const response = await api.post(BackupPurgeUrl, null)
    return response.data
  },
}
