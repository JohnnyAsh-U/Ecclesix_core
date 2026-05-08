import api from '@/config/api'
import { UserActivateUrl, UserDeactivateUrl, UserDeleteUrl, UserUpdateUrl, UserUrl } from '@/utils/constant'

export interface UserSchema {
  id: string
  username: string
  email: string
  phone?: string
  role: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateUserSchema {
  username: string
  email: string
  phone: string
}

export interface UpdateUserSchema {
  username?: string
  email?: string
  phone?: string
}

export const userService = {
  listUsers: () => api.get<UserSchema[]>(UserUrl),

  createUser: (payload: CreateUserSchema) =>
    api.post<UserSchema>(UserUrl, payload),

  deleteUser: (userId: string) =>
    api.delete<void>(UserDeleteUrl(userId)),

  deactivateUser: (userId: string) =>
    api.post<UserSchema>(UserDeactivateUrl(userId)),

  reactivateUser: (userId: string) =>
    api.post<UserSchema>(UserActivateUrl(userId)),

  updateUser: (userId: string, payload: UpdateUserSchema) =>
    api.put<UserSchema>(UserUpdateUrl(userId), payload),
}
