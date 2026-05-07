import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUpdatePlan } from '@/hooks/plan.hooks'
import { useForm } from 'react-hook-form'
import { Form } from '@/components/ui/form'

interface EditPlanFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  plan: any | null
}

type FormValues = {
  code: string
  name: string
  price: number
  annual_price?: number
  currency: string
  max_churches: number
  max_members: number
}

export function EditPlanForm({ open, onOpenChange, plan }: EditPlanFormProps) {
  const updatePlan = useUpdatePlan()

  const form = useForm<FormValues>({
    defaultValues: {
      code: '',
      name: '',
      price: 0,
      annual_price: 0,
      currency: 'EUR',
      max_churches: 1,
      max_members: 10,
    },
  })

  const { register, handleSubmit, reset, formState } = form

  useEffect(() => {
    if (plan) {
      reset({
        code: plan.code || '',
        name: plan.name || '',
        price: Number(plan.price) || 0,
        annual_price: Number(plan.annual_price) || 0,
        currency: plan.currency || 'EUR',
        max_churches: plan.max_churches || 1,
        max_members: plan.max_members || 0,
      })
    }
  }, [plan, reset])

  const onSubmit = async (values: FormValues) => {
    if (!plan) return
    try {
      await updatePlan.mutateAsync({ planId: plan.id, payload: values })
      onOpenChange(false)
    } catch (e) {
      // handled by hook
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Modifier le plan</SheetTitle>
          <SheetDescription>Mettre à jour les informations du plan</SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="flex-1 space-y-4 px-4 overflow-y-auto">
            <div>
              <Label>Code</Label>
              <Input {...register('code', { required: true })} />
            </div>
            <div>
              <Label>Nom</Label>
              <Input {...register('name', { required: true })} />
            </div>
            <div>
              <Label>Prix mensuel</Label>
              <Input type="number" step="0.01" {...register('price', { valueAsNumber: true })} />
            </div>
            <div>
              <Label>Prix annuel (optionnel)</Label>
              <Input type="number" step="0.01" {...register('annual_price', { valueAsNumber: true })} />
            </div>
            <div>
              <Label>Devise</Label>
              <Input {...register('currency')} />
            </div>
            <div>
              <Label>Max églises</Label>
              <Input type="number" {...register('max_churches', { valueAsNumber: true })} />
            </div>
            <div>
              <Label>Max membres</Label>
              <Input type="number" {...register('max_members', { valueAsNumber: true })} />
            </div>

            <SheetFooter>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">Annuler</Button>
                <Button type="submit" className="flex-1" disabled={updatePlan.isPending || formState.isSubmitting}>
                  {updatePlan.isPending || formState.isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </div>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}

export default EditPlanForm
