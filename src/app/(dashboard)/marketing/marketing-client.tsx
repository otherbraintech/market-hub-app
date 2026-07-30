"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Loader2, Target, Lightbulb, Share2, Calendar as CalendarIcon, Megaphone, ArrowRight, ShieldAlert, Award } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ViewStrategyDialog } from "@/components/strategy/view-strategy-dialog";
import { ViewCampaignModal } from "@/components/campaigns/view-campaign-modal";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface MarketingClientProps {
  strategies: any[];
  campaigns: any[];
  selectedBusinessId: string;
  businessName: string;
  lastCascadeGeneratedAt: string | null;
  initialAutoGenerateEnabled: boolean;
}

export function MarketingClient({
  strategies,
  campaigns,
  selectedBusinessId,
  businessName,
  lastCascadeGeneratedAt,
}: MarketingClientProps) {
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  const router = useRouter();

  // Helper to format last cascade run / cooldown
  const getCooldownStatus = () => {
    if (!lastCascadeGeneratedAt) return null;
    const lastRun = new Date(lastCascadeGeneratedAt);
    const timeSince = Date.now() - lastRun.getTime();
    const oneDayMs = 24 * 60 * 60 * 1000;
    
    if (timeSince < oneDayMs) {
      const remainingMs = oneDayMs - timeSince;
      const hours = Math.floor(remainingMs / (1000 * 60 * 60));
      const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
      return {
        label: `Cooldown de IA activo. Podrás volver a generar en ${hours}h ${minutes}m.`,
        isCooldown: true
      };
    }
    return null;
  };

  const cooldownStatus = getCooldownStatus();

  const handleGenerate = async () => {
    if (cooldownStatus?.isCooldown) {
      toast.error("La generación está en cooldown de 24h.");
      return;
    }

    try {
      setIsAutoGenerating(true);
      toast.loading("Iniciando la generación de estrategias y campañas con IA...", { id: "cascade-gen" });
      
      const res = await fetch(`/api/business/${selectedBusinessId}/auto-generate-cascade`, {
        method: "POST"
      });

      if (res.ok) {
        toast.success("¡Estrategias y Campañas creadas y calendarizadas con éxito!", { id: "cascade-gen" });
        router.refresh();
        // Esperar un momento para recargar
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        toast.error("Ocurrió un error al generar. Inténtalo de nuevo.", { id: "cascade-gen" });
      }
    } catch (err) {
      console.error(err);
      toast.error("Error de conexión con el servidor.", { id: "cascade-gen" });
    } finally {
      setIsAutoGenerating(false);
    }
  };

  // Mapeo de estados de campañas
  const statusColors: Record<string, string> = {
    DRAFT: "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-900/50 dark:text-slate-400 dark:border-slate-800",
    SCHEDULED: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-400 dark:border-blue-800",
    ACTIVE: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-400 dark:border-emerald-800",
    PAUSED: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/50 dark:text-amber-400 dark:border-amber-800",
    COMPLETED: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/50 dark:text-purple-400 dark:border-purple-800",
  };

  const statusTranslations: Record<string, string> = {
    DRAFT: "Borrador",
    SCHEDULED: "Programada",
    ACTIVE: "Activa",
    PAUSED: "Pausada",
    COMPLETED: "Completada",
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "d 'de' MMMM, yyyy", { locale: es });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="flex flex-col h-full bg-background pb-12">
      {/* Banner Principal */}
      <div className="p-8 border-b bg-card/10 backdrop-blur-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-fuchsia-500/5 pointer-events-none" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="space-y-1">
            <Badge variant="outline" className="bg-violet-500/10 text-violet-600 dark:text-violet-400 border-none font-bold uppercase tracking-widest text-[9px] px-2 py-0.5">
              Marketing Inteligente
            </Badge>
            <h1 className="text-3xl font-black tracking-tight">{businessName}</h1>
            <p className="text-sm text-muted-foreground">Estrategias y Campañas de Marketing impulsadas por IA.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Button
              onClick={handleGenerate}
              disabled={isAutoGenerating || !!cooldownStatus}
              className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-extrabold shadow-md gap-2 h-11 px-5 rounded-xl cursor-pointer disabled:opacity-50"
            >
              {isAutoGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-amber-350 fill-amber-350" />
                  Auto-generar con IA
                </>
              )}
            </Button>
          </div>
        </div>

        {cooldownStatus && (
          <div className="mt-4 p-2.5 rounded-xl border border-amber-250 bg-amber-50/40 text-[11px] text-amber-700 font-bold flex items-center gap-2 max-w-lg dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/60">
            <ShieldAlert className="h-4 w-4 shrink-0 text-amber-500" />
            <span>{cooldownStatus.label}</span>
          </div>
        )}
      </div>

      <div className="flex-1 p-8 pt-6 space-y-8 w-full">
        <Tabs defaultValue="strategies" className="w-full">
          <TabsList className="bg-muted/40 p-1 rounded-xl border mb-6">
            <TabsTrigger value="strategies" className="rounded-lg font-bold text-xs px-4 py-2">
              <Lightbulb className="h-3.5 w-3.5 mr-2 text-violet-500" />
              Estrategias de IA ({strategies.length})
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="rounded-lg font-bold text-xs px-4 py-2">
              <Target className="h-3.5 w-3.5 mr-2 text-fuchsia-500" />
              Parametrización de Campañas de Marketing ({campaigns.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="strategies" className="space-y-6 outline-none focus:outline-none">
            {strategies.length === 0 ? (
              <Card className="border border-dashed border-border/60 bg-muted/5 py-12 text-center">
                <CardContent className="space-y-3">
                  <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground/30 animate-pulse" />
                  <div className="space-y-1">
                    <h3 className="text-sm font-black">No tienes estrategias generadas</h3>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      Haz clic en el botón de arriba para que la IA diseñe estrategias personalizadas basadas en tu negocio.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {strategies.map((strat) => (
                  <Card key={strat.id} className="border border-border/40 bg-card/35 backdrop-blur-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between gap-3">
                        <CardTitle className="text-base font-black text-slate-800 dark:text-slate-200">
                          {strat.name}
                        </CardTitle>
                        <Badge className={strat.isActive ? "bg-emerald-500/10 text-emerald-600 border-none dark:text-emerald-400 font-extrabold uppercase text-[8px]" : "bg-slate-100 text-slate-500 dark:bg-slate-900 border-none font-bold uppercase text-[8px]"}>
                          {strat.isActive ? "Activa" : "Borrador"}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs line-clamp-3 leading-relaxed mt-2">
                        {strat.description || "Sin descripción proporcionada."}
                      </CardDescription>
                    </CardHeader>
                    <div className="p-6 pt-0 border-t border-border/10 bg-muted/10 flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">
                        Estrategia IA
                      </span>
                      <ViewStrategyDialog strategy={strat} />
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-6 outline-none focus:outline-none">
            {campaigns.length === 0 ? (
              <Card className="border border-dashed border-border/60 bg-muted/5 py-12 text-center">
                <CardContent className="space-y-3">
                  <Target className="h-12 w-12 mx-auto text-muted-foreground/30 animate-pulse" />
                  <div className="space-y-1">
                    <h3 className="text-sm font-black">No tienes campañas creadas</h3>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      Las campañas se crearán de forma automática una vez que la IA defina tu estrategia.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {campaigns.map((camp) => (
                  <Card key={camp.id} className="border border-border/40 bg-card/35 backdrop-blur-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between gap-3">
                        <CardTitle className="text-base font-black text-slate-800 dark:text-slate-200">
                          {camp.name}
                        </CardTitle>
                        <Badge className={`${statusColors[camp.status] || "bg-muted text-muted-foreground"} border-none font-extrabold uppercase text-[8px]`}>
                          {statusTranslations[camp.status] || camp.status}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs line-clamp-3 leading-relaxed mt-2">
                        {camp.description || "Sin descripción proporcionada."}
                      </CardDescription>
                      <div className="space-y-1.5 pt-3">
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-semibold">
                          <CalendarIcon className="h-3 w-3 text-slate-450" />
                          <span>Inicio: {formatDate(camp.startDate)}</span>
                        </div>
                        {camp.endDate && (
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-semibold">
                            <CalendarIcon className="h-3 w-3 text-slate-450" />
                            <span>Fin: {formatDate(camp.endDate)}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-semibold">
                          <Megaphone className="h-3 w-3 text-slate-450" />
                          <span>Contenidos programados: {camp._count?.contents || camp.contents?.length || 0}</span>
                        </div>
                      </div>
                    </CardHeader>
                    <div className="p-6 pt-0 border-t border-border/10 bg-muted/10 flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">
                        Campaña Activa
                      </span>
                      <ViewCampaignModal campaign={camp} />
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
