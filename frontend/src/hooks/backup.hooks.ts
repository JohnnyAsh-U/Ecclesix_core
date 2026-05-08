import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { backupService } from '@/services/backup.service'
import { toast } from 'sonner'

// Query key factory for backups
const backupKeys = {
  all: () => ['backups'],
  tenants: () => [...backupKeys.all(), 'tenants'],
}

/**
 * Hook to fetch detailed backups for a specific tenant
 */
export function useGetTenantBackups(tenantSchema?: string) {
  return useQuery({
    queryKey: [...backupKeys.tenants(), 'tenant', tenantSchema],
    queryFn: () => backupService.getTenantBackups(tenantSchema as string),
  })
}

/**
 * Hook to fetch list of all tenants with their backup information
 */
export function useListTenantBackups() {
  return useQuery({
    queryKey: backupKeys.tenants(),
    queryFn: () => backupService.listTenantBackups(),
  })
}

/**
 * Hook to trigger on-demand backup for a specific tenant
 */
export function useBackupTenant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (tenantName: string) => backupService.backupTenant(tenantName),
    onSuccess: (_, tenantName) => {
      toast.success(`Backup started for ${tenantName}`)
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
      const data = await backupService.getDownloadUrl(backupId)
      // Return presigned URL payload for the caller to display / copy
      return data
    },
    onSuccess: () => {
      toast.success('Download URL generated')
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

/**
 * Hook to trigger purge of old backups for all tenants
 */
export function usePurgeBackups() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => backupService.purgeBackups(),
    onSuccess: () => {
      toast.success('Purge completed')
      queryClient.invalidateQueries({ queryKey: backupKeys.tenants() })
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.detail ||
        error?.message ||
        'Failed to purge backups'
      toast.error(message)
    },
  })
}
