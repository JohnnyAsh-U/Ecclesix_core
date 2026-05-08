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
import { Mail, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface Email {
  id: number
  from: string
  subject: string
  body: string
  date: string
  read: boolean
}

interface Ticket {
  id: number
  title: string
  description: string
  reportedBy: string
  status: 'open' | 'in-progress' | 'resolved'
  createdAt: string
  completedAt: string | null
}

const staticEmails: Email[] = [
  {
    id: 1,
    from: 'user@example.com',
    subject: 'Issue with backup feature',
    body: 'I am having trouble accessing the backup feature. The download button is not working.',
    date: '2024-05-08T10:30:00',
    read: true,
  },
  {
    id: 2,
    from: 'admin@church.org',
    subject: 'Upgrade inquiry',
    body: 'We would like to upgrade our plan to premium. Please provide details.',
    date: '2024-05-07T14:15:00',
    read: true,
  },
  {
    id: 3,
    from: 'support@example.com',
    subject: 'Follow-up on previous ticket',
    body: 'Following up on your previous support request. Have you resolved the issue?',
    date: '2024-05-06T09:45:00',
    read: false,
  },
]

type Props = {}

export default function Support({}: Props) {
  const [emails] = useState<Email[]>(staticEmails)
  const [tickets, setTickets] = useState<Ticket[]>([
    {
      id: 1,
      title: 'Backup download not working',
      description: 'User reports that the backup download button is not responding',
      reportedBy: 'user@example.com',
      status: 'in-progress',
      createdAt: '2024-05-08T10:30:00',
      completedAt: null,
    },
    {
      id: 2,
      title: 'Schema restore failing',
      description: 'Schema restore endpoint returns 500 error on PostgreSQL 14',
      reportedBy: 'admin@church.org',
      status: 'open',
      createdAt: '2024-05-07T14:15:00',
      completedAt: null,
    },
  ])

  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [createTicketOpen, setCreateTicketOpen] = useState(false)
  const [isReplying, setIsReplying] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    reportedBy: '',
  })

  const handleViewEmail = (email: Email) => {
    setSelectedEmail(email)
    setEmailDialogOpen(true)
  }

  const handleCreateTicket = () => {
    if (!formData.title.trim() || !formData.description.trim() || !formData.reportedBy.trim()) {
      toast.error('Please fill in all fields')
      return
    }

    const newTicket: Ticket = {
      id: Math.max(...tickets.map(t => t.id), 0) + 1,
      title: formData.title,
      description: formData.description,
      reportedBy: formData.reportedBy,
      status: 'open',
      createdAt: new Date().toISOString(),
      completedAt: null,
    }

    setTickets([newTicket, ...tickets])
    setFormData({ title: '', description: '', reportedBy: '' })
    setCreateTicketOpen(false)
    toast.success('Ticket created successfully')
  }

  const handleChangeStatus = (ticketId: number, newStatus: 'open' | 'in-progress' | 'resolved') => {
    setTickets(
      tickets.map(t =>
        t.id === ticketId ? { ...t, status: newStatus } : t
      )
    )
    toast.success(`Ticket status updated to ${newStatus}`)
  }

  const handleMarkCompleted = (ticketId: number) => {
    setTickets(
      tickets.map(t =>
        t.id === ticketId ? { ...t, status: 'resolved', completedAt: new Date().toISOString() } : t
      )
    )
    toast.success('Ticket marked as completed')
  }

  const handleDeleteTicket = (ticketId: number) => {
    setTickets(tickets.filter(t => t.id !== ticketId))
    toast.success('Ticket deleted')
  }

  const handleReplyEmail = () => {
    if (!replyText.trim()) {
      toast.error('Please enter a reply message')
      return
    }
    toast.success(`Reply sent to ${selectedEmail?.from}`)
    setReplyText('')
    setIsReplying(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className='h-4 w-4 text-yellow-600' />
      case 'in-progress':
        return <Clock className='h-4 w-4 text-blue-600' />
      case 'resolved':
        return <CheckCircle2 className='h-4 w-4 text-green-600' />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    let classes = 'px-2 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 '
    switch (status) {
      case 'open':
        classes += 'bg-yellow-100 text-yellow-800'
        break
      case 'in-progress':
        classes += 'bg-blue-100 text-blue-800'
        break
      case 'resolved':
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
        <h1 className='text-2xl font-bold tracking-tight'>Support</h1>
        <p className='text-muted-foreground'>
          Gérez les <b>emails</b> de support et créez des <b>tickets</b>
        </p>
      </div>

      <div className='mt-6'>
        <Tabs defaultValue='emails' className='w-full'>
          <TabsList>
            <TabsTrigger value='emails'>
              <Mail className='h-4 w-4 mr-2' />
              Emails
            </TabsTrigger>
            <TabsTrigger value='tickets'>
              <AlertCircle className='h-4 w-4 mr-2' />
              Tickets
            </TabsTrigger>
          </TabsList>

          {/* Emails Tab */}
          <TabsContent value='emails' className='mt-4'>
            <div className='border rounded-lg overflow-hidden'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>De</TableHead>
                    <TableHead>Sujet</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emails.map((email) => (
                    <TableRow key={email.id}>
                      <TableCell className='font-medium'>{email.from}</TableCell>
                      <TableCell>{email.subject}</TableCell>
                      <TableCell>{new Date(email.date).toLocaleString()}</TableCell>
                      <TableCell>
                        <span className='text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800'>
                          {email.read ? 'Lu' : 'Non lu'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          size='sm'
                          variant='ghost'
                          onClick={() => handleViewEmail(email)}
                        >
                          Voir
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Tickets Tab */}
          <TabsContent value='tickets' className='mt-4'>
            <div className='mb-4'>
              <Button
                onClick={() => setCreateTicketOpen(true)}
                className='mb-4'
              >
                Créer un ticket
              </Button>
            </div>

            <div className='border rounded-lg overflow-hidden'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titre</TableHead>
                    <TableHead>Rapporté par</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Créé</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell className='font-medium'>{ticket.title}</TableCell>
                      <TableCell>{ticket.reportedBy}</TableCell>
                      <TableCell>
                        <div className={getStatusBadge(ticket.status)}>
                          {getStatusIcon(ticket.status)}
                          {ticket.status === 'open' && 'Ouvert'}
                          {ticket.status === 'in-progress' && 'En cours'}
                          {ticket.status === 'resolved' && 'Résolu'}
                        </div>
                      </TableCell>
                      <TableCell>{new Date(ticket.createdAt).toLocaleString()}</TableCell>
                      <TableCell>
                        <div className='flex gap-2'>
                          <Button
                            size='sm'
                            variant='ghost'
                            onClick={() => handleChangeStatus(ticket.id, ticket.status === 'open' ? 'in-progress' : ticket.status === 'in-progress' ? 'resolved' : 'open')}
                            disabled={ticket.status === 'resolved'}
                          >
                            {ticket.status === 'open' && 'Démarrer'}
                            {ticket.status === 'in-progress' && 'Compléter'}
                            {ticket.status === 'resolved' && 'Complété'}
                          </Button>
                          {ticket.status !== 'resolved' && (
                            <Button
                              size='sm'
                              variant='ghost'
                              onClick={() => handleMarkCompleted(ticket.id)}
                            >
                              <CheckCircle2 className='h-4 w-4' />
                            </Button>
                          )}
                          <Button
                            size='sm'
                            variant='ghost'
                            onClick={() => handleDeleteTicket(ticket.id)}
                          >
                            🗑️
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* View Email Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={(open) => {
        setEmailDialogOpen(open)
        if (!open) {
          setIsReplying(false)
          setReplyText('')
        }
      }}>
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>{selectedEmail?.subject}</DialogTitle>
          </DialogHeader>
          <div className='mt-4'>
            {!isReplying ? (
              <>
                <div className='mb-4'>
                  <p className='text-sm font-semibold text-muted-foreground'>De:</p>
                  <p className='text-sm'>{selectedEmail?.from}</p>
                </div>
                <div className='mb-4'>
                  <p className='text-sm font-semibold text-muted-foreground'>Date:</p>
                  <p className='text-sm'>{selectedEmail && new Date(selectedEmail.date).toLocaleString()}</p>
                </div>
                <div className='mb-4'>
                  <p className='text-sm font-semibold text-muted-foreground'>Message:</p>
                  <p className='text-sm whitespace-pre-wrap'>{selectedEmail?.body}</p>
                </div>
              </>
            ) : (
              <>
                <div className='mb-4'>
                  <p className='text-sm font-semibold text-muted-foreground'>Répondre à:</p>
                  <p className='text-sm'>{selectedEmail?.from}</p>
                </div>
                <div className='mb-4'>
                  <label className='text-sm font-semibold block mb-2'>Votre réponse:</label>
                  <textarea
                    placeholder='Entrez votre réponse...'
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className='w-full rounded border px-3 py-2 text-sm h-32'
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            {!isReplying ? (
              <>
                <Button variant='outline' onClick={() => setEmailDialogOpen(false)}>
                  Fermer
                </Button>
                <Button onClick={() => setIsReplying(true)}>
                  Répondre
                </Button>
              </>
            ) : (
              <>
                <Button variant='outline' onClick={() => setIsReplying(false)}>
                  Annuler
                </Button>
                <Button onClick={handleReplyEmail}>
                  Envoyer la réponse
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Ticket Dialog */}
      <Dialog open={createTicketOpen} onOpenChange={setCreateTicketOpen}>
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>Créer un nouveau ticket</DialogTitle>
          </DialogHeader>
          <div className='mt-4 space-y-4'>
            <div>
              <label className='text-sm font-semibold block mb-1'>Titre</label>
              <input
                type='text'
                placeholder='Titre du ticket'
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className='w-full rounded border px-3 py-2 text-sm'
              />
            </div>
            <div>
              <label className='text-sm font-semibold block mb-1'>Description</label>
              <textarea
                placeholder='Description du problème'
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className='w-full rounded border px-3 py-2 text-sm h-24'
              />
            </div>
            <div>
              <label className='text-sm font-semibold block mb-1'>Rapporté par</label>
              <input
                type='email'
                placeholder='Email de la personne'
                value={formData.reportedBy}
                onChange={(e) => setFormData({ ...formData, reportedBy: e.target.value })}
                className='w-full rounded border px-3 py-2 text-sm'
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setCreateTicketOpen(false)
                setFormData({ title: '', description: '', reportedBy: '' })
              }}
            >
              Annuler
            </Button>
            <Button onClick={handleCreateTicket}>
              Créer le ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Main>
  )
}