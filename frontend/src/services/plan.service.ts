import api from '@/config/api'
import type { BillingPlan } from '@/types'
import { BillingPlanUrl, DetailBillingPlanUrl } from '@/utils/constant'




export interface CreatePlan {
    code: string,
    name: string,
    price: string | number,
    annual_price: string | number,
    currency: string,
    max_churches: number,
    max_members: number,
}

export const billingPlanService = {
    // List all plan
    async listPlans(): Promise<BillingPlan[]> {
        const response = await api.get<BillingPlan[]>(BillingPlanUrl)
        return response.data
    },

    // Create a new plan
    async createPlan(payload: CreatePlan): Promise<any> {
        const response = await api.post<any>(BillingPlanUrl, payload)
        return response.data
    },

    // update  plan
    async updatePlan(planId: number, payload: CreatePlan): Promise<any> {
        const response = await api.put<any>(DetailBillingPlanUrl(planId), payload)
        return response.data
    },

    // delete plan
    async deletePlan(planId: number){
        const response = await api.delete(DetailBillingPlanUrl(planId))
        return response.data
    }

}
