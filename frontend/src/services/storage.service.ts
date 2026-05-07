import api from '@/config/api'
import { TenantsStorageListUrl, TenantsStorageStatUrl } from '@/utils/constant'

export interface TenantStorageItem {
  tenant_id: number
  schema_name: string
  name?: string
  total_files_count?: number
  total_files_size?: number
}

export const storageService = {
  async listTenants(): Promise<TenantStorageItem[]> {
    const { data } = await api.get(TenantsStorageListUrl)
    // backend returns { tenants: [...] }
    if (data?.tenants) return data.tenants
    return data
  },

  async stats(): Promise<any> {
    const { data } = await api.get(TenantsStorageStatUrl)
    return data
  },
}

export default storageService
