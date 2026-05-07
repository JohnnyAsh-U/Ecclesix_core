import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { usePlansList } from '@/hooks/plan.hooks'
import { useChangeBillingPlan } from '@/hooks/billing.hooks'
import { Label } from '@/components/ui/label'

interface ChangePlanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bill: any | null
}

export default function ChangePlanDialog({ open, onOpenChange, bill }: ChangePlanDialogProps) {
  const { data: plans = [] } = usePlansList()
  const changePlan = useChangeBillingPlan()
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null)

  useEffect(() => {
    if (!bill) return
    // Try to set default to current plan code if available
    const currentCode = bill.plan
    if (currentCode && plans.length > 0) {
      const p = plans.find((x: any) => x.code === currentCode)
      if (p) setSelectedPlanId(p.id)
    }
  }, [bill, plans])

  const handleConfirm = async () => {
    if (!bill || !selectedPlanId) return
    try {
      await changePlan.mutateAsync({ tenant_id: bill.tenant_id, plan_id: selectedPlanId })
      onOpenChange(false)
    } catch (e) {
      // handled by hook
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Changer le plan</DialogTitle>
          <DialogDescription>Sélectionnez un nouveau plan pour ce locataire.</DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div>
            <Label>Plan</Label>
            <select
              value={selectedPlanId ?? ''}
              onChange={(e) => setSelectedPlanId(Number(e.target.value))}
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
            >
              <option value="">Sélectionner un plan...</option>
              {plans.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="text-sm text-gray-700">
            <p>Locataire: <strong>{bill?.church_name}</strong></p>
          </div>
        </div>

        <DialogFooter>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button onClick={handleConfirm} disabled={changePlan.isPending || !selectedPlanId}>
              {changePlan.isPending ? 'Mise à jour...' : 'Changer le plan'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
