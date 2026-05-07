import api from '@/config/api'
import { MigrationsSummaryUrl, MigrationsRunUrl, MigrationsStateUrl } from '@/utils/constant'

export interface TenantMigrationSummary {
  schema_name: string
  name?: string
  migration_count?: number
  latest_migration?: string | null
  latest_applied_at?: string | null
}

export const migrationService = {
  async summary(): Promise<TenantMigrationSummary[]> {
    const { data } = await api.get(MigrationsSummaryUrl)
    // backend may return { tenants: [...] } or an array directly
    if (data?.tenants) return data.tenants
    return data
  },

  async run(tenantId: number): Promise<any> {
    const { data } = await api.post(MigrationsRunUrl(tenantId))
    return data
  },

  async state(tenantId: number): Promise<any> {
    const { data } = await api.get(MigrationsStateUrl(tenantId))
    return data
  },
}

export default migrationService
