"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Globe,
  Loader2,
  Facebook,
  Instagram,
  ChevronRight,
  AlertCircle,
  Users,
  ThumbsUp,
  MessageSquare,
  Activity,
  Flame,
  MapPin,
  Award,
  ShieldCheck,
  Megaphone,
  Zap,
  Eye,
  Compass,
  Briefcase,
  TrendingUp,
  Heart,
  Target
} from "lucide-react";
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

const getPlatformTheme = (channel: string) => {
  const c = channel?.toUpperCase();
  if (c === "FACEBOOK") {
    return {
      gradient: "from-blue-600/10 via-blue-500/5 to-cyan-500/5 dark:from-blue-950/20 dark:via-blue-900/10 dark:to-cyan-950/10",
      border: "border-blue-500/20 dark:border-blue-500/10",
      text: "text-blue-600 dark:text-blue-400",
      iconBg: "bg-blue-500/10",
      accent: "blue"
    };
  }
  if (c === "INSTAGRAM") {
    return {
      gradient: "from-purple-600/10 via-pink-500/5 to-orange-500/5 dark:from-purple-950/20 dark:via-pink-950/10 dark:to-orange-950/10",
      border: "border-pink-500/20 dark:border-pink-500/10",
      text: "text-pink-600 dark:text-pink-400",
      iconBg: "bg-pink-500/10",
      accent: "pink"
    };
  }
  if (c === "TIKTOK") {
    return {
      gradient: "from-slate-900/20 via-slate-800/10 to-slate-700/10 dark:from-slate-800/20 dark:via-slate-900/10 dark:to-slate-950/10",
      border: "border-slate-700/20 dark:border-slate-700/10",
      text: "text-slate-900 dark:text-slate-100",
      iconBg: "bg-slate-900/10 dark:bg-white/10",
      accent: "slate"
    };
  }
  return {
    gradient: "from-slate-500/10 to-slate-400/5 dark:from-slate-800/20 dark:to-slate-900/10",
    border: "border-slate-500/20 dark:border-slate-500/10",
    text: "text-slate-600 dark:text-slate-400",
    iconBg: "bg-slate-500/10",
    accent: "slate"
  };
};

