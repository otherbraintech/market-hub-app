"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Target,
  Calendar,
  DollarSign,
  Users,
  Briefcase,
  Layers,
  Sparkles,
  Flame,
  Zap,
  TrendingUp,
  Megaphone,
  ListTodo,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ViewCampaignModalProps {
  campaign: {
    id: string;
    name: string;
    description: string | null;
    objective: string;
    startDate: Date | string;
    endDate: Date | string | null;
    status: string;
    budget: any; // Decimal
    channels: any; // Json list of channels
    targeting: any; // Json object
    objectiveDetails?: any;
    metrics?: any;
    strategy?: { name: string } | null;
    _count?: { contents: number };
    contents?: any[];
  };
}

const objectiveTranslations: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  AWARENESS: { 
    label: "Reconocimiento de Marca", 
    icon: <Megaphone className="h-4 w-4" />, 
    color: "text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    bg: "bg-blue-50 dark:bg-blue-950/30"
  },
  ENGAGEMENT: { 
    label: "Interacción / Comunidad", 
    icon: <Flame className="h-4 w-4" />, 
    color: "text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800",
    bg: "bg-orange-50 dark:bg-orange-950/30"
  },
  TRAFFIC: { 
    label: "Tráfico / Visitas", 
    icon: <TrendingUp className="h-4 w-4" />, 
    color: "text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    bg: "bg-emerald-50 dark:bg-emerald-950/30"
  },
  LEADS: { 
    label: "Generación de Leads", 
    icon: <Target className="h-4 w-4" />, 
    color: "text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800",
    bg: "bg-purple-50 dark:bg-purple-950/30"
  },
  SALES: { 
    label: "Ventas / Conversión", 
    icon: <DollarSign className="h-4 w-4" />, 
    color: "text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-800",
    bg: "bg-pink-50 dark:bg-pink-950/30"
  },
  RETENTION: { 
    label: "Fidelización / Retención", 
    icon: <Zap className="h-4 w-4" />, 
    color: "text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    bg: "bg-amber-50 dark:bg-amber-950/30"
  },
};

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/50 dark:text-gray-400 dark:border-gray-800",
  SCHEDULED: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-400 dark:border-blue-800",
  ACTIVE: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-400 dark:border-green-800",
  PAUSED: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-400 dark:border-yellow-800",
  COMPLETED: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/50 dark:text-purple-400 dark:border-purple-800",
};

const statusTranslations: Record<string, string> = {
  DRAFT: "Borrador",
  SCHEDULED: "Programada",
  ACTIVE: "Activa",
  PAUSED: "Pausada",
  COMPLETED: "Completada",
};

function safeParseJson(val: any): any {
  if (!val) return null;
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch (e) {
      return null;
    }
  }
  return val;
}

