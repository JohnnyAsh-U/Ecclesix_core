
import { useState } from 'react'
import { useMigrationsSummary, useRunTenantMigration, useTenantMigrationState } from '@/hooks/migration.hooks'
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
import {  Play, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Main } from '@/components/layout/main'

export default function Migrations() {
  const { data: tenants = [], isLoading } = useMigrationsSummary()
  const runMutation = useRunTenantMigration()
  const [selected, setSelected] = useState<any | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [runOpen, setRunOpen] = useState(false)

  const handleViewDetails = (tenant: any) => {
    setSelected(tenant)
    setDetailsOpen(true)
  }

  const handleRun = (tenant: any) => {
    // clear previous mutation result
    runMutation.reset()
    setSelected(tenant)
    setRunOpen(true)
  }

  const tenantStateQuery = useTenantMigrationState(selected?.tenant_id)

  const confirmRun = async () => {
    if (!selected?.tenant_id) {
      toast.error('Missing tenant id')
      return
    }
    try {
      await runMutation.mutateAsync(selected.tenant_id)
    } catch (err: any) {
      // error shown by hook
    }
  }

  if (isLoading) return <div className='flex items-center justify-center h-64'><Loader2 className='h-8 w-8 animate-spin text-muted-foreground' /></div>

  return (
    <Main>
        <div>
        <h1 className='text-2xl font-bold tracking-tight'>Migrations</h1>
        <p className='text-muted-foreground'>
          Gestion des Migrations de la <b>base de données</b>
        </p>
      </div>
      <div className='border rounded-lg overflow-hidden mt-4'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Schema</TableHead>
              <TableHead>Église</TableHead>
              <TableHead>Migrations</TableHead>
              <TableHead>Dernière migration</TableHead>
              <TableHead>Appliée le</TableHead>
              <TableHead className='text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.map((t: any, idx: number) => (
              <TableRow key={t.schema_name + idx}>
                <TableCell className='font-medium'>{t.schema_name}</TableCell>
                <TableCell>{t.name}</TableCell>
                <TableCell>{t.migration_count ?? '-'}</TableCell>
                <TableCell>{t.latest_migration ?? '-'}</TableCell>
                <TableCell>{t.latest_applied_at ? new Date(t.latest_applied_at).toLocaleString() : '-'}</TableCell>
                <TableCell className='text-right'>
                  <div className='flex justify-end gap-2'>
                    <Button size='sm' onClick={() => handleViewDetails(t)}>Détails</Button>
                    <Button size='sm' variant='ghost' onClick={() => handleRun(t)}>
                      <Play className='h-4 w-4' />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={(v) => { setDetailsOpen(v); if (!v) setSelected(null) }}> 
        <DialogContent className="sm:max-w-4xl w-full max-h-[70vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Détails des migrations — {selected?.schema_name}</DialogTitle>
          </DialogHeader>

          <div className='mt-4'>
            {tenantStateQuery.isLoading ? (
              <div className='flex items-center justify-center p-8'><Loader2 className='h-6 w-6 animate-spin' /></div>
            ) : tenantStateQuery.isError ? (
              <div className='p-4 text-red-600'>Erreur: {(tenantStateQuery.error as any)?.message || 'Failed to load'}</div>
            ) : (
              <div className='overflow-auto max-h-80'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>App</TableHead>
                      <TableHead>Migration</TableHead>
                      <TableHead>Appliée le</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tenantStateQuery.data?.all?.map((m: any, id: number) => (
                      <TableRow key={id}>
                        <TableCell>{m.app}</TableCell>
                        <TableCell className='font-medium'>{m.name}</TableCell>
                        <TableCell>{m.applied_at ? new Date(m.applied_at).toLocaleString() : '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setDetailsOpen(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Run Migration Dialog */}
      <Dialog open={runOpen} onOpenChange={(v) => { setRunOpen(v); if (!v) { setSelected(null); runMutation.reset(); } }}>
        <DialogContent className="sm:max-w-3xl w-full max-h-[70vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Exécuter la migration — {selected?.schema_name}</DialogTitle>
          </DialogHeader>

          <div className='mt-4'>
            {runMutation.isPending ? (
              <div className='p-8 text-center'><Loader2 className='h-6 w-6 animate-spin mx-auto' /><div className='mt-2'>Migration en cours...</div></div>
            ) : runMutation.isError ? (
              <div className='p-4 text-red-600'>Erreur: {(runMutation.error as any)?.response?.data?.error || (runMutation.error as any)?.message}</div>
            ) : runMutation.isSuccess ? (
              <div className='p-4'>
                <div><strong>Succès:</strong> {runMutation.data?.success ? 'Oui' : 'Non'}</div>
                <div className='mt-2'>
                  <strong>Sortie:</strong>
                  <pre className='mt-2 text-sm whitespace-pre-wrap'>{runMutation.data?.stdout ?? ''}</pre>
                </div>
              </div>
            ) : (
              <div className='p-4'>Êtes-vous sûr de vouloir exécuter les migrations pour <strong>{selected?.schema_name}</strong> ?</div>
            )}
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setRunOpen(false)}>{runMutation.data?.success ? 'Fermer' : 'Annuler'}</Button>
            <Button onClick={confirmRun} disabled={runMutation.isPending || runMutation.data?.success}>{runMutation.isPending ? 'En cours...' : 'Exécuter'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Main>
  )
}