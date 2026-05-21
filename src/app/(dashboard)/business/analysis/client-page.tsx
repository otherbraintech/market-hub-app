"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Globe, Loader2, Facebook, Instagram, ChevronRight, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

export function BusinessAnalysisClient({ businessId, business, initialAnalyses }: any) {
  const [requestingChannel, setRequestingChannel] = useState<string | null>(null);
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
      
      // Branding
      if (weaknessesStr.includes("branding") || weaknessesStr.includes("marca") || missingStr.includes("social")) {
        arr.push("Fortalecer tu identidad de marca con storytelling enfocado en tu valor y diferenciación.");
      }
      if (missingStr.includes("redes") || weaknessesStr.includes("redes")) {
        arr.push("Crear y vincular perfiles de redes sociales activos para consolidar la confianza de los clientes.");
      }
      if (arr.length === 0) {
        arr.push("Definir una propuesta de valor única y posicionamiento estratégico frente a competidores locales.");
      }
      
      // Marketing
      if (weaknessesStr.includes("contacto") || missingStr.includes("contacto")) {
        arr.push("Configurar botones de contacto directos como WhatsApp en tu página para mejorar la captación.");
      }
      if (weaknessesStr.includes("seo") || weaknessesStr.includes("seo")) {
        arr.push("Comenzar con campañas de búsqueda pagada en tu ciudad para aparecer ante clientes potenciales.");
      }
      if (arr.length <= 1) {
        arr.push("Implementar promociones de temporada y darlas a conocer en canales digitales locales.");
      }
      
      // SEO
      if (weaknessesStr.includes("seo") || weaknessesStr.includes("seo") || missingStr.includes("metadatos")) {
        arr.push("Optimizar títulos y metadatos de tu sitio web para búsquedas locales relevantes.");
        arr.push("Hacer un listado de keywords prioritarias para pastelería y chocolates en tu región.");
      } else {
        arr.push("Optimizar imágenes y velocidad de carga móvil para aumentar tu indexación orgánica.");
      }
      
      // UX
      if (weaknessesStr.includes("producto") || missingStr.includes("producto")) {
        arr.push("Estructurar un catálogo digital detallado y visualmente atractivo de todos tus pasteles y productos.");
      }
      if (weaknessesStr.includes("contacto") || missingStr.includes("contacto")) {
        arr.push("Hacer que los datos de contacto y la ubicación de tiendas sean sumamente fáciles de encontrar.");
      }
      if (arr.length <= 4) {
        arr.push("Asegurar una velocidad de carga y navegación fluidas en dispositivos móviles.");
      }
      
      // Conversion
      if (weaknessesStr.includes("carrito") || weaknessesStr.includes("checkout") || weaknessesStr.includes("commerce")) {
        arr.push("Integrar un botón rápido de pedidos vía WhatsApp para automatizar las conversiones de compra.");
      }
      if (weaknessesStr.includes("fidelización") || weaknessesStr.includes("loyalty")) {
        arr.push("Considerar un programa básico de lealtad (ej: tarjetas de fidelización) para fomentar la retención.");
      }
      if (arr.length <= 5) {
        arr.push("Crear llamadas a la acción (CTAs) claras y persuasivas en toda la página.");
      }
      
      return arr;
    }
    
    return [];
  };

  let facebookUrl = "";
  let instagramUrl = "";
  let tiktokUrl = "";

  if (business.socialLinks) {
    try {
      const links = typeof business.socialLinks === "string" ? JSON.parse(business.socialLinks) : business.socialLinks;
      facebookUrl = links.facebook || "";
      instagramUrl = links.instagram || "";
      tiktokUrl = links.tiktok || "";
    } catch (e) {
      console.error("Error parsing social links:", e);
    }
  }

  const channels = [
    { key: "website", name: "WEBSITE", label: "Sitio Web", icon: Globe, color: "text-blue-500", url: business.website },
    { key: "facebook", name: "FACEBOOK", label: "Facebook", icon: Facebook, color: "text-blue-600", url: facebookUrl },
    { key: "instagram", name: "INSTAGRAM", label: "Instagram", icon: Instagram, color: "text-pink-500", url: instagramUrl },
    { key: "tiktok", name: "TIKTOK", label: "TikTok", icon: TikTokIcon, color: "text-black dark:text-white", url: tiktokUrl },
  ].filter(c => c.url);

  const handleRequestAnalysis = async (channel: string, url: string) => {
    const promise = new Promise(async (resolve, reject) => {
      try {
        setRequestingChannel(channel);
        const res = await fetch("/api/analysis/request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "MY_BUSINESS",
            entityId: businessId,
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
        setRequestingChannel(null);
      }
    });

    toast.promise(promise, {
      loading: `Enviando sitio de tu negocio a analizar a n8n...`,
      success: `¡Análisis iniciado! El agente de IA de n8n está escaneando tu sitio web en segundo plano.`,
      error: (err: any) => err.message || "Error al iniciar el análisis en n8n.",
    });
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Mi Negocio IA</h2>
          <p className="text-muted-foreground text-sm">
            Analiza el posicionamiento, contenido e impacto de tus propios canales digitales.
          </p>
        </div>
      </div>

      {channels.length === 0 ? (
        <Card className="border border-dashed border-muted-foreground/30">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Sparkles className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-bold">Sin canales digitales configurados</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-2 mb-4">
              Por favor ve a la pestaña de edición de tu negocio y configura tu Sitio Web o enlaces de Facebook, Instagram o TikTok para poder iniciar un análisis.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue={channels[0].name} className="space-y-4">
          <TabsList>
            {channels.map(ch => {
              const Icon = ch.icon;
              return (
                <TabsTrigger key={ch.name} value={ch.name} className="gap-2">
                  <Icon className={`h-4 w-4 ${ch.color}`} />
                  {ch.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {channels.map(ch => {
            const report = initialAnalyses[ch.name];
            const isPending = report?.status === "PENDING" || report?.status === "PROCESSING";
            const isRequesting = requestingChannel === ch.name;
            const Icon = ch.icon;

            return (
              <TabsContent key={ch.name} value={ch.name} className="space-y-4">
                <div className="flex justify-between items-center bg-muted/20 p-4 rounded-xl border border-muted/50">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Canal de Análisis</span>
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <Icon className={`h-5 w-5 ${ch.color}`} />
                      {ch.label}
                    </h3>
                    <p className="text-xs text-blue-500">
                      <a href={ch.url} target="_blank" rel="noreferrer" className="hover:underline">{ch.url}</a>
                    </p>
                  </div>
                  <Button
                    onClick={() => handleRequestAnalysis(ch.name, ch.url)}
                    disabled={isPending || isRequesting}
                    className="gap-2"
                  >
                    {isRequesting || isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    {report ? "Re-analizar canal" : "Iniciar análisis"}
                  </Button>
                </div>

                <Card className="border border-muted/50 shadow-sm">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Resultados del Análisis</CardTitle>
                        <CardDescription>
                          Reporte detallado sobre la presencia en este canal digital.
                        </CardDescription>
                      </div>
                      {report && <StatusBadge status={report.status} />}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {!report ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed rounded-xl">
                        <Sparkles className="h-10 w-10 text-muted-foreground/30 mb-3" />
                        <h3 className="text-sm font-semibold">Aún no hay análisis. Solicita uno nuevo.</h3>
                      </div>
                    ) : report.status === "COMPLETED" && report.data ? (() => {
                      const isNewestStructure = !!report.data.brand_identity || !!report.data.business_insights;
                      const isNewStructure = !!report.data.competitor_overview;

                      if (isNewestStructure || isNewStructure) {
                        let overview: any = {};
                        let mkt: any = {};
                        let ux: any = {};
                        let insights: any = {};
                        let recs: any = {};
                        let dataQuality: any = null;

                        if (isNewestStructure) {
                          const bIdentity = report.data.brand_identity || {};
                          const wAnalysis = report.data.website_analysis || {};
                          const mSignals = report.data.marketing_signals || {};
                          const bInsights = report.data.business_insights || {};
                          const dQuality = report.data.data_quality || {};

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

                          recs = report.data.strategic_recommendations || {};

                          dataQuality = {
                            confidence_score: dQuality.confidence_score,
                            missing_information: dQuality.missing_information,
                            analysis_limitations: dQuality.analysis_limitations,
                          };
                        } else {
                          overview = report.data.competitor_overview || {};
                          mkt = report.data.marketing_analysis || {};
                          ux = report.data.ux_analysis || {};
                          insights = report.data.competitive_insights || {};
                          recs = report.data.strategic_recommendations || {};
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
                            arr.push("Fortalecer tu identidad de marca con storytelling enfocado en tu valor y diferenciación.");
                          }
                          if (missingStr.includes("redes") || weaknessesStr.includes("redes")) {
                            arr.push("Crear y vincular perfiles de redes sociales activos para consolidar la confianza de los clientes.");
                          }
                          if (arr.length === 0) {
                            arr.push("Definir una propuesta de valor única y posicionamiento estratégico frente a competidores locales.");
                          }
                          return arr;
                        })();

                        const finalMarketing = marketingRecs.length > 0 ? marketingRecs : (() => {
                          const arr = [];
                          const weaknessesStr = (ux.ux_weaknesses || []).join(" ").toLowerCase();
                          const missingStr = (insights.market_gaps || []).join(" ").toLowerCase();
                          if (weaknessesStr.includes("contacto") || missingStr.includes("contacto")) {
                            arr.push("Configurar botones de contacto directos como WhatsApp en tu página para mejorar la captación.");
                          }
                          if (weaknessesStr.includes("seo") || missingStr.includes("seo")) {
                            arr.push("Comenzar con campañas de búsqueda pagada en tu ciudad para aparecer ante clientes potenciales.");
                          }
                          if (arr.length === 0) {
                            arr.push("Implementar promociones de temporada y darlas a conocer en canales digitales locales.");
                          }
                          return arr;
                        })();

                        const finalSeo = seoRecs.length > 0 ? seoRecs : (() => {
                          const arr = [];
                          const weaknessesStr = (ux.ux_weaknesses || []).join(" ").toLowerCase();
                          const missingStr = (insights.market_gaps || []).join(" ").toLowerCase();
                          if (weaknessesStr.includes("seo") || weaknessesStr.includes("seo") || missingStr.includes("metadatos")) {
                            arr.push("Optimizar títulos y metadatos de tu sitio web para búsquedas locales relevantes.");
                            arr.push("Hacer un listado de keywords prioritarias para pastelería y chocolates en tu región.");
                          } else {
                            arr.push("Optimizar imágenes y velocidad de carga móvil para aumentar tu indexación orgánica.");
                          }
                          return arr;
                        })();

                        const finalUx = uxRecs.length > 0 ? uxRecs : (() => {
                          const arr = [];
                          const weaknessesStr = (ux.ux_weaknesses || []).join(" ").toLowerCase();
                          const missingStr = (insights.market_gaps || []).join(" ").toLowerCase();
                          if (weaknessesStr.includes("producto") || missingStr.includes("producto")) {
                            arr.push("Estructurar un catálogo digital detallado y visualmente atractivo de todos tus pasteles y productos.");
                          }
                          if (weaknessesStr.includes("contacto") || missingStr.includes("contacto")) {
                            arr.push("Hacer que los datos de contacto y la ubicación de tiendas sean sumamente fáciles de encontrar.");
                          }
                          if (arr.length === 0) {
                            arr.push("Asegurar una velocidad de carga y navegación fluidas en dispositivos móviles.");
                          }
                          return arr;
                        })();

                        const finalConversion = convRecs.length > 0 ? convRecs : (() => {
                          const arr = [];
                          const weaknessesStr = (ux.ux_weaknesses || []).join(" ").toLowerCase();
                          const missingStr = (insights.market_gaps || []).join(" ").toLowerCase();
                          if (weaknessesStr.includes("carrito") || weaknessesStr.includes("checkout") || weaknessesStr.includes("commerce")) {
                            arr.push("Integrar un botón rápido de pedidos vía WhatsApp para automatizar las conversiones de compra.");
                          }
                          if (weaknessesStr.includes("fidelización") || weaknessesStr.includes("loyalty")) {
                            arr.push("Considerar un programa básico de lealtad (ej: tarjetas de fidelización) para fomentar la retención.");
                          }
                          if (arr.length === 0) {
                            arr.push("Crear llamadas a la acción (CTAs) claras y persuasivas en toda la página.");
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
                              {report.data.confidence_score && (
                                <div className="flex items-center gap-2 pt-2 border-t border-blue-500/10 mt-2">
                                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Nivel de Confianza IA:</span>
                                  <Badge variant="outline" className="text-[10px] font-bold py-0 bg-blue-500/10 border-blue-500/20 text-blue-600">
                                    {report.data.confidence_score * 100}%
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
                                    <h4 className="font-bold text-[10px] uppercase tracking-wider text-orange-600">Puntos de Fricción</h4>
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
                            {hasRecommendations && (
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
                            )}

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
                          <div className="bg-muted/30 p-4 rounded-xl border border-muted/50">
                            <h4 className="font-bold text-xs uppercase text-muted-foreground mb-2">Posicionamiento / Resumen</h4>
                            <p className="font-semibold text-base">
                              {report.data.market_positioning || report.data.title || "Análisis completado"}
                            </p>
                            {(report.data.metaDescription || report.data.brand_personality) && (
                              <p className="text-xs text-muted-foreground mt-2">
                                {report.data.metaDescription || `Personalidad de Marca: ${(report.data.brand_personality || []).join(", ")}`}
                              </p>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10">
                              <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-600 mb-3">
                                {report.data.strengths ? "Fortalezas Detectadas" : "Productos Detectados"}
                              </h4>
                              <ul className="list-disc pl-5 text-xs space-y-1.5 text-muted-foreground">
                                {(report.data.strengths || report.data.products || []).map((p: string, i: number) => (
                                  <li key={i}>{p}</li>
                                ))}
                              </ul>
                            </div>
                            <div className="bg-rose-500/5 p-4 rounded-xl border border-rose-500/10">
                              <h4 className="font-bold text-xs uppercase tracking-wider text-rose-600 mb-3">
                                {report.data.weaknesses ? "Debilidades / Puntos a Mejorar" : "Promociones Activas"}
                              </h4>
                              <ul className="list-disc pl-5 text-xs space-y-1.5 text-muted-foreground">
                                {(report.data.weaknesses || report.data.promotions || []).map((p: string, i: number) => (
                                  <li key={i}>{p}</li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          {(report.data.opportunities || report.data.target_audience) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {report.data.opportunities && (
                                <div className="bg-yellow-500/5 p-4 rounded-xl border border-yellow-500/10">
                                  <h4 className="font-bold text-xs uppercase tracking-wider text-yellow-600 mb-3">Oportunidades</h4>
                                  <ul className="list-disc pl-5 text-xs space-y-1.5 text-muted-foreground">
                                    {(report.data.opportunities || []).map((o: string, i: number) => (
                                      <li key={i}>{o}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {report.data.target_audience && (
                                <div className="bg-purple-500/5 p-4 rounded-xl border border-purple-500/10">
                                  <h4 className="font-bold text-xs uppercase tracking-wider text-purple-600 mb-3">Audiencia Objetivo</h4>
                                  <ul className="list-disc pl-5 text-xs space-y-1.5 text-muted-foreground">
                                    {(report.data.target_audience || []).map((t: string, i: number) => (
                                      <li key={i}>{t}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}

                          <div className="bg-blue-500/5 p-4 rounded-xl border border-blue-500/10">
                            <h4 className="font-bold text-xs uppercase tracking-wider text-blue-600 mb-3">Recomendaciones de Mejora</h4>
                            <ul className="space-y-3">
                              {getFlatRecommendations(report.data).map((rec: string, i: number) => (
                                <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                                  <ChevronRight className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                                  <span>{rec}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      );
                    })() : report.status === "ERROR" ? (
                      <div className="bg-destructive/10 p-4 rounded-xl border border-destructive/20 text-destructive flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 shrink-0" />
                        <div>
                          <p className="font-bold text-sm">Error en el análisis</p>
                          <p className="text-sm mt-1">{report.error || "Ocurrió un error inesperado."}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground text-center py-12 flex flex-col items-center gap-3">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                        El análisis está siendo procesado por el motor externo (n8n)...
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "PENDING":
      return <Badge className="bg-yellow-500 text-white hover:bg-yellow-600 text-[10px] font-bold px-2 py-0.5">PENDIENTE</Badge>;
    case "PROCESSING":
      return <Badge className="bg-blue-500 text-white hover:bg-blue-600 text-[10px] font-bold px-2 py-0.5">PROCESANDO</Badge>;
    case "COMPLETED":
      return <Badge className="bg-green-500 text-white hover:bg-green-600 text-[10px] font-bold px-2 py-0.5">LISTO</Badge>;
    case "ERROR":
      return <Badge className="bg-red-500 text-white hover:bg-red-600 text-[10px] font-bold px-2 py-0.5">ERROR</Badge>;
    default:
      return <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0.5">{status}</Badge>;
  }
}
