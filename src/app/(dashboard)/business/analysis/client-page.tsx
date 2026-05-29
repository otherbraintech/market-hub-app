"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sparkles, Globe, Loader2, Facebook, Instagram, ChevronRight, FileText,
  Users, ThumbsUp, MessageSquare, Activity, Flame, MapPin, Award, ShieldCheck,
  Megaphone, Zap, Eye, Compass, Briefcase, TrendingUp, Heart, Target,
  AlertCircle, Star, Linkedin, Youtube, Search, ArrowLeft
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
          <Link href={`/business/${businessId}/general-report`}>
            <Button variant="outline" className="gap-2 cursor-pointer transition-all active:scale-[0.98] hover:bg-slate-50">
              <FileText className="h-4 w-4" />
              Ver Informe General
            </Button>
          </Link>
          <Link href={`/business/${businessId}`}>
            <Button variant="outline" className="gap-2 cursor-pointer transition-all active:scale-[0.98] hover:bg-slate-50">
              <Briefcase className="h-4 w-4" />
              Ver Negocio
            </Button>
          </Link>
        </div>
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
              if (Array.isArray(dataObj) && dataObj.length > 0 && dataObj[0].output) {
                dataObj = dataObj[0].output;
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

              if (tiktokFollowers === "N/D" || tiktokLikes === "N/D" || tiktokVideos === "N/D" || tiktokUsername === "N/D") {
                const rawData = report?.data ? (typeof report.data === "string" ? JSON.parse(report.data) : report.data) : null;
                const firstItem = Array.isArray(rawData) && rawData.length > 0 ? rawData[0] : null;
                const author = dataObj?.authorMeta || firstItem?.authorMeta;
                if (author) {
                  if (tiktokFollowers === "N/D") tiktokFollowers = author.fans !== undefined ? author.fans.toLocaleString() : "N/D";
                  if (tiktokLikes === "N/D") tiktokLikes = author.heart !== undefined ? author.heart.toLocaleString() : "N/D";
                  if (tiktokVideos === "N/D") tiktokVideos = author.video !== undefined ? author.video.toLocaleString() : "N/D";
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
            const isFacebookStructure = !!dataObj?.social_intelligence || !!dataObj?.brand_positioning || !!dataObj?.strategic_diagnostics;
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
                          <span>Me gusta</span>
                        </div>
                        <span className="font-semibold text-foreground text-right">{tiktokLikes}</span>
                      </div>
                      <div className="flex items-start justify-between text-sm pb-1.5 border-b border-border/40 gap-4">
                        <div className="flex items-center gap-2 text-muted-foreground shrink-0 mt-0.5">
                          <FileText className={`h-4 w-4 ${theme.text}`} />
                          <span>Videos</span>
                        </div>
                        <span className="font-semibold text-foreground text-right">{tiktokVideos}</span>
                      </div>
                      <div className="flex items-start justify-between text-sm gap-4">
                        <div className="flex items-center gap-2 text-muted-foreground shrink-0 mt-0.5">
                          <Eye className={`h-4 w-4 ${theme.text}`} />
                          <span>Vistas Promedio</span>
                        </div>
                        <span className="font-semibold text-foreground text-right">{tiktokAverageViews}</span>
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
                          {dataObj?.social_intelligence?.audience_size || "N/D"}
                        </span>
                      </div>
                      <div className="flex items-start justify-between text-sm pb-1.5 border-b border-border/40 gap-4">
                        <div className="flex items-center gap-2 text-muted-foreground shrink-0 mt-0.5">
                          <Activity className={`h-4 w-4 ${theme.text}`} />
                          <span>Engagement</span>
                        </div>
                        <span className="font-semibold text-foreground text-right">
                          {dataObj?.social_intelligence?.engagement_level || "N/D"}
                        </span>
                      </div>
                      <div className="flex items-start justify-between text-sm pb-1.5 border-b border-border/40 gap-4">
                        <div className="flex items-center gap-2 text-muted-foreground shrink-0 mt-0.5">
                          <Megaphone className={`h-4 w-4 ${theme.text}`} />
                          <span>Anuncios</span>
                        </div>
                        <span className="font-semibold text-foreground text-right">
                          {dataObj?.social_intelligence?.active_marketing_ads ? "Activos (Meta)" : "Inactivos"}
                        </span>
                      </div>
                      <div className="flex items-start justify-between text-sm gap-4">
                        <div className="flex items-center gap-2 text-muted-foreground shrink-0 mt-0.5">
                          <Briefcase className={`h-4 w-4 ${theme.text}`} />
                          <span>Nicho</span>
                        </div>
                        <span className="font-semibold text-foreground text-right" title={dataObj?.brand_positioning?.niche || "N/D"}>
                          {dataObj?.brand_positioning?.niche || "N/D"}
                        </span>
                      </div>
                    </div>
                  ) : isInstagramStructure && isCompleted ? (
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between text-sm pb-1.5 border-b border-border/40 gap-4">
                        <div className="flex items-center gap-2 text-muted-foreground shrink-0 mt-0.5">
                          <Users className={`h-4 w-4 ${theme.text}`} />
                          <span>Seguidores</span>
                        </div>
                        <span className="font-semibold text-foreground text-right">
                          {(() => {
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
                            
                            return socialPresence.audience_size?.followers || "N/D";
                          })()}
                        </span>
                      </div>
                      <div className="flex items-start justify-between text-sm pb-1.5 border-b border-border/40 gap-4">
                        <div className="flex items-center gap-2 text-muted-foreground shrink-0 mt-0.5">
                          <FileText className={`h-4 w-4 ${theme.text}`} />
                          <span>Publicaciones</span>
                        </div>
                        <span className="font-semibold text-foreground text-right">
                          {socialPresence.audience_size?.posts_count || dataObj.instagram_presence?.audience_size?.posts_count || "N/D"}
                        </span>
                      </div>
                      <div className="flex items-start justify-between text-sm pb-1.5 border-b border-border/40 gap-4">
                        <div className="flex items-center gap-2 text-muted-foreground shrink-0 mt-0.5">
                          <Users className={`h-4 w-4 ${theme.text}`} />
                          <span>Siguiendo</span>
                        </div>
                        <span className="font-semibold text-foreground text-right">
                          {socialPresence.audience_size?.following || dataObj.instagram_presence?.audience_size?.following || "N/D"}
                        </span>
                      </div>
                      <div className="flex items-start justify-between text-sm gap-4">
                        <div className="flex items-center gap-2 text-muted-foreground shrink-0 mt-0.5">
                          <Activity className={`h-4 w-4 ${theme.text}`} />
                          <span>Engagement</span>
                        </div>
                        <span className="font-semibold text-foreground text-right">
                          {dataObj?.engagement_analysis?.engagement_level || 
                           dataObj?.engagement_analysis?.current_activity_level || 
                           dataObj?.community_analysis?.current_activity_level || "N/D"}
                        </span>
                      </div>
                    </div>
                  ) : (isWebsiteStructure || isConsolidatedStructure) && isCompleted ? (
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between text-sm pb-1.5 border-b border-border/40 gap-4">
                        <div className="flex items-center gap-2 text-muted-foreground shrink-0 mt-0.5">
                          <Compass className={`h-4 w-4 ${theme.text}`} />
                          <span>Posición</span>
                        </div>
                        <span className="font-semibold text-foreground text-right" title={positionVal}>
                          {positionVal}
                        </span>
                      </div>
                      <div className="flex items-start justify-between text-sm pb-1.5 border-b border-border/40 gap-4">
                        <div className="flex items-center gap-2 text-muted-foreground shrink-0 mt-0.5">
                          <Award className={`h-4 w-4 ${theme.text}`} />
                          <span>Ventaja</span>
                        </div>
                        <span className="font-semibold text-foreground text-right" title={advantageVal}>
                          {advantageVal}
                        </span>
                      </div>
                      <div className="flex items-start justify-between text-sm pb-1.5 border-b border-border/40 gap-4">
                        <div className="flex items-center gap-2 text-muted-foreground shrink-0 mt-0.5">
                          <Target className={`h-4 w-4 ${theme.text}`} />
                          <span>Enfoque / Brecha</span>
                        </div>
                        <span className="font-semibold text-foreground text-right" title={gapVal}>
                          {gapVal}
                        </span>
                      </div>
                      <div className="flex items-start justify-between text-sm gap-4">
                        <div className="flex items-center gap-2 text-muted-foreground shrink-0 mt-0.5">
                          <Zap className={`h-4 w-4 ${theme.text}`} />
                          <span>Estado / Confianza</span>
                        </div>
                        <span className="font-semibold text-foreground text-right" title={priorityVal}>
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
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Analizando...</span>
                        </div>
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
