import { Main } from '@/components/layout/main'
import { Button } from '@/components/ui/button'
import type { Tenant } from '@/types'
import { useState } from 'react'
import { TenantsTable } from './components/tenants-table'
import { CreateTenantForm } from './components/create-tenant-form'
import { EditTenantForm, type EditTenantPayload } from './components/edit-tenant-form'
import { useTenantsList, useUpdateTenant } from '@/hooks/tenant.hooks'
import { Loader2 } from 'lucide-react'

type Props = {}

export default function Tenants({ }: Props) {
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false)
  const [editDrawerOpen, setEditDrawerOpen] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)

  const { data: tenants = [], isLoading } = useTenantsList()
  const updateTenantMutation = useUpdateTenant()

  const handleOpenCreateDrawer = () => {
    setCreateDrawerOpen(true)
  }

  const handleEditTenant = (tenant: Tenant) => {
    setSelectedTenant(tenant)
    setEditDrawerOpen(true)
  }

  const handleUpdateTenant = async (data: EditTenantPayload) => {
    await updateTenantMutation.mutateAsync(data)
  }

  return (
    <Main>
      <div className='flex flex-wrap items-end justify-between gap-2 mb-4'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Clients</h2>
          <p className='text-muted-foreground'>
            Gestion des Clients
          </p>
        </div>
        <div className='flex items-center space-x-2'>
          <Button onClick={handleOpenCreateDrawer}>Ajouter Client</Button>
        </div>
      </div>

      {isLoading ? (
        <div className='flex items-center justify-center h-64'>
          <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
        </div>
      ) : (
        <TenantsTable
          tenants={tenants}
          isLoading={isLoading}
          onEdit={handleEditTenant}
        />
      )}

      {/* Create Tenant Drawer */}
      <CreateTenantForm
        open={createDrawerOpen}
        onOpenChange={setCreateDrawerOpen}
      />

      {/* Edit Tenant Drawer */}
      <EditTenantForm
        open={editDrawerOpen}
        onOpenChange={setEditDrawerOpen}
        tenant={selectedTenant}
        onSubmit={handleUpdateTenant}
        isLoading={updateTenantMutation.isPending}
      />
    </Main>
  )
}