import { useSystemMetrics } from '@/hooks/control-plane'


function HealthBar({ value, label }: { value: number; label: string }) {
  const getColor = (v: number) => {
    if (v > 80) return 'bg-red-500'
    if (v > 60) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm text-gray-600">{label}</span>
        <span className="text-sm font-medium text-gray-900">{value}%</span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${getColor(value)} transition-all`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

export function SystemResources() {
  const { data: metrics, isLoading } = useSystemMetrics()

  if (!metrics) return null

  return (
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-6">System Resources</h3>
        <div className="space-y-4">
            {isLoading ? (
              <>
                <HealthBar value={0} label="CPU Usage" />
                <HealthBar value={0} label="Memory Usage" />
                <HealthBar value={0} label="Disk Usage" />
              </>
            ) : (
              <>
                <HealthBar value={metrics.cpu} label="CPU Usage" />
                <HealthBar value={metrics.ram} label="Memory Usage" />
                <HealthBar value={metrics.disk} label="Disk Usage" />
              </>
            )}
        </div>
      </div>
    )
}
