"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sparkles, Globe, Loader2, Facebook, Instagram, ChevronRight, FileText,
  Users, ThumbsUp, MessageSquare, Activity, Flame, MapPin, Award, ShieldCheck,
  Megaphone, Zap, Eye, Compass, Briefcase, TrendingUp, Heart, Target,
  AlertCircle, Star, Linkedin, Youtube, Search, ArrowLeft, Smile, RefreshCw,
  CheckCircle2, Lightbulb
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ScrapingReportDialog } from "@/components/business/scraping-report-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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

const parseSocialMetric = (val: any): number | null => {
  if (val === undefined || val === null || val === "") return null;
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    let clean = val.trim().toLowerCase();
    let multiplier = 1;
    if (clean.endsWith("k")) {
      multiplier = 1000;
      clean = clean.slice(0, -1);
    } else if (clean.endsWith("m")) {
      multiplier = 1000000;
      clean = clean.slice(0, -1);
    }
    if (multiplier > 1) {
      clean = clean.replace(/,/g, ".");
      const parsed = parseFloat(clean);
      return isNaN(parsed) ? null : Math.round(parsed * multiplier);
    } else {
      clean = clean.replace(/[\s]/g, "");
      const parsed = parseInt(clean.replace(/[.,]/g, ""), 10);
      return isNaN(parsed) ? null : parsed;
    }
  }
  return null;
};

const formatLocaleNumber = (val: any): string => {
  if (val === undefined || val === null) return "N/D";
  const num = Number(val);
  if (isNaN(num)) return typeof val === "string" ? val.trim() : val.toString();
  return num.toLocaleString('es-ES');
};