const formatSocialMetric = (val: unknown): string => {
  if (val === undefined || val === null || val === "") return "N/D";
  if (typeof val === "number") return val.toLocaleString();
  if (typeof val === "string") {
    if (/[KkMm]/.test(val)) return val.trim();
    const cleanStr = val.replace(/[\s,]/g, "");
    const num = Number(cleanStr);
    if (!isNaN(num)) return num.toLocaleString();
    return val.trim();
  }
  return String(val);
};

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

  const isAnyRequesting = requestingChannel !== null;
  const isAnyPending = channels.some(ch => initialAnalyses[ch.name]?.status === "PENDING" || initialAnalyses[ch.name]?.status === "PROCESSING");
  const isAnyAnalyzing = isAnyRequesting || isAnyPending;


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
                    disabled={isAnyAnalyzing}
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
                      // Normalizar: puede llegar como string JSON serializado desde n8n
                      const dataObj: any = typeof report.data === "string" ? JSON.parse(report.data) : report.data;
                      const isNewestStructure = !!dataObj.brand_identity || !!dataObj.business_insights;
                      const isNewStructure = !!dataObj.competitor_overview;
                      // Soporta esquema nuevo (business_intelligence, community_analysis) y antiguo
                      const isSocialStructure = !!dataObj.facebook_presence || !!dataObj.instagram_presence || !!dataObj.tiktok_presence || !!dataObj.branding_analysis || !!dataObj.business_intelligence || !!dataObj.community_analysis;

                      if (isSocialStructure) {
                        const socialPresence = dataObj.facebook_presence || dataObj.instagram_presence || dataObj.tiktok_presence || {};
                        const branding = dataObj.branding_analysis || {};
                        // Nuevo esquema Facebook
                        const communityAnalysis = dataObj.community_analysis || {};
                        const reputationAnalysis = dataObj.reputation_analysis || {};
                        const bizSignals = dataObj.business_intelligence || dataObj.business_signals || {};
                        const compObs = dataObj.competitive_observations || {};
                        const dQualityObj = dataObj.data_quality || {};
                        const confidenceScore = dQualityObj.confidence_score ?? dataObj.confidence_score;
                        // Normalizar engagement fusionando estructuras antigua y nueva
                        const engagement: any = {
                          ...(dataObj.engagement_analysis || {}),
                          engagement_level: communityAnalysis.current_activity_level ?? dataObj.engagement_analysis?.engagement_level,
                          social_proof_signals: reputationAnalysis.social_proof_signals ?? dataObj.engagement_analysis?.social_proof_signals ?? [],
                          reputation_indicators: reputationAnalysis.trust_signals ?? [],
                          audience_loyalty_indicators: communityAnalysis.audience_loyalty_indicators ?? dataObj.engagement_analysis?.audience_loyalty_indicators ?? [],
                          community_activity_signals: communityAnalysis.community_engagement_signals ?? dataObj.engagement_analysis?.community_activity_signals ?? [],
                        };

                        // Determinar tema visual basado en la plataforma
                        const theme = getPlatformTheme(ch.name);

                        return (
                          <div className="space-y-6">
                            {/* CABECERA SOCIAL PREMIUM */}
                            <div className={`relative overflow-hidden bg-gradient-to-br ${theme.gradient} ${theme.border} p-6 rounded-2xl border shadow-sm`}>
                              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <h3 className="text-2xl font-black tracking-tight text-foreground">
                                      {socialPresence.brand_name || "Nombre del Canal"}
                                    </h3>
                                    {socialPresence.business_category && (
                                      <Badge variant="outline" className={`text-[10px] font-bold ${theme.text} ${theme.iconBg} border-none`}>
                                        {socialPresence.business_category}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground font-medium max-w-2xl leading-relaxed whitespace-pre-line">
                                    {(socialPresence.brand_summary || "Sin resumen disponible.").replace(/\n/g, " • ")}
                                  </p>
                                </div>
                                <div className="flex flex-col items-start md:items-end gap-1.5 shrink-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Alcance:</span>
                                    <Badge variant="secondary" className="text-[10px] font-bold">
                                      {socialPresence.market_scope || "Local / Regional"}
                                    </Badge>
                                  </div>
                                  {confidenceScore != null && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Confianza IA:</span>
                                      <Badge className="text-[10px] font-bold bg-green-500 text-white border-none py-0.5 px-2">
                                        {(confidenceScore * 100).toFixed(0)}%
                                      </Badge>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* PANEL DE MÉTRICAS SOCIALES PREMIUM */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              {/* 1. SEGUIDORES */}
                              <Card className={`relative overflow-hidden bg-gradient-to-br ${theme.gradient} ${theme.border} p-5 rounded-2xl shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-300`}>
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Seguidores</span>
                                  <div className={`p-2 rounded-xl ${theme.iconBg} ${theme.text}`}>
                                    <Users className="h-4 w-4" />
                                  </div>
                                </div>
                                <div className="mt-3">
                                  <span className="text-3xl font-black tracking-tight text-foreground font-sans leading-none block mb-1">
                                    {formatSocialMetric(socialPresence.audience_metrics?.followers ?? socialPresence.audience_size?.followers)}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground/80 font-medium">
                                    Comunidad en la red
                                  </span>
                                </div>
                              </Card>

                              <Card className={`relative overflow-hidden bg-gradient-to-br ${theme.gradient} ${theme.border} p-5 rounded-2xl shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-300`}>
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Me gusta (Likes)</span>
                                  <div className={`p-2 rounded-xl ${theme.iconBg} ${theme.text}`}>
                                    <ThumbsUp className="h-4 w-4" />
                                  </div>
                                </div>
                                <div className="mt-3">
                                  <span className="text-3xl font-black tracking-tight text-foreground font-sans leading-none block mb-1">
                                    {formatSocialMetric(socialPresence.audience_metrics?.likes ?? socialPresence.audience_size?.likes)}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground/80 font-medium">
                                    Aprobación de marca
                                  </span>
                                </div>
                              </Card>

                              <Card className={`relative overflow-hidden bg-gradient-to-br ${theme.gradient} ${theme.border} p-5 rounded-2xl shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-300`}>
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Activos (Semanal)</span>
                                  <div className={`p-2 rounded-xl ${theme.iconBg} ${theme.text}`}>
                                    <Activity className="h-4 w-4" />
                                  </div>
                                </div>
                                <div className="mt-3">
                                  <span className="text-3xl font-black tracking-tight text-foreground font-sans leading-none block mb-1">
                                    {formatSocialMetric(socialPresence.audience_metrics?.talking_about_count ?? socialPresence.audience_size?.talking_about)}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground/80 font-medium">
                                    Hablando de esto
                                  </span>
                                </div>
                              </Card>

                              <Card className={`relative overflow-hidden bg-gradient-to-br ${theme.gradient} ${theme.border} p-5 rounded-2xl shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-300`}>
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Engagement</span>
                                  <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
                                    <Flame className="h-4 w-4" />
                                  </div>
                                </div>
                                <div className="mt-3">
                                  <span className="text-2xl font-black tracking-tight text-orange-600 dark:text-orange-400 leading-none block mb-1">
                                    {engagement.engagement_level || communityAnalysis.community_size_category || "Medio"}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground/80 font-medium">
                                    {reputationAnalysis.total_reviews != null
                                      ? `Reseñas: ${formatSocialMetric(reputationAnalysis.total_reviews)}`
                                      : socialPresence.audience_metrics?.reviews_count != null
                                        ? `Reseñas: ${formatSocialMetric(socialPresence.audience_metrics.reviews_count)}`
                                        : "Nivel de engagement"}
                                  </span>
                                </div>
                              </Card>
                            </div>

                            {/* PESTAÑAS DETALLADAS PREMIUM PARA REDES SOCIALES */}
                            <Tabs defaultValue="presence" className="w-full space-y-4">
                              <TabsList className="grid grid-cols-3 lg:grid-cols-6 h-auto p-1 bg-muted/60 rounded-xl">
                                <TabsTrigger value="presence" className="text-xs py-2 gap-1.5"><MapPin className="h-3.5 w-3.5 shrink-0" /> Madurez</TabsTrigger>
                                <TabsTrigger value="branding" className="text-xs py-2 gap-1.5"><Sparkles className="h-3.5 w-3.5 shrink-0" /> Branding</TabsTrigger>
                                <TabsTrigger value="engagement" className="text-xs py-2 gap-1.5"><Heart className="h-3.5 w-3.5 shrink-0" /> Comunidad</TabsTrigger>
                                <TabsTrigger value="business" className="text-xs py-2 gap-1.5"><Briefcase className="h-3.5 w-3.5 shrink-0" /> Negocio</TabsTrigger>
                                <TabsTrigger value="competitive" className="text-xs py-2 gap-1.5"><Target className="h-3.5 w-3.5 shrink-0" /> Competitividad</TabsTrigger>
                                <TabsTrigger value="recs" className="text-xs py-2 gap-1.5"><Zap className="h-3.5 w-3.5 shrink-0" /> Plan IA</TabsTrigger>
                              </TabsList>

                              {/* PESTAÑA 1: PRESENCIA Y MADUREZ */}
                              <TabsContent value="presence" className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <Card className="p-5 border border-muted/50 shadow-sm space-y-3">
                                    <h4 className="font-bold text-xs uppercase tracking-wider text-primary flex items-center gap-2">
                                      <MapPin className="h-4 w-4" /> Señales de Presencia Local
                                    </h4>
                                    <ul className="space-y-2">
                                      {socialPresence.local_presence_signals && socialPresence.local_presence_signals.length > 0 ? (
                                        socialPresence.local_presence_signals.map((p: string, i: number) => (
                                          <li key={i} className="flex gap-2 text-xs text-muted-foreground leading-relaxed">
                                            <ChevronRight className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                                            <span>{p}</span>
                                          </li>
                                        ))
                                      ) : (
                                        <li className="text-xs text-muted-foreground italic">No se detectaron señales explícitas de ubicación física.</li>
                                      )}
                                    </ul>
                                  </Card>

                                  <Card className="p-5 border border-muted/50 shadow-sm space-y-3">
                                    <h4 className="font-bold text-xs uppercase tracking-wider text-primary flex items-center gap-2">
                                      <Award className="h-4 w-4" /> Madurez de Marca en la Red
                                    </h4>
                                    <ul className="space-y-2">
                                      {socialPresence.brand_maturity_indicators && socialPresence.brand_maturity_indicators.length > 0 ? (
                                        socialPresence.brand_maturity_indicators.map((p: string, i: number) => (
                                          <li key={i} className="flex gap-2 text-xs text-muted-foreground leading-relaxed">
                                            <ChevronRight className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                                            <span>{p}</span>
                                          </li>
                                        ))
                                      ) : (
                                        <li className="text-xs text-muted-foreground italic">No se detectaron indicadores históricos explícitos.</li>
                                      )}
                                    </ul>
                                  </Card>
                                </div>
                              </TabsContent>

                              {/* PESTAÑA 2: BRANDING E IDENTIDAD */}
                              <TabsContent value="branding" className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <Card className="p-5 border border-muted/50 shadow-sm space-y-3">
                                    <h4 className="font-bold text-xs uppercase tracking-wider text-purple-600 flex items-center gap-2">
                                      <Sparkles className="h-4 w-4" /> Personalidad y Tono Emocional
                                    </h4>
                                    <div className="space-y-3">
                                      {branding.brand_personality && branding.brand_personality.length > 0 && (
                                        <div>
                                          <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground block mb-1.5">Personalidad</span>
                                          <div className="flex flex-wrap gap-1.5">
                                            {branding.brand_personality.map((p: string, i: number) => (
                                              <Badge key={i} variant="outline" className="text-[10px] font-bold border-purple-500/20 bg-purple-500/5 text-purple-600 dark:text-purple-400">
                                                {p}
                                              </Badge>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      {branding.emotional_tone && branding.emotional_tone.length > 0 && (
                                        <div>
                                          <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground block mb-1.5">Tono Emocional</span>
                                          <div className="flex flex-wrap gap-1.5">
                                            {branding.emotional_tone.map((p: string, i: number) => (
                                              <Badge key={i} variant="outline" className="text-[10px] font-bold border-pink-500/20 bg-pink-500/5 text-pink-600 dark:text-pink-400">
                                                {p}
                                              </Badge>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </Card>

                                  <Card className="p-5 border border-muted/50 shadow-sm space-y-3">
                                    <h4 className="font-bold text-xs uppercase tracking-wider text-purple-600 flex items-center gap-2">
                                      <Compass className="h-4 w-4" /> Estilo de Comunicación y Visuales
                                    </h4>
                                    <div className="grid grid-cols-1 gap-3">
                                      {branding.communication_style && branding.communication_style.length > 0 && (
                                        <div>
                                          <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground block mb-1">Estilo de Comunicación</span>
                                          <ul className="space-y-1">
                                            {branding.communication_style.map((s: string, i: number) => (
                                              <li key={i} className="flex gap-1.5 text-xs text-muted-foreground leading-normal">
                                                <ChevronRight className="h-3 w-3 text-purple-500 shrink-0 mt-0.5" />
                                                <span>{s}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                      {branding.visual_branding_signals && branding.visual_branding_signals.length > 0 && (
                                        <div className="pt-2 border-t border-muted/20">
                                          <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground block mb-1">Señales Visuales detectadas</span>
                                          <ul className="space-y-1">
                                            {branding.visual_branding_signals.map((s: string, i: number) => (
                                              <li key={i} className="flex gap-1.5 text-xs text-muted-foreground leading-normal">
                                                <ChevronRight className="h-3 w-3 text-purple-500 shrink-0 mt-0.5" />
                                                <span>{s}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                    </div>
                                  </Card>

                                  {branding.brand_positioning_indicators && branding.brand_positioning_indicators.length > 0 && (
                                    <Card className="p-5 border border-muted/50 shadow-sm space-y-2 col-span-1 md:col-span-2 bg-purple-500/5">
                                      <h4 className="font-bold text-xs uppercase tracking-wider text-purple-600">Indicadores de Posicionamiento</h4>
                                      <p className="text-xs text-muted-foreground leading-relaxed">
                                        {branding.brand_positioning_indicators.join(" • ")}
                                      </p>
                                    </Card>
                                  )}
                                </div>
                              </TabsContent>

                              {/* PESTAÑA 3: ENGAGEMENT Y COMUNIDAD */}
                              <TabsContent value="engagement" className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <Card className="p-5 border border-muted/50 shadow-sm space-y-3">
                                    <h4 className="font-bold text-xs uppercase tracking-wider text-pink-600 flex items-center gap-2">
                                      <Heart className="h-4 w-4" /> Actividad y Prueba Social
                                    </h4>
                                    <div className="space-y-3">
                                      {engagement.social_proof_signals && engagement.social_proof_signals.length > 0 && (
                                        <div>
                                          <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground block mb-1">Señales de Prueba Social</span>
                                          <ul className="space-y-1">
                                            {engagement.social_proof_signals.map((s: string, i: number) => (
                                              <li key={i} className="flex gap-1.5 text-xs text-muted-foreground leading-relaxed">
                                                <ChevronRight className="h-3.5 w-3.5 text-pink-500 shrink-0 mt-0.5" />
                                                <span>{s}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                      {engagement.community_activity_signals && engagement.community_activity_signals.length > 0 && (
                                        <div className="pt-2 border-t border-muted/20">
                                          <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground block mb-1">Actividad de la Comunidad</span>
                                          <ul className="space-y-1">
                                            {engagement.community_activity_signals.map((s: string, i: number) => (
                                              <li key={i} className="flex gap-1.5 text-xs text-muted-foreground leading-relaxed">
                                                <ChevronRight className="h-3.5 w-3.5 text-pink-500 shrink-0 mt-0.5" />
                                                <span>{s}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                    </div>
                                  </Card>

                                  <Card className="p-5 border border-muted/50 shadow-sm space-y-3">
                                    <h4 className="font-bold text-xs uppercase tracking-wider text-pink-600 flex items-center gap-2">
                                      <ShieldCheck className="h-4 w-4" /> Reputación y Lealtad
                                    </h4>
                                    <div className="space-y-3">
                                      {engagement.reputation_indicators && engagement.reputation_indicators.length > 0 && (
                                        <div>
                                          <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground block mb-1">Indicadores de Reputación</span>
                                          <ul className="space-y-1">
                                            {engagement.reputation_indicators.map((s: string, i: number) => (
                                              <li key={i} className="flex gap-1.5 text-xs text-muted-foreground leading-relaxed">
                                                <ChevronRight className="h-3.5 w-3.5 text-pink-500 shrink-0 mt-0.5" />
                                                <span>{s}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                      {engagement.audience_loyalty_indicators && engagement.audience_loyalty_indicators.length > 0 && (
                                        <div className="pt-2 border-t border-muted/20">
                                          <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground block mb-1">Fidelización y Lealtad</span>
                                          <ul className="space-y-1">
                                            {engagement.audience_loyalty_indicators.map((s: string, i: number) => (
                                              <li key={i} className="flex gap-1.5 text-xs text-muted-foreground leading-relaxed">
                                                <ChevronRight className="h-3.5 w-3.5 text-pink-500 shrink-0 mt-0.5" />
                                                <span>{s}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                    </div>
                                  </Card>
                                </div>
                              </TabsContent>

                              {/* PESTAÑA 4: SEÑALES DE NEGOCIO */}
                              <TabsContent value="business" className="space-y-4">
                                {/* Indicadores de Inteligencia de Negocio y Reputación */}
                                {(bizSignals.website_present !== undefined || bizSignals.advertising_active !== undefined || bizSignals.phone_contact_available !== undefined || reputationAnalysis.reputation_summary) && (
                                  <Card className="p-5 border border-muted/50 shadow-sm space-y-3 bg-teal-500/5">
                                    <h4 className="font-bold text-xs uppercase tracking-wider text-teal-600 flex items-center gap-2">
                                      <Briefcase className="h-4 w-4" /> Inteligencia Comercial y Reputación (Facebook)
                                    </h4>
                                    <div className="flex flex-wrap gap-2.5">
                                      {reputationAnalysis.reputation_summary && (
                                        <Badge variant="outline" className="text-xs font-bold border-teal-500/20 bg-teal-500/10 text-teal-700 dark:text-teal-400 py-1 px-3">
                                          Reputación: {reputationAnalysis.reputation_summary}
                                        </Badge>
                                      )}
                                      {reputationAnalysis.recommendation_percentage != null && (
                                        <Badge variant="outline" className="text-xs font-bold border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-400 py-1 px-3">
                                          Recomendado: {reputationAnalysis.recommendation_percentage}%
                                        </Badge>
                                      )}
                                      {bizSignals.website_present !== undefined && (
                                        <Badge variant={bizSignals.website_present ? "default" : "secondary"} className={`text-xs font-bold py-1 px-3 ${bizSignals.website_present ? "bg-teal-500 text-white" : "bg-muted text-muted-foreground"}`}>
                                          Sitio Web: {bizSignals.website_present ? "Detectado" : "No detectado"}
                                        </Badge>
                                      )}
                                      {bizSignals.advertising_active !== undefined && (
                                        <Badge variant={bizSignals.advertising_active ? "default" : "secondary"} className={`text-xs font-bold py-1 px-3 ${bizSignals.advertising_active ? "bg-teal-500 text-white" : "bg-muted text-muted-foreground"}`}>
                                          Campañas Activas: {bizSignals.advertising_active ? "Sí" : "No"}
                                        </Badge>
                                      )}
                                      {bizSignals.phone_contact_available !== undefined && (
                                        <Badge variant={bizSignals.phone_contact_available ? "default" : "secondary"} className={`text-xs font-bold py-1 px-3 ${bizSignals.phone_contact_available ? "bg-teal-500 text-white" : "bg-muted text-muted-foreground"}`}>
                                          Contacto Telefónico: {bizSignals.phone_contact_available ? "Disponible" : "No disponible"}
                                        </Badge>
                                      )}
                                      {bizSignals.price_range_indicator && (
                                        <Badge variant="outline" className="text-xs font-bold border-teal-500/20 bg-teal-500/10 text-teal-700 dark:text-teal-400 py-1 px-3">
                                          Precio: {bizSignals.price_range_indicator}
                                        </Badge>
                                      )}
                                    </div>
                                  </Card>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <Card className="p-5 border border-muted/50 shadow-sm space-y-3">
                                    <h4 className="font-bold text-xs uppercase tracking-wider text-teal-600 flex items-center gap-2">
                                      <Briefcase className="h-4 w-4" /> Confianza y Comercialización
                                    </h4>
                                    <div className="space-y-3">
                                      {bizSignals.trust_signals && bizSignals.trust_signals.length > 0 && (
                                        <div>
                                          <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground block mb-1">Señales de Confianza Comercial</span>
                                          <ul className="space-y-1">
                                            {bizSignals.trust_signals.map((s: string, i: number) => (
                                              <li key={i} className="flex gap-1.5 text-xs text-muted-foreground leading-relaxed">
                                                <ChevronRight className="h-3.5 w-3.5 text-teal-500 shrink-0 mt-0.5" />
                                                <span>{s}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                      {bizSignals.commercial_signals && bizSignals.commercial_signals.length > 0 && (
                                        <div className="pt-2 border-t border-muted/20">
                                          <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground block mb-1">Indicadores Comerciales</span>
                                          <ul className="space-y-1">
                                            {bizSignals.commercial_signals.map((s: string, i: number) => (
                                              <li key={i} className="flex gap-1.5 text-xs text-muted-foreground leading-relaxed">
                                                <ChevronRight className="h-3.5 w-3.5 text-teal-500 shrink-0 mt-0.5" />
                                                <span>{s}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                    </div>
                                  </Card>

                                  <Card className="p-5 border border-muted/50 shadow-sm space-y-3">
                                    <h4 className="font-bold text-xs uppercase tracking-wider text-teal-600 flex items-center gap-2">
                                      <Megaphone className="h-4 w-4" /> Marketing y Pauta
                                    </h4>
                                    <div className="space-y-3">
                                      {bizSignals.advertising_signals && bizSignals.advertising_signals.length > 0 && (
                                        <div>
                                          <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground block mb-1">Actividad Publicitaria (Meta Ads)</span>
                                          <ul className="space-y-1">
                                            {bizSignals.advertising_signals.map((s: string, i: number) => (
                                              <li key={i} className="flex gap-1.5 text-xs text-muted-foreground leading-relaxed">
                                                <ChevronRight className="h-3.5 w-3.5 text-teal-500 shrink-0 mt-0.5" />
                                                <span>{s}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                      {bizSignals.platform_usage_maturity && bizSignals.platform_usage_maturity.length > 0 && (
                                        <div className="pt-2 border-t border-muted/20">
                                          <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground block mb-1">Uso de Herramientas de Marketing</span>
                                          <ul className="space-y-1">
                                            {bizSignals.platform_usage_maturity.map((s: string, i: number) => (
                                              <li key={i} className="flex gap-1.5 text-xs text-muted-foreground leading-relaxed">
                                                <ChevronRight className="h-3.5 w-3.5 text-teal-500 shrink-0 mt-0.5" />
                                                <span>{s}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                    </div>
                                  </Card>

                                  {bizSignals.conversion_signals && bizSignals.conversion_signals.length > 0 && (
                                    <Card className="p-5 border border-muted/50 shadow-sm space-y-2 col-span-1 md:col-span-2 bg-teal-500/5">
                                      <h4 className="font-bold text-xs uppercase tracking-wider text-teal-600 flex items-center gap-1.5">
                                        <Zap className="h-4 w-4" /> Canales y Elementos de Conversión detectados
                                      </h4>
                                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                                        {bizSignals.conversion_signals.map((s: string, i: number) => (
                                          <li key={i} className="flex gap-2 text-xs text-muted-foreground leading-normal">
                                            <ChevronRight className="h-3.5 w-3.5 text-teal-600 shrink-0 mt-0.5" />
                                            <span>{s}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </Card>
                                  )}
                                </div>
                              </TabsContent>

                              {/* PESTAÑA 5: OBSERVACIONES COMPETITIVAS */}
                              <TabsContent value="competitive" className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <Card className="p-5 border border-muted/50 shadow-sm space-y-3">
                                    <h4 className="font-bold text-xs uppercase tracking-wider text-orange-600 flex items-center gap-2">
                                      <TrendingUp className="h-4 w-4" /> Fortalezas y Diferenciadores
                                    </h4>
                                    <div className="space-y-3">
                                      {compObs.main_strengths && compObs.main_strengths.length > 0 && (
                                        <div>
                                          <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground block mb-1">Fortalezas detectadas</span>
                                          <ul className="space-y-1">
                                            {compObs.main_strengths.map((s: string, i: number) => (
                                              <li key={i} className="flex gap-1.5 text-xs text-muted-foreground leading-relaxed">
                                                <ChevronRight className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                                <span>{s}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                      {compObs.differentiators && compObs.differentiators.length > 0 && (
                                        <div className="pt-2 border-t border-muted/20">
                                          <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground block mb-1">Factores Diferenciadores</span>
                                          <ul className="space-y-1">
                                            {compObs.differentiators.map((s: string, i: number) => (
                                              <li key={i} className="flex gap-1.5 text-xs text-muted-foreground leading-relaxed">
                                                <ChevronRight className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                                <span>{s}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                    </div>
                                  </Card>

                                  <Card className="p-5 border border-muted/50 shadow-sm space-y-3">
                                    <h4 className="font-bold text-xs uppercase tracking-wider text-orange-600 flex items-center gap-2">
                                      <AlertCircle className="h-4 w-4" /> Debilidades y Visibilidad
                                    </h4>
                                    <div className="space-y-3">
                                      {compObs.main_weaknesses && compObs.main_weaknesses.length > 0 && (
                                        <div>
                                          <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground block mb-1">Debilidades y Oportunidades de Mejora</span>
                                          <ul className="space-y-1">
                                            {compObs.main_weaknesses.map((s: string, i: number) => (
                                              <li key={i} className="flex gap-1.5 text-xs text-muted-foreground leading-relaxed">
                                                <ChevronRight className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                                                <span>{s}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                      {compObs.visibility_indicators && compObs.visibility_indicators.length > 0 && (
                                        <div className="pt-2 border-t border-muted/20">
                                          <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground block mb-1">Indicadores de Visibilidad</span>
                                          <ul className="space-y-1">
                                            {compObs.visibility_indicators.map((s: string, i: number) => (
                                              <li key={i} className="flex gap-1.5 text-xs text-muted-foreground leading-relaxed">
                                                <ChevronRight className="h-3.5 w-3.5 text-orange-500 shrink-0 mt-0.5" />
                                                <span>{s}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                    </div>
                                  </Card>

                                  {compObs.customer_perception_indicators && compObs.customer_perception_indicators.length > 0 && (
                                    <Card className="p-5 border border-muted/50 shadow-sm space-y-2 col-span-1 md:col-span-2 bg-orange-500/5">
                                      <h4 className="font-bold text-xs uppercase tracking-wider text-orange-600 flex items-center gap-1.5">
                                        <Eye className="h-4 w-4" /> Percepción de Clientes y Comunidad
                                      </h4>
                                      <p className="text-xs text-muted-foreground leading-relaxed">
                                        {compObs.customer_perception_indicators.join(" • ")}
                                      </p>
                                    </Card>
                                  )}
                                </div>
                              </TabsContent>

                              {/* PESTAÑA 6: PLAN DE RECOMENDACIONES IA */}
                              <TabsContent value="recs" className="space-y-4">
                                <Card className="p-6 border border-blue-500/10 bg-blue-500/5 shadow-sm space-y-4">
                                  <h4 className="font-bold text-sm text-blue-600 flex items-center gap-2 border-b border-blue-500/10 pb-2">
                                    <Sparkles className="h-4 w-4" /> Recomendaciones Estratégicas de Crecimiento Social
                                  </h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* 1. BRANDING */}
                                    {branding.brand_positioning_indicators && branding.brand_positioning_indicators.length > 0 && (
                                      <div className="space-y-2">
                                        <h5 className="font-bold text-[10px] uppercase tracking-wider text-purple-600">Estrategia de Marca</h5>
                                        <ul className="space-y-1.5">
                                          {branding.brand_positioning_indicators.map((rec: string, i: number) => (
                                            <li key={i} className="flex gap-2 text-xs text-muted-foreground leading-relaxed">
                                              <ChevronRight className="h-3.5 w-3.5 text-purple-500 shrink-0 mt-0.5" />
                                              <span>Fortalecer la comunicación de la marca destacando {rec.toLowerCase()}.</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                    {/* 2. MARKETING */}
                                    {bizSignals.advertising_signals && bizSignals.advertising_signals.length > 0 && (
                                      <div className="space-y-2">
                                        <h5 className="font-bold text-[10px] uppercase tracking-wider text-teal-600">Marketing e Interacción</h5>
                                        <ul className="space-y-1.5">
                                          {bizSignals.advertising_signals.map((rec: string, i: number) => (
                                            <li key={i} className="flex gap-2 text-xs text-muted-foreground leading-relaxed">
                                              <ChevronRight className="h-3.5 w-3.5 text-teal-500 shrink-0 mt-0.5" />
                                              <span>{rec}. Considerar campañas dinámicas locales para captar más tráfico.</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                    {/* 3. CONVERSIÓN */}
                                    {bizSignals.conversion_signals && bizSignals.conversion_signals.length > 0 && (
                                      <div className="space-y-2">
                                        <h5 className="font-bold text-[10px] uppercase tracking-wider text-indigo-600">Canales de Conversión</h5>
                                        <ul className="space-y-1.5">
                                          {bizSignals.conversion_signals.map((rec: string, i: number) => (
                                            <li key={i} className="flex gap-2 text-xs text-muted-foreground leading-relaxed">
                                              <ChevronRight className="h-3.5 w-3.5 text-indigo-500 shrink-0 mt-0.5" />
                                              <span>Vincular y potenciar el {rec.toLowerCase()} como canal de ventas directas.</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                    {/* 4. VISIBILIDAD */}
                                    {compObs.main_weaknesses && compObs.main_weaknesses.length > 0 && (
                                      <div className="space-y-2">
                                        <h5 className="font-bold text-[10px] uppercase tracking-wider text-rose-600">Acción ante Debilidades</h5>
                                        <ul className="space-y-1.5">
                                          {compObs.main_weaknesses.map((rec: string, i: number) => (
                                            <li key={i} className="flex gap-2 text-xs text-muted-foreground leading-relaxed">
                                              <ChevronRight className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                                              <span>Mitigar la debilidad: {rec.toLowerCase()} mediante tácticas correctivas rápidas.</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                </Card>
                              </TabsContent>
                            </Tabs>

                            {/* CALIDAD Y LIMITACIONES */}
                            {dQualityObj && (dQualityObj.missing_information?.length > 0 || dQualityObj.analysis_limitations?.length > 0) && (
                              <div className="bg-orange-500/5 p-5 rounded-xl border border-orange-500/10 space-y-3">
                                <h4 className="font-bold text-xs uppercase tracking-widest text-orange-600 flex items-center gap-2 border-b border-orange-500/10 pb-2">
                                  <AlertCircle className="h-4 w-4" /> Calidad de los Datos y Limitaciones
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {dQualityObj.missing_information && dQualityObj.missing_information.length > 0 && (
                                    <div className="space-y-1.5">
                                      <span className="text-[10px] uppercase font-bold tracking-wider text-orange-600 block">Información Faltante en la Red</span>
                                      <ul className="space-y-1">
                                        {dQualityObj.missing_information.map((p: string, i: number) => (
                                          <li key={i} className="flex gap-1.5 text-xs text-muted-foreground leading-normal">
                                            <ChevronRight className="h-3.5 w-3.5 text-orange-500 shrink-0 mt-0.5" />
                                            <span>{p}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {dQualityObj.analysis_limitations && dQualityObj.analysis_limitations.length > 0 && (
                                    <div className="space-y-1.5">
                                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 block">Limitaciones del Análisis</span>
                                      <ul className="space-y-1">
                                        {dQualityObj.analysis_limitations.map((p: string, i: number) => (
                                          <li key={i} className="flex gap-1.5 text-xs text-muted-foreground leading-normal">
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
                      } else if (isNewestStructure || isNewStructure) {
                        let overview: any = {};
                        let mkt: any = {};
                        let ux: any = {};
                        let insights: any = {};
                        let recs: any = {};
                        let dataQuality: any = null;

                        const socialPresence = report.data.facebook_presence || report.data.instagram_presence || report.data.tiktok_presence || {};
                        const branding = report.data.branding_analysis || {};
                        const engagement = report.data.engagement_analysis || {};
                        const bizSignals = report.data.business_signals || {};
                        const compObs = report.data.competitive_observations || {};
                        const dQualityObj = report.data.data_quality || {};

                        if (isSocialStructure) {
                          overview = {
                            market_positioning: branding.brand_positioning_indicators?.[0] || `${socialPresence.brand_name || "Canal Social"} - ${socialPresence.business_category || "Presencia Social"}`,
                            brand_summary: socialPresence.brand_summary,
                            brand_personality: branding.brand_personality || [],
                            emotional_tone: branding.emotional_tone || [],
                          };

                          mkt = {
                            marketing_tactics: [
                              ...(bizSignals.advertising_signals || []),
                              ...(bizSignals.platform_usage_maturity || []),
                              ...(branding.communication_style || []),
                            ],
                            conversion_elements: bizSignals.conversion_signals || [],
                            seo_signals: bizSignals.commercial_signals || [],
                            content_strategy: branding.visual_branding_signals || [],
                            social_proof_signals: [
                              ...(bizSignals.trust_signals || []),
                              ...(engagement.social_proof_signals || []),
                            ],
                          };

                          ux = {
                            ux_strengths: compObs.main_strengths || [],
                            ux_weaknesses: compObs.main_weaknesses || [],
                            navigation_observations: socialPresence.local_presence_signals || [],
                            conversion_friction_points: compObs.customer_perception_indicators || [],
                            mobile_experience_observations: socialPresence.brand_maturity_indicators || [],
                          };

                          insights = {
                            differentiation_opportunities: compObs.differentiators || [],
                            market_gaps: dQualityObj.missing_information || [],
                            customer_psychology_insights: branding.brand_personality || [],
                          };

                          recs = report.data.strategic_recommendations || {
                            branding_recommendations: branding.brand_positioning_indicators || [],
                            marketing_recommendations: bizSignals.advertising_signals || [],
                            seo_recommendations: bizSignals.commercial_signals || [],
                            ux_recommendations: compObs.visibility_indicators || [],
                            conversion_recommendations: bizSignals.conversion_signals || [],
                          };

                          dataQuality = {
                            confidence_score: dQualityObj.confidence_score,
                            missing_information: dQualityObj.missing_information,
                            analysis_limitations: dQualityObj.analysis_limitations,
                          };
                        } else if (isNewestStructure) {
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
                            {/* Panel de Métricas Sociales (exclusivo para canales sociales) */}
                            {isSocialStructure && (
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {socialPresence.audience_size?.followers && (
                                  <div className="relative overflow-hidden bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border border-blue-500/10 p-4 rounded-xl shadow-sm hover:shadow transition-all">
                                    <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 block">Seguidores</span>
                                    <span className="text-2xl font-extrabold mt-1 block text-foreground">
                                      {isNaN(Number(socialPresence.audience_size.followers))
                                        ? socialPresence.audience_size.followers
                                        : Number(socialPresence.audience_size.followers).toLocaleString()}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground mt-0.5 block">{socialPresence.market_scope || "Alcance del canal"}</span>
                                  </div>
                                )}
                                {socialPresence.audience_size?.likes && (
                                  <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500/5 to-blue-500/5 border border-indigo-500/10 p-4 rounded-xl shadow-sm hover:shadow transition-all">
                                    <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 block">Me gusta (Likes)</span>
                                    <span className="text-2xl font-extrabold mt-1 block text-foreground">
                                      {isNaN(Number(socialPresence.audience_size.likes))
                                        ? socialPresence.audience_size.likes
                                        : Number(socialPresence.audience_size.likes).toLocaleString()}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground mt-0.5 block">{socialPresence.business_category || "Categoría de Negocio"}</span>
                                  </div>
                                )}
                                {socialPresence.audience_size?.talking_about && (
                                  <div className="relative overflow-hidden bg-gradient-to-br from-teal-500/5 to-emerald-500/5 border border-teal-500/10 p-4 rounded-xl shadow-sm hover:shadow transition-all">
                                    <span className="text-[10px] uppercase font-bold tracking-wider text-teal-600 block">Usuarios activos</span>
                                    <span className="text-2xl font-extrabold mt-1 block text-foreground">
                                      {isNaN(Number(socialPresence.audience_size.talking_about))
                                        ? socialPresence.audience_size.talking_about
                                        : Number(socialPresence.audience_size.talking_about).toLocaleString()}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground mt-0.5 block">Interactuando semanalmente</span>
                                  </div>
                                )}
                                {engagement.engagement_level && (
                                  <div className="relative overflow-hidden bg-gradient-to-br from-purple-500/5 to-pink-500/5 border border-purple-500/10 p-4 rounded-xl shadow-sm hover:shadow transition-all flex flex-col justify-between">
                                    <div>
                                      <span className="text-[10px] uppercase font-bold tracking-wider text-purple-600 block">Engagement</span>
                                      <span className="text-xl font-extrabold mt-1 block text-purple-700 dark:text-purple-400">
                                        {engagement.engagement_level}
                                      </span>
                                    </div>
                                    {socialPresence.audience_size?.reviews_count && (
                                      <span className="text-[9px] text-muted-foreground mt-1 block">
                                        Basado en {socialPresence.audience_size.reviews_count} reseñas
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

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
