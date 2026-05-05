/**
 * Custom Hooks for Control Plane
 * Reusable hooks for data fetching, state management, and common logic
 */

import { useCallback, useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiService } from '@/services/api'

// ========================================================================
// TABLE HOOKS
// ========================================================================

export interface UsePaginationOptions {
  initialPage?: number
  initialPageSize?: number
}

export function usePagination(options: UsePaginationOptions = {}) {
  const { initialPage = 1, initialPageSize = 20 } = options
  const [page, setPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialPageSize)

  const goToPage = useCallback((p: number) => setPage(Math.max(1, p)), [])
  const nextPage = useCallback(() => setPage((p) => p + 1), [])
  const prevPage = useCallback(() => setPage((p) => Math.max(1, p - 1)), [])

  return {
    page,
    pageSize,
    setPage: goToPage,
    nextPage,
    prevPage,
    setPageSize,
  }
}

export interface UseTableStateOptions {
  defaultSortColumn?: string
  defaultSortDirection?: 'asc' | 'desc'
}

export function useTableState(options: UseTableStateOptions = {}) {
  const { defaultSortColumn = '', defaultSortDirection = 'desc' } = options
  const [search, setSearch] = useState('')
  const [sortColumn, setSortColumn] = useState(defaultSortColumn)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(
    defaultSortDirection
  )

  const handleSort = useCallback((column: string) => {
    setSortColumn((prev) => (prev === column ? prev : column))
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
  }, [])

  return {
    search,
    setSearch,
    sortColumn,
    sortDirection,
    handleSort,
  }
}

// ========================================================================
// DATA FETCHING HOOKS
// ========================================================================

export function useTenants(
  page: number = 1,
  pageSize: number = 20,
  search?: string,
  status?: string
) {
  return useQuery({
    queryKey: ['tenants', page, pageSize, search, status],
    queryFn: () => apiService.getTenants(page, pageSize, search, status),
  })
}

export function useTenantDetail(tenantId: string | null) {
  return useQuery({
    queryKey: ['tenant', tenantId],
    queryFn: () => (tenantId ? apiService.getTenantById(tenantId) : null),
    enabled: !!tenantId,
  })
}

export function useSubscriptions(page: number = 1, pageSize: number = 20) {
  return useQuery({
    queryKey: ['subscriptions', page, pageSize],
    queryFn: () => apiService.getSubscriptions(page, pageSize),
  })
}

export function useInvoices(page: number = 1, pageSize: number = 20, status?: string) {
  return useQuery({
    queryKey: ['invoices', page, pageSize, status],
    queryFn: () => apiService.getInvoices(page, pageSize, status),
  })
}

export function useBackups(
  tenantId?: string,
  page: number = 1,
  pageSize: number = 20
) {
  return useQuery({
    queryKey: ['backups', tenantId, page, pageSize],
    queryFn: () => apiService.getBackups(tenantId, page, pageSize),
  })
}

export function useEmails(
  inbox?: string,
  status?: string,
  page: number = 1,
  pageSize: number = 20
) {
  return useQuery({
    queryKey: ['emails', inbox, status, page, pageSize],
    queryFn: () => apiService.getEmails(inbox, status, page, pageSize),
  })
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => apiService.getAdminUsers(),
  })
}

export function useAuditLogs(page: number = 1, pageSize: number = 20, filters?: Record<string, any>) {
  return useQuery({
    queryKey: ['auditLogs', page, pageSize, filters],
    queryFn: () => apiService.getAuditLogs(page, pageSize, filters),
  })
}

export function useSystemMetrics() {
  return useQuery({
    queryKey: ['systemMetrics'],
    queryFn: () => apiService.getSystemMetrics(),
    refetchInterval: 30000, // Refresh every 30 seconds
  })
}

export function useBusinessMetrics() {
  return useQuery({
    queryKey: ['businessMetrics'],
    queryFn: () => apiService.getBusinessMetrics(),
    refetchInterval: 60000, // Refresh every 60 seconds
  })
}

