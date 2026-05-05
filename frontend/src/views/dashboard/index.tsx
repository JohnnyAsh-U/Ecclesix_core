import { Main } from '@/components/layout/main'
import { DashboardMetricsGrid } from './components/metrics-grid'
import { SystemResources } from './components/system-resources'
import { useRevenueData } from '@/hooks/control-plane'
import { SignupsLineChart } from './components/signups-line-chart'
import RevenueBarChart from './components/revenue-bar-chart'
import { SystemHealth } from './components/system-health'


type Props = {}

export default function Dashboard({ }: Props) {
    const { data: revenueData, isLoading } = useRevenueData()


    // Format data for display
    const chartData = revenueData?.map((item) => ({
        ...item,
        formattedRevenue: `$${(item.revenue / 1000).toFixed(0)}k`,
    })) || []

    return (
        <Main>
            <div>
                <h1 className='text-2xl font-bold tracking-tight'>Tableau de Bord</h1>
                <p className='text-muted-foreground'>
                    Les Stats
                </p>
            </div>
            {/* Key Metrics */}
            <section className='mt-2'>
                <DashboardMetricsGrid />
            </section>
            <div className='grid grid-cols-3 gap-4 mt-6'>
                <div className='col-span-2 lg:col-span-2'>
                    <RevenueBarChart data={chartData} isLoading={isLoading} />
                </div>
                <div className='col-span-1 lg:col-span-1'>
                    <SystemResources />
                </div>
            </div>
            <div className='grid grid-cols-3 gap-4 mt-6'>
                <div className='col-span-2 lg:col-span-2'>
                    <SignupsLineChart data={chartData} isLoading={isLoading} />
                </div>
                <div className='col-span-1 lg:col-span-1'>
                    <SystemHealth />
                </div>
            </div>
        </Main>
    )
}

