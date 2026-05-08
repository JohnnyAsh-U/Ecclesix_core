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
import { Plus, Edit2, Trash2, LogsIcon } from 'lucide-react'
import { toast } from 'sonner'

interface Admin {
  id: number
  name: string
  email: string
  role: string
  createdAt: string
  lastActive: string
}

interface AdminLog {
  id: number
  admin: string
  action: string
  target: string
  timestamp: string
  details: string
}

const staticAdmins: Admin[] = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@church.org',
    role: 'Super Admin',
    createdAt: '2024-01-15T10:30:00',
    lastActive: '2024-05-08T14:22:00',
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@church.org',
    role: 'Admin',
    createdAt: '2024-02-20T09:15:00',
    lastActive: '2024-05-07T18:45:00',
  },
  {
    id: 3,
    name: 'Mike Johnson',
    email: 'mike@church.org',
    role: 'Moderator',
    createdAt: '2024-03-10T11:00:00',
    lastActive: '2024-05-05T16:30:00',
  },
]

const staticLogs: AdminLog[] = [
  {
    id: 1,
    admin: 'John Doe',
    action: 'User Created',
    target: 'Jane Smith',
    timestamp: '2024-05-08T10:30:00',
    details: 'Created new admin account',
  },
  {
    id: 2,
    admin: 'Jane Smith',
    action: 'User Updated',
    target: 'Mike Johnson',
    timestamp: '2024-05-08T09:15:00',
    details: 'Updated role from Admin to Moderator',
  },
  {
    id: 3,
    admin: 'John Doe',
    action: 'User Deleted',
    target: 'Old Admin',
    timestamp: '2024-05-07T14:45:00',
    details: 'Deleted inactive admin account',
  },
  {
    id: 4,
    admin: 'Jane Smith',
    action: 'Permission Changed',
    target: 'Mike Johnson',
    timestamp: '2024-05-06T11:20:00',
    details: 'Revoked backup permissions',
  },
]

type Props = {}

export default function Admins({}: Props) {
  const [admins, setAdmins] = useState<Admin[]>(staticAdmins)
  const [logs] = useState<AdminLog[]>(staticLogs)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Admin',
  })

  const handleOpenCreateDialog = () => {
    setFormData({ name: '', email: '', role: 'Admin' })
    setSelectedAdmin(null)
    setCreateDialogOpen(true)
  }

  const handleOpenEditDialog = (admin: Admin) => {
    setFormData({ name: admin.name, email: admin.email, role: admin.role })
    setSelectedAdmin(admin)
    setEditDialogOpen(true)
  }

  const handleCreateAdmin = () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error('Please fill in all fields')
      return
    }

    const newAdmin: Admin = {
      id: Math.max(...admins.map(a => a.id), 0) + 1,
      name: formData.name,
      email: formData.email,
      role: formData.role,
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
    }

    setAdmins([newAdmin, ...admins])
    setFormData({ name: '', email: '', role: 'Admin' })
    setCreateDialogOpen(false)
    toast.success('Admin created successfully')
  }

  const handleUpdateAdmin = () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error('Please fill in all fields')
      return
    }

    if (!selectedAdmin) return

    setAdmins(
      admins.map(a =>
        a.id === selectedAdmin.id
          ? {
              ...a,
              name: formData.name,
              email: formData.email,
              role: formData.role,
            }
          : a
      )
    )
    setFormData({ name: '', email: '', role: 'Admin' })
    setEditDialogOpen(false)
    toast.success('Admin updated successfully')
  }

  const handleDeleteAdmin = (admin: Admin) => {
    if (admin.role === 'Super Admin') {
      toast.error('Cannot delete Super Admin')
      return
    }

    setAdmins(admins.filter(a => a.id !== admin.id))
    toast.success('Admin deleted successfully')
  }

  const getRoleBadge = (role: string) => {
    let classes = 'px-2 py-1 rounded-full text-xs font-medium '
    switch (role) {
      case 'Super Admin':
        classes += 'bg-red-100 text-red-800'
        break
      case 'Admin':
        classes += 'bg-blue-100 text-blue-800'
        break
      case 'Moderator':
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
                    <TableHead>Rôle</TableHead>
                    <TableHead>Créé le</TableHead>
                    <TableHead>Dernière activité</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className='font-medium'>{admin.name}</TableCell>
                      <TableCell>{admin.email}</TableCell>
                      <TableCell>
                        <span className={getRoleBadge(admin.role)}>
                          {admin.role}
                        </span>
                      </TableCell>
                      <TableCell>{new Date(admin.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(admin.lastActive).toLocaleString()}</TableCell>
                      <TableCell>
                        <div className='flex gap-2'>
                          <Button
                            size='sm'
                            variant='ghost'
                            onClick={() => handleOpenEditDialog(admin)}
                          >
                            <Edit2 className='h-4 w-4' />
                          </Button>
                          <Button
                            size='sm'
                            variant='ghost'
                            onClick={() => handleDeleteAdmin(admin)}
                            disabled={admin.role === 'Super Admin'}
                          >
                            <Trash2 className='h-4 w-4' />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
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
                    <TableHead>Cible</TableHead>
                    <TableHead>Détails</TableHead>
                    <TableHead>Date/Heure</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className='font-medium'>{log.admin}</TableCell>
                      <TableCell>
                        <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800'>
                          {log.action}
                        </span>
                      </TableCell>
                      <TableCell>{log.target}</TableCell>
                      <TableCell className='text-sm text-muted-foreground'>{log.details}</TableCell>
                      <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
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
              <label className='text-sm font-semibold block mb-1'>Nom</label>
              <input
                type='text'
                placeholder='Nom complet'
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              <label className='text-sm font-semibold block mb-1'>Rôle</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className='w-full rounded border px-3 py-2 text-sm'
              >
                <option value='Admin'>Admin</option>
                <option value='Moderator'>Moderator</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setCreateDialogOpen(false)
                setFormData({ name: '', email: '', role: 'Admin' })
              }}
            >
              Annuler
            </Button>
            <Button onClick={handleCreateAdmin}>
              Créer
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
              <label className='text-sm font-semibold block mb-1'>Nom</label>
              <input
                type='text'
                placeholder='Nom complet'
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              <label className='text-sm font-semibold block mb-1'>Rôle</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className='w-full rounded border px-3 py-2 text-sm'
                disabled={selectedAdmin?.role === 'Super Admin'}
              >
                <option value='Admin'>Admin</option>
                <option value='Moderator'>Moderator</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setEditDialogOpen(false)
                setFormData({ name: '', email: '', role: 'Admin' })
              }}
            >
              Annuler
            </Button>
            <Button onClick={handleUpdateAdmin}>
              Mettre à jour
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Main>
  )
}