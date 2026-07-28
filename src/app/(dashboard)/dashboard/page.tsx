/**
 * Dashboard CRM - Centro de Comando de Agencia & Pymes
 */

import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Building2, 
  Users, 
  Calendar, 
  Sparkles, 
  Target, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  Plus, 
  ArrowRight, 
  Zap, 
  Cpu, 
  Bot, 
  Layers, 
  Globe, 
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  FileText
} from "lucide-react";
import Link from "next/link";
import { getSelectedBusinessId, getBusinesses } from "@/actions/business";
import { getSession } from "@/lib/auth";
import { EmptyBusinessState } from "@/components/business/empty-business-state";

function StatCard({ 
  title, 
  value, 
  description, 
  icon: Icon,
  color = "cyan"
}: { 
  title: string;
  value: string | number;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  color?: "cyan" | "violet" | "emerald" | "amber";
}) {
  const colorMap = {
    cyan: { text: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
    violet: { text: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
    emerald: { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    amber: { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  };

  const style = colorMap[color];

  return (
    <Card className="border border-slate-800 bg-[#0D1526] text-slate-100 hover:border-slate-700 transition-all duration-300 shadow-xl rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          {title}
        </CardTitle>
        <div className={cn("p-2.5 rounded-xl border", style.bg, style.border)}>
          <Icon className={cn("h-4 w-4", style.text)} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-black tracking-tight text-white">{value}</div>
        {description && (
          <p className="text-xs text-slate-400 mt-1.5 font-medium">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

function AgentStatusCard({
  name,
  role,
  icon: Icon,
  status,
  color
}: {
  name: string;
  role: string;
  icon: React.ComponentType<{ className?: string }>;
  status: "ACTIVE" | "IDLE";
  color: string;
}) {
  return (
    <div className="p-3.5 rounded-xl bg-[#132035] border border-slate-800 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div
          className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}
        >
          <Icon className="h-4.5 w-4.5" style={{ color }} />
        </div>
        <div>
          <h5 className="text-xs font-bold text-white leading-tight">{name}</h5>
          <p className="text-[10.5px] text-slate-400 mt-0.5">{role}</p>
        </div>
      </div>
      <Badge
        variant="outline"
        className={cn(
          "text-[9.5px] font-black uppercase px-2 py-0.5 border",
          status === "ACTIVE" 
            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 animate-pulse" 
            : "bg-slate-800 text-slate-400 border-slate-700"
        )}
      >
        {status === "ACTIVE" ? "Operativo" : "En Espera"}
      </Badge>
    </div>
  );
}

export default async function DashboardPage() {
  const selectedBusinessId = await getSelectedBusinessId();
  const session = await getSession();
  const userRole = session?.user?.role || "USER";

  const allBusinesses = await getBusinesses();

  if (!allBusinesses || allBusinesses.length === 0) {
    return (
      <div className="p-8">
        <EmptyBusinessState />
      </div>
    );
  }

  const activeBusinessId = selectedBusinessId || allBusinesses[0].id;

  const [
    campaignCount,
    strategyCount,
    contentCount,
    competitorCount,
    recentContents,
    recentCampaigns
  ] = await Promise.all([
    prisma.campaign.count({ where: { businessId: activeBusinessId } }),
    prisma.marketingStrategy.count({ where: { businessId: activeBusinessId } }),
    prisma.content.count({ 
      where: { 
        OR: [
          { campaign: { businessId: activeBusinessId } },
          { product: { businessId: activeBusinessId } }
        ]
      } 
    }),
    prisma.competitor.count({ where: { businessId: activeBusinessId } }),
    prisma.content.findMany({
      where: {
        OR: [
          { campaign: { businessId: activeBusinessId } },
          { product: { businessId: activeBusinessId } }
        ]
      },
      take: 4,
      orderBy: { createdAt: "desc" },
      include: { campaign: true }
    }),
    prisma.campaign.findMany({
      where: { businessId: activeBusinessId },
      take: 3,
      orderBy: { createdAt: "desc" }
    })
  ]);

  const monthName = new Date().toLocaleDateString("es-ES", { month: "long", year: "numeric" });

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-[1600px] mx-auto animate-fade-in text-slate-100">
      {/* Executive Command Center Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-cyan-400 animate-pulse" />
            <span className="text-[11px] font-black text-cyan-400 uppercase tracking-widest">
              Centro de Comando
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">
            Dashboard General
          </h1>
          <p className="text-xs text-slate-400 capitalize">
            {monthName} • {allBusinesses.length} negocio(s) registrado(s) • Todos los sistemas operativos
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button asChild className="gradient-primary text-xs font-bold gap-2 rounded-xl shadow-lg shadow-blue-950/40">
            <Link href={activeBusinessId ? `/onboarding?businessId=${activeBusinessId}&preview=true` : "/onboarding"}>
              <Plus className="h-4 w-4" /> Nuevo Negocio
            </Link>
          </Button>
        </div>
      </div>

      {/* Agency Stats Bar */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Negocios Registrados"
          value={allBusinesses.length}
          description="Perfiles de marca activos"
          icon={Building2}
          color="cyan"
        />
        <StatCard
          title="Planes Estratégicos"
          value={strategyCount}
          description="Estrategias de 8 pilares IA"
          icon={Target}
          color="violet"
        />
        <StatCard
          title="Piezas de Contenido"
          value={contentCount}
          description="Contenidos en el calendario"
          icon={Calendar}
          color="emerald"
        />
        <StatCard
          title="Competidores Monitoreados"
          value={competitorCount}
          description="Rivalidad y benchmarks de mercado"
          icon={Users}
          color="amber"
        />
      </div>

      {/* Main Command Center Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Businesses List (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-slate-800 bg-[#0D1526] text-slate-100 shadow-xl rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-slate-800/80 bg-[#080E1A]/60 flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-base font-extrabold tracking-tight text-white flex items-center gap-2">
                  <Building2 className="h-4.5 w-4.5 text-cyan-400" />
                  Lista de Negocios
                </CardTitle>
                <CardDescription className="text-xs text-slate-400 mt-0.5">
                  Directorio de negocios con acceso directo al perfil y pipeline de operaciones.
                </CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" className="text-xs font-bold text-cyan-400 hover:text-cyan-300 gap-1">
                <Link href="/business">
                  Ver Todos <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardHeader>

            <CardContent className="p-0">
              <div className="divide-y divide-slate-800/60">
                {allBusinesses.slice(0, 5).map((b) => (
                  <div
                    key={b.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#132035]/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-black text-white text-sm shrink-0">
                        {b.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-100">{b.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-slate-400 font-medium">{b.industry || "General"}</span>
                          {b.website && (
                            <span className="text-[10px] text-cyan-400/80 flex items-center gap-1">
                              • <Globe className="h-3 w-3" /> {b.website.replace(/^https?:\/\//, '')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button asChild size="sm" variant="outline" className="h-8 text-xs font-bold border-cyan-500/20 text-slate-300 hover:text-white bg-slate-900/60 gap-1.5">
                        <Link href={`/business/${b.id}`}>
                          <Layers className="h-3.5 w-3.5 text-cyan-400" /> Abrir Negocio & Pipeline
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Content Table */}
          <Card className="border border-slate-800 bg-[#0D1526] text-slate-100 shadow-xl rounded-2xl">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-extrabold text-white flex items-center gap-2">
                  <Calendar className="h-4.5 w-4.5 text-emerald-400" />
                  Próximas Piezas del Calendario
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Contenidos generados listos para su publicación en redes.
                </CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" className="text-xs font-bold text-cyan-400 hover:text-cyan-300">
                <Link href="/calendar">
                  Ver Calendario <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentContents.length === 0 ? (
                <div className="text-center py-8 text-slate-500 border border-dashed border-slate-800 rounded-xl bg-slate-900/30">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-slate-600" />
                  <p className="text-xs font-semibold">Sin publicaciones programadas aún</p>
                  <p className="text-[11px] text-slate-500 mt-1">Ejecuta el paso 3 del pipeline para construir tu calendario.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentContents.map((item) => (
                    <div key={item.id} className="p-3 rounded-xl border border-slate-800 bg-[#132035]/60 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <h5 className="font-bold text-xs text-slate-200">{item.title}</h5>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            Campaña: {item.campaign?.name || "General"} • Tipo: <span className="uppercase font-bold">{item.type}</span>
                          </span>
                        </div>
                      </div>
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-bold">
                        {item.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: AI Agents Status & System Operations (1/3) */}
        <div className="space-y-6">
          {/* AI Agents Operational Status */}
          <Card className="border border-slate-800 bg-[#0D1526] text-slate-100 shadow-xl rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-extrabold text-white flex items-center gap-2">
                <Cpu className="h-4.5 w-4.5 text-cyan-400 animate-pulse" />
                Agentes IA Operativos
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Estado de la fuerza laboral digital autónoma.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <AgentStatusCard
                name="Scanner Agent"
                role="Extracción Web y Redes Sociales"
                icon={Cpu}
                status="ACTIVE"
                color="#00B4D8"
              />
              <AgentStatusCard
                name="Growth Strategist"
                role="Modelado de 8 Pilares Estratégicos"
                icon={Sparkles}
                status="ACTIVE"
                color="#7C3AED"
              />
              <AgentStatusCard
                name="Editorial Architect"
                role="Generación 60-25-15 y Copies"
                icon={ShieldCheck}
                status="ACTIVE"
                color="#10B981"
              />
              <AgentStatusCard
                name="Competitor Intelligence"
                role="Benchmarking y Matrices FODA"
                icon={Users}
                status="ACTIVE"
                color="#F59E0B"
              />
            </CardContent>
          </Card>

          {/* Quick Access Card */}
          <Card className="border border-cyan-500/20 bg-gradient-to-br from-[#0D1526] to-[#132035] text-slate-100 shadow-xl rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-black text-cyan-400 uppercase tracking-wider">
              <Zap className="h-4 w-4" /> Acceso Rápido a Operaciones
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Selecciona un negocio para abrir su perfil y ejecutar los 3 pasos del pipeline autónomo.
            </p>
            <Button asChild className="w-full text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950">
              <Link href="/business">
                Ir a Mis Negocios <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
