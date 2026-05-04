import React from 'react'

import { useEffect, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp'
import { useVerify2FAMutation } from '@/hooks/auth.hooks'

const formSchema = z.object({
  code: z
    .string()
    .min(6, 'Please enter the 6-digit code')
    .max(8, 'Code must be at most 8 characters'),
})

interface Verify2FAFormProps extends React.HTMLAttributes<HTMLFormElement> {
  tempToken: string
  redirectTo?: string
}

export function Verify2FAForm({
  tempToken,
  redirectTo,
  ...props
}: Verify2FAFormProps) {
  const navigate = useNavigate()
  const verify2FAMutation = useVerify2FAMutation()
  const [timer, setTimer] = useState(300) // 5 minutes

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: '',
    },
  })

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          toast.error('Session expired, please login again')
          navigate({ to: '/login', replace: true })
          return 0
        }
        return prev - 1
      })
    }, 2000)

    return () => clearInterval(interval)
  }, [navigate])

  async function onSubmit(data: z.infer<typeof formSchema>) {
    try {
      await verify2FAMutation.mutateAsync({
        tempToken,
        code: data.code,
      })

      toast.success('Two-factor authentication verified')
      navigate({
        to: redirectTo || '/_authenticated/',
        replace: true,
      })
    } catch (error: any) {
      const errorMessage = error?.response?.data?.detail || '2FA verification failed'
      toast.error(errorMessage)
      form.reset()
    }
  }

  const minutes = Math.floor(timer / 60)
  const seconds = timer % 60

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('grid gap-4')}
        {...props}
      >
        <FormField
          control={form.control}
          name='code'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Verification Code</FormLabel>
              <FormControl>
                <InputOTP maxLength={6} {...field}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </FormControl>
              <FormMessage />
              <p className='text-xs text-muted-foreground mt-2'>
                Enter the 6-digit code from your authenticator app
              </p>
            </FormItem>
          )}
        />

        <div className='text-center text-sm text-muted-foreground'>
          Code expires in {minutes}:{seconds.toString().padStart(2, '0')}
        </div>

        <Button disabled={verify2FAMutation.isPending}>
          {verify2FAMutation.isPending && (
            <Loader2 className='animate-spin' />
          )}
          Verify
        </Button>
      </form>
    </Form>
  )
}
