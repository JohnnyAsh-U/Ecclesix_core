import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import migrationService from '@/services/migration.service'
import { toast } from 'sonner'

const MIGRATIONS_QUERY_KEY = ['migrations']

export function useMigrationsSummary() {
  return useQuery({
    queryKey: MIGRATIONS_QUERY_KEY,
    queryFn: () => migrationService.summary(),
  })
}

export function useRunTenantMigration() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (tenantId: number) => migrationService.run(tenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MIGRATIONS_QUERY_KEY })
      toast.success('Migration started')
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || err?.message || 'Failed to start migration'
      toast.error(msg)
    },
  })
}

export function useTenantMigrationState(tenantId?: number) {
  return useQuery({
    queryKey: ['migrations', tenantId],
    queryFn: () => migrationService.state(tenantId as number),
    enabled: !!tenantId,
    // Do not cache placeholder data for different tenant ids
    staleTime: 0,
  })
}

export default migrationService
