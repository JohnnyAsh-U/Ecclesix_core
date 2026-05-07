/**
 * Billing Module Pages and Components
 */

import { useEffect, useState } from 'react'
import { useRecentBillings, useFilterBillings } from '@/hooks/billing.hooks'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { TableSkeleton, StatusBadge } from '@/components/shared/data-display'
import { formatDate } from '@/lib/utils-control-plane'
import { MoreVertical, Edit, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Main } from '@/components/layout/main'
import { BillingMetricsGrid } from './components/metrics'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { usePlansList } from '@/hooks/plan.hooks'
import CreatePlanForm from './components/create-plan-form'
import EditPlanForm from './components/edit-plan-form'
import DeletePlanDialog from './components/delete-plan-dialog'
import PaymentModal from './components/payment-modal'
import ChangePlanDialog from './components/change-plan-dialog'
import { Badge } from '@/components/ui/badge'

const statusToFrench = (s: string | undefined) => {
  if (!s) return '—'
  switch (s.toLowerCase()) {
    case 'paid':
      return 'Payé'
    case 'pending':
      return 'En attente'
    case 'refunded':
      return 'Remboursé'
    case 'failed':
      return 'Échoué'
    default:
      return s.charAt(0).toUpperCase() + s.slice(1)
  }
}

// ========================================================================
// SUBSCRIPTIONS TABLE
// ========================================================================

