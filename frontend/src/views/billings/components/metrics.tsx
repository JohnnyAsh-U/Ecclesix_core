/**
 * Billing Metrics Grid Component
 * Displays key billing metrics
 */


import { useBillingStats } from '@/hooks/billing.hooks'
import {
  Users,
  AlertCircle,
  CurrencyIcon,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function BillingMetricsGrid() {
  const { data: metrics, isLoading } = useBillingStats()


  if (isLoading)
    return <div className="text-center py-8"><Skeleton className="h-20 w-full" /></div>

  if (!metrics)
    return <div className="text-center py-8">Échec du chargement des métriques</div>

  const items = [
    {
      label: 'Revenu Mensuel',
      value: `${parseFloat(metrics.monthly_revenue).toLocaleString()} ${metrics.currency}`,
      icon: <CurrencyIcon className="h-6 w-6" />,
    },
    {
      label: 'Revenu Annuel',
      value: `${parseFloat(metrics.annual_revenue).toLocaleString()} ${metrics.currency}`,
      icon: <CurrencyIcon className="h-6 w-6" />,
    },
    {
      label: 'Clients Actifs',
      value: metrics.active_tenants_count.toLocaleString(),
      icon: <Users className="h-6 w-6" />,
    },
    {
      label: 'Clients Inactifs',
      value: metrics.inactive_tenants_count.toLocaleString(),
      icon: <AlertCircle className="h-6 w-6" />,
    },
  ]

  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
      {items.map((item, idx) => (
        <Card key={idx} className="border">
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              {item.label}
              {isLoading && <Skeleton className="h-4 w-2/3" />}
            </CardTitle>
            {item.icon}
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{item.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}