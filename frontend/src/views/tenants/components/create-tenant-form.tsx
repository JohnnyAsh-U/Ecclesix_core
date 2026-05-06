import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCreateTenant } from '@/hooks/tenant.hooks'
import { usePlansList } from '@/hooks/plan.hooks'
import type { CreateTenantPayload } from '@/services/tenant.service'
import { useForm, Controller } from 'react-hook-form'
import { Form } from '@/components/ui/form'

interface CreateTenantFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateTenantForm({
  open,
  onOpenChange,
}: CreateTenantFormProps) {
  type FormValues = CreateTenantPayload & { plan: string }

  const { data: plans = [] } = usePlansList()

  const form = useForm<FormValues>({
    defaultValues: {
      name: '',
      church_name: '',
      domain: '',
      superadmin_email: '',
      schema_name: '',
      plan: '',
      billing_cycle: 'monthly',
      email: '',
      phone: '',
    },
  })

  const { control, register, handleSubmit, reset, formState } = form

  const createMutation = useCreateTenant()

  useEffect(() => {
    if (!open) {
      reset()
    }
  }, [open, reset])

  const onFormSubmit = async (values: FormValues) => {
    const payload = {
      ...values,
      schema_name: values.schema_name || values.domain.replace(/\./g, '_').toLowerCase(),
      plan: values.plan,
    }

    try {
      await createMutation.mutateAsync(payload)
      reset()
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to create tenant:', error)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex flex-col'>
        <SheetHeader className='text-start'>
          <SheetTitle>Ajouter un nouveau client</SheetTitle>
          <SheetDescription>
            Remplissez les informations pour créer un nouveau client
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
        <form onSubmit={handleSubmit(onFormSubmit)} className='flex-1 space-y-6 overflow-y-auto px-4'>
          <div className='space-y-2'>
            <Label htmlFor='name'>Nom</Label>
            <Input id='name' {...register('name')} placeholder='Nom du client' required />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='church_name'>Nom de l\'église</Label>
            <Input id='church_name' {...register('church_name')} placeholder="Nom de l\'église" required />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='domain'>Domaine</Label>
            <Input id='domain' {...register('domain')} type='text' placeholder='exemple.com' required />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='superadmin_email'>Email du Super Admin</Label>
            <Input id='superadmin_email' {...register('superadmin_email')} type='email' placeholder='admin@exemple.com' required />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='email'>Email</Label>
            <Input id='email' {...register('email')} type='email' placeholder='contact@exemple.com' />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='phone'>Téléphone</Label>
            <Input id='phone' {...register('phone')} type='tel' placeholder='+33 1 23 45 67 89' />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='plan'>Plan</Label>
            <Controller
              control={control}
              name='plan'
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((p: any) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.name || p.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='billing_cycle'>Cycle de facturation</Label>
            <Controller
              control={control}
              name='billing_cycle'
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='monthly'>Mensuel</SelectItem>
                    <SelectItem value='annual'>Annuel</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='schema_name'>Nom du schéma (optionnel)</Label>
            <Input id='schema_name' {...register('schema_name')} placeholder='Auto-généré si vide' />
          </div>

<SheetFooter>
          <div className='flex gap-2 pt-4'>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              className='flex-1'
            >
              Annuler
            </Button>
            <Button type='submit' disabled={createMutation.isPending || formState.isSubmitting} className='flex-1'>
              {createMutation.isPending || formState.isSubmitting ? 'Création...' : 'Créer'}
            </Button>
          </div>
          </SheetFooter>
        </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
