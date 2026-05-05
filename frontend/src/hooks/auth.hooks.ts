// src/hooks/auth.hooks.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/stores/auth.store'
import { useNavigate } from '@tanstack/react-router'

// ---- Bootstrap: who am I? ----
export const useMeQuery = () => {
  const { setUser, token } = useAuthStore()

  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const user = await authService.me()
      setUser(user)
      return user
    },
    enabled: !!token,             // only runs if token exists
    retry: false,
    staleTime: 5 * 60 * 1000,    // 5 min
    throwOnError: false,
  })
}

// ---- Login ----
export const useLoginMutation = () => {
  const { setUser, setAuth } = useAuthStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) =>
      authService.login(username, password),

    onSuccess: (data) => {
      if (data.requires_2fa) return // caller handles 2FA redirect

      setAuth(data.user!, data.access_token!)
      setUser(data.user!)
      queryClient.invalidateQueries({ queryKey: ['auth'] })
    },
  })
}

// ---- 2FA Verify ----
export const useVerify2FAMutation = () => {
  const { updateToken, setUser } = useAuthStore()

  return useMutation({
    mutationFn: ({ tempToken, code }: { tempToken: string; code: string }) =>
      authService.verifyTwoFactor(tempToken, code),

    onSuccess: (data) => {
      updateToken(data.access_token)
      setUser(data.user)
    },
  })
}

// ---- 2FA Setup ----
export const useSetup2FAMutation = () => {
  return useMutation({
    mutationFn: () => authService.setupTwoFactor(),
  })
}

// ---- 2FA Enable ----
export const useEnable2FAMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (code: string) => authService.enableTwoFactor(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
    },
  })
}

// ---- 2FA Disable ----
export const useDisable2FAMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (code: string) => authService.disableTwoFactor(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
    },
  })
}

// ---- Logout ----
export const useLogoutMutation = () => {
  const { clearAuth } = useAuthStore()
  const queryClient = useQueryClient()
    const navigate = useNavigate()
  

  return useMutation({
    mutationFn: authService.logout,
    onSettled: () => {
      clearAuth()                              // clear zustand + localStorage
      queryClient.clear()                   // wipe all cached queries
      navigate({
        to: '/login',
        replace: true,
      })
    },
  })
}