const formatSocialMetric = (val: any) => {
  const num = parseSocialMetric(val);
  if (num === null) {
    return typeof val === "string" ? val.trim() : "N/D";
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return num.toLocaleString('es-ES');
};

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
  if (c === "LINKEDIN") {
    return {
      gradient: "from-blue-700/10 via-blue-600/5 to-blue-500/5 dark:from-blue-950/20 dark:via-blue-900/10 dark:to-blue-950/10",
      border: "border-blue-700/20 dark:border-blue-700/10",
      text: "text-blue-700 dark:text-blue-400",
      iconBg: "bg-blue-700/10",
      accent: "blue"
    };
  }
  if (c === "YOUTUBE") {
    return {
      gradient: "from-red-600/10 via-red-500/5 to-red-400/5 dark:from-red-950/20 dark:via-red-900/10 dark:to-red-950/10",
      border: "border-red-600/20 dark:border-red-600/10",
      text: "text-red-600 dark:text-red-400",
      iconBg: "bg-red-600/10",
      accent: "red"
    };
  }
  if (c === "SEO_GOOGLE") {
    return {
      gradient: "from-green-600/10 via-green-500/5 to-emerald-500/5 dark:from-green-950/20 dark:via-green-900/10 dark:to-emerald-950/10",
      border: "border-green-600/20 dark:border-green-600/10",
      text: "text-green-600 dark:text-green-400",
      iconBg: "bg-green-600/10",
      accent: "green"
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

const getPlatformHoverClasses = (channel: string) => {
  const c = channel?.toUpperCase();
  if (c === "FACEBOOK") {
    return "hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 dark:hover:bg-blue-950/30 dark:hover:text-blue-300";
  }
  if (c === "INSTAGRAM") {
    return "hover:bg-pink-50 hover:text-pink-700 hover:border-pink-300 dark:hover:bg-pink-950/30 dark:hover:text-pink-300";
  }
  if (c === "TIKTOK") {
    return "hover:bg-slate-100 hover:text-slate-900 hover:border-slate-400 dark:hover:bg-slate-800/40 dark:hover:text-slate-100";
  }
  if (c === "LINKEDIN") {
    return "hover:bg-blue-50 hover:text-blue-800 hover:border-blue-400 dark:hover:bg-blue-950/30 dark:hover:text-blue-300";
  }
  if (c === "YOUTUBE") {
    return "hover:bg-red-50 hover:text-red-700 hover:border-red-300 dark:hover:bg-red-950/30 dark:hover:text-red-300";
  }
  if (c === "SEO_GOOGLE" || c === "WEBSITE") {
    return "hover:bg-violet-50 hover:text-violet-700 hover:border-violet-300 dark:hover:bg-violet-950/30 dark:hover:text-violet-300";
  }
  return "hover:bg-violet-50 hover:text-violet-700 hover:border-violet-300 dark:hover:bg-violet-950/30 dark:hover:text-violet-300";
};

const accentMap: Record<string, string> = {
  blue: "bg-blue-500",
  pink: "bg-pink-500",
  slate: "bg-slate-900 dark:bg-white",
  red: "bg-red-500",
  green: "bg-green-500",
  purple: "bg-purple-500",
  emerald: "bg-emerald-500",
  cyan: "bg-cyan-500",
  orange: "bg-orange-500",
  amber: "bg-amber-500",
  violet: "bg-violet-500",
};

interface BusinessAnalysisClientProps {
  businessId: string;
  business: any;
  initialAnalyses: Record<string, any>;
}

export function BusinessAnalysisClient({ businessId, business, initialAnalyses }: BusinessAnalysisClientProps) {
  const router = useRouter();
  const [requestingChannel, setRequestingChannel] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [loadingReport, setLoadingReport] = useState(true);
  const [generatingAnalysis, setGeneratingAnalysis] = useState(false);
  const [consolidatedAnalysis, setConsolidatedAnalysis] = useState<any>(null);

  useEffect(() => {
    fetchReport();
  }, [businessId]);

  const fetchReport = async () => {
    try {
      setLoadingReport(true);
      const response = await fetch(`/api/business/${businessId}/general-report`);
      if (response.ok) {
        const data = await response.json();
        setReportData(data);
        if (data.consolidatedAnalysis) {
          setConsolidatedAnalysis(data.consolidatedAnalysis);
        }
      }
    } catch (err) {
      console.error('Error fetching general report:', err);
    } finally {
      setLoadingReport(false);
    }
  };

  const generateConsolidatedAnalysis = async () => {
    try {
      setGeneratingAnalysis(true);
      const response = await fetch(`/api/business/${businessId}/consolidated-analysis`, {
        method: 'POST'
      });
      if (response.ok) {
        const data = await response.json();
        setConsolidatedAnalysis(data.analysis);
        toast.success("¡Análisis consolidado generado con éxito!");
      } else {
        toast.error("Error al generar el análisis consolidado.");
      }
    } catch (err) {
      console.error('Error generating consolidated analysis:', err);
      toast.error("Error al generar el análisis consolidado.");
    } finally {
      setGeneratingAnalysis(false);
    }
  };

  const handleRequestAnalysis = async (channel: string, url: string) => {
    const promise = new Promise(async (resolve, reject) => {
      try {
        setRequestingChannel(channel);
        const res = await fetch(`/api/business/${businessId}/scrap`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
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
      loading: `Enviando ${channel.toLowerCase()} a analizar a n8n...`,
      success: `¡Análisis iniciado! El agente de IA de n8n está escaneando en segundo plano.`,
      error: (err: any) => err.message || "Error al iniciar el análisis en n8n.",
    });
  };

  // Extract all cards (business channel combination)
  const cards: any[] = [];
  
  let facebookUrl = "";
  let instagramUrl = "";
  let tiktokUrl = "";
  let linkedinUrl = "";
  let youtubeUrl = "";
  let seoGoogleUrl = "";

  if (business.socialLinks) {
    try {
      const links = typeof business.socialLinks === "string" ? JSON.parse(business.socialLinks) : business.socialLinks;
      facebookUrl = links.facebook || "";
      instagramUrl = links.instagram || "";
      tiktokUrl = links.tiktok || "";
      linkedinUrl = links.linkedin || "";
      youtubeUrl = links.youtube || "";
      seoGoogleUrl = links.seoGoogle || "";
    } catch (e) {
      console.error("Error parsing social links:", e);
    }
  }

  const channelConfigs = [
    { key: "website", name: "WEBSITE", label: "Sitio Web", icon: Globe, color: "text-blue-500", url: business.website },
    { key: "facebook", name: "FACEBOOK", label: "Facebook", icon: Facebook, color: "text-blue-600", url: facebookUrl },
    { key: "instagram", name: "INSTAGRAM", label: "Instagram", icon: Instagram, color: "text-pink-500", url: instagramUrl },
    { key: "tiktok", name: "TIKTOK", label: "TikTok", icon: TikTokIcon, color: "text-black dark:text-white", url: tiktokUrl },
    { key: "linkedin", name: "LINKEDIN", label: "LinkedIn", icon: Linkedin, color: "text-blue-700", url: linkedinUrl },
    { key: "youtube", name: "YOUTUBE", label: "YouTube", icon: Youtube, color: "text-red-600", url: youtubeUrl },
    { key: "seoGoogle", name: "SEO_GOOGLE", label: "SEO Google", icon: Search, color: "text-green-600", url: seoGoogleUrl },
  ];

  channelConfigs.forEach((chConfig) => {
    if (chConfig.url) {
      cards.push({
        channel: chConfig.name,
        label: chConfig.label,
        icon: chConfig.icon,
        color: chConfig.color,
        url: chConfig.url,
        report: initialAnalyses[chConfig.name] || null,
      });
    }
  });

  const isAnyRequesting = requestingChannel !== null;
  const isAnyPending = cards.some((card: any) => card.report?.status === "PENDING" || card.report?.status === "PROCESSING");
  const isAnyAnalyzing = isAnyRequesting || isAnyPending;

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Análisis de Mi Negocio: {business.name}</h2>
            <p className="text-muted-foreground text-sm">
              Monitorea y analiza los canales digitales de {business.name} con informes inteligentes generados por IA a partir del scraping de su presencia online.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/business/${businessId}`}>
            <Button variant="outline" className="gap-2 cursor-pointer transition-all active:scale-[0.98] hover:bg-slate-50">
              <Briefcase className="h-4 w-4" />
              Ver Negocio
            </Button>
          </Link>
        </div>
      </div>

      {/* Consolidated AI Analysis */}
      {loadingReport ? (
        <Card className="border-none shadow-sm bg-slate-50/50">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-violet-500 mb-3" />
            <p className="text-sm text-muted-foreground">Cargando análisis consolidado...</p>
          </CardContent>
        </Card>
      ) : consolidatedAnalysis ? (
        <Card className="bg-gradient-to-br from-violet-50/40 via-white to-white border-violet-100/80 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-violet-950">
              <Sparkles className="h-5 w-5 text-violet-600" />
              Análisis Consolidado con IA
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={generateConsolidatedAnalysis}
              disabled={generatingAnalysis}
              className="gap-2 text-violet-700 border-violet-200 bg-violet-50 hover:bg-violet-100 hover:text-violet-800"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${generatingAnalysis ? 'animate-spin' : ''}`} />
              {generatingAnalysis ? 'Generando...' : 'Actualizar Análisis'}
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Executive Summary */}
            {consolidatedAnalysis.executiveSummary && (
              <div className="bg-violet-50/30 rounded-xl p-4 border border-violet-100/50">
                <h3 className="text-xs font-bold text-violet-900 mb-1.5 uppercase tracking-wider flex items-center gap-2">
                  <Target className="h-4 w-4 text-violet-600" />
                  Resumen Ejecutivo
                </h3>
                <p className="text-sm text-slate-700 leading-relaxed">{consolidatedAnalysis.executiveSummary}</p>
              </div>
            )}

            {/* Market Position */}
            {consolidatedAnalysis.marketPosition && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-white rounded-lg p-3 border border-slate-100 shadow-sm">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Posición Actual</h4>
                  <p className="text-xs text-slate-700 leading-relaxed">{consolidatedAnalysis.marketPosition.currentPosition}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-slate-100 shadow-sm">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Ventaja Competitiva</h4>
                  <p className="text-xs text-slate-700 leading-relaxed">{consolidatedAnalysis.marketPosition.competitiveAdvantage}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-slate-100 shadow-sm">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Oportunidad de Mercado</h4>
                  <p className="text-xs text-slate-700 leading-relaxed">{consolidatedAnalysis.marketPosition.marketGap}</p>
                </div>
              </div>
            )}

            {/* SWOT (Matriz FODA) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-emerald-50/50 rounded-xl p-3 border border-emerald-100">
                <h4 className="text-xs font-bold text-emerald-800 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Fortalezas
                </h4>
                <ul className="space-y-1.5">
                  {consolidatedAnalysis.strengths?.slice(0, 4).map((s: string, i: number) => (
                    <li key={i} className="text-xs text-emerald-900/80 flex gap-1.5 items-start">
                      <span className="text-emerald-500 mt-0.5">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-rose-50/50 rounded-xl p-3 border border-rose-100">
                <h4 className="text-xs font-bold text-rose-800 mb-2 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 text-rose-600" />
                  Debilidades
                </h4>
                <ul className="space-y-1.5">
                  {consolidatedAnalysis.weaknesses?.slice(0, 4).map((w: string, i: number) => (
                    <li key={i} className="text-xs text-rose-900/80 flex gap-1.5 items-start">
                      <span className="text-rose-500 mt-0.5">•</span>
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-blue-50/50 rounded-xl p-3 border border-blue-100">
                <h4 className="text-xs font-bold text-blue-800 mb-2 flex items-center gap-1.5">
                  <Lightbulb className="h-4 w-4 text-blue-600" />
                  Oportunidades
                </h4>
                <ul className="space-y-1.5">
                  {consolidatedAnalysis.opportunities?.slice(0, 4).map((o: string, i: number) => (
                    <li key={i} className="text-xs text-blue-900/80 flex gap-1.5 items-start">
                      <span className="text-blue-500 mt-0.5">•</span>
                      <span>{o}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-amber-50/50 rounded-xl p-3 border border-amber-100">
                <h4 className="text-xs font-bold text-amber-800 mb-2 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  Amenazas
                </h4>
                <ul className="space-y-1.5">
                  {consolidatedAnalysis.threats?.slice(0, 4).map((t: string, i: number) => (
                    <li key={i} className="text-xs text-amber-900/80 flex gap-1.5 items-start">
                      <span className="text-amber-500 mt-0.5">•</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Strategic Recommendations & Next Steps */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Recommendations */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-violet-600" />
                  Recomendaciones Clave
                </h3>
                <div className="space-y-2">
                  {consolidatedAnalysis.strategicRecommendations?.slice(0, 3).map((rec: any, i: number) => (
                    <div key={i} className="bg-slate-50/50 rounded-lg p-2.5 border border-slate-100 flex items-start justify-between gap-3">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{rec.category}</span>
                        <p className="text-xs text-slate-700 leading-relaxed">{rec.action}</p>
                      </div>
                      <Badge variant={rec.priority === 'alta' ? 'default' : rec.priority === 'media' ? 'secondary' : 'outline'} className="text-[9px] uppercase tracking-wide px-1.5 py-0">
                        {rec.priority}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Next Steps */}
              {consolidatedAnalysis.nextSteps && (
                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Target className="h-4 w-4 text-violet-600" />
                    Próximos Pasos Recomendados
                  </h3>
                  <div className="bg-violet-50/20 border border-violet-100/50 rounded-xl p-3 space-y-2">
                    {consolidatedAnalysis.nextSteps.slice(0, 4).map((step: string, i: number) => (
                      <div key={i} className="flex gap-2 text-xs text-slate-700">
                        <span className="text-violet-600 font-bold">{i + 1}.</span>
                        <span className="leading-relaxed">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-dashed border-violet-200 bg-violet-50/10">
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <Sparkles className="h-10 w-10 text-violet-400 mb-3 animate-pulse" />
            <h3 className="text-md font-bold text-violet-950">Análisis Consolidado no generado</h3>
            <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
              Combina la inteligencia de todos tus canales digitales escaneados para obtener una estrategia consolidada de negocio con inteligencia artificial.
            </p>
            <Button 
              onClick={generateConsolidatedAnalysis} 
              disabled={generatingAnalysis}
              className="bg-violet-600 hover:bg-violet-700 text-white gap-2 text-xs"
            >
              {generatingAnalysis ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generando Análisis...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generar Análisis Consolidado con IA
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="pt-4 border-t border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2 mb-1">
          <Globe className="h-5 w-5 text-violet-500" />
          Canales Extraídos y Analizados
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Presencia de canales y redes sociales actualmente detectados y mapeados para el negocio.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {cards.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-xl mt-6">
              <Globe className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-bold">Sin canales digitales</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-2 mb-4">
                Añade tu sitio web y redes sociales en la configuración del negocio para comenzar el análisis.
              </p>
              <Link href={`/business/${businessId}`}>
                <Button variant="outline">
                  Configurar Canales
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          cards.map((card: any) => {
            const theme = getPlatformTheme(card.channel);
            const report = card.report;
            const isPending = report?.status === "PENDING" || report?.status === "PROCESSING";
            const isCompleted = report?.status === "COMPLETED";
            const isError = report?.status === "ERROR";

            // Normalize data
            let dataObj: any = null;
            if (report?.data) {
              dataObj = typeof report.data === "string" ? JSON.parse(report.data) : report.data;
              
              // Handle new array structure with output field
              if (Array.isArray(dataObj) && dataObj.length > 0) {
                dataObj = dataObj[0].output || dataObj[0];
              }
            }

            // Extract TikTok specific data
            let tiktokFollowers = "N/D";
            let tiktokLikes = "N/D";
            let tiktokVideos = "N/D";
            let tiktokAverageViews = "N/D";
            let tiktokUsername = "N/D";

            const hasTiktokData = card.channel === "TIKTOK" && isCompleted;
            if (hasTiktokData) {
              const seoSignals = dataObj?.seo_signals || dataObj?.marketing_signals?.seo_signals;
              if (Array.isArray(seoSignals)) {
                seoSignals.forEach((signal: string) => {
                  const sigLower = signal.toLowerCase();
                  if (sigLower.includes("seguidor")) {
                    const parts = signal.split(":");
                    tiktokFollowers = parts.length > 1 ? parts[1].trim() : signal;
                  } else if (sigLower.includes("me gusta")) {
                    const parts = signal.split(":");
                    tiktokLikes = parts.length > 1 ? parts[1].trim() : signal;
                  } else if (sigLower.includes("video") || sigLower.includes("publica")) {
                    const parts = signal.split(":");
                    tiktokVideos = parts.length > 1 ? parts[1].trim() : signal;
                  } else if (sigLower.includes("visualiza") || sigLower.includes("promedio")) {
                    const parts = signal.split(":");
                    tiktokAverageViews = parts.length > 1 ? parts[1].trim() : signal;
                  }
                });
              }

              if (dataObj?.tiktok_presence) {
                if (tiktokFollowers === "N/D") tiktokFollowers = dataObj.tiktok_presence.followers?.toString() || "N/D";
                if (tiktokLikes === "N/D") tiktokLikes = dataObj.tiktok_presence.likes?.toString() || "N/D";
                if (tiktokVideos === "N/D") tiktokVideos = dataObj.tiktok_presence.videos_count?.toString() || "N/D";
                tiktokUsername = dataObj.tiktok_presence.username || "N/D";
              }

              if (dataObj?.profile) {
                if (tiktokFollowers === "N/D") tiktokFollowers = dataObj.profile.followers !== undefined ? formatLocaleNumber(dataObj.profile.followers) : "N/D";
                if (tiktokLikes === "N/D") tiktokLikes = dataObj.profile.total_likes !== undefined ? formatLocaleNumber(dataObj.profile.total_likes) : "N/D";
                if (tiktokVideos === "N/D") tiktokVideos = dataObj.profile.total_videos !== undefined ? formatLocaleNumber(dataObj.profile.total_videos) : "N/D";
                if (tiktokUsername === "N/D") tiktokUsername = dataObj.profile.username || "N/D";
              }

              if (dataObj?.engagement) {
                if (tiktokAverageViews === "N/D") tiktokAverageViews = dataObj.engagement.views !== undefined ? formatLocaleNumber(dataObj.engagement.views) : "N/D";
              }

              if (tiktokFollowers === "N/D" || tiktokLikes === "N/D" || tiktokVideos === "N/D" || tiktokUsername === "N/D") {
                const rawData = report?.data ? (typeof report.data === "string" ? JSON.parse(report.data) : report.data) : null;
                const firstItem = Array.isArray(rawData) && rawData.length > 0 ? rawData[0] : null;
                const author = dataObj?.authorMeta || firstItem?.authorMeta;
                if (author) {
                  if (tiktokFollowers === "N/D") tiktokFollowers = author.fans !== undefined ? formatLocaleNumber(author.fans) : "N/D";
                  if (tiktokLikes === "N/D") tiktokLikes = author.heart !== undefined ? formatLocaleNumber(author.heart) : "N/D";
                  if (tiktokVideos === "N/D") tiktokVideos = author.video !== undefined ? formatLocaleNumber(author.video) : "N/D";
                  if (tiktokUsername === "N/D") tiktokUsername = author.name || author.nickName || "N/D";
                }
              }

              if (tiktokUsername === "N/D" && card.url) {
                try {
                  const urlObj = new URL(card.url.startsWith("http") ? card.url : `https://${card.url}`);
                  const pathParts = urlObj.pathname.split("/").filter(Boolean);
                  if (pathParts.length > 0) {
                    tiktokUsername = pathParts[0].startsWith("@") ? pathParts[0] : `@${pathParts[0]}`;
                  }
                } catch (e) {
                  // ignore
                }
              }
            }

            const isInstagramStructure = !!dataObj?.instagram_presence || !!dataObj?.engagement_analysis || !!dataObj?.content_analysis;
            const isFacebookStructure = !!dataObj?.social_intelligence || !!dataObj?.facebook_presence || !!dataObj?.brand_positioning || !!dataObj?.strategic_diagnostics;
            const isWebsiteStructure = !!dataObj?.brand_identity || !!dataObj?.website_analysis || !!dataObj?.business_insights;
            const isConsolidatedStructure = !!dataObj?.marketPosition || !!dataObj?.executiveSummary || !!dataObj?.strategicRecommendations;
 
            // Extract Instagram-specific data
            const socialPresence = dataObj?.instagram_presence || {};
            const engagement = dataObj?.engagement_analysis || {};
            const compObs = dataObj?.competitive_observations || {};

            // Extract Website/Consolidated preview metrics
            let positionVal = "N/D";
            let advantageVal = "N/D";
            let gapVal = "N/D";
            let priorityVal = "N/D";
            let summaryText = "";
            let strengthsList: string[] = [];
            let weaknessesList: string[] = [];

            if (isWebsiteStructure) {
              positionVal = dataObj?.brand_identity?.market_positioning || dataObj?.brand_identity?.brand_summary || "N/D";
              advantageVal = dataObj?.business_insights?.differentiators?.[0] || dataObj?.business_insights?.main_strengths?.[0] || "N/D";
              gapVal = dataObj?.business_insights?.product_or_service_focus?.[0] || dataObj?.website_analysis?.content_focus?.[0] || "N/D";
              priorityVal = dataObj?.data_quality?.confidence_score ? `Confianza: ${Math.round(dataObj.data_quality.confidence_score * 100)}%` : "Alta";
              summaryText = dataObj?.brand_identity?.brand_summary || "";
              strengthsList = dataObj?.business_insights?.main_strengths || [];
              weaknessesList = dataObj?.business_insights?.main_weaknesses || [];
            } else if (isConsolidatedStructure) {
              positionVal = dataObj?.marketPosition?.currentPosition || "N/D";
              advantageVal = dataObj?.marketPosition?.competitiveAdvantage || "N/D";
              gapVal = dataObj?.marketPosition?.marketGap || "N/D";
              priorityVal = dataObj?.channelStrategy?.channelPriorities?.WEBSITE ? `Prioridad Web: ${dataObj.channelStrategy.channelPriorities.WEBSITE}` : "Alta";
              summaryText = dataObj?.executiveSummary || "";
              strengthsList = dataObj?.strengths || [];
              weaknessesList = dataObj?.weaknesses || [];
            }

            return (
              <Card key={card.channel} className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-opacity-50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-xl ${theme.gradient} ${theme.border} border shrink-0`}>
                        <card.icon className={`h-6 w-6 ${theme.text}`} />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold flex items-center gap-1.5">
                          {card.label}
                          {isCompleted && (
                            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                          )}
                        </CardTitle>
                        {card.url ? (
                          <a
                            href={card.url.startsWith("http") ? card.url : `https://${card.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-muted-foreground mt-0.5 line-clamp-1 hover:text-primary hover:underline cursor-pointer transition-colors inline-block w-fit max-w-[140px] sm:max-w-[200px] truncate"
                            title={card.url}
                          >
                            {card.url}
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground mt-0.5 block">N/D</span>
                        )}
                      </div>
                    </div>
                    <Badge 
                      variant={isCompleted ? "default" : isPending ? "secondary" : isError ? "destructive" : "outline"}
                      className={`${isCompleted ? `bg-gradient-to-r ${theme.gradient} ${theme.text} border-0` : ""} pointer-events-none shrink-0`}
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Analizando...
                        </>
                      ) : isCompleted ? (
                        "Completado"
                      ) : isError ? (
                        "Error"
                      ) : (
                        "Pendiente"
                      )}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {card.channel === "TIKTOK" && isCompleted ? (
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between text-sm pb-1.5 border-b border-border/40 gap-4">
                        <div className="flex items-center gap-2 text-muted-foreground shrink-0 mt-0.5">
                          <Users className={`h-4 w-4 ${theme.text}`} />
                          <span>Seguidores</span>
                        </div>
                        <span className="font-semibold text-foreground text-right">{tiktokFollowers}</span>
                      </div>
                      <div className="flex items-start justify-between text-sm pb-1.5 border-b border-border/40 gap-4">
                        <div className="flex items-center gap-2 text-muted-foreground shrink-0 mt-0.5">
                          <Heart className={`h-4 w-4 ${theme.text}`} />
                          <span>Me gusta totales</span>
                        </div>
                        <span className="font-semibold text-foreground text-right">{tiktokLikes}</span>
                      </div>
                      <div className="flex items-start justify-between text-sm pb-1.5 border-b border-border/40 gap-4">
                        <div className="flex items-center gap-2 text-muted-foreground shrink-0 mt-0.5">
                          <Activity className={`h-4 w-4 ${theme.text}`} />
                          <span>Engagement</span>
                        </div>
                        <span className="font-semibold text-foreground text-right capitalize">
                          {dataObj?.engagement?.engagement_level || "N/D"}
                        </span>
                      </div>
                      <div className="flex items-start justify-between text-sm gap-4">
                        <div className="flex items-center gap-2 text-muted-foreground shrink-0 mt-0.5">
                          <Globe className={`h-4 w-4 ${theme.text}`} />
                          <span>Enlaces</span>
                        </div>
                        <span className="font-semibold text-foreground text-right text-xs">
                          {(() => {
                            const web = dataObj?.business_signals?.website_present;
                            const wa = dataObj?.business_signals?.whatsapp_present;
                            if (web && wa) return "Web y WhatsApp";
                            if (web) return "Solo Web";
                            if (wa) return "Solo WhatsApp";
                            return "Ninguno";
                          })()}
                        </span>
                      </div>
                    </div>
                  ) : isFacebookStructure && isCompleted ? (
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between text-sm pb-1.5 border-b border-border/40 gap-4">
                        <div className="flex items-center gap-2 text-muted-foreground shrink-0 mt-0.5">
                          <Users className={`h-4 w-4 ${theme.text}`} />
                          <span>Seguidores</span>
                        </div>
                        <span className="font-semibold text-foreground text-right">
                          {(() => {
                            const presence = dataObj?.facebook_presence || {};
                            const metrics = presence.audience_metrics || {};
                            return formatSocialMetric(metrics.followers ?? metrics.likes ?? dataObj?.social_intelligence?.audience_size);
                          })()}
                        </span>
                      </div>
                      <div className="flex items-start justify-between text-sm pb-1.5 border-b border-border/40 gap-4">
                        <div className="flex items-center gap-2 text-muted-foreground shrink-0 mt-0.5">
                          <Activity className={`h-4 w-4 ${theme.text}`} />
                          <span>Actividad (Talking)</span>
                        </div>
                        <span className="font-semibold text-foreground text-right">
                          {(() => {
                            const presence = dataObj?.facebook_presence || {};
                            const metrics = presence.audience_metrics || {};
                            return formatSocialMetric(metrics.talking_about_count ?? dataObj?.social_intelligence?.engagement_level);
                          })()}
                        </span>
                      </div>
                      <div className="flex items-start justify-between text-sm gap-4">
                        <div className="flex items-center gap-2 text-muted-foreground shrink-0 mt-0.5">
                          <Briefcase className={`h-4 w-4 ${theme.text}`} />
                          <span>Categoría</span>
                        </div>
                        <span className="font-semibold text-foreground text-right truncate max-w-[150px]" title={dataObj?.facebook_presence?.business_category || dataObj?.brand_positioning?.niche || "N/D"}>
                          {dataObj?.facebook_presence?.business_category || dataObj?.brand_positioning?.niche || "N/D"}
                        </span>
                      </div>
                    </div>
                  ) : isInstagramStructure && isCompleted ? (() => {
                    const followers = (() => {
                      const visibility = compObs.visibility_indicators;
                      const socialProof = engagement.social_proof_signals;
                      
                      if (visibility && Array.isArray(visibility)) {
                        for (const indicator of visibility) {
                          if (typeof indicator === 'string' && indicator.toLowerCase().includes('seguidor')) {
                            const match = indicator.match(/[\d.]+[KkMm]?/);
                            if (match) return match[0];
                          }
                        }
                      }
                      
                      if (socialProof && Array.isArray(socialProof)) {
                        for (const signal of socialProof) {
                            if (typeof signal === 'string' && signal.toLowerCase().includes('seguidor')) {
                              const match = signal.match(/[\d.]+[KkMm]?/);
                              if (match) return match[0];
                            }
                        }
                      }
                      
                      return socialPresence.audience_size?.followers;
                    })();

                    const posts = socialPresence.audience_size?.posts_count || dataObj.instagram_presence?.audience_size?.posts_count;
                    const following = socialPresence.audience_size?.following || dataObj.instagram_presence?.audience_size?.following;
                    const engagementLevel = dataObj?.engagement_analysis?.engagement_level || 
                                            dataObj?.engagement_analysis?.current_activity_level || 
                                            dataObj?.community_analysis?.current_activity_level;

                    const branding = dataObj?.branding_analysis || {};
                    const brandPersonality = branding.brand_personality || [];
                    const emotionalTone = branding.emotional_tone || [];
                    const category = socialPresence.business_category || socialPresence.business_category_name || dataObj?.instagram_presence?.business_category;

                    const hasFollowers = followers !== undefined && followers !== null && followers !== "" && followers !== "N/D" && followers !== "N/A";
                    const hasPosts = posts !== undefined && posts !== null && posts !== "" && posts !== "N/D" && posts !== "N/A";
                    const hasFollowing = following !== undefined && following !== null && following !== "" && following !== "N/D" && following !== "N/A";
                    const hasEngagement = engagementLevel !== undefined && engagementLevel !== null && engagementLevel !== "" && engagementLevel !== "N/D" && engagementLevel !== "N/A";

                    if (!hasFollowers && !hasPosts && !hasFollowing && !hasEngagement && !category && brandPersonality.length === 0 && emotionalTone.length === 0) {
                      return <div className="text-center py-4 text-muted-foreground text-xs">Sin métricas disponibles en Instagram</div>;
                    }

                    return (
                      <div className="space-y-2.5">
                        {hasFollowers && (
                          <div className="flex items-start justify-between text-sm pb-1.5 border-b border-border/40 gap-4">
                            <div className="flex items-center gap-2 text-muted-foreground shrink-0 mt-0.5">
                              <Users className={`h-4 w-4 ${theme.text}`} />
                              <span>Seguidores</span>
                            </div>
                            <span className="font-semibold text-foreground text-right">{formatSocialMetric(followers)}</span>
                          </div>
                        )}
                        {hasPosts && (
                          <div className="flex items-start justify-between text-sm pb-1.5 border-b border-border/40 gap-4">
                            <div className="flex items-center gap-2 text-muted-foreground shrink-0 mt-0.5">
                              <FileText className={`h-4 w-4 ${theme.text}`} />
                              <span>Publicaciones</span>
                            </div>
                            <span className="font-semibold text-foreground text-right">{posts}</span>
                          </div>
                        )}
                        {hasFollowing && (
                          <div className="flex items-start justify-between text-sm pb-1.5 border-b border-border/40 gap-4">
                            <div className="flex items-center gap-2 text-muted-foreground shrink-0 mt-0.5">
                              <Users className={`h-4 w-4 ${theme.text}`} />
                              <span>Siguiendo</span>
                            </div>
                            <span className="font-semibold text-foreground text-right">{following}</span>
                          </div>
                        )}
                        {hasEngagement && (
                          <div className="flex items-start justify-between text-sm pb-1.5 border-b border-border/40 gap-4">
                            <div className="flex items-center gap-2 text-muted-foreground shrink-0 mt-0.5">
                              <Activity className={`h-4 w-4 ${theme.text}`} />
                              <span>Engagement</span>
                            </div>
                            <span className="font-semibold text-foreground text-right">{engagementLevel}</span>
                          </div>
                        )}
                        {category && (
                          <div className="flex items-start justify-between text-sm pb-1.5 border-b border-border/40 gap-4">
                            <div className="flex items-center gap-2 text-muted-foreground shrink-0 mt-0.5">
                              <Briefcase className={`h-4 w-4 ${theme.text}`} />
                              <span>Categoría</span>
                            </div>
                            <span className="font-semibold text-foreground text-right truncate max-w-[150px]" title={category}>{category}</span>
                          </div>
                        )}
                        {brandPersonality && brandPersonality.length > 0 && (
                          <div className="flex items-start justify-between text-sm pb-1.5 border-b border-border/40 gap-4">
                            <div className="flex items-center gap-2 text-muted-foreground shrink-0 mt-0.5">
                              <Sparkles className={`h-4 w-4 ${theme.text}`} />
                              <span>Personalidad</span>
                            </div>
                            <span className="font-semibold text-foreground text-right truncate max-w-[150px]" title={brandPersonality.join(", ")}>
                              {brandPersonality.slice(0, 2).join(", ")}
                            </span>
                          </div>
                        )}
                        {emotionalTone && emotionalTone.length > 0 && (
                          <div className="flex items-start justify-between text-sm gap-4">
                            <div className="flex items-center gap-2 text-muted-foreground shrink-0 mt-0.5">
                              <Smile className={`h-4 w-4 ${theme.text}`} />
                              <span>Tono Emocional</span>
                            </div>
                            <span className="font-semibold text-foreground text-right truncate max-w-[150px]" title={emotionalTone.join(", ")}>
                              {emotionalTone.slice(0, 2).join(", ")}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })() : (isWebsiteStructure || isConsolidatedStructure) && isCompleted ? (
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between text-sm pb-1.5 border-b border-border/40 gap-4">
                        <div className="flex items-center gap-2 text-muted-foreground shrink-0 mt-0.5">
                          <Compass className={`h-4 w-4 ${theme.text}`} />
                          <span>Posición</span>
                        </div>
                        <span className="font-semibold text-foreground text-right text-xs max-w-[160px] sm:max-w-[220px] truncate" title={positionVal}>
                          {positionVal}
                        </span>
                      </div>
                      <div className="flex items-start justify-between text-sm pb-1.5 border-b border-border/40 gap-4">
                        <div className="flex items-center gap-2 text-muted-foreground shrink-0 mt-0.5">
                          <Award className={`h-4 w-4 ${theme.text}`} />
                          <span>Ventaja</span>
                        </div>
                        <span className="font-semibold text-foreground text-right text-xs max-w-[160px] sm:max-w-[220px] truncate" title={advantageVal}>
                          {advantageVal}
                        </span>
                      </div>
                      <div className="flex items-start justify-between text-sm pb-1.5 border-b border-border/40 gap-4">
                        <div className="flex items-center gap-2 text-muted-foreground shrink-0 mt-0.5">
                          <Target className={`h-4 w-4 ${theme.text}`} />
                          <span>Enfoque / Brecha</span>
                        </div>
                        <span className="font-semibold text-foreground text-right text-xs max-w-[160px] sm:max-w-[220px] truncate" title={gapVal}>
                          {gapVal}
                        </span>
                      </div>
                      <div className="flex items-start justify-between text-sm gap-4">
                        <div className="flex items-center gap-2 text-muted-foreground shrink-0 mt-0.5">
                          <Zap className={`h-4 w-4 ${theme.text}`} />
                          <span>Estado / Confianza</span>
                        </div>
                        <span className="font-semibold text-foreground text-right text-xs max-w-[160px] sm:max-w-[220px] truncate" title={priorityVal}>
                          {priorityVal}
                        </span>
                      </div>
                    </div>
                  ) : isCompleted && dataObj ? (
                    <div className="space-y-2">
                      {dataObj.market_positioning && (
                        <div className="bg-muted/30 rounded p-2 text-sm">
                          <p className="text-xs text-muted-foreground mb-1">Posicionamiento</p>
                          <p className="font-medium line-clamp-2">{dataObj.market_positioning}</p>
                        </div>
                      )}
                      {dataObj.strengths && dataObj.strengths.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {dataObj.strengths.slice(0, 3).map((s: string, i: number) => (
                            <Badge key={i} variant="secondary" className="text-xs bg-emerald-50 text-emerald-700">
                              {s}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      {isPending ? (
                        <p className="text-xs text-slate-400 py-2">
                          Obteniendo datos del canal en segundo plano...
                        </p>
                      ) : isError ? (
                        <div className="flex items-center justify-center gap-2 text-red-500">
                          <AlertCircle className="h-4 w-4" />
                          <span>Error en el análisis</span>
                        </div>
                      ) : (
                        <span>Sin análisis aún</span>
                      )}
                    </div>
                  )}
                </CardContent>

                <CardFooter className="pt-0 flex gap-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        disabled={isAnyAnalyzing || requestingChannel === card.channel}
                        className={`flex-1 cursor-pointer transition-all hover:shadow-md active:scale-[0.98] disabled:pointer-events-auto disabled:cursor-not-allowed ${
                          isCompleted ? getPlatformHoverClasses(card.channel) : "hover:brightness-95 hover:shadow-lg"
                        }`}
                        variant={isCompleted ? "outline" : "default"}
                      >
                        {requestingChannel === card.channel || isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Analizando...
                          </>
                        ) : isCompleted ? (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Re-analizar
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Analizar
                          </>
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Análisis</AlertDialogTitle>
                        <AlertDialogDescription>
                          ¿Estás seguro de que deseas iniciar el análisis para el canal {card.label.toLowerCase()} ({card.url})? Esto iniciará un proceso de scraping en segundo plano a través del agente de IA en n8n.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="cursor-pointer">Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleRequestAnalysis(card.channel, card.url)}
                          className="cursor-pointer bg-violet-600 hover:bg-violet-700 text-white"
                        >
                          Confirmar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  {isCompleted && report && (
                    <ScrapingReportDialog 
                      data={dataObj} 
                      channel={card.channel}
                      triggerClassName={getPlatformHoverClasses(card.channel)} 
                    />
                  )}
                </CardFooter>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
