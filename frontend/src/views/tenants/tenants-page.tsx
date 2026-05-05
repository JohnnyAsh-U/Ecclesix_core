/**
 * Tenants Management Page
 * Main page for viewing and managing all tenants
 */

import { useState } from 'react'
import { TenantsTable } from './components/tenants-table'
import { Button } from '@/components/ui/button'
import type { Tenant } from '@/types'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Main } from '@/components/layout/main'

export function TenantsPage() {
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false)
  const [planDialogOpen, setPlanDialogOpen] = useState(false)
  const [suspendReason, setSuspendReason] = useState('')
  const [newPlan, setNewPlan] = useState('')

  const handleSuspendTenant = (tenant: Tenant) => {
    setSelectedTenant(tenant)
    setSuspendDialogOpen(true)
  }

  const handleConfirmSuspend = () => {
    if (selectedTenant) {
      toast.success(
        `Tenant ${selectedTenant.name} ${selectedTenant.status === 'suspended' ? 'reactivated' : 'suspended'}`
      )
      setSuspendDialogOpen(false)
      setSuspendReason('')
      setSelectedTenant(null)
    }
  }

  const handleChangePlan = (tenant: Tenant) => {
    setSelectedTenant(tenant)
    setNewPlan(tenant.plan)
    setPlanDialogOpen(true)
  }

  const handleConfirmPlanChange = () => {
    if (selectedTenant) {
      toast.success(`Plan updated to ${newPlan}`)
      setPlanDialogOpen(false)
      setNewPlan('')
      setSelectedTenant(null)
    }
  }

  const handleImpersonate = (tenant: Tenant) => {
    toast.success(`Impersonating ${tenant.name}`)
    // In a real app, would redirect to tenant dashboard
  }

  const handleDeleteTenant = (tenant: Tenant) => {
    if (
      window.confirm(
        `Are you sure you want to permanently delete ${tenant.name}? This cannot be undone.`
      )
    ) {
      toast.success(`Tenant ${tenant.name} deleted`)
    }
  }

  return (
    <Main className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tenant Management</h1>
          <p className="text-gray-600 mt-1">
            Manage all church and organization tenants on the platform
          </p>
        </div>
        <Button>+ New Tenant</Button>
      </div>

      {/* Tenants Table */}
      <TenantsTable
        onViewTenant={(t) => console.log('View tenant', t)}
        onSuspendTenant={handleSuspendTenant}
        onChangePlan={handleChangePlan}
        onImpersonate={handleImpersonate}
        onDeleteTenant={handleDeleteTenant}
      />

      {/* Suspend Dialog */}
      <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedTenant?.status === 'suspended'
                ? 'Reactivate Tenant'
                : 'Suspend Tenant'}
            </DialogTitle>
            <DialogDescription>
              {selectedTenant?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedTenant?.status !== 'suspended' && (
            <Textarea
              placeholder="Reason for suspension..."
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              className="min-h-20"
            />
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={selectedTenant?.status === 'suspended' ? 'default' : 'destructive'}
              onClick={handleConfirmSuspend}
            >
              {selectedTenant?.status === 'suspended'
                ? 'Reactivate'
                : 'Suspend'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Plan Change Dialog */}
      <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Tenant Plan</DialogTitle>
            <DialogDescription>
              {selectedTenant?.name} - Current: {selectedTenant?.plan}
            </DialogDescription>
          </DialogHeader>

          <Select value={newPlan} onValueChange={setNewPlan}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="starter">Starter</SelectItem>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPlanDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmPlanChange}>
              Update Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Main>
  )
}
