
import { useState } from 'react'
import { useTenantsStorage, useStorageStats } from '@/hooks/storage.hooks'
import { Main } from '@/components/layout/main'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TableSkeleton } from '@/components/shared/data-display'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Eye, HardDrive, File, Video, Music, FileText, Image } from 'lucide-react'
import { useGetStorage } from '@/hooks/tenant.hooks'

type Props = {}

// ========================================================================
// METRIC CARD COMPONENT
// ========================================================================
interface MetricCardProps {
  label: string
  value: string | number
  unit?: string
  icon?: React.ReactNode
}

function MetricCard({ label, value, unit, icon }: MetricCardProps) {
  const isLoading = value === undefined || value === null
  return (
    <Card className="border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {label}
          {isLoading && <Skeleton className="h-4 w-2/3" />}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
          {unit && <span className="text-sm text-muted-foreground ml-2">{unit}</span>}
        </div>
      </CardContent>
    </Card>
  )
}

// ========================================================================
// OVERVIEW TAB
// ========================================================================

function OverviewTab() {
  const { data: stats, isLoading: statsLoading } = useStorageStats()
  const { data: tenants, isLoading: tenantsLoading } = useTenantsStorage()

  if (statsLoading || tenantsLoading) {
    return <TableSkeleton rows={6} />
  }

  if (!stats || !tenants) {
    return <div className="text-center py-8 text-gray-600">Erreur lors du chargement des données</div>
  }

  // Extract stats
  const totalSize = stats.summary?.total_files_size_gb || 0
  const totalFiles = stats.summary?.total_files_count || 0

  // Count files by type
  const breakdown = stats.breakdown_by_type || []
  const videosCount = breakdown.find((b: any) => b.media_type === 'video')?.count || 0
  const audioCount = breakdown.find((b: any) => b.media_type === 'audio')?.count || 0
  const docsCount = breakdown.find((b: any) => b.media_type === 'document')?.count || 0
  const photoCount = breakdown.find((b: any) => b.media_type === 'photo')?.count || 0

  // Prepare bar chart data (tenants)
  const barChartData = tenants.map((t: any) => ({
    name: t.name,
    storage: parseFloat(t.total_files_size_gb || 0),
  }))

  // Prepare pie chart data (media types)
  const pieChartData = breakdown.map((b: any) => ({
    name: b.media_type.charAt(0).toUpperCase() + b.media_type.slice(1),
    value: b.count,
    size: b.size,
  }))

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b']

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-6">
        <MetricCard label="Taille totale" value={totalSize.toFixed(2)} unit="GB" icon={<HardDrive className="h-6 w-6" />} />
        <MetricCard label="No. des fichiers" value={totalFiles} icon={<File className="h-6 w-6" />} />
        <MetricCard label="Vidéos" value={videosCount} icon={<Video className="h-6 w-6" />} />
        <MetricCard label="Audio" value={audioCount} icon={<Music className="h-6 w-6" />} />
        <MetricCard label="Documents" value={docsCount} icon={<FileText className="h-6 w-6" />} />
        <MetricCard label="Photos" value={photoCount} icon={<Image className="h-6 w-6" />} />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Bar Chart - 2/3 width */}
        <Card className="md:col-span-2 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Stockage par locataire (GB)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="storage" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Pie Chart - 1/3 width */}
        <Card className="rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Répartition par type</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieChartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {pieChartData.map((_: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  )
}

// ========================================================================
// DETAIL MODAL COMPONENT
// ========================================================================

interface DetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenant: any | null
}

