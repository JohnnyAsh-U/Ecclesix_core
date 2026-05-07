import { useState, useMemo } from 'react'
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
import { Eye, Clock, HardDrive, Loader2, Trash2, Download, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { Main } from '@/components/layout/main'
import { useListTenantBackups, useBackupTenant, useDeleteBackup, useRestoreBackup, useDownloadBackup } from '@/hooks/backup.hooks'

export default function Backups() {
  const { data: tenants = [], isLoading } = useListTenantBackups()
  const backupTenantMutation = useBackupTenant()
  const deleteMutation = useDeleteBackup()
  const restoreMutation = useRestoreBackup()
  const downloadMutation = useDownloadBackup()

  const [selected, setSelected] = useState<any | null>(null)
  const [viewOpen, setViewOpen] = useState(false)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [backupNowOpen, setBackupNowOpen] = useState(false)
  const [backupTime, setBackupTime] = useState('02:00')
  const [isScheduleLoading, setIsScheduleLoading] = useState(false)

  // Get last 10 backups for selected tenant (from tenants data)
  const selectedTenantBackups = useMemo(() => {
    if (!selected) return []
    // In a real implementation, this would be filtered from actual backup history
    // For now, we'll show a placeholder
    return []
  }, [selected])

  const handleViewBackups = (tenant: any) => {
    setSelected(tenant)
    setViewOpen(true)
  }

  const handleScheduleBackup = (tenant: any) => {
    setSelected(tenant)
    setScheduleOpen(true)
  }

  const handleBackupNow = (tenant: any) => {
    setSelected(tenant)
    setBackupNowOpen(true)
  }

  const handleDeleteBackup = async (backupId: string) => {
    await deleteMutation.mutateAsync(backupId)
  }

  const handleDownloadBackup = async (backupId: string) => {
    await downloadMutation.mutateAsync(backupId)
  }

  const handleRestoreBackup = async (backupId: string) => {
    await restoreMutation.mutateAsync(backupId)
  }

  const confirmSchedule = async () => {
    setIsScheduleLoading(true)
    try {
      // TODO: Implement schedule backup endpoint
      await new Promise(resolve => setTimeout(resolve, 1500))
      toast.success(`Backup schedule updated to ${backupTime} daily`)
      setScheduleOpen(false)
      setSelected(null)
    } catch (err) {
      toast.error('Failed to update schedule')
    } finally {
      setIsScheduleLoading(false)
    }
  }

  const confirmBackupNow = async () => {
    if (!selected?.tenant_name) {
      toast.error('Missing tenant name')
      return
    }
    try {
      await backupTenantMutation.mutateAsync(selected.tenant_name)
      setBackupNowOpen(false)
      setSelected(null)
    } catch (err) {
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
      <div>
        <h1 className='text-2xl font-bold tracking-tight'>Sauvegardes</h1>
        <p className='text-muted-foreground'>
          Gestion des <b>sauvegardes</b> des données des églises
        </p>
      </div>

      <div className='border rounded-lg overflow-hidden mt-4'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Église</TableHead>
              <TableHead>Prochaine sauvegarde</TableHead>
              <TableHead>Dernière sauvegarde</TableHead>
              <TableHead>Taille</TableHead>
              <TableHead className='text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.map((tenant) => (
              <TableRow key={tenant.tenant_id}>
                <TableCell className='font-medium'>{tenant.tenant_name}</TableCell>
                <TableCell>{tenant.next_schedule ? new Date(tenant.next_schedule).toLocaleString() : '-'}</TableCell>
                <TableCell>{tenant.last_backup ? new Date(tenant.last_backup).toLocaleString() : '-'}</TableCell>
                <TableCell>
                  <div className='flex items-center gap-2'>
                    <HardDrive className='h-4 w-4 text-muted-foreground' />
                    {(tenant.size_bytes / (1024 * 1024 * 1024)).toFixed(2)} GB
                  </div>
                </TableCell>
                <TableCell className='text-right'>
                  <div className='flex justify-end gap-2'>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => handleViewBackups(tenant)}
                    >
                      <Eye className='h-4 w-4 mr-1' />
                      Voir
                    </Button>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => handleScheduleBackup(tenant)}
                    >
                      <Clock className='h-4 w-4 mr-1' />
                    </Button>
                    <Button
                      size='sm'
                      onClick={() => handleBackupNow(tenant)}
                      disabled={backupTenantMutation.isPending}
                    >
                      {backupTenantMutation.isPending ? (
                        <>
                          <Loader2 className='h-4 w-4 mr-1 animate-spin' />
                          En cours...
                        </>
                      ) : (
                        'Maintenant'
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

          <div className='mt-4'>
            {selectedTenantBackups.length === 0 ? (
              <div className='p-8 text-center text-muted-foreground'>
                Aucune sauvegarde trouvée
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Taille</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedTenantBackups.map((backup) => (
                    <TableRow key={backup.id}>
                      <TableCell className='font-medium'>{backup.name}</TableCell>
                      <TableCell>{new Date(backup.date).toLocaleString()}</TableCell>
                      <TableCell>{backup.size_gb} GB</TableCell>
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
                          <Button
                            size='sm'
                            variant='ghost'
                            onClick={() => handleRestoreBackup(backup.id)}
                            disabled={restoreMutation.isPending}
                            title='Restore'
                          >
                            <RotateCcw className='h-4 w-4' />
                          </Button>
                          <Button
                            size='sm'
                            variant='ghost'
                            onClick={() => handleDeleteBackup(backup.id)}
                            disabled={deleteMutation.isPending}
                            title='Delete'
                          >
                            <Trash2 className='h-4 w-4 text-destructive' />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setViewOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Set Backup Schedule Dialog */}
      <Dialog
        open={scheduleOpen}
        onOpenChange={(v) => {
          setScheduleOpen(v)
          if (!v) setSelected(null)
        }}
      >
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Définir la sauvegarde planifiée — {selected?.tenant_name}</DialogTitle>
          </DialogHeader>

          <div className='mt-4 space-y-4'>
            <div>
              <label className='text-sm font-medium'>Heure de sauvegarde quotidienne</label>
              <p className='text-sm text-muted-foreground mt-1 mb-3'>
                Sélectionnez l'heure à laquelle la sauvegarde doit être effectuée chaque jour
              </p>
              <input
                type='time'
                value={backupTime}
                onChange={(e) => setBackupTime(e.target.value)}
                className='w-full px-3 py-2 border border-input rounded-md text-sm'
              />
            </div>

            <div className='rounded-lg bg-muted p-3'>
              <p className='text-sm'>
                <strong>Prochaine sauvegarde:</strong> Aujourd'hui à {backupTime}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setScheduleOpen(false)}
              disabled={isScheduleLoading}
            >
              Annuler
            </Button>
            <Button onClick={confirmSchedule} disabled={isScheduleLoading}>
              {isScheduleLoading ? (
                <>
                  <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                  En cours...
                </>
              ) : (
                'Enregistrer'
              )}
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