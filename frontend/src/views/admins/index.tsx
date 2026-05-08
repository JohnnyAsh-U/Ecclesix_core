import { useState } from 'react'
import { Main } from '@/components/layout/main'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Edit2, Trash2, LogsIcon, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useListUsersQuery, useCreateUserMutation, useUpdateUserMutation, useDeleteUserMutation, useDeactivateUserMutation, useReactivateUserMutation } from '@/hooks/user.hooks'
import { useListAuditLogsQuery } from '@/hooks/audit.hooks'

interface Admin {
  id: string
  name: string
  email: string
  phone?: string
  role: string
  is_active: boolean
  createdAt: string
  updatedAt: string
}


type Props = {}

export default function Admins({ }: Props) {
  const { data: users = [], isLoading: isLoadingUsers } = useListUsersQuery()
  const { data: auditLogs = [], isLoading: isLoadingLogs } = useListAuditLogsQuery(100, 0)
  const createUserMut = useCreateUserMutation()
  const updateUserMut = useUpdateUserMutation()
  const deleteUserMut = useDeleteUserMutation()
  const deactivateUserMut = useDeactivateUserMutation()
  const reactivateUserMut = useReactivateUserMutation()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{ type: 'delete' | 'deactivate' | 'reactivate'; user: Admin } | null>(null)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
  })

  const handleOpenCreateDialog = () => {
    setFormData({ username: '', email: '', phone: '' })
    setSelectedAdmin(null)
    setCreateDialogOpen(true)
  }

  const handleOpenEditDialog = (admin: Admin) => {
    setFormData({ username: admin.name, email: admin.email, phone: admin.phone || '' })
    setSelectedAdmin(admin)
    setEditDialogOpen(true)
  }

  const handleCreateAdmin = async () => {
    if (!formData.username.trim() || !formData.email.trim()) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }

    try {
      await createUserMut.mutateAsync({
        username: formData.username,
        email: formData.email,
        phone: formData.phone
      })
      setFormData({ username: '', email: '', phone: '' })
      setCreateDialogOpen(false)
      toast.success('Administrateur créé avec succès')
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la création')
    }
  }

  const handleUpdateAdmin = async () => {
    if (!formData.username.trim() || !formData.email.trim()) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }

    if (!selectedAdmin) return

    try {
      await updateUserMut.mutateAsync({
        userId: selectedAdmin.id,
        payload: {
          username: formData.username,
          email: formData.email,
          phone: formData.phone,
        },
      })
      setFormData({ username: '', email: '', phone: '' })
      setEditDialogOpen(false)
      toast.success('Administrateur mis à jour avec succès')
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la mise à jour')
    }
  }

  const handleDeleteAdmin = (admin: Admin) => {
    setConfirmAction({ type: 'delete', user: admin })
    setConfirmDialogOpen(true)
  }

  const handleDeactivateAdmin = (admin: Admin) => {
    setConfirmAction({ type: 'deactivate', user: admin })
    setConfirmDialogOpen(true)
  }

  const handleReactivateAdmin = (admin: Admin) => {
    setConfirmAction({ type: 'reactivate', user: admin })
    setConfirmDialogOpen(true)
  }

  const handleConfirmAction = async () => {
    if (!confirmAction) return

    try {
      if (confirmAction.type === 'delete') {
        await deleteUserMut.mutateAsync(confirmAction.user.id)
        toast.success('Administrateur supprimé avec succès')
      } else if (confirmAction.type === 'deactivate') {
        await deactivateUserMut.mutateAsync(confirmAction.user.id)
        toast.success('Administrateur désactivé avec succès')
      } else if (confirmAction.type === 'reactivate') {
        await reactivateUserMut.mutateAsync(confirmAction.user.id)
        toast.success('Administrateur réactivé avec succès')
      }
      setConfirmDialogOpen(false)
      setConfirmAction(null)
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'action')
    }
  }

  const getRoleBadge = (role: string) => {
    let classes = 'px-2 py-1 rounded-full text-xs font-medium '
    switch (role) {
      case 'admin':
        classes += 'bg-blue-100 text-blue-800'
        break
      case 'mod':
        classes += 'bg-green-100 text-green-800'
        break
      default:
        classes += 'bg-gray-100 text-gray-800'
    }
    return classes
  }

  return (
    <Main>
      <div>
        <h1 className='text-2xl font-bold tracking-tight'>Administration</h1>
        <p className='text-muted-foreground'>
          Gérez les <b>administrateurs</b> et consultez les <b>journaux d'activité</b>
        </p>
      </div>

      <div className='mt-6'>
        <Tabs defaultValue='admins' className='w-full'>
          <TabsList>
            <TabsTrigger value='admins'>
              <Plus className='h-4 w-4 mr-2' />
              Admins
            </TabsTrigger>
            <TabsTrigger value='logs'>
              <LogsIcon className='h-4 w-4 mr-2' />
              Admin Logs
            </TabsTrigger>
          </TabsList>

          {/* Admins Tab */}
          <TabsContent value='admins' className='mt-4'>
            <div className='mb-4'>
              <Button onClick={handleOpenCreateDialog}>
                <Plus className='h-4 w-4 mr-2' />
                Ajouter un administrateur
              </Button>
            </div>

            <div className='border rounded-lg overflow-hidden'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Créé le</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingUsers ? (
                    <TableRow>
                      <TableCell colSpan={7} className='text-center py-8'>
                        <Loader2 className='h-5 w-5 animate-spin mx-auto' />
                      </TableCell>
                    </TableRow>
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className='text-center py-8 text-muted-foreground'>
                        Aucun administrateur
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user: any) => (
                      <TableRow key={user.id}>
                        <TableCell className='font-medium'>{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.phone || '-'}</TableCell>
                        <TableCell>
                          <span className={getRoleBadge(user.role)}>
                            {user.role == 'admin' ? 'Admin': 'Moderateur'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={user.is_active ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                            {user.is_active ? '✓ Actif' : '✗ Inactif'}
                          </span>
                        </TableCell>
                        <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className='flex gap-1'>
                            <Button
                              size='sm'
                              variant='ghost'
                              onClick={() => handleOpenEditDialog({
                                id: user.id,
                                name: user.username,
                                email: user.email,
                                phone: user.phone,
                                role: user.role,
                                is_active: user.is_active,
                                createdAt: user.created_at,
                                updatedAt: user.updated_at,
                              })}
                            >
                              <Edit2 className='h-4 w-4' />
                            </Button>
                            {user.is_active ? (
                              <Button
                                size='sm'
                                variant='ghost'
                                onClick={() => handleDeactivateAdmin({
                                  id: user.id,
                                  name: user.username,
                                  email: user.email,
                                  phone: user.phone,
                                  role: user.role,
                                  is_active: user.is_active,
                                  createdAt: user.created_at,
                                  updatedAt: user.updated_at,
                                })}
                              >
                                ⊗
                              </Button>
                            ) : (
                              <Button
                                size='sm'
                                variant='ghost'
                                onClick={() => handleReactivateAdmin({
                                  id: user.id,
                                  name: user.username,
                                  email: user.email,
                                  phone: user.phone,
                                  role: user.role,
                                  is_active: user.is_active,
                                  createdAt: user.created_at,
                                  updatedAt: user.updated_at,
                                })}
                              >
                                ⊕
                              </Button>
                            )}
                            <Button
                              size='sm'
                              variant='ghost'
                              onClick={() => handleDeleteAdmin({
                                id: user.id,
                                name: user.username,
                                email: user.email,
                                phone: user.phone,
                                role: user.role,
                                is_active: user.is_active,
                                createdAt: user.created_at,
                                updatedAt: user.updated_at,
                              })}
                            >
                              <Trash2 className='h-4 w-4' />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Admin Logs Tab */}
          <TabsContent value='logs' className='mt-4'>
            <div className='border rounded-lg overflow-hidden'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Administrateur</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Ressource</TableHead>
                    <TableHead>Détails</TableHead>
                    <TableHead>Date/Heure</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingLogs ? (
                    <TableRow>
                      <TableCell colSpan={5} className='text-center py-8'>
                        <Loader2 className='h-5 w-5 animate-spin mx-auto' />
                      </TableCell>
                    </TableRow>
                  ) : auditLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className='text-center py-8 text-muted-foreground'>
                        Aucun journal d'audit
                      </TableCell>
                    </TableRow>
                  ) : (
                    auditLogs.map((log: any) => (
                      <TableRow key={log.id}>
                        <TableCell className='font-medium'>{log.admin}</TableCell>
                        <TableCell>
                          <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800'>
                            {log.action}
                          </span>
                        </TableCell>
                        <TableCell>{log.resource || '-'}</TableCell>
                        <TableCell className='text-sm text-muted-foreground'>{log.details || '-'}</TableCell>
                        <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Admin Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>Ajouter un nouvel administrateur</DialogTitle>
          </DialogHeader>
          <div className='mt-4 space-y-4'>
            <div>
              <label className='text-sm font-semibold block mb-1'>Nom d'utilisateur</label>
              <input
                type='text'
                placeholder="Nom d'utilisateur"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className='w-full rounded border px-3 py-2 text-sm'
              />
            </div>
            <div>
              <label className='text-sm font-semibold block mb-1'>Email</label>
              <input
                type='email'
                placeholder='adresse@email.com'
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className='w-full rounded border px-3 py-2 text-sm'
              />
            </div>
            <div>
              <label className='text-sm font-semibold block mb-1'>Téléphone</label>
              <input
                type='tel'
                placeholder='Numéro de téléphone'
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className='w-full rounded border px-3 py-2 text-sm'
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setCreateDialogOpen(false)
                setFormData({ username: '', email: '', phone: '' })
              }}
            >
              Annuler
            </Button>
            <Button onClick={handleCreateAdmin} disabled={createUserMut.isPending}>
              {createUserMut.isPending ? (<><Loader2 className='h-4 w-4 mr-2 animate-spin' />Création...</>) : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Admin Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>Modifier l'administrateur</DialogTitle>
          </DialogHeader>
          <div className='mt-4 space-y-4'>
            <div>
              <label className='text-sm font-semibold block mb-1'>Nom d'utilisateur</label>
              <input
                type='text'
                placeholder="Nom d'utilisateur"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className='w-full rounded border px-3 py-2 text-sm'
              />
            </div>
            <div>
              <label className='text-sm font-semibold block mb-1'>Email</label>
              <input
                type='email'
                placeholder='adresse@email.com'
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className='w-full rounded border px-3 py-2 text-sm'
              />
            </div>
            <div>
              <label className='text-sm font-semibold block mb-1'>Téléphone</label>
              <input
                type='tel'
                placeholder='Numéro de téléphone'
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className='w-full rounded border px-3 py-2 text-sm'
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setEditDialogOpen(false)
                setFormData({ username: '', email: '', phone: ''})
              }}
            >
              Annuler
            </Button>
            <Button onClick={handleUpdateAdmin} disabled={updateUserMut.isPending}>
              {updateUserMut.isPending ? (<><Loader2 className='h-4 w-4 mr-2 animate-spin' />Mise à jour...</>) : 'Mettre à jour'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <AlertCircle className='h-5 w-5 text-yellow-600' />
              Confirmer l'action
            </DialogTitle>
          </DialogHeader>
          {confirmAction && (
            <div className='space-y-4'>
              <p className='text-sm text-muted-foreground'>
                {confirmAction.type === 'delete' && `Êtes-vous sûr de vouloir supprimer l'administrateur "${confirmAction.user.name}" ? Cette action est irréversible.`}
                {confirmAction.type === 'deactivate' && `Êtes-vous sûr de vouloir désactiver l'administrateur "${confirmAction.user.name}" ?`}
                {confirmAction.type === 'reactivate' && `Êtes-vous sûr de vouloir réactiver l'administrateur "${confirmAction.user.name}" ?`}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant='outline' onClick={() => setConfirmDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleConfirmAction}
              disabled={deleteUserMut.isPending || deactivateUserMut.isPending || reactivateUserMut.isPending}
              variant={confirmAction?.type === 'delete' ? 'destructive' : 'default'}
            >
              {(deleteUserMut.isPending || deactivateUserMut.isPending || reactivateUserMut.isPending) ? (
                <><Loader2 className='h-4 w-4 mr-2 animate-spin' />Traitement...</>
              ) : (
                confirmAction?.type === 'delete' ? 'Supprimer' : 
                confirmAction?.type === 'deactivate' ? 'Désactiver' : 
                'Réactiver'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Main>
  )
}