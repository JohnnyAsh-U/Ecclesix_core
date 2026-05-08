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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Eye, HardDrive, Loader2, Download, RotateCcw, DatabaseBackupIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Main } from '@/components/layout/main'
import { useListTenantBackups, useBackupTenant, useRestoreBackup, useDownloadBackup, useGetTenantBackups, useBackupFull, usePurgeBackups } from '@/hooks/backup.hooks'
import type { TenantBackup } from '@/services/backup.service'
import { Spinner } from '@/components/ui/spinner'

export default function Backups() {
  const { data: tenants = [], isLoading } = useListTenantBackups()
  const backupTenantMutation = useBackupTenant()
  const backupFullMutation = useBackupFull()
  // deletion removed
  const restoreMutation = useRestoreBackup()
  const downloadMutation = useDownloadBackup()

  const [selected, setSelected] = useState<TenantBackup | null>(null)
  const [viewOpen, setViewOpen] = useState(false)
  const [backupNowOpen, setBackupNowOpen] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [downloadModalOpen, setDownloadModalOpen] = useState(false)
  const { data: tenantDetails = [], isLoading: detailIsLoading } = useGetTenantBackups(selected?.tenant_schema)
  const purgeMutation = usePurgeBackups()

  const renderStatusChip = (status?: string) => {
    const s = (status || 'pending').toLowerCase()
    let classes = 'px-2 py-0.5 rounded-full text-xs font-medium '
    let label = s

    switch (s) {
      case 'running':
      case 'pending':
        classes += 'bg-yellow-100 text-yellow-800'
        break
      case 'success':
        classes += 'bg-green-100 text-green-800'
        break
      case 'failed':
        classes += 'bg-red-100 text-red-800'
        break
      default:
        classes += 'bg-gray-100 text-gray-800'
        break
    }

    // Capitalize label
    label = label.charAt(0).toUpperCase() + label.slice(1)

    return <span className={classes}>{label}</span>
  }


  const handleViewBackups = (tenant: any) => {
    setSelected(tenant)
    setViewOpen(true)
  }


  const handleBackupNow = (tenant: any) => {
    setSelected(tenant)
    setBackupNowOpen(true)
  }

  function PurgeButton() {
    return (
      <Button
        size='default'
        variant='destructive'
        onClick={async () => {
          const ok = window.confirm('Purge backups older than each tenant\'s retention? This will permanently delete files from object storage.')
          if (!ok) return
          try {
            await purgeMutation.mutateAsync()
          } catch (e) {
            // handled by hook
          }
        }}
        disabled={purgeMutation.isPending}
      >
        {purgeMutation.isPending ? 'Purge en cours...' : 'Purger les sauvegardes'}
      </Button>
    )
  }

  // deletion removed

  const handleDownloadBackup = async (backupId: string) => {
    try {
      const data = await downloadMutation.mutateAsync(backupId)
      if (data && data.url) {
        setDownloadUrl(data.url)
        setDownloadModalOpen(true)
      }
    } catch (err) {
      // error handled by mutation
    }
  }

  const handleRestoreBackup = async (backupId: string) => {
    await restoreMutation.mutateAsync(backupId)
  }


  const confirmBackupNow = async () => {
    if (!selected?.tenant_schema) {
      toast.error('Missing tenant schema')
      return
    }
    try {
      if (selected.tenant_schema == '__full__') {
        await backupFullMutation.mutateAsync()
        setBackupNowOpen(false)
        return
      } else {
        await backupTenantMutation.mutateAsync(selected.tenant_schema)
        setBackupNowOpen(false)
      }
      setSelected(null)
    } catch (err) {
      console.log('Backup error', err)
      // Error is handled by mutation hook
    }
  }

  if (isLoading) {
    return (
      <Main>
        <div className='flex items-center justify-center h-64'>
          <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
        </div>
      </Main>
    )
  }

  return (
    <Main>
          <div className='flex items-start justify-between'>
            <div>
              <h1 className='text-2xl font-bold tracking-tight'>Sauvegardes</h1>
              <p className='text-muted-foreground'>
                Gestion des <b>sauvegardes</b> des données des églises
              </p>
            </div>
            <div>
              <PurgeButton />
            </div>
          </div>

      <div className='border rounded-lg overflow-hidden mt-4'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Schema</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Dernière sauvegarde</TableHead>
              <TableHead>Taille</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.map((tenant) => (
              <TableRow key={tenant.tenant_id}>
                <TableCell className='font-medium'>{tenant.tenant_schema}</TableCell>
                <TableCell>{tenant.tenant_name}</TableCell>
                <TableCell>
                  <div className='flex items-center'>
                    {renderStatusChip(tenant.status)}
                  </div>
                </TableCell>
                <TableCell>{tenant.last_backup ? new Date(tenant.last_backup).toLocaleString() : '-'}</TableCell>
                <TableCell>
                  <div className='flex items-center gap-2'>
                    <HardDrive className='h-4 w-4 text-muted-foreground' />
                    {(tenant.size_bytes / (1024 * 1024)).toFixed(2)} MB
                  </div>
                </TableCell>
                <TableCell>
                  <div className='flex gap-2'>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => handleViewBackups(tenant)}
                    >
                      <Eye className='h-4 w-4 mr-1' />
                    </Button>

                    <Button
                      size='sm'
                      variant={'outline'}
                      onClick={() => handleBackupNow(tenant)}
                      disabled={backupTenantMutation.isPending}
                    >
                      {backupTenantMutation.isPending ? (
                        <>
                          <Loader2 className='h-4 w-4 mr-1 animate-spin' />
                          En cours...
                        </>
                      ) : (
                        <DatabaseBackupIcon />
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* View Backup History Dialog */}
      <Dialog
        open={viewOpen}
        onOpenChange={(v) => {
          setViewOpen(v)
          if (!v) {
            setSelected(null)
          }
        }}
      >
        <DialogContent className='sm:max-w-4xl w-full max-h-[70vh] overflow-auto'>
          <DialogHeader>
            <DialogTitle>Historique des sauvegardes — {selected?.tenant_name}</DialogTitle>
          </DialogHeader>

          {detailIsLoading ? <div className='flex justify-center text-center'><Spinner className='size-7' /></div> : <div className='mt-4'>
            {tenantDetails.length === 0 ? (
              <div className='p-8 text-center text-muted-foreground'>
                Aucune sauvegarde trouvée
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Taille</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenantDetails.map((backup) => (
                    <TableRow key={backup.id}>
                      <TableCell className='font-medium'>{backup.tenant_schema}</TableCell>
                      <TableCell>{renderStatusChip(backup.status)}</TableCell>
                      <TableCell>{backup.created_at ? new Date(backup.created_at).toLocaleString() : '-'}</TableCell>
                      <TableCell>{(backup.size_bytes / (1024 ** 2)).toFixed(2)} MB</TableCell>
                      <TableCell className='text-right'>
                        <div className='flex justify-end gap-2'>
                          <Button
                            size='sm'
                            variant='ghost'
                            onClick={() => handleDownloadBackup(backup.id)}
                            disabled={downloadMutation.isPending}
                            title='Download'
                          >
                            <Download className='h-4 w-4' />
                          </Button>
                          {backup.tenant_schema !== '__full__' && backup.tenant_schema !== 'public' && (
                            <Button
                              size='sm'
                              variant='ghost'
                              onClick={() => handleRestoreBackup(backup.id)}
                              disabled={restoreMutation.isPending}
                              title='Restore'
                            >
                              <RotateCcw className='h-4 w-4' />
                            </Button>
                          )}
                          {/* deletion removed */}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>}

      {/* Download URL Modal */}
      <Dialog
        open={downloadModalOpen}
        onOpenChange={(v) => {
          setDownloadModalOpen(v)
          if (!v) setDownloadUrl(null)
        }}
      >
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>Download URL</DialogTitle>
          </DialogHeader>
          <div className='mt-2'>
            <p className='text-sm text-muted-foreground mb-2'>
              Use the temporary URL below to download the backup directly from object storage. It will expire in 300 seconds.
            </p>
            <div className='flex gap-2 items-center'>
              <input
                readOnly
                value={downloadUrl ?? ''}
                className='flex-1 rounded border px-2 py-1 text-sm'
              />
              <Button
                size='sm'
                onClick={async () => {
                  if (!downloadUrl) return
                  try {
                    await navigator.clipboard.writeText(downloadUrl)
                    toast.success('Copied URL to clipboard')
                  } catch (e) {
                    toast.error('Failed to copy URL')
                  }
                }}
              >
                Copy
              </Button>
            </div>
            <p className='text-xs text-muted-foreground mt-3'>Do not share this URL. It grants temporary access to the backup file.</p>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDownloadModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

          <DialogFooter>
            <Button variant='outline' onClick={() => setViewOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Backup Now Dialog */}
      <Dialog
        open={backupNowOpen}
        onOpenChange={(v) => {
          setBackupNowOpen(v)
          if (!v) {
            setSelected(null)
          }
        }}
      >
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Sauvegarder maintenant</DialogTitle>
          </DialogHeader>

          <div className='mt-4'>
            {backupTenantMutation.isPending ? (
              <div className='p-8 text-center'>
                <Loader2 className='h-6 w-6 animate-spin mx-auto' />
                <div className='mt-2 text-sm text-muted-foreground'>
                  Création de la sauvegarde pour {selected?.tenant_name}...
                </div>
              </div>
            ) : (
              <p className='text-sm text-muted-foreground'>
                Êtes-vous sûr de vouloir créer une sauvegarde maintenant pour{' '}
                <strong>{selected?.tenant_name}</strong> ?
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setBackupNowOpen(false)}
              disabled={backupTenantMutation.isPending}
            >
              Annuler
            </Button>
            <Button onClick={confirmBackupNow} disabled={backupTenantMutation.isPending}>
              {backupTenantMutation.isPending ? 'Sauvegarde en cours...' : 'Sauvegarder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Main>
  )
}