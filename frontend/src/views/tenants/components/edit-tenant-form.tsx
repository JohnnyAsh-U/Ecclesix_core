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
import { Checkbox } from '@/components/ui/checkbox'
import { useForm, Controller } from 'react-hook-form'
import type { Tenant } from '@/types'
import { Form } from '@/components/ui/form'

interface EditTenantFormProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    tenant: Tenant | null
    onSubmit: (data: EditTenantPayload) => Promise<void>
    isLoading?: boolean
}

export interface EditTenantPayload {
    id: number
    name: string
    church_name: string
    phone: string
    email: string
    custom_logo: boolean
}

export function EditTenantForm({
    open,
    onOpenChange,
    tenant,
    onSubmit,
    isLoading = false,
}: EditTenantFormProps) {
    type FormValues = Omit<EditTenantPayload, 'id'>

    const form = useForm<FormValues>({
        defaultValues: {
            name: '',
            church_name: '',
            phone: '',
            email: '',
            custom_logo: false,
        },
    })
    const { register, handleSubmit, reset, control, formState } = form
    useEffect(() => {
        if (tenant) {
            reset({
                name: tenant.name || '',
                church_name: tenant.church_name || '',
                phone: tenant.phone || '',
                email: tenant.email || '',
                custom_logo: tenant.custom_logo || false,
            })
        } else {
            reset({ name: '', church_name: '', phone: '', email: '', custom_logo: false })
        }
    }, [tenant, open, reset])

    const onFormSubmit = async (values: FormValues) => {
        if (!tenant) return
        try {
            await onSubmit({ id: tenant.id, ...values })
            onOpenChange(false)
        } catch (error) {
            console.error('Failed to update tenant:', error)
        }
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className='flex flex-col'>
                <SheetHeader className='text-start'>
                    <SheetTitle>Éditer le client</SheetTitle>
                    <SheetDescription>
                        Mettez à jour les informations du client
                    </SheetDescription>
                </SheetHeader>
                <Form {...form}>

                    <form onSubmit={handleSubmit(onFormSubmit)} className='flex-1 space-y-6 overflow-y-auto px-4'>
                        <div className='space-y-2'>
                            <Label htmlFor='name'>Nom</Label>
                            <Input id='name' placeholder='Nom du client' {...register('name')} required />
                        </div>

                        <div className='space-y-2'>
                            <Label htmlFor='church_name'>Nom de l\'église</Label>
                            <Input id='church_name' placeholder="Nom de l\'église" {...register('church_name')} required />
                        </div>

                        <div className='space-y-2'>
                            <Label htmlFor='email'>Email</Label>
                            <Input id='email' type='email' placeholder='contact@exemple.com' {...register('email')} required />
                        </div>

                        <div className='space-y-2'>
                            <Label htmlFor='phone'>Téléphone</Label>
                            <Input id='phone' type='tel' placeholder='+33 1 23 45 67 89' {...register('phone')} />
                        </div>

                        <div className='flex items-center space-x-2'>
                            <Controller
                                control={control}
                                name='custom_logo'
                                render={({ field }) => (
                                    <>
                                        <Checkbox id='custom_logo' checked={field.value} onCheckedChange={(v) => field.onChange(Boolean(v))} />
                                    </>
                                )}
                            />
                            <Label htmlFor='custom_logo' className='font-normal cursor-pointer'>
                                Logo personnalisé
                            </Label>
                        </div>

                        <SheetFooter>
                            <div className='flex gap-2 pt-4'>
                                <Button type='button' variant='outline' onClick={() => onOpenChange(false)} className='flex-1'>
                                    Annuler
                                </Button>
                                <Button type='submit' disabled={isLoading || formState.isSubmitting} className='flex-1'>
                                    {isLoading || formState.isSubmitting ? 'Mise à jour...' : 'Mettre à jour'}
                                </Button>
                            </div>
                        </SheetFooter>

                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    )
}
