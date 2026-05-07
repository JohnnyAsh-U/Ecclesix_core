// import { useState, useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { tenantService, type CreateTenantPayload } from '@/services/tenant.service'
// import type { Tenant } from '@/types'
import { toast } from 'sonner'

const TENANTS_QUERY_KEY = ['tenants']

export function useTenantsList() {
  return useQuery({
    queryKey: TENANTS_QUERY_KEY,
    queryFn: () => tenantService.listTenants(),
  })
}

export function useTenantDetail(tenantId: number) {
  return useQuery({
    queryKey: ['tenant', tenantId],
    queryFn: () => tenantService.getTenantDetail(tenantId),
    enabled: !!tenantId,
  })
}

export function useCreateTenant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateTenantPayload) =>
      tenantService.createTenant(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: TENANTS_QUERY_KEY })
      toast.success(`Tenant ${data.church_name} created successfully`)
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.detail || 'Failed to create tenant'
      toast.error(message)
    },
  })
}

export function useActivateTenant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (tenantId: number) => tenantService.activateTenant(tenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TENANTS_QUERY_KEY })
      toast.success('Tenant activated')
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || 'Failed to activate'
      toast.error(message)
    },
  })
}

export function useDeactivateTenant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (tenantId: number) =>
      tenantService.deactivateTenant(tenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TENANTS_QUERY_KEY })
      toast.success('Tenant deactivated')
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || 'Failed to deactivate'
      toast.error(message)
    },
  })
}

export function useUpdateDomain() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ tenantId, domain }: { tenantId: number; domain: string }) =>
      tenantService.updateDomain(tenantId, domain),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TENANTS_QUERY_KEY })
      toast.success('Domain added successfully')
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || 'Failed to add domain'
      toast.error(message)
    },
  })
}

// useGetStorage
export function useGetStorage(tenantId?: number){
  return useQuery({
    queryKey: ['tenant', tenantId],
    queryFn: () => tenantService.getStorage(tenantId as number),
    enabled: !!tenantId,
  })
}

export function useUpdateStorage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      tenantId,
      quota_bytes,
    }: {
      tenantId: number
      quota_bytes: number
    }) => tenantService.updateStorage(tenantId, quota_bytes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TENANTS_QUERY_KEY })
      toast.success('Storage quota updated')
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.detail || 'Failed to update storage'
      toast.error(message)
    },
  })
}

export function useUpdateTenant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: any) =>
      tenantService.updateTenant(payload.id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: TENANTS_QUERY_KEY })
      toast.success(`Tenant ${data.church_name} updated successfully`)
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.detail || 'Failed to update tenant'
      toast.error(message)
    },
  })
}