export function useRevenueData() {
  return useQuery({
    queryKey: ['revenueData'],
    queryFn: () => apiService.getRevenueData(),
  })
}

export function useActivityFeed(page: number = 1, pageSize: number = 10) {
  return useQuery({
    queryKey: ['activityFeed', page, pageSize],
    queryFn: () => apiService.getActivityFeed(page, pageSize),
  })
}

export function useCoupons(page: number = 1, pageSize: number = 20) {
  return useQuery({
    queryKey: ['coupons', page, pageSize],
    queryFn: () => apiService.getCoupons(page, pageSize),
  })
}

export function usePlans() {
  return useQuery({
    queryKey: ['plans'],
    queryFn: () => apiService.getPlans(),
  })
}

export function useAutomationRules(page: number = 1, pageSize: number = 20) {
  return useQuery({
    queryKey: ['automationRules', page, pageSize],
    queryFn: () => apiService.getAutomationRules(page, pageSize),
  })
}

export function useRuleExecutions(ruleId: string, page: number = 1, pageSize: number = 20) {
  return useQuery({
    queryKey: ['ruleExecutions', ruleId, page, pageSize],
    queryFn: () => apiService.getRuleExecutions(ruleId, page, pageSize),
  })
}

// ========================================================================
// MUTATION HOOKS
// ========================================================================

export function useUpdateTenantStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (args: { tenantId: string; status: string; reason?: string }) =>
      apiService.updateTenantStatus(args.tenantId, args.status, args.reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
    },
  })
}

export function useImpersonateTenant() {
  return useMutation({
    mutationFn: (tenantId: string) => apiService.impersonateTenant(tenantId),
  })
}

export function useChangeTenantPlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (args: { tenantId: string; newPlan: string }) =>
      apiService.changeTenantPlan(args.tenantId, args.newPlan),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
    },
  })
}

export function useDeleteTenant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (tenantId: string) => apiService.deleteTenant(tenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
    },
  })
}

export function useCreateBackup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (tenantId: string) => apiService.createBackup(tenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backups'] })
    },
  })
}

export function useRestoreBackup() {
  return useMutation({
    mutationFn: (backupId: string) => apiService.restoreBackup(backupId),
  })
}

export function useAssignEmail() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (args: { emailId: string; operatorId: string }) =>
      apiService.assignEmail(args.emailId, args.operatorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] })
    },
  })
}

export function useResolveEmail() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (emailId: string) => apiService.resolveEmail(emailId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] })
    },
  })
}

export function useMarkInvoicePaid() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (invoiceId: string) => apiService.markInvoicePaid(invoiceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
  })
}

export function useIssueRefund() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (args: { invoiceId: string; amount: number }) =>
      apiService.issueRefund(args.invoiceId, args.amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
  })
}

export function useUpdateAdminRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (args: { adminId: string; newRole: string }) =>
      apiService.updateAdminRole(args.adminId, args.newRole),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] })
    },
  })
}

export function useCreateAutomationRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (rule: any) => apiService.createAutomationRule(rule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automationRules'] })
    },
  })
}

export function useUpdateAutomationRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (args: { ruleId: string; updates: any }) =>
      apiService.updateAutomationRule(args.ruleId, args.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automationRules'] })
    },
  })
}

export function useToggleAutomationRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (args: { ruleId: string; isActive: boolean }) =>
      apiService.toggleAutomationRule(args.ruleId, args.isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automationRules'] })
    },
  })
}

// ========================================================================
// UTILITY HOOKS
// ========================================================================

export function useURLPagination() {
  // Simple URL pagination without complex router integration
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const goToPage = useCallback((p: number) => {
    setPage(Math.max(1, p))
  }, [])

  return { page, pageSize, goToPage, setPage, setPageSize }
}

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  })

  const setValue = useCallback(
    (value: T) => {
      try {
        setStoredValue(value)
        window.localStorage.setItem(key, JSON.stringify(value))
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error)
      }
    },
    [key]
  )

  return [storedValue, setValue]
}
