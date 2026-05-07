import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { backupService, TenantBackup, BackupJob } from '@/services/backup.service'
import { toast } from 'sonner'

// Query key factory for backups
const backupKeys = {
  all: () => ['backups'],
  tenants: () => [...backupKeys.all(), 'tenants'],
}

/**
 * Hook to fetch list of all tenants with their backup information
 */
export function useListTenantBackups() {
  return useQuery({
    queryKey: backupKeys.tenants(),
    queryFn: () => backupService.listTenantBackups(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook to trigger on-demand backup for a specific tenant
 */
export function useBackupTenant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (tenantName: string) => backupService.backupTenant(tenantName),
    onSuccess: (data, tenantName) => {
      toast.success(`Backup started for ${tenantName}`)
      // Refetch backup list
      queryClient.invalidateQueries({ queryKey: backupKeys.tenants() })
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.detail ||
        error?.message ||
        'Failed to start backup'
      toast.error(message)
    },
  })
}

/**
 * Hook to trigger full database backup
 */
export function useBackupFull() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => backupService.backupFull(),
    onSuccess: () => {
      toast.success('Full backup started')
      // Refetch backup list
      queryClient.invalidateQueries({ queryKey: backupKeys.tenants() })
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.detail ||
        error?.message ||
        'Failed to start full backup'
      toast.error(message)
    },
  })
}

/**
 * Hook to delete a backup
 */
export function useDeleteBackup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (backupId: string) => backupService.deleteBackup(backupId),
    onSuccess: () => {
      toast.success('Backup deleted successfully')
      // Refetch backup list
      queryClient.invalidateQueries({ queryKey: backupKeys.tenants() })
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.detail ||
        error?.message ||
        'Failed to delete backup'
      toast.error(message)
    },
  })
}

/**
 * Hook to restore from a backup
 */
export function useRestoreBackup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (backupId: string) => backupService.restoreBackup(backupId),
    onSuccess: () => {
      toast.success('Restore job started')
      // Refetch backup list
      queryClient.invalidateQueries({ queryKey: backupKeys.tenants() })
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.detail ||
        error?.message ||
        'Failed to start restore'
      toast.error(message)
    },
  })
}

/**
 * Hook to download a backup file
 */
export function useDownloadBackup() {
  return useMutation({
    mutationFn: async (backupId: string) => {
      const blob = await backupService.downloadBackup(backupId)
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `backup_${backupId}.dump`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      return { success: true }
    },
    onSuccess: () => {
      toast.success('Backup downloaded successfully')
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.detail ||
        error?.message ||
        'Failed to download backup'
      toast.error(message)
    },
  })
}