export function SubscriptionsTable() {
  const { data, isLoading } = useRecentBillings()
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [changePlanOpen, setChangePlanOpen] = useState(false)
  const [paymentMode, setPaymentMode] = useState<'pay' | 'extend'>('pay')
  const [selectedBill, setSelectedBill] = useState<any | null>(null)

  const handlePay = (bill: any) => {
    setSelectedBill(bill)
    setPaymentMode('pay')
    setPaymentOpen(true)
  }

  const handleExtend = (bill: any) => {
    setSelectedBill(bill)
    setPaymentMode('extend')
    setPaymentOpen(true)
  }

  const handleChangePlan = (bill: any) => {
    setSelectedBill(bill)
    setChangePlanOpen(true)
  }

  if (isLoading) return <TableSkeleton rows={5} />
  if (!data || data.length === 0) {
    return <div className="text-center py-8 text-gray-600">Aucune facturation récente trouvée</div>
  }
  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead>Église</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead>Période</TableHead>
            <TableHead>Montant</TableHead>
            <TableHead>Methode</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Date de paiement</TableHead>
            <TableHead className="w-10">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((bill) => (
            <TableRow key={bill.tenant_id}>
              <TableCell className="font-medium">{bill.church_name}</TableCell>
              <TableCell>{bill.plan || 'N/A'}</TableCell>
              <TableCell>
                {bill.month && bill.year
                  ? `${new Date(Number(bill.year), Number(bill.month) - 1).toLocaleString('fr', { month: 'long' })} ${bill.year}`
                  : '—'}
              </TableCell>
              <TableCell>{bill.amount || '—'} {bill.currency}</TableCell>
              <TableCell>{bill.payment_method || '-'}</TableCell>
              <TableCell>
                {bill.is_active ? (bill.status ? <StatusBadge status={bill.status} label={statusToFrench(bill.status)} /> : '-') : <Badge variant='failed'>Inactif</Badge>}
              </TableCell>
              <TableCell className="text-sm">{bill.paid_at ? formatDate(bill.paid_at) : '—'}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {bill.status === 'pending' && bill.is_active && (
                      <DropdownMenuItem onClick={() => handlePay(bill)}>Payer</DropdownMenuItem>
                    )}
                    {bill.status === 'paid' && bill.is_active && (
                      <>
                        <DropdownMenuItem onClick={() => handleExtend(bill)}>Prolonger</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleChangePlan(bill)}>Changer le plan</DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <PaymentModal open={paymentOpen} onOpenChange={setPaymentOpen} bill={selectedBill} mode={paymentMode} />
      <ChangePlanDialog open={changePlanOpen} onOpenChange={setChangePlanOpen} bill={selectedBill} />
    </div>
      
  )
}

// ========================================================================
// INVOICES TABLE
// ========================================================================

export function InvoicesTable() {
  const [data, setData] = useState<any[]>([])
  const filterMutation = useFilterBillings()

  // Initialize with current month/year from URL or defaults
  const currentDate = new Date()
  const defaultMonth = (currentDate.getMonth() + 1).toString()
  const defaultYear = currentDate.getFullYear().toString()

  // Parse query params from URL
  const searchParams = new URLSearchParams(window.location.search)
  const [month, setMonth] = useState<string>(searchParams.get('month') || defaultMonth)
  const [year, setYear] = useState<string>(searchParams.get('year') || defaultYear)

  // Update URL when month/year changes
  const updateURLParams = (newMonth: string, newYear: string) => {
    const params = new URLSearchParams()
    params.set('month', newMonth)
    params.set('year', newYear)
    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`)
  }

  // Update URL params when month/year changes
  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = e.target.value
    setMonth(newMonth)
    updateURLParams(newMonth, year)
  }

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = e.target.value
    setYear(newYear)
    updateURLParams(month, newYear)
  }

  // Auto-filter when month/year changes
  useEffect(() => {
    if (month && year) {
      filterMutation.mutate(
        { month: parseInt(month), year: parseInt(year) },
        {
          onSuccess: (result) => {
            setData(result)
          },
        }
      )
    }
  }, [month, year])

  if (filterMutation.isPending) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="text-sm font-medium">Mois</label>
            <select
              value={month}
              onChange={handleMonthChange}
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
            >
              <option value="">Sélectionner le mois...</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={String(i + 1)}>
                  {new Date(2024, i).toLocaleString('fr', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium">Année</label>
            <select
              value={year}
              onChange={handleYearChange}
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
            >
              <option value="">Sélectionner l'année...</option>
              {Array.from({ length: 5 }, (_, i) => {
                const y = new Date().getFullYear() - i
                return (
                  <option key={y} value={String(y)}>
                    {y}
                  </option>
                )
              })}
            </select>
          </div>
        </div>
        <TableSkeleton rows={5} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="text-sm font-medium">Mois</label>
          <select
            value={month}
            onChange={handleMonthChange}
            className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
          >
            <option value="">Sélectionner le mois...</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={String(i + 1)}>
                {new Date(2024, i).toLocaleString('fr', { month: 'long' })}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="text-sm font-medium">Année</label>
          <select
            value={year}
            onChange={handleYearChange}
            className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
          >
            <option value="">Sélectionner l'année...</option>
            {Array.from({ length: 5 }, (_, i) => {
              const y = new Date().getFullYear() - i
              return (
                <option key={y} value={String(y)}>
                  {y}
                </option>
              )
            })}
          </select>
        </div>
      </div>
      {data.length === 0 ? (
        <div className="text-center py-8 text-gray-600">Aucune facture trouvée pour cette période.</div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>N° facture</TableHead>
                <TableHead>Église</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date de paiement</TableHead>
                <TableHead>Méthode de paiement</TableHead>
                <TableHead className="w-10">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((inv, id) => (
                <TableRow key={id}>
                  <TableCell className="font-mono text-sm">{inv.invoice_number}</TableCell>
                  <TableCell>{inv.church_name}</TableCell>
                  <TableCell className="font-medium">
                    {inv.currency} {inv.amount}
                  </TableCell>
                  <TableCell>
                    {inv.status ? <StatusBadge status={inv.status} label={statusToFrench(inv.status)} /> : '—'}
                  </TableCell>
                  <TableCell className="text-sm">{inv.paid_at ? formatDate(inv.paid_at) : '—'}</TableCell>
                  <TableCell className="text-sm">{inv.payment_method || '—'}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Voir</DropdownMenuItem>
                        <DropdownMenuItem>Télécharger PDF</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
// ========================================================================
// PLANS GRID
// ========================================================================

export function PlansGrid() {
  const { data: plans, isLoading } = usePlansList()
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null)
  const handleOpenCreate = () => setCreateOpen(true)
  const handleOpenEdit = (p: any) => {
    setSelectedPlan(p)
    setEditOpen(true)
  }
  const handleOpenDelete = (p: any) => {
    setSelectedPlan(p)
    setDeleteOpen(true)
  }

  if (isLoading) return <TableSkeleton rows={2} />
  if (!plans || plans.length === 0) {
    return <div className="text-center py-8 text-gray-600">Aucun plan trouvé</div>
  }

  return (
    <>
      <div className="flex items-center justify-end mb-4">
        <Button onClick={handleOpenCreate}>+ Créer un plan</Button>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {plans?.map((plan) => (
          <div key={plan.id} className="border rounded-lg p-6 hover:border-blue-500 transition-colors">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg mb-2">{plan.code}</h3>
                <p className="text-gray-600 text-sm mb-2">{plan.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(plan)} aria-label="Modifier">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleOpenDelete(plan)} aria-label="Supprimer">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-3 mb-4 mt-4">
              <div>
                <p className="text-2xl font-bold">
                  {Number(plan.price).toLocaleString('fr-FR')} {plan.currency}
                  <span className="text-sm text-gray-600 font-normal">/mois</span>
                </p>
                {plan.annual_price && (
                  <p className="text-sm text-gray-500">
                    {Number(plan.annual_price).toLocaleString('fr-FR')} {plan.currency}/an
                  </p>
                )}
              </div>

              <ul className="space-y-2 text-sm">
                <li className="text-gray-700">✓ {plan.max_churches} églises</li>
                <li className="text-gray-700">✓ {plan.max_members} membres</li>
              </ul>
            </div>
          </div>
        ))}
      </div>

      <CreatePlanForm open={createOpen} onOpenChange={setCreateOpen} />
      <EditPlanForm open={editOpen} onOpenChange={setEditOpen} plan={selectedPlan} />
      <DeletePlanDialog open={deleteOpen} onOpenChange={setDeleteOpen} plan={selectedPlan} />
    </>
  )
}

// ========================================================================
// BILLING PAGE
// ========================================================================

export default function Billing() {


  return (
    <Main >
      <div>
        <h1 className='text-2xl font-bold tracking-tight'>Facturation</h1>
        <p className='text-muted-foreground'>
          Gestion des facturations
        </p>
      </div>

      {/* Metrics */}
      <div className="mt-2 mb-6">
        <BillingMetricsGrid />
      </div>
      <Tabs
        orientation='horizontal'
        defaultValue='subscriptions'
        className='space-y-4'
      >
        <div className='w-full overflow-x-auto pb-2'>
          <TabsList>
            <TabsTrigger value='subscriptions'>Abonnements</TabsTrigger>
            <TabsTrigger value='invoices'>Factures</TabsTrigger>
            <TabsTrigger value='plans'>
              Packages
            </TabsTrigger>

          </TabsList>
        </div>
        <TabsContent value='subscriptions' className='space-y-4'>
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Affichage de tous les abonnements actifs
              </p>
            </div>
            <SubscriptionsTable />
          </>
        </TabsContent>
        <TabsContent value='invoices' className='space-y-4'>
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Affichage de toutes les factures
              </p>
            </div>
            <InvoicesTable />
          </>
        </TabsContent>

        <TabsContent value='plans' className='space-y-4'>
          <>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-gray-600">Plans de facturation disponibles</p>
              </div>
            <PlansGrid />
          </>
        </TabsContent>
      </Tabs>
    </Main>
  )
}
