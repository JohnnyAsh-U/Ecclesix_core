import { useSystemMetrics } from '@/hooks/control-plane'
import { format } from 'date-fns/format'
import { parseISO } from 'date-fns/parseISO'


interface StatItemProps {
  label: string
  value: string | number
  unit?: string
  isMoney?: boolean
  isPercentage?: boolean
}


export function formatTime(date: string | Date, formatStr: string = 'HH:mm:ss'): string {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, formatStr)
  } catch {
    return 'Invalid time'
  }
}
export function StatItem({ label, value, unit, isMoney, isPercentage }: StatItemProps) {
  let displayValue = value

  if (isMoney) {
    displayValue = typeof value === 'number' ? `$${value.toLocaleString()}` : value
  } else if (isPercentage) {
    displayValue = typeof value === 'number' ? `${value}%` : value
  }

  return (
    <div>
      <p className="text-sm text-gray-600">{label}</p>
      <p className="text-lg font-semibold text-gray-900 mt-1">
        {displayValue}
        {unit && <span className="text-sm text-gray-500 ml-1">{unit}</span>}
      </p>
    </div>
  )
}

export function SystemHealth() {
  const { data: metrics } = useSystemMetrics()

  // if (isLoading) return <CardSkeleton count={1} />

  if (!metrics) return null

  return (


    <div className="bg-white rounded-lg border p-6">
      <h3 className="text-lg font-semibold mb-6">API & Database</h3>
      <div className="space-y-4">
        <StatItem
          label="API Latency"
          value={`${metrics.apiLatencyMs}ms`}
          unit="average"
        />
        <StatItem
          label="Queue Depth"
          value={metrics.queueDepth}
          unit="jobs pending"
        />
        <StatItem
          label="DB Slow Queries"
          value={metrics.dbSlowQueriesCount}
          unit="last hour"
        />
        <StatItem
          label="Last Updated"
          value={formatTime(metrics.timestamp, 'HH:mm:ss')}
        />
      </div>
    </div>
  )
}
