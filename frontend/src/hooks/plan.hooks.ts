import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { billingPlanService, type CreatePlan } from '@/services/plan.service'
import { toast } from 'sonner'

const PLANS_QUERY_KEY = ['plans']

export function usePlansList() {
  return useQuery({
    queryKey: PLANS_QUERY_KEY,
    queryFn: () => billingPlanService.listPlans(),
  })
}

export function useCreatePlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreatePlan) => billingPlanService.createPlan(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: PLANS_QUERY_KEY })
      toast.success(`Plan ${data?.name || 'created'} created successfully`)
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || 'Failed to create plan'
      toast.error(message)
    },
  })
}

export function useUpdatePlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ planId, payload }: { planId: number; payload: CreatePlan }) =>
      billingPlanService.updatePlan(planId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PLANS_QUERY_KEY })
      toast.success('Plan updated successfully')
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || 'Failed to update plan'
      toast.error(message)
    },
  })
}

export function useDeletePlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (planId: number) => billingPlanService.deletePlan(planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PLANS_QUERY_KEY })
      toast.success('Plan deleted')
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || 'Failed to delete plan'
      toast.error(message)
    },
  })
}

export function usePlanDetail(planId: number) {
  return useQuery({
    queryKey: ['plan', planId],
    queryFn: () => billingPlanService.listPlans().then(plans => plans.find(p => p.id === planId)),
    enabled: !!planId,
  })
}
