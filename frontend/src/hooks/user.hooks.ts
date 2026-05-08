import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { userService, type CreateUserSchema, type UpdateUserSchema } from '@/services/user.service'

export const useListUsersQuery = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await userService.listUsers()
      return response.data
    },
  })
}

export const useCreateUserMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateUserSchema) => userService.createUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export const useDeleteUserMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => userService.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export const useDeactivateUserMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => userService.deactivateUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export const useReactivateUserMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => userService.reactivateUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export const useUpdateUserMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: UpdateUserSchema }) =>
      userService.updateUser(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}
