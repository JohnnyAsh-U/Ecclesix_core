/**
 * Tenants Table Component
 * Displays list of all tenants with management actions
 */

import { useState } from 'react'
import { useTenants } from '@/hooks/control-plane'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { TableSkeleton, StatusBadge, PlanBadge } from '@/components/shared/data-display'
import { FilterBar } from '@/components/shared/filters'
import { MoreVertical, Eye, Ban, Edit3, Trash2, LogIn } from 'lucide-react'
import type { Tenant } from '@/types'
import { formatDistance } from 'date-fns/formatDistance'
import { parseISO } from 'date-fns/parseISO'


export function formatDateRelative(date: string | Date): string {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return formatDistance(d, new Date(), { addSuffix: true })
  } catch {
    return 'Invalid date'
  }
}

interface TenantsTableProps {
  onViewTenant?: (tenant: Tenant) => void
  onSuspendTenant?: (tenant: Tenant) => void
  onChangePlan?: (tenant: Tenant) => void
  onImpersonate?: (tenant: Tenant) => void
  onDeleteTenant?: (tenant: Tenant) => void
}

export function TenantsTable({
  onViewTenant,
  onSuspendTenant,
  onChangePlan,
  onImpersonate,
  onDeleteTenant,
}: TenantsTableProps) {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [planFilter, setPlanFilter] = useState('')

  const { data, isLoading } = useTenants(
    page,
    20,
    search,
    statusFilter || undefined
  )

  if (isLoading) return <TableSkeleton rows={5} />

  if (!data || data.data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600">
        No tenants found
      </div>
    )
  }

  const filteredData = planFilter
    ? data.data.filter((t) => t.plan === planFilter)
    : data.data

  return (
    <div className="space-y-4">
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        filters={[
          {
            label: 'Status',
            value: statusFilter,
            onChange: (value) => setStatusFilter(Array.isArray(value) ? value[0] || '' : value),
            options: [
              { label: 'Active', value: 'active' },
              { label: 'Suspended', value: 'suspended' },
              { label: 'Trial', value: 'trial' },
              { label: 'Archived', value: 'archived' },
            ],
          },
          {
            label: 'Plan',
            value: planFilter,
            onChange: (value) => setPlanFilter(Array.isArray(value) ? value[0] || '' : value),
            options: [
              { label: 'Starter', value: 'starter' },
              { label: 'Professional', value: 'professional' },
              { label: 'Enterprise', value: 'enterprise' },
              { label: 'Custom', value: 'custom' },
            ],
          },
        ]}
        onReset={() => {
          setSearch('')
          setStatusFilter('')
          setPlanFilter('')
        }}
      />

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead>Tenant Name</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Users</TableHead>
              <TableHead>Storage</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead className="w-10">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((tenant) => (
              <TableRow key={tenant.id}>
                <TableCell className="font-medium">{tenant.name}</TableCell>
                <TableCell className="text-sm">{tenant.domain}</TableCell>
                <TableCell>
                  <PlanBadge plan={tenant.plan} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={tenant.status} />
                </TableCell>
                <TableCell className="text-sm">{tenant.usersCount}</TableCell>
                <TableCell className="text-sm">
                  {tenant.storageUsedGB}GB / {tenant.storageQuotaGB}GB
                </TableCell>
                <TableCell className="text-sm">
                  {tenant.lastLoginAt
                    ? formatDateRelative(tenant.lastLoginAt)
                    : 'Never'}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {onViewTenant && (
                        <DropdownMenuItem onClick={() => onViewTenant(tenant)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                      )}
                      {onImpersonate && (
                        <DropdownMenuItem onClick={() => onImpersonate(tenant)}>
                          <LogIn className="mr-2 h-4 w-4" />
                          Impersonate
                        </DropdownMenuItem>
                      )}
                      {onChangePlan && (
                        <DropdownMenuItem onClick={() => onChangePlan(tenant)}>
                          <Edit3 className="mr-2 h-4 w-4" />
                          Change Plan
                        </DropdownMenuItem>
                      )}
                      {onSuspendTenant && (
                        <DropdownMenuItem onClick={() => onSuspendTenant(tenant)}>
                          <Ban className="mr-2 h-4 w-4" />
                          {tenant.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                        </DropdownMenuItem>
                      )}
                      {onDeleteTenant && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onDeleteTenant(tenant)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing {(page - 1) * 20 + 1} to{' '}
          {Math.min(page * 20, data.total)} of {data.total} tenants
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            disabled={!data.hasMore}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
