import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MoreHorizontal, Loader2, CheckCircle, SquareXIcon } from 'lucide-react'
import type { Tenant } from '@/types'
import {
  useActivateTenant,
  useDeactivateTenant,
  useUpdateDomain,
  useUpdateStorage,
} from '@/hooks/tenant.hooks'
import { toast } from 'sonner'

interface TenantsTableProps {
  tenants: Tenant[]
  isLoading?: boolean
  onEdit?: (tenant: Tenant) => void
}

export function TenantsTable({ tenants, isLoading, onEdit }: TenantsTableProps) {
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [storageDialogOpen, setStorageDialogOpen] = useState(false)
  const [domainDialogOpen, setDomainDialogOpen] = useState(false)
  const [storageInput, setStorageInput] = useState('')
  const [domainInput, setDomainInput] = useState('')

  const activateMutation = useActivateTenant()
  const deactivateMutation = useDeactivateTenant()
  const updateDomainMutation = useUpdateDomain()
  const updateStorageMutation = useUpdateStorage()

  const handleStorageEdit = (tenant: Tenant) => {
    setSelectedTenant(tenant)
    setStorageInput(
      tenant.storage?.quota_bytes ? String(tenant.storage.quota_bytes) : ''
    )
    setStorageDialogOpen(true)
  }

  const handleStorageUpdate = async () => {
    if (!selectedTenant || !storageInput) return

    try {
      const bytes = parseInt(storageInput)
      if (isNaN(bytes) || bytes <= 0) {
        toast.error('Storage quota must be a positive number')
        return
      }
      await updateStorageMutation.mutateAsync({
        tenantId: selectedTenant.id,
        quota_bytes: bytes,
      })
      setStorageDialogOpen(false)
      setStorageInput('')
    } catch (error) {
      console.error('Failed to update storage:', error)
    }
  }

  const handleAddDomain = (tenant: Tenant) => {
    setSelectedTenant(tenant)
    setDomainInput('')
    setDomainDialogOpen(true)
  }

  const handleDomainSubmit = async () => {
    if (!selectedTenant || !domainInput) return

    try {
      await updateDomainMutation.mutateAsync({
        tenantId: selectedTenant.id,
        domain: domainInput.toLowerCase().trim(),
      })
      setDomainDialogOpen(false)
      setDomainInput('')
    } catch (error) {
      console.error('Failed to update domain:', error)
    }
  }

  const handleActivate = async (tenant: Tenant) => {
    try {
      await activateMutation.mutateAsync(tenant.id)
    } catch (error) {
      console.error('Failed to activate:', error)
    }
  }

  const handleDeactivate = async (tenant: Tenant) => {
    try {
      await deactivateMutation.mutateAsync(tenant.id)
    } catch (error) {
      console.error('Failed to deactivate:', error)
    }
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  if (isLoading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
      </div>
    )
  }

  if (tenants.length === 0) {
    return (
      <div className='border rounded-lg p-8 text-center'>
        <p className='text-muted-foreground'>Aucun client trouvé</p>
      </div>
    )
  }

  console.log(tenants)

  return (
    <>
      <div className='border rounded-lg overflow-hidden'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom de l'église</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Domaines</TableHead>
              <TableHead>Stockage</TableHead>
              <TableHead>Eglises</TableHead>
              <TableHead>Membres</TableHead>
              <TableHead>Logo</TableHead>
              <TableHead className='text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.map((tenant) => (
              <TableRow key={tenant.id}>
                <TableCell className='font-medium'>
                  {tenant.church_name}
                </TableCell>
                <TableCell>{tenant.plan || 'N/A'}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      tenant.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {tenant.is_active ? 'Actif' : 'Inactif'}
                  </span>
                </TableCell>
                <TableCell>
                  <div className='text-sm'>
                    {tenant.domains.slice(0, 2).map((d) => (
                      <div key={d} className='text-muted-foreground'>
                        {d}
                      </div>
                    ))}
                    {tenant.domains.length > 2 && (
                      <div className='text-muted-foreground text-xs'>
                        +{tenant.domains.length - 2} more
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {tenant.storage ? (
                    <div className='text-sm'>
                      <div>
                        {formatBytes(tenant.storage.used_bytes)} /{' '}
                        {formatBytes(tenant.storage.quota_bytes)}
                      </div>
                      <div className='text-muted-foreground'>
                        {tenant.storage.percent.toFixed(1)}%
                      </div>
                    </div>
                  ) : (
                    'N/A'
                  )}
                </TableCell>
                <TableCell>{tenant.church_count}</TableCell>
                <TableCell>{tenant.member_count}</TableCell>
                <TableCell>
                  {tenant.custom_logo ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <SquareXIcon className="h-5 w-5 text-red-600" />
                  )}
                </TableCell>
                <TableCell className='text-right'>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant='ghost' size='icon'>
                        <MoreHorizontal className='h-4 w-4' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end' className='w-56'>
                      <DropdownMenuItem onClick={() => onEdit?.(tenant)}>
                        Éditer
                      </DropdownMenuItem>
                      {tenant.is_active ? (
                        <DropdownMenuItem
                          onClick={() => handleDeactivate(tenant)}
                          disabled={deactivateMutation.isPending}
                        >
                          Désactiver
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() => handleActivate(tenant)}
                          disabled={activateMutation.isPending}
                        >
                          Activer
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleAddDomain(tenant)}>
                        Mettre à jour le domaine
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStorageEdit(tenant)}>
                        Éditer stockage
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Storage Dialog */}
      <Dialog open={storageDialogOpen} onOpenChange={setStorageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Éditer le stockage</DialogTitle>
            <DialogDescription>
              {selectedTenant?.church_name}
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='storage'>Quota de stockage (bytes)</Label>
              <Input
                id='storage'
                type='number'
                value={storageInput}
                onChange={(e) => setStorageInput(e.target.value)}
                placeholder='ex. 5368709120'
              />
              <p className='text-xs text-muted-foreground'>
                Stockage actuel: {selectedTenant?.storage ? formatBytes(selectedTenant.storage.used_bytes) : 'N/A'}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setStorageDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button
              onClick={handleStorageUpdate}
              disabled={updateStorageMutation.isPending}
            >
              {updateStorageMutation.isPending ? 'Mise à jour...' : 'Mettre à jour'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Domain Dialog */}
      <Dialog open={domainDialogOpen} onOpenChange={setDomainDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mettre à jour le domaine</DialogTitle>
            <DialogDescription>
              {selectedTenant?.church_name}
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='domain'>Domaine</Label>
              <Input
                id='domain'
                type='text'
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                placeholder='exemple.com'
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setDomainDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button
              onClick={handleDomainSubmit}
              disabled={updateDomainMutation.isPending}
            >
              {updateDomainMutation.isPending ? 'Mise à jour...' : 'Mettre à jour'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
