import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import billingService from '@/services/billing.service'
import { toast } from 'sonner'

const BILLINGS_QUERY_KEY = ['billings']
const BILLINGS_STATS_KEY = ['billings', 'stats']

// Helper to safely extract error message
const getErrorMessage = (error: any, defaultMsg: string): string => {
  if (typeof error?.response?.data?.detail === 'string') {
    return error.response.data.detail
  }
  if (typeof error?.response?.data?.detail === 'object' && error.response.data.detail?.msg) {
    return error.response.data.detail.msg
  }
  if (Array.isArray(error?.response?.data?.detail)) {
    const firstError = error.response.data.detail[0]
    return typeof firstError === 'string' ? firstError : firstError?.msg || defaultMsg
  }
  return defaultMsg
}

export function useRecentBillings() {
  return useQuery({
    queryKey: BILLINGS_QUERY_KEY,
    queryFn: () => billingService.recent(),
  })
}

export function useBillingStats() {
  return useQuery({
    queryKey: BILLINGS_STATS_KEY,
    queryFn: () => billingService.stats(),
  })
}

export function useFilterBillings() {
  return useMutation({
    mutationFn: ({ month, year }: { month: number; year: number }) => 
      billingService.filter(month, year),
    onError: (error: any) => {
      const message = getErrorMessage(error, 'Failed to filter billings')
      toast.error(message)
    },
  })
}

export function useCreateBilling() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: Record<string, any>) => billingService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BILLINGS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: BILLINGS_STATS_KEY })
      toast.success('Billing created')
    },
    onError: (error: any) => {
      const message = getErrorMessage(error, 'Failed to create billing')
      toast.error(message)
    },
  })
}

export function useChangeBillingPlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: Record<string, any>) => billingService.changePlan(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BILLINGS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: BILLINGS_STATS_KEY })
      toast.success('Plan updated')
    },
    onError: (error: any) => {
      const message = getErrorMessage(error, 'Failed to change billing plan')
      toast.error(message)
    },
  })
}

export default billingService