export function ViewCampaignModal({ campaign }: ViewCampaignModalProps) {
  const objectiveInfo = objectiveTranslations[campaign.objective] || {
    label: campaign.objective,
    icon: <Target className="h-4 w-4" />,
    color: "text-muted-foreground",
    bg: "bg-muted/10",
  };

  // Parse targeting details safely
  const targeting = safeParseJson(campaign.targeting);
  const locations = targeting?.locations || [];
  const interests = targeting?.interests || [];
  const ageRange = targeting?.ageRange || [];

  // Parse channels details safely
  const channelsRaw = safeParseJson(campaign.channels);
  const channels = Array.isArray(channelsRaw) ? channelsRaw : [];

  // Parse metrics
  const metrics = safeParseJson(campaign.metrics);

  // Parse objectiveDetails
  const objectiveDetails = safeParseJson(campaign.objectiveDetails);

  // Parse contents list
  const contents = campaign.contents || [];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full text-xs font-semibold" variant="outline" size="sm">
          Ver Campaña
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto border border-muted/20 rounded-2xl shadow-2xl p-0 bg-background flex flex-col">
        {/* CABECERA */}
        <div className="p-6 border-b border-muted/20 bg-muted/5 space-y-3 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={`${statusColors[campaign.status]} text-[10px] font-bold border`}>
              {statusTranslations[campaign.status] || campaign.status}
            </Badge>
            <Badge variant="outline" className={`text-[10px] font-bold border ${objectiveInfo.color} ${objectiveInfo.bg}`}>
              <span className="mr-1 shrink-0">{objectiveInfo.icon}</span>
              {objectiveInfo.label}
            </Badge>
          </div>
          <DialogTitle className="text-xl font-black tracking-tight text-foreground">
            {campaign.name}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Detalles técnicos e inversión estratégica asignada a esta campaña.
          </DialogDescription>
        </div>

        {/* CONTENIDO DEL MODAL */}
        <div className="p-6 space-y-6">
          {/* DESCRIPCIÓN */}
          {campaign.description && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Descripción</span>
              <p className="text-xs text-muted-foreground/90 leading-relaxed bg-muted/5 p-4 rounded-xl border border-muted/20 text-justify">
                {campaign.description}
              </p>
            </div>
          )}

          {/* INFORMACIÓN BÁSICA GRID */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Fechas */}
            <div className="flex items-center gap-3 bg-muted/5 p-3 rounded-xl border border-muted/20">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Calendar className="h-4.5 w-4.5" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Período de Ejecución</span>
                <span className="text-xs font-semibold text-foreground">
                  {format(new Date(campaign.startDate), "d 'de' MMMM", { locale: es })} -{" "}
                  {campaign.endDate
                    ? format(new Date(campaign.endDate), "d 'de' MMMM yyyy", { locale: es })
                    : "Continuo"}
                </span>
              </div>
            </div>

            {/* Presupuesto */}
            <div className="flex items-center gap-3 bg-muted/5 p-3 rounded-xl border border-muted/20">
              <div className="p-2 bg-violet-500/10 rounded-lg text-violet-650 dark:text-violet-400">
                <DollarSign className="h-4.5 w-4.5" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Presupuesto Asignado</span>
                <span className="text-xs font-bold text-foreground">
                  {campaign.budget ? `$${campaign.budget.toString()} USD` : "No especificado"}
                </span>
              </div>
            </div>

            {/* Estrategia Vinculada */}
            <div className="flex items-center gap-3 bg-muted/5 p-3 rounded-xl border border-muted/20">
              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-600">
                <Briefcase className="h-4.5 w-4.5" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Estrategia Vinculada</span>
                <span className="text-xs font-semibold text-foreground truncate max-w-[200px] block">
                  {campaign.strategy?.name || "Sin vincular"}
                </span>
              </div>
            </div>

            {/* Contenidos Generados */}
            <div className="flex items-center gap-3 bg-muted/5 p-3 rounded-xl border border-muted/20">
              <div className="p-2 bg-pink-500/10 rounded-lg text-pink-600">
                <Layers className="h-4.5 w-4.5" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Publicaciones Generadas</span>
                <span className="text-xs font-bold text-foreground">
                  {campaign._count?.contents || 0} publicaciones en el calendario
                </span>
              </div>
            </div>
          </div>

          {/* DETALLES DE OBJETIVO ADICIONALES */}
          {objectiveDetails && typeof objectiveDetails === 'object' && Object.keys(objectiveDetails).length > 0 && (
            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-violet-750 dark:text-violet-300 flex items-center gap-1.5 border-b border-muted/20 pb-1">
                <Target className="h-4 w-4 text-violet-650" /> Detalles del Objetivo
              </h4>
              <div className="grid gap-3 bg-muted/5 p-4 rounded-xl border border-muted/20 text-xs">
                {Object.entries(objectiveDetails).map(([key, val]: [string, any]) => (
                  <div key={key} className="flex justify-between py-1 border-b border-muted/10 last:border-0">
                    <span className="font-medium text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="font-bold text-foreground">{typeof val === 'object' ? JSON.stringify(val) : String(val)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TARGET SEGMENT */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-violet-750 dark:text-violet-300 flex items-center gap-1.5 border-b border-muted/20 pb-1">
              <Users className="h-4 w-4 text-violet-650" /> Segmentación de Audiencia
            </h4>
            {locations.length > 0 || interests.length > 0 || ageRange.length > 0 ? (
              <div className="grid gap-3 bg-muted/5 p-4 rounded-xl border border-muted/20">
                <div className="grid gap-3 sm:grid-cols-2">
                  {/* Ubicaciones */}
                  {locations.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Ubicación Geográfica</span>
                      <div className="flex flex-wrap gap-1">
                        {locations.map((loc: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-[10px] font-medium">
                            {loc}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Rango de Edad */}
                  {ageRange.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Rango de Edad</span>
                      <div>
                        <Badge variant="outline" className="text-[10px] font-bold border-violet-200 text-violet-600 dark:border-violet-850">
                          {ageRange[0]} a {ageRange[1]} años
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>

                {/* Intereses */}
                {interests.length > 0 && (
                  <div className="space-y-1 pt-2 border-t border-muted/20">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Intereses Clave</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {interests.map((interest: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-[10px] border-violet-250 text-violet-700 bg-violet-50/50 font-semibold dark:border-violet-900 dark:text-violet-300">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic bg-muted/5 p-4 rounded-xl border border-muted/20">
                No se ha especificado segmentación detallada para esta campaña.
              </p>
            )}
          </div>

          {/* CHANNELS DISTRIBUTION */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-violet-750 dark:text-violet-300 flex items-center gap-1.5 border-b border-muted/20 pb-1">
              <Sparkles className="h-4 w-4 text-violet-650" /> Distribución por Canal
            </h4>
            {channels.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {channels.map((ch: any, idx: number) => (
                  <Card key={idx} className={`p-3 rounded-xl border ${ch.isActive ? "border-violet-200 dark:border-violet-900 bg-background shadow-sm" : "border-muted/30 opacity-50 bg-background/50"}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold uppercase tracking-wider">{ch.platform}</span>
                      <Badge className={ch.isActive ? "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300" : "bg-muted text-muted-foreground"} variant="secondary">
                        {ch.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <DollarSign className="h-3.5 w-3.5 mr-0.5" />
                      <span className="font-medium text-foreground">${ch.budget || 0} USD</span>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic bg-muted/5 p-4 rounded-xl border border-muted/20">
                No se han configurado canales para esta campaña.
              </p>
            )}
          </div>

          {/* METRICS & PERFORMANCE */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-violet-750 dark:text-violet-300 flex items-center gap-1.5 border-b border-muted/20 pb-1">
              <TrendingUp className="h-4 w-4 text-violet-650" /> Métricas e Inversión (Resultados)
            </h4>
            {metrics && typeof metrics === 'object' && Object.keys(metrics).length > 0 ? (
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
                {metrics.impressions !== undefined && (
                  <div className="bg-muted/5 p-3 rounded-xl border border-muted/20 space-y-0.5">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Impresiones</span>
                    <span className="text-sm font-bold text-foreground">{Number(metrics.impressions).toLocaleString()}</span>
                  </div>
                )}
                {metrics.reach !== undefined && (
                  <div className="bg-muted/5 p-3 rounded-xl border border-muted/20 space-y-0.5">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Alcance</span>
                    <span className="text-sm font-bold text-foreground">{Number(metrics.reach).toLocaleString()}</span>
                  </div>
                )}
                {metrics.clicks !== undefined && (
                  <div className="bg-muted/5 p-3 rounded-xl border border-muted/20 space-y-0.5">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Clics</span>
                    <span className="text-sm font-bold text-foreground">{Number(metrics.clicks).toLocaleString()}</span>
                  </div>
                )}
                {metrics.engagement !== undefined && (
                  <div className="bg-muted/5 p-3 rounded-xl border border-muted/20 space-y-0.5">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Interacción</span>
                    <span className="text-sm font-bold text-foreground">{Number(metrics.engagement).toLocaleString()}</span>
                  </div>
                )}
                {metrics.conversions !== undefined && (
                  <div className="bg-muted/5 p-3 rounded-xl border border-muted/20 space-y-0.5">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Conversiones</span>
                    <span className="text-sm font-bold text-foreground">{Number(metrics.conversions).toLocaleString()}</span>
                  </div>
                )}
                {metrics.spend !== undefined && (
                  <div className="bg-muted/5 p-3 rounded-xl border border-muted/20 space-y-0.5">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Gasto Real</span>
                    <span className="text-sm font-bold text-foreground">${Number(metrics.spend).toLocaleString()} USD</span>
                  </div>
                )}
                {metrics.roas !== undefined && (
                  <div className="bg-muted/5 p-3 rounded-xl border border-muted/20 space-y-0.5 col-span-2 sm:col-span-1">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">ROAS</span>
                    <span className="text-sm font-bold text-foreground">{Number(metrics.roas).toFixed(2)}x</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic bg-muted/5 p-4 rounded-xl border border-muted/20">
                Las métricas aún no están disponibles para esta campaña (se sincronizarán automáticamente al activarse).
              </p>
            )}
          </div>

          {/* PLANIFICACIÓN DE PUBLICACIONES */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-violet-750 dark:text-violet-300 flex items-center gap-1.5 border-b border-muted/20 pb-1">
              <ListTodo className="h-4 w-4 text-violet-650" /> Planificación de Contenidos ({contents.length})
            </h4>
            {contents.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {contents.map((post: any, idx: number) => (
                  <Card key={idx} className="p-3.5 rounded-xl border border-muted/20 bg-background shadow-sm space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">{post.title}</span>
                      <Badge className="bg-violet-100 text-violet-750 dark:bg-violet-900 border-none font-bold text-[9px] uppercase shrink-0">
                        {post.type} - {post.channel}
                      </Badge>
                    </div>
                    {post.body && (
                      <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-3">{post.body}</p>
                    )}
                    {post.caption && (
                      <p className="text-[10px] text-slate-500 italic leading-relaxed line-clamp-2 border-t border-muted/5 pt-1">
                        {post.caption}
                      </p>
                    )}
                    <div className="text-[9px] text-muted-foreground flex items-center gap-1 pt-0.5">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      <span>Programada: {format(new Date(post.scheduledAt), "d 'de' MMMM", { locale: es })}</span>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic bg-muted/5 p-4 rounded-xl border border-muted/20">
                No hay publicaciones programadas para esta campaña.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
