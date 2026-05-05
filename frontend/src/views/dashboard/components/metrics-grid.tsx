/**
 * Dashboard Metrics Grid Component
 * Displays key platform metrics
 */


import { useBusinessMetrics } from '@/hooks/control-plane'
import {
  BarChart3,
  Users,
  TrendingUp,
  AlertCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function DashboardMetricsGrid() {
  const { data: metrics, isLoading } = useBusinessMetrics()


  if (!metrics)
    return <div className="text-center py-8">Failed to load metrics</div>

  const items = [
    {
      label: 'Active Tenants',
      value: metrics.activeTenants.toLocaleString(),
      icon: <Users className="h-6 w-6" />,
      trend: { value: 12, direction: 'up' as const },
    },
    {
      label: 'Monthly Active Users',
      value: metrics.mau.toLocaleString(),
      icon: <BarChart3 className="h-6 w-6" />,
      trend: { value: 8, direction: 'up' as const },
    },
    {
      label: 'Trial Conversions',
      value: metrics.trialConversions,
      icon: <TrendingUp className="h-6 w-6" />,
      trend: { value: 5, direction: 'up' as const },
    },
    {
      label: 'Churn Rate',
      value: `${metrics.churnedTenants}`,
      icon: <AlertCircle className="h-6 w-6" />,
      trend: { value: 2, direction: 'down' as const },
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
            <p className={`text-xs ${item.trend.direction == 'up' ? 'text-green-600' : 'text-red-600'}`}>
              +{item.trend.value}% from last month
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
