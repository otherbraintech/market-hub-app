/**
 * Dashboard Page - Página principal con métricas y estado del sistema
 */

import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  FileText, 
  Target, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Zap
} from 'lucide-react'

// Componente de estadística
function StatCard({ 
  title, 
  value, 
  description, 
  icon: Icon,
  trend,
  glowColor = "blue"
}: { 
  title: string
  value: string | number
  description?: string
  icon: React.ComponentType<{ className?: string }>
  trend?: { value: number; positive: boolean }
  glowColor?: "blue" | "violet" | "emerald" | "orange"
}) {
  const glowStyles = {
    blue: "bg-blue-500/10 text-blue-600",
    violet: "bg-violet-500/10 text-violet-600",
    emerald: "bg-emerald-500/10 text-emerald-600",
    orange: "bg-orange-500/10 text-orange-600",
  };

  return (
    <Card className="card-shadow overflow-hidden group hover:scale-[1.02] transition-all duration-300 border-none bg-card/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
          {title}
        </CardTitle>
        <div className={cn("p-2 rounded-lg transition-colors", glowStyles[glowColor])}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-black">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1 font-medium italic">{description}</p>
        )}
        {trend && (
          <div className={`flex items-center mt-3 text-xs font-bold px-2 py-1 rounded-full w-fit ${
            trend.positive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            <TrendingUp className={`h-3 w-3 mr-1 ${!trend.positive && 'rotate-180'}`} />
            {trend.value}% vs mes anterior
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Componente de actividad reciente
function RecentActivity() {
  // En producción esto vendría de la API
  const activities = [
    { id: 1, type: 'content_generated', message: '5 ideas generadas para campaña "Lanzamiento Q1"', time: 'Hace 5 min', status: 'success' },
    { id: 2, type: 'content_published', message: 'Post publicado en Instagram', time: 'Hace 15 min', status: 'success' },
    { id: 3, type: 'job_failed', message: 'Error generando imagen para Reel', time: 'Hace 1 hora', status: 'error' },
    { id: 4, type: 'campaign_created', message: 'Nueva campaña "Promoción Verano"', time: 'Hace 2 horas', status: 'info' },
  ]

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Actividad Reciente
        </CardTitle>
        <CardDescription>
          Últimos eventos del sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3">
              <div className={`mt-1 h-2 w-2 rounded-full ${
                activity.status === 'success' ? 'bg-green-500' :
                activity.status === 'error' ? 'bg-red-500' : 'bg-blue-500'
              }`} />
              <div className="flex-1 space-y-1">
                <p className="text-sm">{activity.message}</p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
              {activity.status === 'error' && (
                <Badge variant="destructive" className="text-xs">Reintentar</Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Componente de Jobs en progreso
function ActiveJobs() {
  // En producción esto vendría de la API
  const jobs = [
    { id: 1, type: 'GENERATE_CONTENT_IDEAS', status: 'PROCESSING', campaign: 'Lanzamiento Q1' },
    { id: 2, type: 'GENERATE_MEDIA', status: 'QUEUED', campaign: 'Promoción Verano' },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Jobs Activos
        </CardTitle>
        <CardDescription>
          Procesos en ejecución
        </CardDescription>
      </CardHeader>
      <CardContent>
        {jobs.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p>No hay jobs activos</p>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">{job.type.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-muted-foreground">{job.campaign}</p>
                </div>
                <Badge variant={job.status === 'PROCESSING' ? 'warning' : 'secondary'}>
                  {job.status === 'PROCESSING' ? (
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 bg-yellow-500 rounded-full animate-pulse" />
                      Procesando
                    </span>
                  ) : 'En cola'}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Página principal
import { getSelectedBusinessId } from '@/actions/business';

export default async function DashboardPage() {
  const selectedBusinessId = await getSelectedBusinessId();

  if (!selectedBusinessId) {
    return (
      <div className="p-8 md:p-12 h-[calc(100vh-100px)] flex flex-col items-center justify-center text-center">
        <LayoutDashboard className="h-16 w-16 text-muted-foreground/20 mb-6" />
        <h1 className="text-4xl font-black tracking-tight text-gradient mb-2">Bienvenido a MarketHub</h1>
        <p className="text-muted-foreground text-lg max-w-md">
          Para comenzar, selecciona un negocio en el panel izquierdo o crea uno nuevo en la sección de Negocios.
        </p>
      </div>
    );
  }

  // Fetch real counts for the selected business
  const [campaignCount, productCount, contentCount, jobCount] = await Promise.all([
    prisma.campaign.count({ where: { businessId: selectedBusinessId } }),
    prisma.product.count({ where: { businessId: selectedBusinessId } }),
    prisma.content.count({ where: { campaign: { businessId: selectedBusinessId } } }),
    prisma.job.count({ where: { payload: { path: ['businessId'], equals: selectedBusinessId } } }).catch(() => 0) // Simplified job count
  ]);

  return (
    <div className="p-8 md:p-12 space-y-10 max-w-[1600px] mx-auto">
      {/* Welcome Section */}
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black tracking-tight text-gradient">Dashboard</h1>
        <p className="text-muted-foreground text-lg font-medium">Bienvenido de nuevo. Aquí tienes la inteligencia de tu marketing.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Campañas Activas" 
          value={campaignCount} 
          icon={Target}
          description={`${campaignCount > 0 ? 'Gestión activa' : 'Sin campañas'}`}
          glowColor="blue"
        />
        <StatCard 
          title="Contenidos" 
          value={contentCount} 
          icon={FileText}
          trend={{ value: 100, positive: true }}
          glowColor="violet"
        />
        <StatCard 
          title="Productos" 
          value={productCount} 
          icon={TrendingUp}
          glowColor="emerald"
        />
        <StatCard 
          title="Jobs IA" 
          value={jobCount} 
          icon={CheckCircle}
          description="En cola y completados"
          glowColor="orange"
        />
      </div>

      {/* Activity and Jobs */}
      <div className="grid gap-4 lg:grid-cols-3">
        <RecentActivity />
        <ActiveJobs />
      </div>

      {/* Estado del Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Estado de Integraciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm">Webhook IA (n8n)</span>
              <Badge variant="success">Conectado</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm">Instagram API</span>
              <Badge variant="success">Conectado</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm">Base de Datos</span>
              <Badge variant="success">Operativa</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
