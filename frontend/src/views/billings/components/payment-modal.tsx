import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateBilling } from '@/hooks/billing.hooks'

interface PaymentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bill: any | null
  mode: 'pay' | 'extend'
}

export default function PaymentModal({ open, onOpenChange, bill, mode }: PaymentModalProps) {
  const createBilling = useCreateBilling()
  const [month, setMonth] = useState<string>('')
  const [year, setYear] = useState<string>('')
  const [amount, setAmount] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState<string>('')
  const [notes, setNotes] = useState<string>('')

  useEffect(() => {
    if (!bill) return
    const now = new Date()
    if (mode === 'pay') {
      setMonth(String(now.getMonth() + 1))
      setYear(String(now.getFullYear()))
    } else {
      // extend: add one month to bill.month/bill.year
      const bMonth = Number(bill.month) || now.getMonth() + 1
      const bYear = Number(bill.year) || now.getFullYear()
      const date = new Date(bYear, bMonth - 1)
      date.setMonth(date.getMonth() + 1)
      setMonth(String(date.getMonth() + 1))
      setYear(String(date.getFullYear()))
    }
    setAmount(bill.amount ? String(bill.amount) : '')
    setPaymentMethod('')
    setNotes('')
  }, [bill, mode])

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!bill) return
    const payload: Record<string, any> = {
      tenant_id: bill.tenant_id ?? bill.tenantId ?? bill.id,
      month: parseInt(month),
      year: parseInt(year),
      amount: amount,
      currency: bill.currency,
      payment_method: paymentMethod,
      notes,
      paid_at: new Date()
    }

    try {
      await createBilling.mutateAsync(payload)
      onOpenChange(false)
    } catch (err) {
      // handled by hook
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'pay' ? 'Enregistrer un paiement' : 'Prolonger et facturer'}</DialogTitle>
          <DialogDescription>
            {mode === 'pay' ? 'Enregistrez le paiement pour la période sélectionnée.' : 'Créez une facture pour prolonger l\'abonnement d\'une période.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label>Mois</Label>
            <Input value={month} readOnly />
          </div>
          <div>
            <Label>Année</Label>
            <Input value={year} readOnly />
          </div>
          <div>
            <Label>Montant</Label>
            <Input value={amount ? `${amount} ${bill?.currency || ''}` : ''} readOnly />
          </div>
          <div>
            <Label>Méthode de paiement</Label>
            <Input value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} placeholder="e.g. carte, virement" />
          </div>
          <div>
            <Label>Notes</Label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
              rows={3}
            />
          </div>

          <DialogFooter>
            <div className="flex gap-2">
              <Button variant="outline" type='reset' onClick={() => onOpenChange(false)}>Annuler</Button>
              <Button type="submit" disabled={createBilling.isPending}>
                {createBilling.isPending ? (mode === 'pay' ? 'Enregistrement...' : 'Création...') : (mode === 'pay' ? 'Enregistrer le paiement' : 'Prolonger')}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
