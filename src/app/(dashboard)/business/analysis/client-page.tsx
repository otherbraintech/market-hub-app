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
              Monitorea y analiza los canales digitales de {business.name}.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/business/${businessId}/general-report`}>
            <Button variant="outline" className="gap-2">
              <FileText className="h-4 w-4" />
              Ver Informe General
            </Button>
          </Link>
          <Link href={`/business/${businessId}`}>
            <Button variant="outline" className="gap-2">
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

            const isInstagramStructure = !!dataObj?.instagram_presence || !!dataObj?.engagement_analysis || !!dataObj?.content_analysis;
            const isFacebookStructure = !!dataObj?.social_intelligence || !!dataObj?.brand_positioning || !!dataObj?.strategic_diagnostics;

            // Extract Instagram-specific data
            const socialPresence = dataObj?.instagram_presence || {};
            const engagement = dataObj?.engagement_analysis || {};
            const compObs = dataObj?.competitive_observations || {};

            return (
              <Card key={card.channel} className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-opacity-50">
                <CardHeader className="pb-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-xl ${theme.gradient} ${theme.border} border`}>
                      <card.icon className={`h-6 w-6 ${theme.text}`} />
                    </div>
                    <Badge 
                      variant={isCompleted ? "default" : isPending ? "secondary" : isError ? "destructive" : "outline"}
                      className={isCompleted ? `bg-gradient-to-r ${theme.gradient} ${theme.text} border-0` : ""}
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
                  <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      {card.label}
                      {isCompleted && (
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                      )}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      {card.url}
                    </p>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {isFacebookStructure && isCompleted ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div className={`bg-gradient-to-br ${theme.gradient} ${theme.border} p-3 rounded-lg border shadow-sm`}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <Users className={`h-3.5 w-3.5 ${theme.text}`} />
                          <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground">Seguidores</span>
                        </div>
                        <p className="text-lg font-semibold text-foreground">
                          {dataObj?.social_intelligence?.audience_size || "N/D"}
                        </p>
                      </div>
                      <div className={`bg-gradient-to-br ${theme.gradient} ${theme.border} p-3 rounded-lg border shadow-sm`}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <Activity className={`h-3.5 w-3.5 ${theme.text}`} />
                          <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground">Engagement</span>
                        </div>
                        <p className="text-lg font-semibold text-foreground">
                          {dataObj?.social_intelligence?.engagement_level || "N/D"}
                        </p>
                      </div>
                      <div className={`bg-gradient-to-br ${theme.gradient} ${theme.border} p-3 rounded-lg border shadow-sm`}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <Megaphone className={`h-3.5 w-3.5 ${theme.text}`} />
                          <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground">Anuncios</span>
                        </div>
                        <p className="text-sm font-semibold text-foreground truncate">
                          {dataObj?.social_intelligence?.active_marketing_ads ? "Activos (Meta)" : "Inactivos"}
                        </p>
                      </div>
                      <div className={`bg-gradient-to-br ${theme.gradient} ${theme.border} p-3 rounded-lg border shadow-sm`}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <Briefcase className={`h-3.5 w-3.5 ${theme.text}`} />
                          <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground">Nicho</span>
                        </div>
                        <p className="text-sm font-semibold text-foreground truncate">
                          {dataObj?.brand_positioning?.niche || "N/D"}
                        </p>
                      </div>
                    </div>
                  ) : isInstagramStructure && isCompleted ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className={`bg-gradient-to-br ${theme.gradient} ${theme.border} p-3 rounded-lg border shadow-sm`}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <Users className={`h-3.5 w-3.5 ${theme.text}`} />
                          <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground">Seguidores</span>
                        </div>
                        <p className="text-lg font-semibold text-foreground">
                          {socialPresence.audience_size?.followers || (() => {
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
                            
                            return "N/D";
                          })()}
                        </p>
                      </div>
                      <div className={`bg-gradient-to-br ${theme.gradient} ${theme.border} p-3 rounded-lg border shadow-sm`}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <FileText className={`h-3.5 w-3.5 ${theme.text}`} />
                          <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground">Publicaciones</span>
                        </div>
                        <p className="text-lg font-semibold text-foreground">
                          {socialPresence.audience_size?.posts_count || dataObj.instagram_presence?.audience_size?.posts_count || "N/D"}
                        </p>
                      </div>
                      <div className={`bg-gradient-to-br ${theme.gradient} ${theme.border} p-3 rounded-lg border shadow-sm`}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <Users className={`h-3.5 w-3.5 ${theme.text}`} />
                          <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground">Siguiendo</span>
                        </div>
                        <p className="text-lg font-semibold text-foreground">
                          {socialPresence.audience_size?.following || dataObj.instagram_presence?.audience_size?.following || "N/D"}
                        </p>
                      </div>
                      <div className={`bg-gradient-to-br ${theme.gradient} ${theme.border} p-3 rounded-lg border shadow-sm`}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <Instagram className={`h-3.5 w-3.5 ${theme.text}`} />
                          <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground">Username</span>
                        </div>
                        <p className="text-lg font-semibold text-foreground truncate">
                          {socialPresence.username || socialPresence.brand_name || dataObj.instagram_presence?.username || dataObj.instagram_presence?.brand_name || "N/D"}
                        </p>
                      </div>
                    </div>
                  ) : isCompleted && dataObj ? (
                    <div className="space-y-2">
                      {dataObj.market_positioning && (
                        <div className="bg-muted/30 rounded p-2">
                          <p className="text-xs text-muted-foreground mb-1">Posicionamiento</p>
                          <p className="text-sm font-medium line-clamp-2">{dataObj.market_positioning}</p>
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
                  <Button
                    onClick={() => handleRequestAnalysis(card.channel, card.url)}
                    disabled={isAnyAnalyzing || requestingChannel === card.channel}
                    className="flex-1"
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
                  {isCompleted && report && (
                    <ScrapingReportDialog data={dataObj} />
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
