import api from '@/config/api'
import type { Tenant, TenantStorage } from '@/types'
import { ActivateTenantUrl, DeactivateTenantUrl, TenantUrl, UpdateDomainUrl, UpdateStorageUrl } from '@/utils/constant'


export interface CreateTenantPayload {
  name: string
  church_name: string
  domain: string
  superadmin_email: string
  schema_name: string
  plan?: string
  billing_cycle?: string
  email?: string
  phone?: string
}

export interface DomainPayload {
  domain: string
}

export interface StoragePayload {
  quota_bytes: number
}

export const tenantService = {
  // List all tenants
  async listTenants(): Promise<Tenant[]> {
    const response = await api.get<Tenant[]>(TenantUrl)
    return response.data
  },

  // Create a new tenant
  async createTenant(payload: CreateTenantPayload): Promise<any> {
    const response = await api.post<any>(TenantUrl, payload)
    return response.data
  },

  // Get tenant detail
  async getTenantDetail(tenantId: number): Promise<Tenant> {
    const response = await api.get<Tenant>(`${TenantUrl}/${tenantId}`)
    return response.data
  },

  // Activate a tenant
  async activateTenant(tenantId: number): Promise<any> {
    const response = await api.post<any>(ActivateTenantUrl(tenantId), {})
    return response.data
  },

  // Deactivate a tenant
  async deactivateTenant(tenantId: number): Promise<any> {
    const response = await api.post<any>(DeactivateTenantUrl(tenantId), {})
    return response.data
  },

  // update domain to tenant
  async updateDomain(tenantId: number, domain: string): Promise<any> {
    const response = await api.patch<any>(UpdateDomainUrl(tenantId), { domain } as DomainPayload)
    return response.data
  },


  // Update storage quota
  async updateStorage(
    tenantId: number,
    quota_bytes: number
  ): Promise<TenantStorage> {
    const response = await api.patch<TenantStorage>(UpdateStorageUrl(tenantId), { quota_bytes } as StoragePayload)
    return response.data
  },


  async updateTenant(tenantId: number, payload: {
    name?: string
    church_name?: string
    phone?: string
    email?: string
    custom_logo?: boolean
  }) {
    const response = await api.put(`${TenantUrl}/${tenantId}`, payload)
    return response.data
  }
}
