"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sparkles, Globe, Loader2, Plus, Facebook, Instagram, ChevronRight, FileText } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

// TikTok Icon SVG
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  );
}

export function CompetitorsAnalysisClient({ businessId, initialCompetitors, myAnalysesByChannel }: any) {
  const [competitors, setCompetitors] = useState(initialCompetitors);
  const [requestingIdChannel, setRequestingIdChannel] = useState<string | null>(null); // e.g. "comp1_WEBSITE"
  const [comparisonChannel, setComparisonChannel] = useState("WEBSITE");
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const router = useRouter();

  const getFlatRecommendations = (reportData: any) => {
    if (!reportData) return [];
    
    if (Array.isArray(reportData.strategic_recommendations)) return reportData.strategic_recommendations;
    if (Array.isArray(reportData.recommendations)) return reportData.recommendations;
    
    const recs = reportData.strategic_recommendations || {};
    
    const brandingRecs = recs.branding_recommendations || [];
    const marketingRecs = recs.marketing_recommendations || [];
    const seoRecs = recs.seo_recommendations || [];
    const uxRecs = recs.ux_recommendations || [];
    const convRecs = recs.conversion_recommendations || [];
    
    if (brandingRecs.length > 0 || marketingRecs.length > 0 || seoRecs.length > 0 || uxRecs.length > 0 || convRecs.length > 0) {
      return [
        ...brandingRecs,
        ...marketingRecs,
        ...seoRecs,
        ...uxRecs,
        ...convRecs,
      ];
    }
    
    const isNewestStructure = !!reportData.brand_identity || !!reportData.business_insights || !!reportData.website_analysis;
    if (isNewestStructure) {
      const bInsights = reportData.business_insights || {};
      const dQuality = reportData.data_quality || {};
      const mainWeaknesses = bInsights.main_weaknesses || [];
      const missingInfo = dQuality.missing_information || [];
      
      const weaknessesStr = mainWeaknesses.join(" ").toLowerCase();
      const missingStr = missingInfo.join(" ").toLowerCase();
      const arr = [];
      
      if (weaknessesStr.includes("branding") || weaknessesStr.includes("marca") || missingStr.includes("social")) {
        arr.push("Fortalecer tu identidad de marca local con storytelling enfocado en cercanía e historia comunitaria.");
      } else {
        arr.push("Destacar tu propuesta de valor diferenciada (ej. envíos rápidos, ingredientes premium) frente a su posicionamiento estándar.");
      }
      
      if (weaknessesStr.includes("contacto") || missingStr.includes("contacto")) {
        arr.push("Implementar campañas de generación de prospectos dirigidas a WhatsApp o formularios de contacto de respuesta inmediata.");
      } else {
        arr.push("Promocionar dinámicamente tus productos en la zona de influencia geográfica donde el competidor tiene mayor tracción.");
      }
      
      if (weaknessesStr.includes("seo") || missingStr.includes("seo") || missingStr.includes("metadatos")) {
        arr.push("Optimizar tus etiquetas meta (Title, Description) con geolocalización clara (ej: 'Tortas en Santa Cruz').");
      } else {
        arr.push("Crear contenido de blog apuntando a las intenciones de búsqueda informativas que ellos están desaprovechando.");
      }
      
      if (weaknessesStr.includes("producto") || missingStr.includes("producto")) {
        arr.push("Diseñar un catálogo digital intuitivo con fotos en alta resolución e información detallada de cada producto.");
      } else {
        arr.push("Asegurar una velocidad de carga móvil impecable y navegación fluida para capturar el tráfico móvil frustrado de la competencia.");
      }
      
      if (weaknessesStr.includes("carrito") || weaknessesStr.includes("checkout") || weaknessesStr.includes("commerce")) {
        arr.push("Habilitar un flujo de checkout simple o pedidos vía WhatsApp en 2 clics para superar su falta de e-commerce.");
      } else {
        arr.push("Implementar pop-ups de salida con ofertas exclusivas o descuentos de primera compra para aumentar la tasa de conversión.");
      }
      
      return arr;
    }
    
    return [];
  };

  const handleRequestAnalysis = async (compId: string, channel: string, url: string) => {
    const key = `${compId}_${channel}`;
    const promise = new Promise(async (resolve, reject) => {
      try {
        setRequestingIdChannel(key);
        const res = await fetch("/api/analysis/request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "COMPETITOR",
            entityId: compId,
            channel,
            url,
          }),
        });
        if (res.ok) {
          router.refresh();
          resolve(true);
        } else {
          const errData = await res.json().catch(() => ({}));
          reject(new Error(errData.details || errData.error || "Error al solicitar el análisis."));
        }
      } catch (error: any) {
        reject(error);
      } finally {
        setRequestingIdChannel(null);
      }
    });

    toast.promise(promise, {
      loading: `Enviando sitio de competencia a analizar a n8n...`,
      success: `¡Análisis iniciado! El agente de IA de n8n está escaneando el sitio web en segundo plano.`,
      error: (err: any) => err.message || "Error al iniciar el análisis en n8n.",
    });
  };

  // Extract all cards (competitor + channel combination)
  const cards: any[] = [];
  competitors.forEach((comp: any) => {
    const channelConfigs = [
      { key: "website", name: "WEBSITE", label: "Sitio Web", icon: Globe, color: "text-blue-500", url: comp.website },
      { key: "facebook", name: "FACEBOOK", label: "Facebook", icon: Facebook, color: "text-blue-600", url: comp.facebook },
      { key: "instagram", name: "INSTAGRAM", label: "Instagram", icon: Instagram, color: "text-pink-500", url: comp.instagram },
      { key: "tiktok", name: "TIKTOK", label: "TikTok", icon: TikTokIcon, color: "text-black dark:text-white", url: comp.tiktok },
    ];

    channelConfigs.forEach((chConfig) => {
      if (chConfig.url) {
        cards.push({
          competitorId: comp.id,
          competitorName: comp.name,
          channel: chConfig.name,
          label: chConfig.label,
          icon: chConfig.icon,
          color: chConfig.color,
          url: chConfig.url,
          report: comp.reportsByChannel?.[chConfig.name] || null,
        });
      }
    });
  });

  // Competitors that have a completed report for the active comparison channel
  const completedCompetitors = competitors.filter(
    (c: any) => c.reportsByChannel?.[comparisonChannel]?.status === "COMPLETED" && c.reportsByChannel?.[comparisonChannel]?.data
  );

  const activeMyAnalysis = myAnalysesByChannel?.[comparisonChannel];

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Análisis de Competidores</h2>
          <p className="text-muted-foreground text-sm">
            Monitorea y compara los canales digitales de tu competencia.
          </p>
        </div>
        <Button disabled variant="outline" className="gap-2">
          <Plus className="h-4 w-4"/> Añadir Competidor
        </Button>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Tarjetas de Análisis ({cards.length})</TabsTrigger>
          <TabsTrigger value="comparison" disabled={completedCompetitors.length === 0 || !activeMyAnalysis}>
            Tabla Comparativa
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {cards.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-xl mt-6">
                  <Globe className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-bold">Sin canales digitales</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mt-2 mb-4">
                    Asegúrate de que tus competidores tengan configurados enlaces a Sitio Web, Facebook, Instagram o TikTok en su perfil para analizarlos.
                  </p>
                </CardContent>
              </Card>
            ) : (
              cards.map((card: any, idx: number) => {
                const report = card.report;
                const isPending = report?.status === "PENDING" || report?.status === "PROCESSING";
                const isRequesting = requestingIdChannel === `${card.competitorId}_${card.channel}`;
                const ChannelIcon = card.icon;
                const isCompleted = report?.status === "COMPLETED" && report?.data;

                // Channel accent colors
                const accentMap: Record<string, { bar: string; iconBg: string; iconText: string }> = {
                  WEBSITE: { bar: "bg-gradient-to-r from-blue-500 to-cyan-400", iconBg: "bg-blue-500/10", iconText: "text-blue-600" },
                  FACEBOOK: { bar: "bg-gradient-to-r from-blue-600 to-blue-400", iconBg: "bg-blue-600/10", iconText: "text-blue-700" },
                  INSTAGRAM: { bar: "bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400", iconBg: "bg-pink-500/10", iconText: "text-pink-600" },
                  TIKTOK: { bar: "bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500 dark:from-white dark:via-gray-300 dark:to-gray-500", iconBg: "bg-gray-900/10 dark:bg-white/10", iconText: "text-gray-900 dark:text-white" },
                };
                const accent = accentMap[card.channel] || accentMap.WEBSITE;

                return (
                  <Card
                    key={idx}
                    className="group flex flex-col overflow-hidden border border-border/60 hover:border-primary/30 transition-all duration-300 shadow-sm hover:shadow-md"
                  >
                    {/* Colored accent bar */}
                    <div className={`h-1 w-full ${accent.bar} shrink-0`} />

                    {/* Header */}
                    <CardHeader className="pb-2 pt-4 px-5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`flex items-center justify-center h-10 w-10 rounded-xl ${accent.iconBg} shrink-0 transition-transform duration-300 group-hover:scale-105`}>
                            <ChannelIcon className={`h-5 w-5 ${accent.iconText}`} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 leading-none mb-1">
                              {card.competitorName}
                            </p>
                            <CardTitle className="text-base font-bold leading-tight">
                              {card.label}
                            </CardTitle>
                          </div>
                        </div>
                        {report && <StatusBadge status={report.status} />}
                      </div>
                      <a
                        href={card.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-blue-500 hover:text-blue-600 hover:underline truncate block mt-2 transition-colors"
                        title={card.url}
                      >
                        {card.url}
                      </a>
                    </CardHeader>

                    {/* Content */}
                    <CardContent className="flex-1 px-5 py-3">
                      {!report ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                          <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                            <Sparkles className="h-5 w-5 text-muted-foreground/40" />
                          </div>
                          <p className="text-xs font-medium text-muted-foreground">Aún no hay análisis para este canal.</p>
                          <p className="text-[10px] text-muted-foreground/50 mt-1">Solicita un nuevo análisis para comenzar.</p>
                        </div>
                      ) : isCompleted ? (() => {
                        const positioning = report.data.brand_identity?.market_positioning || report.data.competitor_overview?.market_positioning || report.data.market_positioning || report.data.metaDescription || "Sin descripción disponible.";
                        const rawStrengths = report.data.business_insights?.main_strengths || report.data.ux_analysis?.ux_strengths || report.data.competitive_insights?.main_strengths || report.data.strengths || report.data.products || [];
                        const strengths = Array.isArray(rawStrengths) ? rawStrengths : [rawStrengths];

                        const rawWeaknesses = report.data.business_insights?.main_weaknesses || report.data.ux_analysis?.ux_weaknesses || report.data.competitive_insights?.main_weaknesses || report.data.weaknesses || report.data.promotions || [];
                        const weaknesses = Array.isArray(rawWeaknesses) ? rawWeaknesses : [rawWeaknesses];

                        return (
                          <div className="space-y-3">
                            {/* Positioning quote */}
                            <div
                              className="relative bg-muted/30 dark:bg-muted/20 rounded-lg px-3 py-2.5 border border-border/50"
                              title={positioning}
                            >
                              <span className="absolute -top-1.5 left-2.5 text-lg leading-none text-muted-foreground/30 font-serif">"</span>
                              <p className="text-[11px] text-muted-foreground italic leading-relaxed line-clamp-2 pl-2">
                                {positioning}
                              </p>
                            </div>

                            {/* Strengths */}
                            {strengths.length > 0 && (
                              <div>
                                <div className="flex items-center gap-1.5 mb-1.5">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                                  <span className="font-bold text-[10px] uppercase tracking-widest text-emerald-600">
                                    Fortalezas
                                  </span>
                                  <span className="text-[9px] text-muted-foreground/50 font-medium">
                                    ({strengths.length})
                                  </span>
                                </div>
                                <ul className="space-y-1 pl-0.5">
                                  {strengths.slice(0, 3).map((p: string, i: number) => (
                                    <li
                                      key={i}
                                      className="flex items-start gap-1.5 text-[11px] text-muted-foreground leading-snug"
                                      title={p}
                                    >
                                      <ChevronRight className="h-3 w-3 text-emerald-500/60 shrink-0 mt-0.5" />
                                      <span className="line-clamp-1">{p}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Weaknesses */}
                            {weaknesses.length > 0 && (
                              <div>
                                <div className="flex items-center gap-1.5 mb-1.5">
                                  <span className="h-1.5 w-1.5 rounded-full bg-orange-500 shrink-0" />
                                  <span className="font-bold text-[10px] uppercase tracking-widest text-orange-600">
                                    Debilidades
                                  </span>
                                  <span className="text-[9px] text-muted-foreground/50 font-medium">
                                    ({weaknesses.length})
                                  </span>
                                </div>
                                <ul className="space-y-1 pl-0.5">
                                  {weaknesses.slice(0, 2).map((p: string, i: number) => (
                                    <li
                                      key={i}
                                      className="flex items-start gap-1.5 text-[11px] text-muted-foreground leading-snug"
                                      title={p}
                                    >
                                      <ChevronRight className="h-3 w-3 text-orange-500/60 shrink-0 mt-0.5" />
                                      <span className="line-clamp-1">{p}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        );
                      })() : report.status === "ERROR" ? (
                        <div className="flex items-start gap-2.5 text-xs text-red-600 dark:text-red-400 bg-red-500/5 p-3 rounded-lg border border-red-500/10">
                          <div className="h-5 w-5 rounded-full bg-red-500/10 flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-[10px] font-bold">!</span>
                          </div>
                          <p className="leading-relaxed">{report.error || "Ocurrió un error inesperado al analizar este canal."}</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-10 gap-2">
                          <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                          <span className="text-xs text-muted-foreground font-medium">Análisis en progreso...</span>
                        </div>
                      )}
                    </CardContent>

                    {/* Footer */}
                    <CardFooter className="px-5 py-3 border-t border-border/40 bg-muted/20 dark:bg-muted/10 flex gap-2 mt-auto">
                      {isCompleted && (
                        <Button
                          onClick={() => setSelectedReport(report)}
                          variant="secondary"
                          size="sm"
                          className="flex-1 gap-1.5 text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 border border-blue-500/20 font-semibold h-8"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          Ver informe
                        </Button>
                      )}
                      <Button
                        onClick={() => handleRequestAnalysis(card.competitorId, card.channel, card.url)}
                        disabled={isPending || isRequesting}
                        variant="outline"
                        size="sm"
                        className={`gap-1.5 text-xs h-8 ${isCompleted ? "flex-1" : "w-full"}`}
                      >
                        {isRequesting || isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="h-3.5 w-3.5" />
                        )}
                        {report ? "Reanalizar" : "Analizar canal"}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <Card className="border border-muted/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle>Yo vs Competencia</CardTitle>
                <CardDescription>
                  Comparativa de presencia e impacto de marketing.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">Comparar Canal:</span>
                <Select value={comparisonChannel} onValueChange={setComparisonChannel}>
                  <SelectTrigger className="w-[180px] h-9">
                    <SelectValue placeholder="Selecciona canal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WEBSITE">Sitio Web</SelectItem>
                    <SelectItem value="FACEBOOK">Facebook</SelectItem>
                    <SelectItem value="INSTAGRAM">Instagram</SelectItem>
                    <SelectItem value="TIKTOK">TikTok</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {completedCompetitors.length === 0 || !activeMyAnalysis ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Sparkles className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm">No hay análisis suficientes completados para comparar en {comparisonChannel}.</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Asegúrate de que tanto tu negocio como al menos un competidor tengan análisis listos para este canal.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Métrica / Aspecto</TableHead>
                      <TableHead className="font-bold text-primary bg-primary/5 rounded-t-lg">Mi Negocio</TableHead>
                      {completedCompetitors.map((c: any) => (
                        <TableHead key={c.id}>{c.name}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                       <TableCell className="font-semibold text-xs uppercase tracking-wider text-muted-foreground align-top">Posicionamiento</TableCell>
                       <TableCell className="align-top bg-primary/5 text-xs font-medium">
                         {activeMyAnalysis?.data?.brand_identity?.market_positioning || activeMyAnalysis?.data?.competitor_overview?.market_positioning || activeMyAnalysis?.data?.market_positioning || activeMyAnalysis?.data?.title || "N/A"}
                       </TableCell>
                       {completedCompetitors.map((c: any) => (
                         <TableCell key={c.id} className="align-top text-xs">
                           {c.reportsByChannel?.[comparisonChannel]?.data?.brand_identity?.market_positioning || c.reportsByChannel?.[comparisonChannel]?.data?.competitor_overview?.market_positioning || c.reportsByChannel?.[comparisonChannel]?.data?.market_positioning || c.reportsByChannel?.[comparisonChannel]?.data?.title || "N/A"}
                         </TableCell>
                       ))}
                     </TableRow>
                     <TableRow>
                       <TableCell className="font-semibold text-xs uppercase tracking-wider text-muted-foreground align-top">Fortalezas / Productos</TableCell>
                       <TableCell className="align-top bg-primary/5">
                         {(() => {
                           const raw = activeMyAnalysis?.data?.business_insights?.main_strengths || activeMyAnalysis?.data?.ux_analysis?.ux_strengths || activeMyAnalysis?.data?.competitive_insights?.main_strengths || activeMyAnalysis?.data?.strengths || activeMyAnalysis?.data?.products || [];
                           const list = Array.isArray(raw) ? raw : [raw];
                           return (
                             <ul className="list-disc pl-4 text-xs text-emerald-600 space-y-1">
                               {list.slice(0, 3).map((p: string, i: number) => <li key={i}>{p}</li>)}
                             </ul>
                           );
                         })()}
                       </TableCell>
                       {completedCompetitors.map((c: any) => (
                         <TableCell key={c.id} className="align-top">
                           {(() => {
                             const data = c.reportsByChannel?.[comparisonChannel]?.data;
                             const raw = data?.business_insights?.main_strengths || data?.ux_analysis?.ux_strengths || data?.competitive_insights?.main_strengths || data?.strengths || data?.products || [];
                             const list = Array.isArray(raw) ? raw : [raw];
                             return (
                               <ul className="list-disc pl-4 text-xs text-emerald-600 space-y-1">
                                 {list.slice(0, 3).map((p: string, i: number) => <li key={i}>{p}</li>)}
                               </ul>
                             );
                           })()}
                         </TableCell>
                       ))}
                     </TableRow>
                    <TableRow>
                       <TableCell className="font-semibold text-xs uppercase tracking-wider text-muted-foreground align-top">Debilidades / Puntos a mejorar</TableCell>
                       <TableCell className="align-top bg-primary/5">
                        {(() => {
                          const raw = activeMyAnalysis?.data?.business_insights?.main_weaknesses || activeMyAnalysis?.data?.ux_analysis?.ux_weaknesses || activeMyAnalysis?.data?.competitive_insights?.main_weaknesses || activeMyAnalysis?.data?.weaknesses || activeMyAnalysis?.data?.promotions || [];
                          const list = Array.isArray(raw) ? raw : [raw];
                          return (
                            <ul className="list-disc pl-4 text-xs text-rose-600 space-y-1">
                              {list.slice(0, 3).map((p: string, i: number) => <li key={i}>{p}</li>)}
                            </ul>
                          );
                        })()}
                      </TableCell>
                      {completedCompetitors.map((c: any) => (
                        <TableCell key={c.id} className="align-top">
                          {(() => {
                            const data = c.reportsByChannel?.[comparisonChannel]?.data;
                            const raw = data?.business_insights?.main_weaknesses || data?.ux_analysis?.ux_weaknesses || data?.competitive_insights?.main_weaknesses || data?.weaknesses || data?.promotions || [];
                            const list = Array.isArray(raw) ? raw : [raw];
                            return (
                              <ul className="list-disc pl-4 text-xs text-rose-600 space-y-1">
                                {list.slice(0, 3).map((p: string, i: number) => <li key={i}>{p}</li>)}
                              </ul>
                            );
                          })()}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-semibold text-xs uppercase tracking-wider text-muted-foreground align-top">Recomendaciones Clave</TableCell>
                      <TableCell className="align-top bg-primary/5">
                        <ul className="space-y-1.5">
                          {getFlatRecommendations(activeMyAnalysis?.data).slice(0, 3).map((r: string, i: number) => (
                            <li key={i} className="flex gap-1 text-xs">
                              <ChevronRight className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                              <span>{r}</span>
                            </li>
                          ))}
                        </ul>
                      </TableCell>
                      {completedCompetitors.map((c: any) => (
                        <TableCell key={c.id} className="align-top">
                          <ul className="space-y-1.5">
                            {getFlatRecommendations(c.reportsByChannel?.[comparisonChannel]?.data).slice(0, 3).map((r: string, i: number) => (
                              <li key={i} className="flex gap-1 text-xs">
                                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                                <span>{r}</span>
                              </li>
                            ))}
                          </ul>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Informe Completo */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 overflow-hidden border border-muted/50 shadow-2xl">
          <DialogHeader className="p-6 pb-4 border-b bg-muted/20 shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-500" />
                  Informe de Inteligencia Competitiva IA
                </DialogTitle>
                <DialogDescription className="text-xs mt-1 text-muted-foreground">
                  Análisis de presencia digital para canal <span className="font-semibold text-blue-500">{selectedReport?.channel}</span> ({selectedReport?.url})
                </DialogDescription>
              </div>
              {selectedReport && (
                <Badge className="bg-green-500 text-white font-bold text-[10px] px-2 py-0.5">
                  LISTO
                </Badge>
              )}
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 max-h-[calc(85vh-120px)]">
            {selectedReport?.data && (() => {
              const isNewestStructure = !!selectedReport.data.brand_identity || !!selectedReport.data.business_insights;
              const isNewStructure = !!selectedReport.data.competitor_overview;

              if (isNewestStructure || isNewStructure) {
                let overview: any = {};
                let mkt: any = {};
                let ux: any = {};
                let insights: any = {};
                let recs: any = {};
                let dataQuality: any = null;

                if (isNewestStructure) {
                  const bIdentity = selectedReport.data.brand_identity || {};
                  const wAnalysis = selectedReport.data.website_analysis || {};
                  const mSignals = selectedReport.data.marketing_signals || {};
                  const bInsights = selectedReport.data.business_insights || {};
                  const dQuality = selectedReport.data.data_quality || {};

                  overview = {
                    market_positioning: bIdentity.market_positioning,
                    brand_summary: bIdentity.brand_summary,
                    brand_personality: bIdentity.brand_personality,
                    emotional_tone: bIdentity.emotional_tone,
                  };

                  mkt = {
                    marketing_tactics: mSignals.marketing_tactics,
                    conversion_elements: wAnalysis.conversion_elements,
                    seo_signals: mSignals.seo_signals,
                    content_strategy: wAnalysis.content_focus,
                    social_proof_signals: wAnalysis.trust_signals,
                  };

                  ux = {
                    ux_strengths: bInsights.main_strengths,
                    ux_weaknesses: bInsights.main_weaknesses,
                    navigation_observations: wAnalysis.ux_observations,
                    conversion_friction_points: bInsights.customer_experience_indicators,
                    mobile_experience_observations: wAnalysis.navigation_structure,
                  };

                  insights = {
                    differentiation_opportunities: bInsights.differentiators,
                    market_gaps: dQuality.missing_information,
                    customer_psychology_insights: bIdentity.target_audience,
                  };

                  recs = selectedReport.data.strategic_recommendations || {};

                  dataQuality = {
                    confidence_score: dQuality.confidence_score,
                    missing_information: dQuality.missing_information,
                    analysis_limitations: dQuality.analysis_limitations,
                  };
                } else {
                  overview = selectedReport.data.competitor_overview || {};
                  mkt = selectedReport.data.marketing_analysis || {};
                  ux = selectedReport.data.ux_analysis || {};
                  insights = selectedReport.data.competitive_insights || {};
                  recs = selectedReport.data.strategic_recommendations || {};
                }

                const brandingRecs = recs.branding_recommendations || [];
                const marketingRecs = recs.marketing_recommendations || [];
                const seoRecs = recs.seo_recommendations || [];
                const uxRecs = recs.ux_recommendations || [];
                const convRecs = recs.conversion_recommendations || [];

                const finalBranding = brandingRecs.length > 0 ? brandingRecs : (() => {
                  const arr = [];
                  const weaknessesStr = (ux.ux_weaknesses || []).join(" ").toLowerCase();
                  const missingStr = (insights.market_gaps || []).join(" ").toLowerCase();
                  if (weaknessesStr.includes("branding") || weaknessesStr.includes("marca") || missingStr.includes("social")) {
                    arr.push("Fortalecer tu identidad de marca local con storytelling enfocado en cercanía e historia comunitaria.");
                  }
                  if (missingStr.includes("redes") || weaknessesStr.includes("redes")) {
                    arr.push("Lanzar campañas de branding multicanal en Instagram y TikTok para capitalizar su total ausencia en redes.");
                  }
                  if (arr.length === 0) {
                    arr.push("Destacar tu propuesta de valor diferenciada (ej. envíos rápidos, ingredientes premium) frente a su posicionamiento estándar.");
                  }
                  return arr;
                })();

                const finalMarketing = marketingRecs.length > 0 ? marketingRecs : (() => {
                  const arr = [];
                  const weaknessesStr = (ux.ux_weaknesses || []).join(" ").toLowerCase();
                  const missingStr = (insights.market_gaps || []).join(" ").toLowerCase();
                  if (weaknessesStr.includes("contacto") || missingStr.includes("contacto")) {
                    arr.push("Implementar campañas de generación de prospectos dirigidas a WhatsApp o formularios de contacto de respuesta inmediata.");
                  }
                  if (weaknessesStr.includes("seo") || missingStr.includes("seo")) {
                    arr.push("Lanzar pauta segmentada localmente en Google Ads para keywords clave antes de que resuelvan su SEO.");
                  }
                  if (arr.length === 0) {
                    arr.push("Promocionar dinámicamente tus productos en la zona de influencia geográfica donde el competidor tiene mayor tracción.");
                  }
                  return arr;
                })();

                const finalSeo = seoRecs.length > 0 ? seoRecs : (() => {
                  const arr = [];
                  const weaknessesStr = (ux.ux_weaknesses || []).join(" ").toLowerCase();
                  const missingStr = (insights.market_gaps || []).join(" ").toLowerCase();
                  if (weaknessesStr.includes("seo") || weaknessesStr.includes("seo") || missingStr.includes("metadatos")) {
                    arr.push("Optimizar tus etiquetas meta (Title, Description) con geolocalización clara (ej: 'Tortas en Santa Cruz').");
                    arr.push("Crear contenido de blog apuntando a las intenciones de búsqueda informativas que ellos están desaprovechando.");
                  } else {
                    arr.push("Monitorear sus palabras clave secundarias para superarlos en el ranking de búsquedas locales.");
                  }
                  return arr;
                })();

                const finalUx = uxRecs.length > 0 ? uxRecs : (() => {
                  const arr = [];
                  const weaknessesStr = (ux.ux_weaknesses || []).join(" ").toLowerCase();
                  const missingStr = (insights.market_gaps || []).join(" ").toLowerCase();
                  if (weaknessesStr.includes("producto") || missingStr.includes("producto")) {
                    arr.push("Diseñar un catálogo digital intuitivo con fotos en alta resolución e información detallada de cada producto.");
                  }
                  if (weaknessesStr.includes("contacto") || missingStr.includes("contacto")) {
                    arr.push("Mantener canales de atención y botones de contacto siempre visibles en la cabecera y pie de página de tu web.");
                  }
                  if (arr.length === 0) {
                    arr.push("Asegurar una velocidad de carga móvil impecable y navegación fluida para capturar el tráfico móvil frustrado de la competencia.");
                  }
                  return arr;
                })();

                const finalConversion = convRecs.length > 0 ? convRecs : (() => {
                  const arr = [];
                  const weaknessesStr = (ux.ux_weaknesses || []).join(" ").toLowerCase();
                  const missingStr = (insights.market_gaps || []).join(" ").toLowerCase();
                  if (weaknessesStr.includes("carrito") || weaknessesStr.includes("checkout") || weaknessesStr.includes("commerce")) {
                    arr.push("Habilitar un flujo de checkout simple o pedidos vía WhatsApp en 2 clics para superar su falta de e-commerce.");
                  }
                  if (weaknessesStr.includes("fidelización") || weaknessesStr.includes("loyalty")) {
                    arr.push("Crear un sistema de recompensas o club de lealtad digital para competir frontalmente con su programa de fidelización.");
                  }
                  if (arr.length === 0) {
                    arr.push("Implementar pop-ups de salida con ofertas exclusivas o descuentos de primera compra para aumentar la tasa de conversión.");
                  }
                  return arr;
                })();

                const hasRecommendations = true;

                return (
                  <div className="space-y-6">
                    {/* 1. Posicionamiento y Resumen */}
                    <div className="bg-blue-500/5 p-4 rounded-xl border border-blue-500/10 space-y-3">
                      <div>
                        <h4 className="font-bold text-xs uppercase tracking-wider text-blue-600 mb-1">Posicionamiento en el Mercado</h4>
                        <p className="text-sm font-semibold leading-relaxed text-foreground">
                          {overview.market_positioning || "Sin posicionamiento especificado"}
                        </p>
                      </div>
                      {overview.brand_summary && (
                        <div className="pt-2 border-t border-blue-500/10">
                          <h4 className="font-bold text-xs uppercase tracking-wider text-blue-500 mb-1">Resumen de la Marca</h4>
                          <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                            {overview.brand_summary}
                          </p>
                        </div>
                      )}
                      {selectedReport.data.confidence_score && (
                        <div className="flex items-center gap-2 pt-2 border-t border-blue-500/10 mt-2">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Nivel de Confianza IA:</span>
                          <Badge variant="outline" className="text-[10px] font-bold py-0 bg-blue-500/10 border-blue-500/20 text-blue-600">
                            {selectedReport.data.confidence_score * 100}%
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* 2. Personalidad y Tono */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {overview.brand_personality && overview.brand_personality.length > 0 && (
                        <div className="bg-purple-500/5 p-4 rounded-xl border border-purple-500/10">
                          <h4 className="font-bold text-xs uppercase tracking-wider text-purple-600 mb-2">Personalidad de Marca</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {overview.brand_personality.map((t: string, i: number) => {
                              const translateTag = (tag: string): string => {
                                const translations: Record<string, string> = {
                                  "friendly": "Amigable",
                                  "interactive": "Interactivo",
                                  "playful": "Juguetón / Lúdico",
                                  "approachable": "Accesible",
                                  "community-focused": "Enfocado en la comunidad",
                                  "fun": "Divertido",
                                  "engaging": "Atractivo / Involucrador",
                                  "welcoming": "Acogedor",
                                  "personalized": "Personalizado"
                                };
                                return translations[tag.toLowerCase().trim()] || tag;
                              };
                              return (
                                <Badge key={i} variant="outline" className="text-[10px] font-bold border-purple-500/20 bg-purple-500/10 text-purple-600">
                                  {translateTag(t)}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {overview.emotional_tone && overview.emotional_tone.length > 0 && (
                        <div className="bg-pink-500/5 p-4 rounded-xl border border-pink-500/10">
                          <h4 className="font-bold text-xs uppercase tracking-wider text-pink-600 mb-2">Tono Emocional</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {overview.emotional_tone.map((t: string, i: number) => {
                              const translateTag = (tag: string): string => {
                                const translations: Record<string, string> = {
                                  "friendly": "Amigable",
                                  "interactive": "Interactivo",
                                  "playful": "Juguetón / Lúdico",
                                  "approachable": "Accesible",
                                  "community-focused": "Enfocado en la comunidad",
                                  "fun": "Divertido",
                                  "engaging": "Atractivo / Involucrador",
                                  "welcoming": "Acogedor",
                                  "personalized": "Personalizado"
                                };
                                return translations[tag.toLowerCase().trim()] || tag;
                              };
                              return (
                                <Badge key={i} variant="outline" className="text-[10px] font-bold border-pink-500/20 bg-pink-500/10 text-pink-600">
                                  {translateTag(t)}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 3. Análisis de Marketing */}
                    <div className="bg-muted/10 p-5 rounded-xl border border-muted/30 space-y-4">
                      <h3 className="font-bold text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2 border-b pb-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-teal-500"></span>
                        Análisis de Marketing y Conversión
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {mkt.marketing_tactics && mkt.marketing_tactics.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-bold text-[10px] uppercase tracking-wider text-teal-600">Tácticas de Marketing</h4>
                            <ul className="space-y-1">
                              {mkt.marketing_tactics.map((p: string, i: number) => (
                                <li key={i} className="flex gap-1.5 text-xs text-muted-foreground">
                                  <ChevronRight className="h-3.5 w-3.5 text-teal-500 shrink-0 mt-0.5" />
                                  <span>{p}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {mkt.conversion_elements && mkt.conversion_elements.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-bold text-[10px] uppercase tracking-wider text-indigo-600">Elementos de Conversión</h4>
                            <ul className="space-y-1">
                              {mkt.conversion_elements.map((p: string, i: number) => (
                                <li key={i} className="flex gap-1.5 text-xs text-muted-foreground">
                                  <ChevronRight className="h-3.5 w-3.5 text-indigo-500 shrink-0 mt-0.5" />
                                  <span>{p}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {mkt.seo_signals && mkt.seo_signals.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-bold text-[10px] uppercase tracking-wider text-blue-600">Señales SEO</h4>
                            <ul className="space-y-1">
                              {mkt.seo_signals.map((p: string, i: number) => (
                                <li key={i} className="flex gap-1.5 text-xs text-muted-foreground">
                                  <ChevronRight className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                                  <span>{p}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {mkt.content_strategy && mkt.content_strategy.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-bold text-[10px] uppercase tracking-wider text-purple-600">Estrategia de Contenidos</h4>
                            <ul className="space-y-1">
                              {mkt.content_strategy.map((p: string, i: number) => (
                                <li key={i} className="flex gap-1.5 text-xs text-muted-foreground">
                                  <ChevronRight className="h-3.5 w-3.5 text-purple-500 shrink-0 mt-0.5" />
                                  <span>{p}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {mkt.social_proof_signals && mkt.social_proof_signals.length > 0 && (
                          <div className="col-span-1 md:col-span-2 space-y-2 pt-2 border-t border-muted/20">
                            <h4 className="font-bold text-[10px] uppercase tracking-wider text-pink-600">Señales de Prueba Social</h4>
                            <ul className="space-y-1">
                              {mkt.social_proof_signals.map((p: string, i: number) => (
                                <li key={i} className="flex gap-1.5 text-xs text-muted-foreground">
                                  <ChevronRight className="h-3.5 w-3.5 text-pink-500 shrink-0 mt-0.5" />
                                  <span>{p}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 4. Análisis de Experiencia de Usuario (UX) */}
                    <div className="bg-muted/10 p-5 rounded-xl border border-muted/30 space-y-4">
                      <h3 className="font-bold text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2 border-b pb-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                        Experiencia de Usuario (UX)
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {ux.ux_strengths && ux.ux_strengths.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-bold text-[10px] uppercase tracking-wider text-emerald-600">Fortalezas UX</h4>
                            <ul className="space-y-1">
                              {ux.ux_strengths.map((p: string, i: number) => (
                                <li key={i} className="flex gap-1.5 text-xs text-muted-foreground">
                                  <ChevronRight className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                  <span>{p}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {ux.ux_weaknesses && ux.ux_weaknesses.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-bold text-[10px] uppercase tracking-wider text-rose-600">Debilidades UX</h4>
                            <ul className="space-y-1">
                              {ux.ux_weaknesses.map((p: string, i: number) => (
                                <li key={i} className="flex gap-1.5 text-xs text-muted-foreground">
                                  <ChevronRight className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                                  <span>{p}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {ux.navigation_observations && ux.navigation_observations.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-bold text-[10px] uppercase tracking-wider text-slate-600">Observaciones de Navegación</h4>
                            <ul className="space-y-1">
                              {ux.navigation_observations.map((p: string, i: number) => (
                                <li key={i} className="flex gap-1.5 text-xs text-muted-foreground">
                                  <ChevronRight className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
                                  <span>{p}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {ux.conversion_friction_points && ux.conversion_friction_points.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-bold text-[10px] uppercase tracking-wider text-orange-600">Características de Experiencia (CX)</h4>
                            <ul className="space-y-1">
                              {ux.conversion_friction_points.map((p: string, i: number) => (
                                <li key={i} className="flex gap-1.5 text-xs text-muted-foreground">
                                  <ChevronRight className="h-3.5 w-3.5 text-orange-500 shrink-0 mt-0.5" />
                                  <span>{p}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {ux.mobile_experience_observations && ux.mobile_experience_observations.length > 0 && (
                          <div className="col-span-1 md:col-span-2 space-y-2 pt-2 border-t border-muted/20">
                            <h4 className="font-bold text-[10px] uppercase tracking-wider text-blue-600">Experiencia Móvil</h4>
                            <ul className="space-y-1">
                              {ux.mobile_experience_observations.map((p: string, i: number) => (
                                <li key={i} className="flex gap-1.5 text-xs text-muted-foreground">
                                  <ChevronRight className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                                  <span>{p}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 5. Perspectivas Competitivas (Insights) */}
                    <div className="bg-muted/10 p-5 rounded-xl border border-muted/30 space-y-4">
                      <h3 className="font-bold text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2 border-b pb-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-pink-500"></span>
                        Perspectivas Competitivas y Diferenciación
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {insights.differentiation_opportunities && insights.differentiation_opportunities.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-bold text-[10px] uppercase tracking-wider text-purple-600">Oportunidades de Diferenciación</h4>
                            <ul className="space-y-1">
                              {insights.differentiation_opportunities.map((p: string, i: number) => (
                                <li key={i} className="flex gap-1.5 text-xs text-muted-foreground">
                                  <ChevronRight className="h-3.5 w-3.5 text-purple-500 shrink-0 mt-0.5" />
                                  <span>{p}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {insights.market_gaps && insights.market_gaps.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-bold text-[10px] uppercase tracking-wider text-amber-600">Gaps del Mercado</h4>
                            <ul className="space-y-1">
                              {insights.market_gaps.map((p: string, i: number) => (
                                <li key={i} className="flex gap-1.5 text-xs text-muted-foreground">
                                  <ChevronRight className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                                  <span>{p}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {insights.customer_psychology_insights && insights.customer_psychology_insights.length > 0 && (
                          <div className="col-span-1 md:col-span-2 space-y-2 pt-2 border-t border-muted/20">
                            <h4 className="font-bold text-[10px] uppercase tracking-wider text-blue-600">Psicología del Consumidor</h4>
                            <ul className="space-y-1">
                              {insights.customer_psychology_insights.map((p: string, i: number) => (
                                <li key={i} className="flex gap-1.5 text-xs text-muted-foreground">
                                  <ChevronRight className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                                  <span>{p}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 6. Recomendaciones Estratégicas */}
                    <div className="bg-blue-500/5 p-5 rounded-xl border border-blue-500/10 space-y-4">
                      <h3 className="font-bold text-sm text-blue-600 flex items-center gap-2 border-b pb-2">
                        <Sparkles className="h-4 w-4" />
                        Plan de Recomendaciones Estratégicas
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {finalBranding && finalBranding.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-bold text-[10px] uppercase tracking-wider text-purple-600">Branding</h4>
                            <ul className="space-y-1">
                              {finalBranding.map((p: string, i: number) => (
                                <li key={i} className="flex gap-1.5 text-xs text-muted-foreground">
                                  <ChevronRight className="h-3.5 w-3.5 text-purple-500 shrink-0 mt-0.5" />
                                  <span>{p}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {finalMarketing && finalMarketing.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-bold text-[10px] uppercase tracking-wider text-teal-600">Marketing</h4>
                            <ul className="space-y-1">
                              {finalMarketing.map((p: string, i: number) => (
                                <li key={i} className="flex gap-1.5 text-xs text-muted-foreground">
                                  <ChevronRight className="h-3.5 w-3.5 text-teal-500 shrink-0 mt-0.5" />
                                  <span>{p}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {finalSeo && finalSeo.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-bold text-[10px] uppercase tracking-wider text-blue-600">SEO</h4>
                            <ul className="space-y-1">
                              {finalSeo.map((p: string, i: number) => (
                                <li key={i} className="flex gap-1.5 text-xs text-muted-foreground">
                                  <ChevronRight className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                                  <span>{p}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {finalUx && finalUx.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-bold text-[10px] uppercase tracking-wider text-amber-600">UX / Experiencia</h4>
                            <ul className="space-y-1">
                              {finalUx.map((p: string, i: number) => (
                                <li key={i} className="flex gap-1.5 text-xs text-muted-foreground">
                                  <ChevronRight className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                                  <span>{p}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {finalConversion && finalConversion.length > 0 && (
                          <div className="col-span-1 md:col-span-2 space-y-2 pt-2 border-t border-blue-500/10">
                            <h4 className="font-bold text-[10px] uppercase tracking-wider text-rose-600">Conversión y E-commerce</h4>
                            <ul className="space-y-1">
                              {finalConversion.map((p: string, i: number) => (
                                <li key={i} className="flex gap-1.5 text-xs text-muted-foreground">
                                  <ChevronRight className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                                  <span>{p}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    {dataQuality && (
                      <div className="bg-orange-500/5 p-5 rounded-xl border border-orange-500/10 space-y-4">
                        <h3 className="font-bold text-xs uppercase tracking-widest text-orange-600 flex items-center gap-2 border-b pb-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-orange-500"></span>
                          Calidad de Datos y Limitaciones del Análisis
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {dataQuality.missing_information && dataQuality.missing_information.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="font-bold text-[10px] uppercase tracking-wider text-orange-600">Información Faltante</h4>
                              <ul className="space-y-1">
                                {dataQuality.missing_information.map((p: string, i: number) => (
                                  <li key={i} className="flex gap-1.5 text-xs text-muted-foreground">
                                    <ChevronRight className="h-3.5 w-3.5 text-orange-500 shrink-0 mt-0.5" />
                                    <span>{p}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {dataQuality.analysis_limitations && dataQuality.analysis_limitations.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="font-bold text-[10px] uppercase tracking-wider text-slate-600">Limitaciones Detectadas</h4>
                              <ul className="space-y-1">
                                {dataQuality.analysis_limitations.map((p: string, i: number) => (
                                  <li key={i} className="flex gap-1.5 text-xs text-muted-foreground">
                                    <ChevronRight className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
                                    <span>{p}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              // FALLBACK A ESTRUCTURA ANTIGUA
              return (
                <div className="space-y-6">
                  {/* Posicionamiento y Score */}
                  <div className="bg-blue-500/5 p-4 rounded-xl border border-blue-500/10 space-y-2">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-blue-600">Posicionamiento en el Mercado</h4>
                    <p className="text-sm font-medium leading-relaxed text-foreground">
                      {selectedReport.data.market_positioning || selectedReport.data.title || "Sin posicionamiento"}
                    </p>
                    {selectedReport.data.confidence_score && (
                      <div className="flex items-center gap-2 pt-2 border-t border-blue-500/10 mt-2">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Nivel de Confianza IA:</span>
                        <Badge variant="outline" className="text-[10px] font-bold py-0 bg-blue-500/10 border-blue-500/20 text-blue-600">
                          {selectedReport.data.confidence_score * 100}%
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Personalidad y Tono */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedReport.data.brand_personality && selectedReport.data.brand_personality.length > 0 && (
                      <div className="bg-purple-500/5 p-4 rounded-xl border border-purple-500/10">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-purple-600 mb-2">Personalidad de Marca</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {(selectedReport.data.brand_personality || []).map((t: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-[10px] font-bold border-purple-500/20 bg-purple-500/10 text-purple-600">
                              {t}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedReport.data.emotional_tone && selectedReport.data.emotional_tone.length > 0 && (
                      <div className="bg-pink-500/5 p-4 rounded-xl border border-pink-500/10">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-pink-600 mb-2">Tono Emocional</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {(selectedReport.data.emotional_tone || []).map((t: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-[10px] font-bold border-pink-500/20 bg-pink-500/10 text-pink-600">
                              {t}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Fortalezas y Debilidades */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(selectedReport.data.strengths || selectedReport.data.products) && (
                      <div className="bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-600 mb-3">
                          {selectedReport.data.strengths ? "Fortalezas" : "Productos / Servicios"}
                        </h4>
                        <ul className="space-y-2">
                          {(selectedReport.data.strengths || selectedReport.data.products || []).map((p: string, i: number) => (
                            <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                              <ChevronRight className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                              <span>{p}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {(selectedReport.data.weaknesses || selectedReport.data.promotions) && (
                      <div className="bg-rose-500/5 p-4 rounded-xl border border-rose-500/10">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-rose-600 mb-3">
                          {selectedReport.data.weaknesses ? "Puntos a mejorar / Debilidades" : "Promociones / Ofertas"}
                        </h4>
                        <ul className="space-y-2">
                          {(selectedReport.data.weaknesses || selectedReport.data.promotions || []).map((p: string, i: number) => (
                            <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                              <ChevronRight className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                              <span>{p}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Audiencia Objetivo y Tacticas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedReport.data.target_audience && selectedReport.data.target_audience.length > 0 && (
                      <div className="bg-indigo-500/5 p-4 rounded-xl border border-indigo-500/10">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-600 mb-3">Audiencia Objetivo</h4>
                        <ul className="space-y-2">
                          {(selectedReport.data.target_audience || []).map((t: string, i: number) => (
                            <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                              <ChevronRight className="h-3.5 w-3.5 text-indigo-500 shrink-0 mt-0.5" />
                              <span>{t}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {selectedReport.data.marketing_tactics && selectedReport.data.marketing_tactics.length > 0 && (
                      <div className="bg-teal-500/5 p-4 rounded-xl border border-teal-500/10">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-teal-600 mb-3">Tácticas de Marketing</h4>
                        <ul className="space-y-2">
                          {(selectedReport.data.marketing_tactics || []).map((t: string, i: number) => (
                            <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                              <ChevronRight className="h-3.5 w-3.5 text-teal-500 shrink-0 mt-0.5" />
                              <span>{t}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Observaciones de UX y Señales de SEO */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedReport.data.ux_observations && selectedReport.data.ux_observations.length > 0 && (
                      <div className="bg-amber-500/5 p-4 rounded-xl border border-amber-500/10">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-amber-600 mb-3">Observaciones de Experiencia (UX)</h4>
                        <ul className="space-y-2">
                          {(selectedReport.data.ux_observations || []).map((t: string, i: number) => (
                            <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                              <ChevronRight className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                              <span>{t}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {selectedReport.data.seo_signals && selectedReport.data.seo_signals.length > 0 && (
                      <div className="bg-slate-500/5 p-4 rounded-xl border border-slate-500/10">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-slate-600 mb-3">Señales e Indicadores SEO</h4>
                        <ul className="space-y-2">
                          {(selectedReport.data.seo_signals || []).map((t: string, i: number) => (
                            <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                              <ChevronRight className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
                              <span>{t}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Oportunidades y Recomendaciones */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedReport.data.opportunities && selectedReport.data.opportunities.length > 0 && (
                      <div className="bg-yellow-500/5 p-4 rounded-xl border border-yellow-500/10">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-yellow-600 mb-3">Oportunidades Estratégicas</h4>
                        <ul className="space-y-2">
                          {(selectedReport.data.opportunities || []).map((o: string, i: number) => (
                            <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                              <ChevronRight className="h-3.5 w-3.5 text-yellow-500 shrink-0 mt-0.5" />
                              <span>{o}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {(selectedReport.data.strategic_recommendations || selectedReport.data.recommendations) && (
                      <div className="bg-blue-500/5 p-4 rounded-xl border border-blue-500/10">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-blue-600 mb-3">
                          {selectedReport.data.strategic_recommendations ? "Recomendaciones Estratégicas" : "Recomendaciones"}
                        </h4>
                        <ul className="space-y-2">
                          {(selectedReport.data.strategic_recommendations || selectedReport.data.recommendations || []).map((r: string, i: number) => (
                            <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                              <ChevronRight className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                              <span>{r}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "PENDING":
      return <Badge className="bg-yellow-500 text-white hover:bg-yellow-600 text-[9px] font-bold px-1.5 py-0.5 rounded">PENDIENTE</Badge>;
    case "PROCESSING":
      return <Badge className="bg-blue-500 text-white hover:bg-blue-600 text-[9px] font-bold px-1.5 py-0.5 rounded">PROCESANDO</Badge>;
    case "COMPLETED":
      return <Badge className="bg-green-500 text-white hover:bg-green-600 text-[9px] font-bold px-1.5 py-0.5 rounded">LISTO</Badge>;
    case "ERROR":
      return <Badge className="bg-red-500 text-white hover:bg-red-600 text-[9px] font-bold px-1.5 py-0.5 rounded">ERROR</Badge>;
    default:
      return <Badge variant="secondary" className="text-[9px] font-bold px-1.5 py-0.5 rounded">{status}</Badge>;
  }
}