function TenantDetailModal({ open, onOpenChange, tenant }: DetailModalProps) {
  if (!tenant) return null

  const { data, isLoading } = useGetStorage(tenant.tenant_id)

  const summary = data?.summary
  const byType = data?.breakdown_by_type || []
  const byChurch = data?.breakdown_by_church || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl w-full max-h-[70vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Détails de stockage: {tenant.name}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="p-6"><Skeleton className="h-20 w-full" /></div>
        ) : (
          <div className="space-y-4 p-6">
            <div>
              <p className="text-sm font-medium text-gray-600">Schéma</p>
              <p className="text-gray-900">{tenant.schema_name}</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Nombre de fichiers</p>
                <p className="text-2xl font-bold">{summary?.total_files_count ?? 0}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Taille totale</p>
                <p className="text-2xl font-bold">{(summary?.total_files_size_gb ?? 0).toFixed(2)} GB</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">En MB</p>
                <p className="text-2xl font-bold">{(summary?.total_files_size_mb ?? 0).toFixed(2)} MB</p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-2">Répartition par type</h4>
              <div className="grid gap-2 md:grid-cols-2">
                {byType.length === 0 && <p className="text-sm text-gray-600">Aucune donnée</p>}
                {byType.map((t: any, idx: number) => (
                  <div key={idx} className="border rounded p-2">
                    <p className="text-sm font-medium">{t.media_type}</p>
                    <p className="text-sm">{t.count} fichiers — {(t.size/1024/1024).toFixed(2)} MB</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-2">Répartition par église</h4>
              {byChurch.length === 0 ? (
                <p className="text-sm text-gray-600">Aucune donnée</p>
              ) : (
                <div className="rounded border">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead>Église</TableHead>
                        <TableHead>Fichiers</TableHead>
                        <TableHead>Taille</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {byChurch.map((c: any) => (
                        <TableRow key={c.id}>
                          <TableCell>{c.church_name}</TableCell>
                          <TableCell>{c.files_count}</TableCell>
                          <TableCell>{(c.total_files_size_mb || 0).toFixed(2)} MB</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ========================================================================
// FILE EXPLORER TAB
// ========================================================================

function FileExplorerTab() {
  const { data: tenants, isLoading } = useTenantsStorage()
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<any | null>(null)

  const handleDetail = (tenant: any) => {
    setSelectedTenant(tenant)
    setDetailOpen(true)
  }

  if (isLoading) return <TableSkeleton rows={5} />
  if (!tenants || tenants.length === 0) {
    return <div className="text-center py-8 text-gray-600">Aucun locataire trouvé</div>
  }

  return (
    <>
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead>Église / Locataire</TableHead>
              <TableHead>Nombre de fichiers</TableHead>
              <TableHead>Taille totale</TableHead>
              <TableHead className="w-10">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.map((tenant: any) => (
              <TableRow key={tenant.tenant_id}>
                <TableCell className="font-medium">{tenant.name}</TableCell>
                <TableCell>{tenant.total_files_count}</TableCell>
                <TableCell>
                  {tenant.total_files_size_gb.toFixed(2)} GB ({tenant.total_files_size_mb.toFixed(2)} MB)
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDetail(tenant)}
                    aria-label="Détails"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <TenantDetailModal open={detailOpen} onOpenChange={setDetailOpen} tenant={selectedTenant} />
    </>
  )
}

// ========================================================================
// MAIN STORAGE PAGE
// ========================================================================

export default function Storage({}: Props) {
  return (
    <Main>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Stockage</h1>
        <p className="text-muted-foreground">
          Gestion et surveillance du stockage des fichiers
        </p>
      </div>

      <Tabs orientation="horizontal" defaultValue="overview" className="space-y-4">
        <div className="w-full overflow-x-auto pb-2">
          <TabsList>
            <TabsTrigger value="overview">Aperçu</TabsTrigger>
            <TabsTrigger value="explorer">Explorateur de fichiers</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-4">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Vue d'ensemble du stockage et répartition par locataire
            </p>
          </div>
          <OverviewTab />
        </TabsContent>

        <TabsContent value="explorer" className="space-y-4">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Liste de tous les locataires et leur utilisation de stockage
            </p>
          </div>
          <FileExplorerTab />
        </TabsContent>
      </Tabs>
    </Main>
  )
}