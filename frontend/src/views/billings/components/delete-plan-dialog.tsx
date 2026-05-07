import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useDeletePlan } from '@/hooks/plan.hooks'

interface DeletePlanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  plan: any | null
}

export function DeletePlanDialog({ open, onOpenChange, plan }: DeletePlanDialogProps) {
  const deletePlan = useDeletePlan()

  const handleConfirm = async () => {
    if (!plan) return
    try {
      await deletePlan.mutateAsync(plan.id)
      onOpenChange(false)
    } catch (e) {
      // handled by hook
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Supprimer le plan</DialogTitle>
          <DialogDescription>Cette action est irréversible. Confirmez la suppression du plan.</DialogDescription>
        </DialogHeader>
        <div className="mt-2">
          <p className="text-sm text-gray-700">Êtes-vous sûr de vouloir supprimer le plan <strong>{plan?.name}</strong> ?</p>
        </div>
        <DialogFooter>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button onClick={handleConfirm} disabled={deletePlan.isPending} className="bg-red-600">
              {deletePlan.isPending ? 'Suppression...' : 'Supprimer'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default DeletePlanDialog
