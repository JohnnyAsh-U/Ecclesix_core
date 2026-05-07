import api from '@/config/api'
import {
  BillingRecentUrl,
  BillingStatsUrl,
  BillingFilterUrl,
  BillingCreateUrl,
  BillingChangePlanUrl
} from '@/utils/constant'

export interface BillingRecord {
  id: number
  invoice_number?: string
  tenant_id?: number
  church_name?: string
  is_active: string
  amount?: string
  currency?: string
  status?: string
  month?: string
  year?: string
  paid_at?: string | null
  payment_method?: string
  plan?: string | null
}

export const billingService = {
  async recent(): Promise<BillingRecord[]> {
    const { data } = await api.get<BillingRecord[]>(BillingRecentUrl)
    return data
  },

  async stats(): Promise<any> {
    const { data } = await api.get(BillingStatsUrl)
    return data
  },

  async filter(month: number, year: number): Promise<BillingRecord[]> {
    const { data } = await api.get<BillingRecord[]>(BillingFilterUrl, {
      params: { month, year }
    })
    return data
  },

  async create(payload: Record<string, any>): Promise<any> {
    const { data } = await api.post(BillingCreateUrl, payload)
    return data
  },

  async changePlan(payload: Record<string, any>): Promise<any> {
    const { data } = await api.post(BillingChangePlanUrl, payload)
    return data
  },
}

export default billingService
