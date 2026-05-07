import { useQuery } from '@tanstack/react-query'
import storageService from '@/services/storage.service'

const STORAGE_QUERY_KEY = ['storage']

export function useTenantsStorage() {
  return useQuery({
    queryKey: STORAGE_QUERY_KEY,
    queryFn: () => storageService.listTenants(),
  })
}

export function useStorageStats() {
  return useQuery({
    queryKey: [...STORAGE_QUERY_KEY, 'stats'],
    queryFn: () => storageService.stats(),
  })
}

export default storageService
