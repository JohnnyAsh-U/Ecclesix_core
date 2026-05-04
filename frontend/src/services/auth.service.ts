// src/services/auth.service.ts
import api from '@/config/api'
import { LoginUrl, LogoutUrl, MeUrl, Setup2FAUrl, Verify2FAUrl } from '@/utils/constant'

export interface User {
  id: string
  username: string
  email: string
  // add your user fields
}

export interface LoginResponse {
  requires_2fa?: boolean
  temp_token?: string
  user?: User
  access_token?: string
  needs_2fa_setup?: boolean
  detail?: string
}

export interface Setup2FAResponse {
  secret: string
  otpauth_url: string
  detail: string
}

export interface Enable2FAResponse {
  message: string
}

export const authService = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const formData = new FormData()
    formData.append('username', username)
    formData.append('password', password)
    const { data } = await api.post(LoginUrl, formData)
    return data
  },

  verifyTwoFactor: async (tempToken: string, code: string) => {
    const { data } = await api.post(Verify2FAUrl, {
      temp_token: tempToken,
      code,
    })
    return data
  },

  setupTwoFactor: async (): Promise<Setup2FAResponse> => {
    const { data } = await api.post(Setup2FAUrl)
    return data
  },

  enableTwoFactor: async (code: string): Promise<Enable2FAResponse> => {
    const { data } = await api.post('/auth/2fa/enable', { code })
    return data
  },

  disableTwoFactor: async (code: string): Promise<Enable2FAResponse> => {
    const { data } = await api.post('/auth/2fa/disable', { code })
    return data
  },

  logout: async () => {
    await api.get(LogoutUrl)
  },

  me: async (): Promise<User> => {
    const { data } = await api.get(MeUrl)
    return data
  },
}