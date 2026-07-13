/**
 * Dashboard Page - Página principal con métricas y estado del sistema
 */

import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  FileText, 
  Target, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Zap,
  Building2,
  Globe,
  ExternalLink,
  Sparkles,
  Calendar,
  Layers,
  Users,
  Compass,
  Link2,
  ChevronRight,
  MessageSquare,
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  Video
} from 'lucide-react'
import Link from 'next/link'

// Componente de estadística
function StatCard({ 
  title, 
  value, 
  description, 
  icon: Icon,
  glowColor = "blue"
}: { 
  title: string
  value: string | number
  description?: string
  icon: React.ComponentType<{ className?: string }>
  glowColor?: "blue" | "violet" | "emerald" | "orange"
}) {
  const glowStyles = {
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    orange: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  };

  return (
    <Card className="card-shadow overflow-hidden group hover:scale-[1.02] transition-all duration-300 border border-border/40 bg-card/60 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          {title}
        </CardTitle>
        <div className={cn("p-2.5 rounded-xl transition-colors", glowStyles[glowColor])}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-black tracking-tight">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1.5 font-medium italic">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

// Helper para iconos de redes sociales
function getChannelIcon(channel: any) {
  if (!channel) return <Globe className="h-3.5 w-3.5" />;
  
  let channelStr = "";
  if (typeof channel === 'string') {
    channelStr = channel;
  } else if (typeof channel === 'object' && channel !== null) {
    channelStr = channel.name || channel.channel || channel.id || "";
  }
  
  if (!channelStr) return <Globe className="h-3.5 w-3.5" />;

  switch (channelStr.toUpperCase()) {
    case 'FACEBOOK':
      return <Facebook className="h-3.5 w-3.5" />;
    case 'INSTAGRAM':
      return <Instagram className="h-3.5 w-3.5" />;
    case 'LINKEDIN':
      return <Linkedin className="h-3.5 w-3.5" />;
    case 'YOUTUBE':
      return <Youtube className="h-3.5 w-3.5" />;
    case 'TIKTOK':
      return <Video className="h-3.5 w-3.5" />;
    default:
      return <Globe className="h-3.5 w-3.5" />;
  }
}

function timeAgo(date: Date) {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'Hace un momento';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
  const days = Math.floor(hours / 24);
  return `Hace ${days} día${days > 1 ? 's' : ''}`;
}

import { getSelectedBusinessId } from '@/actions/business';
import { getSession } from '@/lib/auth';

import { EmptyBusinessState } from "@/components/business/empty-business-state";

export default async function DashboardPage() {
  const selectedBusinessId = await getSelectedBusinessId();
  const session = await getSession();
  const role = session?.user?.role || "USER";

  if (!selectedBusinessId) {
    return (
      <div className="p-8">
        <EmptyBusinessState />
      </div>
    );
  }

  // 1. Fetch de toda la información real
  const [
    business,
    campaigns,
    products,
    competitors,
    strategies,
    upcomingContent,
    allRecentJobs,
    recentCampaigns,
    recentReports,
    recentContents,
    strategyCount,
    scheduledContentCount,
    campaignCount,
    productCount,
    competitorCount
  ] = await Promise.all([
    prisma.business.findUnique({ where: { id: selectedBusinessId } }),
    prisma.campaign.findMany({ where: { businessId: selectedBusinessId }, orderBy: { createdAt: 'desc' }, take: 3, include: { strategy: true } }),
    prisma.product.findMany({ where: { businessId: selectedBusinessId }, orderBy: { createdAt: 'desc' }, take: 4 }),
    prisma.competitor.findMany({ where: { businessId: selectedBusinessId }, orderBy: { createdAt: 'desc' }, take: 4 }),
    prisma.marketingStrategy.findMany({ where: { businessId: selectedBusinessId }, orderBy: { createdAt: 'desc' }, take: 3 }),
    prisma.content.findMany({ 
      where: { 
        OR: [
          { campaign: { businessId: selectedBusinessId } },
          { product: { businessId: selectedBusinessId } }
        ],
        status: "SCHEDULED" 
      }, 
      orderBy: { scheduledAt: 'asc' }, 
      take: 4,
      include: { campaign: true }
    }),
    prisma.job.findMany({
      orderBy: { createdAt: 'desc' },
      take: 15
    }).catch(() => []),
    prisma.campaign.findMany({ where: { businessId: selectedBusinessId }, orderBy: { createdAt: 'desc' }, take: 4 }),
    prisma.analysisReport.findMany({ where: { entityId: selectedBusinessId }, orderBy: { createdAt: 'desc' }, take: 4 }),
    prisma.content.findMany({ where: { campaign: { businessId: selectedBusinessId } }, orderBy: { createdAt: 'desc' }, take: 4, include: { campaign: true } }),
    prisma.marketingStrategy.count({ where: { businessId: selectedBusinessId } }),
    prisma.content.count({ 
      where: { 
        OR: [
          { campaign: { businessId: selectedBusinessId } },
          { product: { businessId: selectedBusinessId } }
        ],
        status: "SCHEDULED" 
      } 
    }),
    prisma.campaign.count({ where: { businessId: selectedBusinessId } }),
    prisma.product.count({ where: { businessId: selectedBusinessId } }),
    prisma.competitor.count({ where: { businessId: selectedBusinessId } }),
  ]);

  // Filtrar trabajos de este negocio
  const recentJobs = allRecentJobs.filter(job => {
    try {
      const payloadStr = JSON.stringify(job.payload || {});
      return payloadStr.includes(selectedBusinessId);
    } catch {
      return false;
    }
  }).slice(0, 4);

  // Construir historial de actividades dinámico
  const activities = [
    ...recentCampaigns.map(c => ({
      id: `campaign-${c.id}`,
      type: 'campaign_created',
      message: `Nueva campaña "${c.name}" creada`,
      time: c.createdAt,
      status: 'info'
    })),
    ...recentReports.map(r => ({
      id: `report-${r.id}`,
      type: 'analysis_completed',
      message: `Análisis del canal ${r.channel} (${r.type === 'MY_BUSINESS' ? 'Propio' : 'Competidor'}) finalizado`,
      time: r.completedAt || r.createdAt,
      status: r.status === 'COMPLETED' ? 'success' : r.status === 'FAILED' ? 'error' : 'info'
    })),
    ...recentContents.map(co => ({
      id: `content-${co.id}`,
      type: 'content_updated',
      message: `Contenido "${co.title}" actualizado a estado ${co.status}`,
      time: co.updatedAt,
      status: co.status === 'PUBLISHED' ? 'success' : co.status === 'FAILED' ? 'error' : 'info'
    }))
  ]
  .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
  .slice(0, 4);

  // Extraer información del Brand Voice JSON si está disponible
  let voiceTone: string[] = [];
  let voicePersonality: string[] = [];
  let targetDemographics = "";
  let targetPsychographics = "";

  if (business?.brandVoice) {
    try {
      const bv = business.brandVoice as any;
      voiceTone = Array.isArray(bv.tone) ? bv.tone : (bv.tone?.split?.(',') || []);
      voicePersonality = Array.isArray(bv.personality) ? bv.personality : (bv.personality?.split?.(',') || []);
    } catch (e) {}
  }

  if (business?.targetAudience) {
    try {
      const ta = business.targetAudience as any;
      targetDemographics = ta.demographics || "";
      targetPsychographics = ta.psychographics || "";
    } catch (e) {}
  }

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-[1600px] mx-auto animate-fade-in">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-2xl bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-gradient">{business?.name}</h1>
            <p className="text-muted-foreground text-sm font-medium">Inteligencia estratégica y automatización de canales</p>
          </div>
        </div>
        <div className="flex gap-2">
          {business?.industry && (
            <Badge variant="secondary" className="px-3.5 py-1 text-xs font-bold uppercase tracking-wider bg-blue-600/10 text-blue-600 border-none dark:bg-blue-500/20 dark:text-blue-400">
              {business.industry}
            </Badge>
          )}
          {business?.website && (
            <a 
              href={business.website.startsWith('http') ? business.website : `https://${business.website}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 border border-border/50 rounded-xl bg-card/40 backdrop-blur-sm"
            >
              <Globe className="h-3.5 w-3.5" />
              Ver Sitio
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className={cn("grid gap-4 md:grid-cols-2", role !== "USER" && "lg:grid-cols-4")}>
        {role !== "USER" && (
          <StatCard 
            title="Campañas" 
            value={campaignCount} 
            icon={Target}
            description={`${campaigns.length > 0 ? `${campaigns.length} recientes` : 'Sin campañas activas'}`}
            glowColor="blue"
          />
        )}
        {role !== "USER" && (
          <StatCard 
            title="Estrategias de IA" 
            value={strategyCount} 
            icon={Sparkles}
            description="Pilares de contenido activos"
            glowColor="violet"
          />
        )}
        <StatCard 
          title="Contenido Programado" 
          value={scheduledContentCount} 
          icon={Calendar}
          description="Listos para publicación"
          glowColor="emerald"
        />
        {role !== "USER" ? (
          <StatCard 
            title="Competidores" 
            value={competitorCount} 
            icon={Users}
            description="Bajo monitoreo IA"
            glowColor="orange"
          />
        ) : (
          <StatCard 
            title="Centro de Tutoriales" 
            value="Guía Activa" 
            icon={Compass}
            description="Aprende el flujo de trabajo"
            glowColor="orange"
          />
        )}
      </div>

      {/* Main Grid Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Columna de la Izquierda: 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Estrategias y Campañas */}
          {/* Estrategias y Campañas / Guía de Inicio */}
          {/* Guía de Onboarding Paso a Paso para Cuentas Nuevas */}
          {(() => {
            const stepsState = [
              {
                title: "Configurar Negocio",
                desc: "Establece el rubro, público objetivo y canales principales.",
                isDone: !!business?.industry,
                link: `/business`,
                linkText: "Configurar"
              },
              {
                title: "Registrar Competidores",
                desc: "Agrega al menos un competidor para benchmarking de mercado.",
                isDone: competitorCount > 0,
                link: `/business`,
                linkText: "Registrar"
              },
              {
                title: "Generar Estrategia con IA",
                desc: "Crea directrices y pilares de contenido adaptados con Gemini.",
                isDone: strategyCount > 0,
                link: `/strategies`,
                linkText: "Generar"
              },
              {
                title: "Programar en el Calendario",
                desc: "Genera el plan de 30 días para automatizar tus redes.",
                isDone: scheduledContentCount > 0,
                link: `/calendar`,
                linkText: "Planificar"
              }
            ];

            const doneCount = stepsState.filter(s => s.isDone).length;
            const progressPercent = Math.round((doneCount / stepsState.length) * 100);

            if (progressPercent < 100) {
              return (
                <Card className="border border-violet-200/60 dark:border-violet-950/40 bg-gradient-to-br from-white via-violet-50/20 to-indigo-50/40 dark:from-slate-900 dark:via-slate-950 dark:to-indigo-950 text-slate-800 dark:text-slate-100 shadow-md card-shadow rounded-2xl overflow-hidden">
                  <CardHeader className="pb-3 bg-violet-50/10 dark:bg-black/30 border-b border-violet-100/50 dark:border-white/5">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                      <div>
                        <CardTitle className="text-base font-black tracking-tight flex items-center gap-2 text-violet-600 dark:text-violet-400">
                          <Sparkles className="h-4.5 w-4.5 text-violet-600 dark:text-violet-400 animate-pulse" />
                          <span>Pasos para activar tu Calendario Editorial ({doneCount} de 4)</span>
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Sigue esta guía interactiva paso a paso para poblar de contenido tus canales de difusión.
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-violet-600 dark:text-violet-400">{progressPercent}% completado</span>
                      </div>
                    </div>
                    {/* Barra de progreso */}
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-3 overflow-hidden border border-muted/20">
                      <div 
                        className="bg-gradient-to-r from-violet-500 to-indigo-500 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="grid gap-3">
                      {stepsState.map((step, idx) => (
                        <div 
                          key={idx} 
                          className={cn(
                            "flex items-center justify-between p-3.5 rounded-xl border transition-all duration-300",
                            step.isDone 
                              ? "bg-emerald-500/5 border-emerald-200/50 text-emerald-900 dark:text-emerald-300 dark:border-emerald-950/30" 
                              : "bg-background/40 border-border/30 hover:border-violet-300 dark:hover:border-violet-850"
                          )}
                        >
                          <div className="flex items-start gap-3 min-w-0 pr-4">
                            <div className={cn(
                              "h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-black border",
                              step.isDone 
                                ? "bg-emerald-500 text-white border-emerald-500" 
                                : "bg-muted text-muted-foreground border-border"
                            )}>
                              {step.isDone ? "✓" : idx + 1}
                            </div>
                            <div className="min-w-0 leading-tight">
                              <p className={cn("text-xs font-bold", step.isDone && "line-through opacity-70")}>{step.title}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{step.desc}</p>
                            </div>
                          </div>

                          {!step.isDone && (
                            <Button asChild size="sm" className="gradient-primary text-[10.5px] font-bold h-7 px-3.5 rounded-lg shrink-0 shadow-sm text-white">
                              <Link href={step.link}>
                                {step.linkText}
                              </Link>
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            }
            return null;
          })()}
            <Card className="border border-border/40 bg-card/30 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg font-bold">
                    <Compass className="h-5 w-5 text-blue-500" />
                    Estrategias y Campañas Activas
                  </CardTitle>
                  <CardDescription>
                    Planes de marketing activos y sus canales de difusión
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild className="text-xs font-bold gap-1 text-muted-foreground hover:text-foreground">
                  <Link href="/strategies">
                    Ver Todas <ChevronRight className="h-3 w-3" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {strategies.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border border-dashed rounded-xl bg-card/20">
                    <Sparkles className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30 animate-pulse" />
                    <p className="text-sm font-semibold">No se han generado estrategias aún</p>
                    <p className="text-xs mt-1">Usa la Inteligencia IA para crear tu primera estrategia.</p>
                    <Button variant="secondary" size="sm" className="mt-4 gap-1.5" asChild>
                      <Link href="/strategies">
                        <Sparkles className="h-3.5 w-3.5" /> Generar con IA
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {strategies.map((strat) => {
                      const stratCampaigns = campaigns.filter(c => c.strategyId === strat.id);
                      return (
                        <div key={strat.id} className="p-4 rounded-xl border border-border/30 bg-card/40 hover:bg-card/70 transition-colors">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-sm text-foreground">{strat.name}</h4>
                                {strat.isActive && (
                                  <Badge variant="secondary" className="text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider bg-green-500/10 text-green-600 border-none dark:bg-green-500/20 dark:text-green-400">
                                    Activo
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2 max-w-xl">
                                {strat.description || "Sin descripción detallada."}
                              </p>
                            </div>
                            
                            {/* Canales */}
                            <div className="flex gap-1">
                              {Array.isArray(strat.channels) && (strat.channels as any[]).map((chan, idx) => {
                                const titleStr = typeof chan === 'string' 
                                  ? chan 
                                  : (typeof chan === 'object' && chan !== null ? (chan.name || chan.channel || chan.id || `channel-${idx}`) : `channel-${idx}`);
                                return (
                                  <div key={idx} className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors" title={titleStr}>
                                    {getChannelIcon(chan)}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Campañas asociadas a esta estrategia */}
                          {stratCampaigns.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-border/20 space-y-2">
                              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">Campañas Vinculadas</span>
                              {stratCampaigns.map((camp) => (
                                <div key={camp.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-background/40">
                                  <span className="font-semibold">{camp.name}</span>
                                  <div className="flex items-center gap-2">
                                    <Badge className={cn("text-[9px] font-extrabold uppercase px-1.5 py-0.5", 
                                      camp.status === 'ACTIVE' ? 'bg-green-500/10 text-green-600 dark:text-green-400' :
                                      camp.status === 'DRAFT' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-muted text-muted-foreground'
                                    )}>
                                      {camp.status}
                                    </Badge>
                                    {camp.budget && (
                                      <span className="text-muted-foreground font-medium">${Number(camp.budget).toLocaleString()}</span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

          {/* Próximas Publicaciones */}
          <Card className="border border-border/40 bg-card/30 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg font-bold">
                  <Calendar className="h-5 w-5 text-emerald-500" />
                  Próximas Publicaciones
                </CardTitle>
                <CardDescription>
                  Contenidos programados en el calendario para su publicación
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild className="text-xs font-bold gap-1 text-muted-foreground hover:text-foreground">
                <Link href="/calendar">
                  Calendario <ChevronRight className="h-3 w-3" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {upcomingContent.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border border-dashed rounded-xl bg-card/20">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
                  <p className="text-sm font-semibold">No hay publicaciones programadas</p>
                  <p className="text-xs mt-1">Crea campañas y genera copies listos para programar.</p>
                </div>
              ) : (
                <div className="grid gap-3.5">
                  {upcomingContent.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3.5 rounded-xl border border-border/20 bg-card/40">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          {item.channel ? getChannelIcon(item.channel) : <FileText className="h-4 w-4" />}
                        </div>
                        <div>
                          <h4 className="font-bold text-xs">{item.title}</h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-muted-foreground">
                              Campaña: {item.campaign?.name || "General"}
                            </span>
                            <span className="text-[10px] font-black text-muted-foreground">•</span>
                            <span className="text-[10px] text-muted-foreground">
                              Tipo: <span className="font-bold uppercase">{item.type}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <Badge className="text-[10px] font-black bg-emerald-500/10 text-emerald-600 border-none px-2 py-0.5">
                          {item.scheduledAt ? new Date(item.scheduledAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : "Pendiente"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Competencia */}
          {role !== "USER" && (
            <Card className="border border-border/40 bg-card/30 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg font-bold">
                    <Users className="h-5 w-5 text-orange-500" />
                    Competidores Monitoreados
                  </CardTitle>
                  <CardDescription>
                    Marcas de la competencia y sus canales sociales activos
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild className="text-xs font-bold gap-1 text-muted-foreground hover:text-foreground">
                  <Link href="/competitors/analysis">
                    Ver Competencia <ChevronRight className="h-3 w-3" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {competitors.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border border-dashed rounded-xl bg-card/20">
                    <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
                    <p className="text-sm font-semibold">No has agregado competidores</p>
                    <p className="text-xs mt-1">Registra a tu competencia en la sección correspondiente para analizarlos.</p>
                  </div>
                ) : (
                  <div className="grid gap-3.5 sm:grid-cols-2">
                    {competitors.map((comp) => {
                      const hasWeb = !!comp.website;
                      const hasFb = !!comp.facebook;
                      const hasIg = !!comp.instagram;
                      const hasTk = !!comp.tiktok;
                      const hasLi = !!comp.linkedin;
                      
                      return (
                        <div key={comp.id} className="p-4 rounded-xl border border-border/25 bg-card/40 hover:bg-card/60 transition-colors flex flex-col justify-between gap-3">
                          <div>
                            <h4 className="font-bold text-xs text-foreground">{comp.name || "Competidor sin nombre"}</h4>
                            {comp.website && (
                              <span className="text-[10px] text-muted-foreground truncate block max-w-[200px] mt-0.5">
                                {comp.website}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/10">
                            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Canales</span>
                            <div className="flex gap-1">
                              {hasWeb && <div className="p-1 rounded bg-muted text-muted-foreground" title="Web"><Globe className="h-3 w-3" /></div>}
                              {hasFb && <div className="p-1 rounded bg-muted text-muted-foreground" title="Facebook"><Facebook className="h-3 w-3" /></div>}
                              {hasIg && <div className="p-1 rounded bg-muted text-muted-foreground" title="Instagram"><Instagram className="h-3 w-3" /></div>}
                              {hasTk && <div className="p-1 rounded bg-muted text-muted-foreground" title="TikTok"><Video className="h-3 w-3" /></div>}
                              {hasLi && <div className="p-1 rounded bg-muted text-muted-foreground" title="LinkedIn"><Linkedin className="h-3 w-3" /></div>}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Columna de la Derecha: 1/3 */}
        <div className="space-y-6">
          {/* Identidad de Marca / Brand DNA */}
          {role !== "USER" && (
            <Card className="border border-border/40 bg-card/30 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-bold">
                  <Sparkles className="h-4 w-4 text-violet-500" />
                  ADN de Marca (IA)
                </CardTitle>
                <CardDescription className="text-xs">
                  Voz e identidad analizada por inteligencia artificial
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {voiceTone.length === 0 && voicePersonality.length === 0 && !targetDemographics ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Compass className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30 animate-pulse" />
                    <p className="text-xs font-semibold">Identidad de marca no analizada</p>
                    <p className="text-[10px] mt-0.5">Usa "Mi Negocio IA" para extraer el tono y audiencia de tu sitio.</p>
                    <Button variant="secondary" size="sm" className="mt-3 text-[10px] h-8" asChild>
                      <Link href="/business/analysis">
                        Analizar Negocio
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <>
                    {voiceTone.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">Tono de Voz</span>
                        <div className="flex flex-wrap gap-1">
                          {voiceTone.map(t => (
                            <Badge key={t} variant="outline" className="text-[10px] font-bold px-2 py-0 bg-background/50 border-border/40 text-foreground">
                              {t}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {voicePersonality.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">Personalidad</span>
                        <div className="flex flex-wrap gap-1">
                          {voicePersonality.map(p => (
                            <Badge key={p} variant="outline" className="text-[10px] font-bold px-2 py-0 bg-background/50 border-border/40 text-foreground">
                              {p}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {targetDemographics && (
                      <div className="space-y-1 pt-2 border-t border-border/10">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">Público Objetivo</span>
                        <p className="text-xs text-foreground/80 leading-relaxed italic line-clamp-3">
                          "{targetDemographics}"
                        </p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Actividad Reciente */}
          <Card className="border border-border/40 bg-card/30 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <Zap className="h-4 w-4 text-amber-500" />
                Actividad Reciente
              </CardTitle>
              <CardDescription className="text-xs">
                Eventos recientes en tu cuenta
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No hay actividad reciente registrada.</p>
              ) : (
                <div className="space-y-3.5">
                  {activities.map((activity, idx) => (
                    <div key={idx} className="flex items-start gap-2.5">
                      <div className={cn("mt-1.5 h-2 w-2 rounded-full shrink-0", 
                        activity.status === 'success' ? 'bg-green-500' :
                        activity.status === 'error' ? 'bg-red-500' : 'bg-blue-500'
                      )} />
                      <div className="space-y-0.5">
                        <p className="text-xs text-foreground font-semibold leading-normal">{activity.message}</p>
                        <p className="text-[10px] text-muted-foreground font-medium">{timeAgo(activity.time)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Jobs en Progreso */}
          {role !== "USER" && (
            <Card className="border border-border/40 bg-card/30 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-bold">
                  <Clock className="h-4 w-4 text-blue-500" />
                  Jobs & Procesos
                </CardTitle>
                <CardDescription className="text-xs">
                  Tareas en ejecución e IA en cola
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentJobs.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    <CheckCircle className="h-6 w-6 mx-auto mb-1.5 text-green-500/80" />
                    <p className="text-xs font-semibold">Sin tareas pendientes</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentJobs.map((job) => (
                      <div key={job.id} className="flex items-center justify-between p-2.5 bg-muted/30 rounded-xl border border-border/10 text-xs">
                        <div>
                          <p className="font-bold text-[11px] uppercase tracking-wide text-foreground">
                            {job.type.replace(/_/g, ' ')}
                          </p>
                          <p className="text-[9px] text-muted-foreground font-medium mt-0.5">
                            {timeAgo(job.createdAt)}
                          </p>
                        </div>
                        <Badge className={cn("text-[9px] font-extrabold uppercase px-1.5 py-0.5",
                          job.status === 'PROCESSING' ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-none' :
                          job.status === 'SUCCESS' ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-none' :
                          job.status === 'FAILED' ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-none' : 'bg-muted text-muted-foreground'
                        )}>
                          {job.status === 'PROCESSING' ? (
                            <span className="flex items-center gap-1">
                              <span className="h-1.5 w-1.5 bg-yellow-500 rounded-full animate-ping" />
                              Procesando
                            </span>
                          ) : job.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Estado de Integraciones */}
          <Card className="border border-border/40 bg-card/30 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <AlertCircle className="h-4 w-4 text-emerald-500" />
                Integraciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2.5">
                <div className="flex items-center justify-between p-2.5 bg-muted/20 border border-border/10 rounded-xl text-xs">
                  <span className="font-semibold text-muted-foreground">Webhook IA (n8n)</span>
                  <Badge className="bg-green-500/10 text-green-600 border-none text-[9px] font-black">CONECTADO</Badge>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-muted/20 border border-border/10 rounded-xl text-xs">
                  <span className="font-semibold text-muted-foreground">Base de Datos</span>
                  <Badge className="bg-green-500/10 text-green-600 border-none text-[9px] font-black">OPERATIVA</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
