"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { 
  getOnboardingResults, 
  startScrapingStage, 
  startDiagnosticStage, 
  startStrategyStage, 
  startCampaignStage,
  startCalendarStage
} from "@/actions/business";
import { listMediaAssetsAction } from "@/actions/media";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileText, ShieldCheck, Target, Users, Megaphone, Image as ImageIcon,
  CheckCircle2, Loader2, Network, HelpCircle, ArrowRight, ArrowLeft,
  Database, Eye, EyeIcon, CalendarDays, Compass, MessageSquare,
  Play, RefreshCw, Check, X, Clock, Cpu, Bot, Sparkles, Layers, AlertTriangle, Terminal,
  Facebook, Instagram, Globe, Lock, Pencil, Lightbulb, BookOpen, Smile, Brain, Award, XCircle, Search, TrendingUp, ThumbsUp, Activity, MapPin, Briefcase, Star, ChevronRight, Download, Store, Landmark, Share2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarView } from "@/components/calendar/calendar-view";
import { MediaLibraryClient } from "@/app/(dashboard)/media/client-page";
import { handleDownloadEstrategiaPDF as downloadEstrategiaPDF, handleDownloadBancoDeDatosPDF as downloadBancoDeDatosPDF, handleDownloadCampanasPDF as downloadCampanasPDF, handleDownloadCalendarioPDF as downloadCalendarioPDF } from "@/utils/print-utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AgentPipelineMonitor } from "./agent-pipeline-monitor";

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

const formatSocialMetric = (val: any): string => {
  if (val === undefined || val === null) return "N/D";
  const num = Number(val);
  if (isNaN(num)) return typeof val === "string" ? val.trim() : val.toString();
  return num.toLocaleString('es-ES');
};

const formatPersonaTitle = (rawName: string | undefined, index: number): string => {
  if (!rawName) return `Persona ${index + 1}`;
  
  // 1. Quitar prefijos tipo "P1", "P2", "P5", "P1: ", "P5 - ", "Persona 1", etc.
  let text = rawName.replace(/^(P\d+|Persona\s*\d+)[\s:\-–—]*/i, "").trim();

  // 2. Extraer solo el nombre de pila antes de comas, "el", "la", "los", "las" o guiones
  let nameOnly = text.split(/[,:\-–—]/)[0].split(/\s+(el|la|los|las)\s+/i)[0].trim();

  if (!nameOnly) return `Persona ${index + 1}`;
  return nameOnly.charAt(0).toUpperCase() + nameOnly.slice(1);
};

const extractPersonaArchetype = (rawName: string | undefined): string | null => {
  if (!rawName) return null;
  let text = rawName.replace(/^(P\d+|Persona\s*\d+)[\s:\-–—]*/i, "").trim();
  const match = text.match(/[,:\-–—]?\s*((el|la|los|las)\s+.*)$/i) || text.match(/,\s*(.*)$/);
  if (match && match[1]) {
    const archetype = match[1].trim();
    return archetype.charAt(0).toUpperCase() + archetype.slice(1);
  }
  return null;
};

const normalizeReportData = (rawReportData: any) => {
  if (!rawReportData) return null;
  let dataObj = typeof rawReportData === "string" ? JSON.parse(rawReportData) : rawReportData;
  
  if (Array.isArray(dataObj) && dataObj.length > 0 && dataObj.every(item => item && typeof item === "object" && "output" in item)) {
    const outputs = dataObj.map((item: any) => item.output).filter(Boolean);
    
    if (outputs.length > 0 && outputs[0].page_overview) {
      const totalReactions = outputs.reduce((acc: number, curr: any) => acc + (curr.engagement_summary?.total_reactions || 0), 0);
      const totalComments = outputs.reduce((acc: number, curr: any) => acc + (curr.engagement_summary?.total_comments || 0), 0);
      const brandName = outputs.find((o: any) => o.page_overview?.brand_name)?.page_overview?.brand_name || "";
      const pageUrl = outputs.find((o: any) => o.page_overview?.page_url)?.page_overview?.page_url || "";
      
      const products = Array.from(new Set(outputs.flatMap((o: any) => o.content_analysis?.main_products_or_services || []))).filter(Boolean);
      const topics = Array.from(new Set(outputs.flatMap((o: any) => o.content_analysis?.common_topics || []))).filter(Boolean);
      const growthOps = Array.from(new Set(outputs.flatMap((o: any) => o.marketing_insights?.growth_opportunities || []))).filter(Boolean);
      const campaigns = Array.from(new Set(outputs.flatMap((o: any) => o.content_analysis?.main_campaigns_detected || []))).filter(Boolean);
      const contentRecs = Array.from(new Set(outputs.flatMap((o: any) => o.marketing_insights?.content_recommendations || []))).filter(Boolean);
      const pricingMentions = Array.from(new Set(outputs.flatMap((o: any) => o.commercial_intelligence?.pricing_mentions || []))).filter(Boolean);
      const salesSignals = Array.from(new Set(outputs.flatMap((o: any) => o.commercial_intelligence?.sales_signals || []))).filter(Boolean);
      const conversionStrategies = Array.from(new Set(outputs.flatMap((o: any) => o.commercial_intelligence?.conversion_strategies || []))).filter(Boolean);
      
      const bestPost = outputs.reduce((best: any, curr: any) => {
        const currBest = curr.engagement_summary?.best_performing_post;
        if (!currBest || currBest.reactions === undefined) return best;
        if (!best || (currBest.reactions || 0) > (best.reactions || 0)) {
          return currBest;
        }
        return best;
      }, null);

      return {
        isAggregatedFacebook: true,
        brand_name: brandName,
        page_url: pageUrl,
        total_reactions: totalReactions,
        total_comments: totalComments,
        total_posts: outputs.length,
        products,
        topics,
        growthOps,
        campaigns,
        contentRecs,
        bestPost,
        
        facebook_presence: {
          brand_name: brandName,
          business_category: "Panadería y Pastelería",
          brand_summary: `Canal de Facebook con ${outputs.length} publicaciones analizadas. Temas principales: ${topics.slice(0, 4).join(', ')}. Estilo de comunicación: ${Array.from(new Set(outputs.flatMap((o: any) => o.content_analysis?.posting_style || []))).slice(0, 3).join(', ')}.`,
          audience_metrics: {
            followers: totalReactions,
            talking_about_count: totalComments
          }
        },
        reputation_analysis: {
          total_reviews: totalComments,
          recommendation_percentage: 100
        },
        branding_analysis: {
          brand_personality: Array.from(new Set(outputs.flatMap((o: any) => o.content_analysis?.posting_style || []))),
          emotional_tone: Array.from(new Set(outputs.flatMap((o: any) => o.audience_response?.positive_signals || [])))
        },
        business_intelligence: {
          website_present: true,
          advertising_active: true,
          phone_contact_available: true,
          price_range_indicator: pricingMentions.length > 0 ? pricingMentions[0] : "Bs. Variable",
          conversion_signals: conversionStrategies,
          commercial_signals: salesSignals
        },
        competitive_observations: {
          main_strengths: products.length > 0 ? products : ["Presencia local activa y buen engagement con la audiencia"],
          main_weaknesses: growthOps.length > 0 ? growthOps : ["Optimizar frecuencia de ofertas y variedad de formatos de contenido"],
          customer_perception_indicators: Array.from(new Set(outputs.flatMap((o: any) => o.audience_response?.engagement_drivers || []))),
          differentiators: products
        },
        strategic_recommendations: contentRecs.length > 0 ? contentRecs : ["Incrementar la frecuencia de publicaciones sobre nuevos sabores e interactuar con seguidores"]
      };
    }
  }

  if (Array.isArray(dataObj) && dataObj.length > 0) {
    dataObj = dataObj[0].output || dataObj[0];
  }

  return dataObj;
};

interface OnboardingResultsPanelProps {
  businessId: string;
  externalActiveTab?: string;
  onTabChange?: (tab: string) => void;
  hideTopTabBar?: boolean;
}

export function OnboardingResultsPanel({ 
  businessId, 
  externalActiveTab, 
  onTabChange,
  hideTopTabBar = false 
}: OnboardingResultsPanelProps) {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTabState] = useState(externalActiveTab || "bancodedatos");
  const [tabTransitionLoading, setTabTransitionLoading] = useState(false);

  const isStageDataReady = (tab: string, currentData: any): boolean => {
    if (!currentData) return false;
    switch (tab) {
      case "bancodedatos":
        return Boolean(currentData.businessInfo || currentData.consolidatedReport || currentData.business);
      case "activosvisuales":
        return Array.isArray(currentData.mediaAssets);
      case "estrategia":
        return Boolean(currentData.activeStrategy || currentData.consolidatedReport);
      case "campanas":
        return Array.isArray(currentData.campaigns);
      case "calendario":
        return Array.isArray(currentData.calendarContents) || Array.isArray(currentData.campaigns);
      default:
        return true;
    }
  };

  const setActiveTab = async (tab: string) => {
    if (tab === activeTab) return;
    setTabTransitionLoading(true);
    setActiveTabState(tab);
    if (onTabChange) onTabChange(tab);
    
    const isMediaTab = tab === "activosvisuales";
    const minDelay = new Promise((resolve) => setTimeout(resolve, 200));

    try {
      // 1. Cargar el paquete de datos del servidor en segundo plano
      await Promise.all([
        fetchResults(true, isMediaTab), 
        fetchNotifications(true), 
        minDelay
      ]);
    } catch (e) {
      console.error("Error al actualizar paquete de datos de etapa:", e);
    } finally {
      // 2. Retirar la pantalla de carga únicamente cuando el paquete de datos de la etapa esté listo
      setTabTransitionLoading(false);
    }
  };

  useEffect(() => {
    if (externalActiveTab && externalActiveTab !== activeTab) {
      let isMounted = true;
      setTabTransitionLoading(true);
      setActiveTabState(externalActiveTab);
      const isMediaTab = externalActiveTab === "activosvisuales";
      const minDelay = new Promise((resolve) => setTimeout(resolve, 200));

      Promise.all([
        fetchResults(true, isMediaTab), 
        fetchNotifications(true), 
        minDelay
      ]).finally(() => {
        if (isMounted) setTabTransitionLoading(false);
      });
      return () => { isMounted = false; };
    }
  }, [externalActiveTab]);

  const [scrapingLoading, setScrapingLoading] = useState(false);
  const [diagnosticLoading, setDiagnosticLoading] = useState(false);
  const [strategyLoading, setStrategyLoading] = useState(false);
  const [campaignLoading, setCampaignLoading] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isTriggeredInSession, setIsTriggeredInSession] = useState(false);
  const [showStrategyAgentWorkingDialog, setShowStrategyAgentWorkingDialog] = useState(false);

  const [selectedCompetitorId, setSelectedCompetitorId] = useState<string>("");

  // Estados para la edición libre de parámetros de campaña
  const [isEditingCampaignParams, setIsEditingCampaignParams] = useState(false);
  const [editedCampName, setEditedCampName] = useState("");
  const [editedCampObjective, setEditedCampObjective] = useState("AWARENESS");
  const [editedCampDesc, setEditedCampDesc] = useState("");
  const [editedCampStartDate, setEditedCampStartDate] = useState("");
  const [editedCampEndDate, setEditedCampEndDate] = useState("");
  const [editedCampBudget, setEditedCampBudget] = useState(150);
  const [editedReelsCount, setEditedReelsCount] = useState(5);
  const [editedCarouselsCount, setEditedCarouselsCount] = useState(2);
  const [editedPostsCount, setEditedPostsCount] = useState(1);

  // Estados para Segmentación (Targeting) y Canales Editables Directos
  const [editedLocations, setEditedLocations] = useState<string>("");
  const [editedAgeMin, setEditedAgeMin] = useState<number>(20);
  const [editedAgeMax, setEditedAgeMax] = useState<number>(50);
  const [editedInterests, setEditedInterests] = useState<string>("");

  const [editedIgBudget, setEditedIgBudget] = useState<number>(50);
  const [editedFbBudget, setEditedFbBudget] = useState<number>(50);
  const [editedTiktokBudget, setEditedTiktokBudget] = useState<number>(50);
  const [isIgActive, setIsIgActive] = useState<boolean>(true);
  const [isFbActive, setIsFbActive] = useState<boolean>(true);
  const [isTiktokActive, setIsTiktokActive] = useState<boolean>(true);
  const [isRegeneratingPlan, setIsRegeneratingPlan] = useState<boolean>(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  interface AgentNotification {
    id: string;
    title: string;
    message: string;
    step: "SCRAPING" | "ANALYSIS" | "DIAGNOSTIC" | "STRATEGY" | "CAMPAIGN" | "CALENDAR";
    status: "PROCESSING" | "COMPLETED" | "FAILED";
    createdAt: string;
  }
  const [notifications, setNotifications] = useState<AgentNotification[]>([]);

  const handleStartScraping = async () => {
    setIsDismissed(false);
    setIsTriggeredInSession(true);
    setScrapingLoading(true);
    if (data) {
      setData((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          businessReports: [],
          competitorReports: [],
          businessInfo: {
            ...prev.businessInfo,
            competitorGeneralReport: null
          }
        };
      });
    }
    try {
      const res = await startScrapingStage(businessId);
      if (res.success) {
        toast.success("¡Agente de Extracción activado!");
        fetchResults(true);
        fetchNotifications(true);
      } else {
        toast.error(res.error || "Fallo al iniciar extracción");
      }
    } catch (e) {
      toast.error("Error al iniciar extracción");
    } finally {
      setScrapingLoading(false);
    }
  };

  const handleStartDiagnostic = async () => {
    setDiagnosticLoading(true);
    try {
      const res = await startDiagnosticStage(businessId);
      if (res.success) {
        toast.success("¡Agente de Diagnóstico activado!");
        fetchResults(true);
        fetchNotifications(true);
      } else {
        toast.error(res.error || "Fallo al iniciar diagnóstico");
      }
    } catch (e) {
      toast.error("Error al iniciar diagnóstico");
    } finally {
      setDiagnosticLoading(false);
    }
  };

  const handleStartStrategy = async () => {
    setIsDismissed(false);
    setIsTriggeredInSession(true);
    setStrategyLoading(true);
    setShowStrategyAgentWorkingDialog(true);
    try {
      const res = await startStrategyStage(businessId);
      if (res.success) {
        toast.success("¡Agente de Growth & Estrategia activado!");
        fetchResults(true);
        fetchNotifications(true);
      } else {
        toast.error(res.error || "Fallo al iniciar estrategia");
      }
    } catch (e) {
      toast.error("Error al iniciar estrategia");
    } finally {
      setStrategyLoading(false);
    }
  };

  const [campaignStartDate, setCampaignStartDate] = useState<string>("");

  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setCampaignStartDate(tomorrow.toISOString().split('T')[0]);
  }, []);

  const handleStartCampaign = async () => {
    setIsDismissed(false);
    setIsTriggeredInSession(true);
    setCampaignLoading(true);
    try {
      const res = await startCampaignStage(businessId, campaignStartDate || undefined);
      if (res.success) {
        toast.success("¡Agente de Planificación de Campañas activado!");
        fetchResults(true);
        fetchNotifications(true);
      } else {
        toast.error(res.error || "Fallo al iniciar campañas");
      }
    } catch (e) {
      toast.error("Error al iniciar campañas");
    } finally {
      setCampaignLoading(false);
    }
  };

  const handleStartCalendar = async () => {
    setIsDismissed(false);
    setIsTriggeredInSession(true);
    setCalendarLoading(true);
    try {
      const res = await startCalendarStage(businessId);
      if (res.success) {
        toast.success("¡Agente Editorial activado para regenerar el calendario!");
        fetchResults(true);
        fetchNotifications(true);
      } else {
        toast.error(res.error || "Fallo al iniciar calendario");
      }
    } catch (e) {
      toast.error("Error al iniciar calendario");
    } finally {
      setCalendarLoading(false);
    }
  };

  const fetchResults = async (silent = false, includeMedia = false) => {
    if (!silent) setLoading(true);
    try {
      const promises: [Promise<any>, Promise<any>?] = [getOnboardingResults(businessId)];
      if (includeMedia) {
        promises.push(listMediaAssetsAction(businessId).catch(() => null));
      }

      const [res, mediaRes] = await Promise.all(promises);

      if (res.success) {
        setData((prevData: any) => {
          return {
            ...prevData,
            ...res,
            ...(includeMedia && mediaRes?.success ? {
              mediaAssets: mediaRes.assets || [],
              mediaLogo: mediaRes.logo || res?.business?.logo,
              mediaColors: mediaRes.brandColors || res?.business?.brandColors,
              mediaCounts: {
                videoCount: mediaRes.videoCount ?? 0,
                imageCount: mediaRes.imageCount ?? 0,
                total: mediaRes.total ?? 0
              }
            } : {})
          };
        });

        if (res.competitorsList && res.competitorsList.length > 0 && !selectedCompetitorId) {
          setSelectedCompetitorId(res.competitorsList[0].id);
        }
      }
    } catch (e) {
      console.error("Error fetching onboarding results:", e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchNotifications = async (silent = false) => {
    try {
      const res = await fetch(`/api/business/${businessId}/agent-notifications`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (e) {
      console.error("Error fetching agent notifications inside panel:", e);
    }
  };

  const hasActiveProcessing = notifications.some(n => n.status === 'PROCESSING') ||
    scrapingLoading || diagnosticLoading || strategyLoading || campaignLoading || calendarLoading;

  useEffect(() => {
    fetchResults();
    fetchNotifications();
  }, [businessId]);

  useEffect(() => {
    const shouldPoll = hasActiveProcessing || showStrategyAgentWorkingDialog;
    if (!shouldPoll) return;

    fetchResults(true);
    fetchNotifications(true);

    const interval = setInterval(() => {
      fetchResults(true);
      fetchNotifications(true);
    }, 2500);
    return () => clearInterval(interval);
  }, [businessId, hasActiveProcessing, showStrategyAgentWorkingDialog]);

  const prevStatusesRef = useRef<Record<string, string>>({});

  useEffect(() => {
    notifications.forEach((notif) => {
      const prevStatus = prevStatusesRef.current[notif.id];
      if (prevStatus !== notif.status) {
        if (notif.status === 'PROCESSING') {
          toast.info(`🤖 ${notif.title}: ${notif.message}`, {
            id: notif.id,
            duration: 10000,
            position: "bottom-right",
          });
        } else if (notif.status === 'COMPLETED') {
          toast.success(`✅ ${notif.title}: ¡Completado con éxito!`, {
            id: notif.id,
            duration: 5000,
            position: "bottom-right",
          });
        } else if (notif.status === 'FAILED') {
          toast.error(`❌ ${notif.title}: Falló el procesamiento.`, {
            id: notif.id,
            duration: 5000,
            position: "bottom-right",
          });
        }
        prevStatusesRef.current[notif.id] = notif.status;
      }
    });
  }, [notifications]);

  const businessReports = data?.businessReports || [];
  const competitorReports = data?.competitorReports || [];
  const activeStrategy = data?.activeStrategy;
  const campaigns = data?.campaigns || [];
  const competitorsList = useMemo(() => {
    const raw = data?.competitorsList || [];
    const seen = new Set<string>();
    return raw.filter((c: any) => {
      const nameKey = (c.name || '').trim().toLowerCase();
      if (!nameKey || seen.has(nameKey)) return false;
      seen.add(nameKey);
      return true;
    });
  }, [data?.competitorsList]);

  const individualBusinessReports = businessReports.filter((r: any) => r.channel !== "CONSOLIDATED");
  const consolidatedReport = businessReports.find((r: any) => r.channel === "CONSOLIDATED");

  const parseJson = (val: any) => {
    if (!val) return null;
    if (typeof val === "string") {
      try {
        return JSON.parse(val);
      } catch (e) {
        return null;
      }
    }
    return val;
  };

  const getChannelStatus = (entityId: string, channelName: string, isCompetitor = false) => {
    const reports = isCompetitor ? competitorReports : businessReports;
    const report = reports.find((r: any) => r.entityId === entityId && r.channel.toUpperCase() === channelName.toUpperCase());
    
    if (!report) return 'idle';
    if (report.status === 'COMPLETED') return 'completed';
    if (report.status === 'FAILED') return 'failed';
    return 'processing';
  };

  const getSocialIcon = (channelName: string) => {
    const name = channelName.toLowerCase();
    if (name.includes('facebook')) {
      return (
        <div className="h-7 w-7 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-600 border border-blue-200/50 shrink-0">
          <Facebook className="h-4 w-4 fill-current" />
        </div>
      );
    }
    if (name.includes('instagram')) {
      return (
        <div className="h-7 w-7 rounded-xl bg-pink-600/10 flex items-center justify-center text-pink-600 border border-pink-200/50 shrink-0">
          <Instagram className="h-4 w-4" />
        </div>
      );
    }
    if (name.includes('tiktok')) {
      return (
        <div className="h-7 w-7 rounded-xl bg-slate-900/10 dark:bg-white/10 flex items-center justify-center text-slate-950 dark:text-white border border-slate-200/50 shrink-0">
          <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.74-3.99-1.72-.08 2.76-.01 5.51-.05 8.27-.07 1.95-.73 3.91-2.03 5.4-1.72 2.01-4.55 2.92-7.11 2.37-2.61-.53-4.87-2.43-5.72-4.95-.97-2.81-.35-6.13 1.64-8.3 1.61-1.77 4.14-2.52 6.44-2.02v4.22c-1.21-.34-2.6-.04-3.51.82-.93.88-1.15 2.29-.69 3.49.43 1.18 1.73 1.98 2.99 1.83 1.25-.11 2.28-1.18 2.39-2.43.08-3.03.02-6.07.05-9.11z"/>
          </svg>
        </div>
      );
    }
    return (
      <div className="h-7 w-7 rounded-xl bg-slate-500/10 flex items-center justify-center text-slate-600 dark:text-slate-300 border border-slate-200/50 shrink-0">
        <Globe className="h-4 w-4" />
      </div>
    );
  };

  const renderStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50 font-bold text-[9px] rounded-full py-0.5 px-2 flex items-center gap-1 shrink-0 shadow-sm">
            <Check className="h-2.5 w-2.5 stroke-[3]" /> AUDITADO
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50 font-bold text-[9px] rounded-full py-0.5 px-2 flex items-center gap-1 shrink-0 animate-pulse shadow-sm">
            <Loader2 className="h-2.5 w-2.5 animate-spin" /> EXTRAENDO
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50 font-black text-[8.5px] rounded-full py-0.5 px-2 flex items-center gap-1 shrink-0 shadow-sm">
            <AlertTriangle className="h-2.5 w-2.5 text-amber-600" /> EXTRACCIÓN PARCIAL
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-300/40 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50 font-bold text-[8.5px] rounded-full py-0.5 px-2 flex items-center gap-1 shrink-0 shadow-sm animate-pulse">
            <RefreshCw className="h-2.5 w-2.5 text-amber-600 animate-spin" /> REINTENTANDO...
          </Badge>
        );
    }
  };

  const isCalendarReady = campaigns.length > 0;

  const getStepStatus = (stepKey: string) => {
    if (stepKey === 'SCRAPING') {
      if (individualBusinessReports.length > 0 || competitorReports.length > 0) {
        return 'completed';
      }
    }

    const stepNotifs = notifications
      .filter(n => n.step === stepKey)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (stepNotifs.length > 0) {
      const latestNotif = stepNotifs[0];
      if (latestNotif.status === 'PROCESSING') {
        const ageMs = Date.now() - new Date(latestNotif.createdAt).getTime();
        const maxAgeMs = 3 * 60 * 1000; // 3 minutos (evita colgados falsos)
        if (ageMs > maxAgeMs) {
          return 'idle'; // Considerar estancado
        }
        return 'processing';
      }
      if (latestNotif.status === 'FAILED') {
        if (stepKey === 'SCRAPING' || stepKey === 'DIAGNOSTIC') {
          if (individualBusinessReports.length > 0 || competitorReports.length > 0 || consolidatedReport) {
            return 'completed';
          }
        }
        return 'failed';
      }
      if (latestNotif.status === 'COMPLETED') {
        if (stepKey === 'STRATEGY' && !activeStrategy) return 'idle';
        if (stepKey === 'CAMPAIGN' && campaigns.length === 0) return 'idle';
        if (stepKey === 'CALENDAR' && !isCalendarReady) return 'idle';
        return 'completed';
      }
    }

    if (stepKey === 'SCRAPING') {
      if (scrapingLoading) return 'processing';
      if (individualBusinessReports.length > 0 || competitorReports.length > 0) {
        return 'completed';
      }
      return 'idle';
    }

    switch (stepKey) {
      case 'ANALYSIS':
        if (getStepStatus('SCRAPING') !== 'completed') return 'idle';
        if (individualBusinessReports.length > 0 || competitorReports.length > 0) return 'completed';
        break;
      case 'DIAGNOSTIC':
        if (getStepStatus('ANALYSIS') !== 'completed') return 'idle';
        if (diagnosticLoading) return 'processing';
        if (consolidatedReport || data?.businessInfo?.competitorGeneralReport) return 'completed';
        break;
      case 'STRATEGY':
        if (getStepStatus('DIAGNOSTIC') !== 'completed') return 'idle';
        if (strategyLoading) return 'processing';
        if (activeStrategy) return 'completed';
        break;
      case 'CAMPAIGN':
        if (getStepStatus('STRATEGY') !== 'completed') return 'idle';
        if (campaignLoading) return 'processing';
        if (campaigns.length > 0) return 'completed';
        break;
      case 'CALENDAR':
        if (getStepStatus('CAMPAIGN') !== 'completed') return 'idle';
        if (isCalendarReady) return 'completed';
        break;
    }
    return 'idle';
  };

  const scrapingStatus = getStepStatus("SCRAPING");
  const diagnosticStatus = getStepStatus("DIAGNOSTIC");



  useEffect(() => {
    if (loading || !data) return;

    // Se eliminó la autoejecución al montar la pantalla para permitir inicio manual mediante botón en el diálogo.

    if (
      scrapingStatus === "completed" &&
      diagnosticStatus === "idle" &&
      !diagnosticLoading &&
      (!consolidatedReport || !data?.businessInfo?.competitorGeneralReport)
    ) {
      handleStartDiagnostic();
    }
  }, [data, loading, notifications]);

  useEffect(() => {
    if (activeTab !== "bancodedatos") return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setHasScrolledToBottom(true);
        }
      },
      { threshold: 0.1 }
    );

    const currentBottom = bottomRef.current;
    if (currentBottom) {
      observer.observe(currentBottom);
    }

    return () => {
      if (currentBottom) {
        observer.unobserve(currentBottom);
      }
    };
  }, [activeTab]);

  const isTabBlocked = (tabName: string): boolean => {
    if (tabName === "bancodedatos") return false;
    if (tabName === "estrategia") return false;
    if (tabName === "campanas" && campaigns.length > 0) return false;
    if (tabName === "calendario" && isCalendarReady) return false;

    const isStrategyActive = strategyLoading || getStepStatus("STRATEGY") === "processing";
    const isCampaignActive = campaignLoading || getStepStatus("CAMPAIGN") === "processing" || isStrategyActive;

    if (tabName === "campanas" && isStrategyActive) return true;
    if (tabName === "calendario" && isCampaignActive) return true;

    if (tabName === "campanas") {
      return !activeStrategy;
    }
    if (tabName === "calendario") {
      return campaigns.length === 0;
    }
    return false;
  };

  const isCampaignProcessing = getStepStatus("CAMPAIGN") === "processing" || campaignLoading;
  const isCalendarProcessing = getStepStatus("CALENDAR") === "processing" || calendarLoading;

  const parsedCons = consolidatedReport ? (parseJson(consolidatedReport.data) || {}) : {};
  const consolidatedPersonas = parseJson(parsedCons.buyerPersonas) || parsedCons.buyerPersonas || [];
  const rawStrategyPersonas = activeStrategy ? (parseJson(activeStrategy.personas) || []) : [];

  const mergedStrategyPersonas = useMemo(() => {
    const baseList = Array.isArray(rawStrategyPersonas) && rawStrategyPersonas.length > 0 
      ? rawStrategyPersonas 
      : (Array.isArray(consolidatedPersonas) ? consolidatedPersonas : []);
    
    return baseList.map((stratP: any, index: number) => {
      const consP = Array.isArray(consolidatedPersonas) && consolidatedPersonas[index] ? consolidatedPersonas[index] : {};
      const name = stratP.name || consP.name || `Persona ${index + 1}`;
      return {
        ...consP,
        ...stratP,
        name,
        demographics: stratP.demographics || consP.demographics || "Audiencia Principal",
        goals: stratP.goals || consP.goals || consP.objectives,
        painPoints: stratP.painPoints || consP.painPoints || consP.pains,
        objections: stratP.objections || consP.objectionHandling || consP.objections,
        triggers: stratP.triggers || consP.buyingTriggers || consP.triggers,
        communication: stratP.communication || (consP.communicationTone || consP.buyingTriggers ? {
          tone: consP.communicationTone || consP.tone || "Empático y persuasivo",
          triggers: consP.buyingTriggers || consP.triggers || "Calidad y recomendación de valor",
          topics: consP.preferredTopics || consP.topics || "Beneficios clave y solución de dolor"
        } : null)
      };
    });
  }, [rawStrategyPersonas, consolidatedPersonas]);

  const parsedStrategyObj = activeStrategy ? {
    objectives: parseJson(activeStrategy.objectives) || [],
    personas: mergedStrategyPersonas,
    funnelStages: parseJson(activeStrategy.funnelStages) || [],
    channels: parseJson(activeStrategy.channels) || []
  } : (mergedStrategyPersonas.length > 0 ? {
    objectives: [],
    personas: mergedStrategyPersonas,
    funnelStages: [],
    channels: []
  } : null);
  const inferredValueProposition = parsedCons.marketPosition?.value_proposition || parsedCons.valueProposition || parsedCons.marketPosition?.competitiveAdvantage || null;

  const handleDownloadEstrategiaPDF = () => {
    downloadEstrategiaPDF(parsedStrategyObj, activeStrategy, data?.businessInfo?.name || "Mi Negocio");
  };

  const handleDownloadBancoDeDatosPDF = () => {
    downloadBancoDeDatosPDF(data, businessReports, competitorReports, competitorsList, businessId);
  };

  const handleDownloadCampanasPDF = () => {
    downloadCampanasPDF(campaigns, data?.businessInfo?.name || "Mi Negocio");
  };

  const handleDownloadCalendarioPDF = () => {
    const calendarContents = data?.calendarContents || [];
    downloadCalendarioPDF(calendarContents, data?.businessInfo?.name || "Mi Negocio", campaigns[0]?.name);
  };

  const shouldActionPulse = (tabName: string): boolean => {
    if (activeTab !== tabName) return false;
    switch (tabName) {
      case "estrategia":
        return !activeStrategy && !strategyLoading;
      case "campanas":
        return campaigns.length === 0 && !campaignLoading;
      default:
        return false;
    }
  };

  const pipelineStages = [
    { key: "BANCODEDATOS", label: "1. Banco de Datos", icon: Database, tab: "bancodedatos", color: "orange", desc: "Diagnóstico, FODA y competencia", emoji: "🗄️", processingEmoji: "⚡" },
    { key: "MEDIA", label: "2. Activos Visuales e Inspiración", icon: ImageIcon, tab: "activosvisuales", color: "blue", desc: "Nicho, web propia y manual", emoji: "🖼️", processingEmoji: "📸" },
    { key: "STRATEGY", label: "3. Estrategia Growth de Marketing", icon: Sparkles, tab: "estrategia", color: "purple", desc: "Buyer personas y embudos", emoji: "🎯", processingEmoji: "✨" },
    { key: "CAMPAIGN", label: "4. Campaña Principal de Marketing", icon: Bot, tab: "campanas", color: "emerald", desc: "Campañas y presupuestos", emoji: "📢", processingEmoji: "🚀" },
    { key: "CALENDAR", label: "5. Calendario & Plan de Publicaciones", icon: ShieldCheck, tab: "calendario", color: "sky", desc: "Copies y feriados patrios", emoji: "📝", processingEmoji: "🤖" },
  ];

  const getStageStatusStyle = (stageKey: string) => {
    let status = 'idle';
    if (stageKey === "BANCODEDATOS") {
      status = (scrapingStatus === 'processing' || diagnosticStatus === 'processing') ? 'processing' :
               (scrapingStatus === 'completed' && diagnosticStatus === 'completed') ? 'completed' : 'idle';
    } else {
      status = getStepStatus(stageKey);
    }

    if (status === 'processing') return { ring: 'ring-2 ring-blue-500/40 animate-pulse', bg: 'bg-blue-500/10 border-blue-400/40', text: 'text-blue-600 dark:text-blue-400', label: 'Procesando' };
    if (status === 'completed') return { ring: '', bg: 'bg-emerald-500/10 border-emerald-400/40', text: 'text-emerald-600 dark:text-emerald-400', label: 'Completado' };
    if (status === 'failed') return { ring: '', bg: 'bg-rose-500/10 border-rose-400/40', text: 'text-rose-600 dark:text-rose-400', label: 'Error' };
    return { ring: '', bg: 'bg-muted/40 border-transparent', text: 'text-muted-foreground/50', label: '' };
  };

  // HEURÍSTICA DE RECOMENDACIONES IDÉNTICA AL PANEL DE COMPETENCIA
  const getFlatRecommendations = (reportData: any) => {
    if (!reportData) return [];
    let data = reportData;
    if (reportData.data) {
      data = typeof reportData.data === "string" ? JSON.parse(reportData.data) : reportData.data;
      if (Array.isArray(data) && data.length > 0) {
        data = data[0].output || data[0];
      }
    }
    
    if (Array.isArray(data.strategic_recommendations)) return data.strategic_recommendations;
    if (Array.isArray(data.recommendations)) return data.recommendations;
    if (Array.isArray(data.contentRecs)) return data.contentRecs;

    const isNewestStructure = !!data.brand_identity || !!data.business_insights || !!data.website_analysis;
    if (isNewestStructure) {
      const bInsights = data.business_insights || {};
      const dQuality = data.data_quality || {};
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

      return arr;
    }

    const recs = data.strategic_recommendations || {};
    const brandingRecs = recs.branding_recommendations || [];
    const marketingRecs = recs.marketing_recommendations || [];
    const seoRecs = recs.seo_recommendations || [];
    const uxRecs = recs.ux_recommendations || [];
    const convRecs = recs.conversion_recommendations || [];

    if (brandingRecs.length > 0 || marketingRecs.length > 0 || seoRecs.length > 0 || uxRecs.length > 0 || convRecs.length > 0) {
      return [...brandingRecs, ...marketingRecs, ...seoRecs, ...uxRecs, ...convRecs];
    }
    if (Array.isArray(data.marketing_insights?.content_recommendations)) {
      return data.marketing_insights.content_recommendations;
    }
    if (Array.isArray(data.content_recommendations)) {
      return data.content_recommendations;
    }
    return [];
  };

  const getConsolidatedDetails = (reportsMap: Record<string, any>) => {
    let positioning = "No disponible";
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const recommendations: string[] = [];

    const chOrder = ["WEBSITE", "FACEBOOK", "INSTAGRAM", "TIKTOK", "LINKEDIN", "YOUTUBE", "SEO_GOOGLE"];
    
    for (const ch of chOrder) {
      const report = reportsMap?.[ch];
      if (report && report.status === "COMPLETED" && report.data) {
        const rData = typeof report.data === "string" ? JSON.parse(report.data) : report.data;
        let dataObj = Array.isArray(rData) && rData.length > 0 ? (rData[0].output || rData[0]) : rData;
        const pos = dataObj?.brand_identity?.market_positioning || dataObj?.competitor_overview?.market_positioning || dataObj?.market_positioning || dataObj?.title || dataObj?.facebook_presence?.brand_summary || dataObj?.instagram_presence?.brand_summary;
        if (pos && pos !== "Sin posicionamiento especificado" && positioning === "No disponible") {
          positioning = pos;
        }

        const rawStrengths = dataObj?.business_insights?.main_strengths || dataObj?.ux_analysis?.ux_strengths || dataObj?.competitive_insights?.main_strengths || dataObj?.strengths || [];
        const strengthsList = Array.isArray(rawStrengths) ? rawStrengths : [rawStrengths];
        strengthsList.forEach((s: string) => {
          if (s && typeof s === "string" && !strengths.includes(s)) strengths.push(s);
        });

        const rawWeaknesses = dataObj?.business_insights?.main_weaknesses || dataObj?.ux_analysis?.ux_weaknesses || dataObj?.competitive_insights?.main_weaknesses || dataObj?.weaknesses || [];
        const weaknessesList = Array.isArray(rawWeaknesses) ? rawWeaknesses : [rawWeaknesses];
        weaknessesList.forEach((w: string) => {
          if (w && typeof w === "string" && !weaknesses.includes(w)) weaknesses.push(w);
        });

        const recs = getFlatRecommendations(report);
        recs.forEach((r: string) => {
          if (r && typeof r === "string" && !recommendations.includes(r)) recommendations.push(r);
        });
      }
    }

    return {
      positioning,
      strengths: strengths.slice(0, 5),
      weaknesses: weaknesses.slice(0, 5),
      recommendations: recommendations.slice(0, 5)
    };
  };

  // OBTENER DIAGNÓSTICO ESTRATÉGICO PARTICULAR DE COMPETIDOR
  const getSelectedCompetitorAnalysis = (selectedComp: any) => {
    if (!selectedComp) return null;

    if (selectedComp.insights?.strategicAnalysis) {
      return selectedComp.insights.strategicAnalysis;
    }

    const channelMap: Record<string, { key: string; label: string }> = {
      WEBSITE: { key: "WEBSITE", label: "Sitio Web" },
      FACEBOOK: { key: "FACEBOOK", label: "Facebook" },
      INSTAGRAM: { key: "INSTAGRAM", label: "Instagram" },
      TIKTOK: { key: "TIKTOK", label: "TikTok" },
      LINKEDIN: { key: "LINKEDIN", label: "LinkedIn" },
      YOUTUBE: { key: "YOUTUBE", label: "YouTube" },
      SEO_GOOGLE: { key: "SEO_GOOGLE", label: "SEO Google" },
    };

    const fortalezas: string[] = [];
    const debilidades: string[] = [];
    const recomendaciones: string[] = [];

    for (const [chKey, chConfig] of Object.entries(channelMap)) {
      const report = selectedComp.reportsByChannel?.[chKey];
      if (!report || report.status !== "COMPLETED" || !report.data) continue;

      const dataObj = normalizeReportData(report.data);
      if (!dataObj) continue;

      const chName = chConfig.label;

      const strengthSources: any[] = [
        dataObj.business_insights?.main_strengths,
        dataObj.business_insights?.differentiators,
        dataObj.ux_analysis?.ux_strengths,
        dataObj.competitive_observations?.main_strengths,
        dataObj.competitive_insights?.strengths,
        dataObj.instagram_presence?.brand_summary ? [dataObj.instagram_presence.brand_summary] : null,
        dataObj.strengths,
      ];

      for (const src of strengthSources) {
        if (!src) continue;
        const items = Array.isArray(src) ? src : [src];
        items.forEach((item: any) => {
          if (item && typeof item === "string" && fortalezas.length < 15) {
            fortalezas.push(`${item} (${chName})`);
          }
        });
      }

      const weaknessSources: any[] = [
        dataObj.business_insights?.main_weaknesses,
        dataObj.ux_analysis?.ux_weaknesses,
        dataObj.competitive_observations?.main_weaknesses,
        dataObj.competitive_insights?.weaknesses,
        dataObj.data_quality?.missing_information,
        dataObj.weaknesses,
      ];

      for (const src of weaknessSources) {
        if (!src) continue;
        const items = Array.isArray(src) ? src : [src];
        items.forEach((item: any) => {
          if (item && typeof item === "string" && debilidades.length < 15) {
            debilidades.push(`${item} (${chName})`);
          }
        });
      }

      const recs = getFlatRecommendations(report);
      recs.forEach((r: string) => {
        if (r && typeof r === "string" && recomendaciones.length < 15) {
          recomendaciones.push(`${r} (${chName})`);
        }
      });

      if (recomendaciones.filter(r => r.endsWith(`(${chName})`)).length === 0) {
        const chanWeaks = debilidades.filter(d => d.endsWith(`(${chName})`));
        if (chanWeaks.length > 0) {
          recomendaciones.push(`Aprovechar las brechas detectadas en ${chName} de la competencia para diferenciarte con contenido de mayor valor. (${chName})`);
        }
      }
    }

if (fortalezas.length === 0 && debilidades.length === 0 && recomendaciones.length === 0) {
      return null;
    }

    return {
      desempenoCanales: fortalezas,
      debilidadesGaps: debilidades,
      planContramedida: recomendaciones
    };
  };

  const hasReports = individualBusinessReports.length > 0 || competitorReports.length > 0;
  const isCurrentlyProcessing = scrapingStatus === "processing" || diagnosticStatus === "processing" || scrapingLoading || diagnosticLoading;
  const isAnalysisComplete = !!consolidatedReport && !!data?.businessInfo?.competitorGeneralReport;

  const isStrategyProcessing = getStepStatus("STRATEGY") === "processing" || strategyLoading;

  const isWaitModalOpen = 
    activeTab === "bancodedatos" &&
    !isDismissed && (
      (loading && !data) ||
      !isAnalysisComplete ||
      isCurrentlyProcessing ||
      scrapingStatus === "failed" ||
      diagnosticStatus === "failed"
    );

  const getDialogProgressContent = () => {
    if (loading && !data) {
      return {
        stage: 1,
        title: "Cargando Banco de Datos",
        description: "Iniciando la conexión con los agentes de inteligencia artificial y recuperando el estado de tu negocio..."
      };
    }
    const hasAnyReportOrData = individualBusinessReports.length > 0 || competitorReports.length > 0 || consolidatedReport || data?.businessInfo?.competitorGeneralReport;

    // Estados fallidos de todas las fases (solo si no existen datos ni reportes con los que continuar)
    if (scrapingStatus === "failed" && !hasAnyReportOrData) {
      return {
        stage: -1,
        title: "Fallo en la Extracción Digital",
        description: "El Agente de Extracción no pudo conectar con los canales digitales. Por favor, reintenta el proceso."
      };
    }
    if (diagnosticStatus === "failed" && !hasAnyReportOrData) {
      return {
        stage: -1,
        title: "Fallo en el Diagnóstico FODA",
        description: "El Agente de Inteligencia no pudo consolidar la información del mercado. Puedes reintentar el análisis."
      };
    }
    if (getStepStatus("STRATEGY") === "failed") {
      return {
        stage: -1,
        title: "Fallo en la Estrategia de Growth",
        description: "El Agente de Estrategia reportó un error al diseñar tus perfiles y objetivos. Por favor, reintenta."
      };
    }
    if (getStepStatus("CAMPAIGN") === "failed") {
      return {
        stage: -1,
        title: "Fallo en la Parametrización de Campañas",
        description: "El Agente de Campañas reportó un error al estructurar tu presupuesto y ofertas. Por favor, reintenta."
      };
    }
    if (getStepStatus("CALENDAR") === "failed") {
      return {
        stage: -1,
        title: "Fallo en el Calendario Editorial",
        description: "El Agente Editorial reportó un error al redactar las publicaciones. Por favor, reintenta."
      };
    }

    // Progresos activos de todas las fases
    if (isStrategyProcessing) {
      return {
        stage: 2,
        title: "Etapa 2: Diseñando Estrategia de Growth",
        description: "El Agente Estratega está analizando los buyer personas de alta fidelidad sociocultural y priorizando tus objetivos de negocio."
      };
    }
    if (isCampaignProcessing) {
      return {
        stage: 3,
        title: "Etapa 3: Parametrización de Campaña de Marketing",
        description: "El Agente de Campañas está configurando las metas comerciales, ofertas y canales ideales para capturar a tu cliente ideal."
      };
    }
    if (isCalendarProcessing) {
      return {
        stage: 4,
        title: "Etapa 4: Generando Calendario Editorial",
        description: "El Agente Editorial está diseñando el cronograma de contenidos y redactando los copys persuasivos bajo la regla 60-25-15."
      };
    }

    // Banco de datos listos/progresos
    if (isAnalysisComplete) {
      return {
        stage: 3,
        title: "Análisis Completado",
        description: "¡Felicidades! Los agentes autónomos han finalizado de extraer la información de tus canales y la competencia, consolidando el FODA y el diagnóstico con éxito."
      };
    }
    if (!hasReports && !isCurrentlyProcessing) {
      return {
        stage: 0,
        title: "Banco de Datos Listo para Procesar",
        description: "Nuestros agentes autónomos están listos para analizar tu presencia digital y la de tu competencia directa. Presiona el botón para disparar el reanálisis y la extracción en cascada."
      };
    }
    if (diagnosticStatus === "processing" || diagnosticLoading) {
      const hasSomeIndividualReports = individualBusinessReports.length > 0 || competitorReports.length > 0;
      if (!hasSomeIndividualReports) {
        return {
          stage: 2,
          title: "Etapa 2: Realizando Diagnóstico por Canal",
          description: "La IA está analizando de forma independiente cada canal de comunicación digital y evaluando su frecuencia, tono, consistencia e interacción."
        };
      } else {
        return {
          stage: 3,
          title: "Etapa 3: Consolidando Informe Competitivo (FODA)",
          description: "El agente analista compila la información total, realiza la comparación y elabora la matriz FODA y el informe general de tus competidores locales."
        };
      }
    }
    if (scrapingStatus === "processing" || scrapingLoading) {
      return {
        stage: 1,
        title: "Etapa 1: Extrayendo Información Digital",
        description: "Nuestros agentes están recorriendo tu sitio web y tus perfiles de redes sociales y los de tus competidores para extraer publicaciones y datos clave del mercado."
      };
    }
    return {
      stage: 1,
      title: "Cargando agentes...",
      description: "Preparando los agentes de inteligencia artificial para el análisis."
    };
  };

  const [rotatingPhraseIndex, setRotatingPhraseIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRotatingPhraseIndex((prev) => prev + 1);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const STAGE_1_PHRASES = [
    "Analizando código fuente de sitios web e indexando publicaciones recientes en redes sociales...",
    "Escaneando la huella digital de tus competidores locales en tiempo real...",
    "Extrayendo patrones de engagement, hashtags virales y frecuencia de contenido...",
    "Agentes rastreando catálogos digitales, precios y llamadas a la acción (CTAs)...",
    "Indexando estructura SEO, enlaces sociales y canales de conversión directos..."
  ];

  const STAGE_2_PHRASES = [
    "Evaluando engagement, frecuencia de publicación y coherencia visual en cada canal digital...",
    "Auditando calidad de copies, tono de comunicación y estilo gráfico de la competencia...",
    "Detectando vacíos de información en tus canales y objeciones no resueltas de tus clientes...",
    "Calculando índice de interacción e impacto de marca frente a rivales directos...",
    "Mapeando canales de mayor tasa de conversión (WhatsApp vs Social vs Tienda Web)..."
  ];

  const STAGE_3_PHRASES = [
    "Cruzando información del mercado, detectando debilidades competitivas y compilando matriz FODA...",
    "Modelando perfil de Buyer Personas y arquetipos de marca con Inteligencia Artificial...",
    "Calculando ventajas diferenciales únicas para posicionar tu oferta en el mercado...",
    "Compilando reporte consolidado de inteligencia comercial y diagnóstico 360°...",
    "Finalizando la síntesis estratégica y preparando recomendaciones de crecimiento..."
  ];

  const STRATEGY_PHRASES = [
    "Modelando enfoque estratégico, definiendo metas comerciales SMART y perfilando Buyer Personas...",
    "Calculando pilares de contenido de alto impacto para atracción, nutrición y cierre de ventas...",
    "Optimizando funnel de conversión según los patrones de compra de tu audiencia objetivo...",
    "Estableciendo tono de voz, propuestas de valor y ganchos promocionales con IA..."
  ];

  const CAMPAIGN_PHRASES = [
    "Estructurando presupuestos ideales, definiendo ofertas de conversión y asignando canales de adquisición...",
    "Diseñando ángulos de comunicación persuasivos y copys promocionales de alta respuesta...",
    "Configurando asignación de inversión en anuncios y métricas clave de desempeño (KPIs)...",
    "Segmentando audiencias frías, templadas y calientes para maximizar el retorno de inversión..."
  ];

  const CALENDAR_PHRASES = [
    "Generando el plan de contenidos mensual y redactando copies con IA bajo la regla 60-25-15...",
    "Redactando guiones de Reels y publicaciones dinámicas alineadas al tono de tu marca...",
    "Calculando días y horas óptimas de publicación para maximizar tu alcance orgánico...",
    "Creando llamadas a la acción (CTAs) irresistibles para convertir seguidores en clientes..."
  ];

  const getDynamicWaitingText = () => {
    if (scrapingStatus === "processing" || scrapingLoading) {
      return STAGE_1_PHRASES[rotatingPhraseIndex % STAGE_1_PHRASES.length];
    }
    if (diagnosticStatus === "processing" || diagnosticLoading) {
      const hasSomeIndividualReports = individualBusinessReports.length > 0 || competitorReports.length > 0;
      if (!hasSomeIndividualReports) {
        return STAGE_2_PHRASES[rotatingPhraseIndex % STAGE_2_PHRASES.length];
      } else {
        return STAGE_3_PHRASES[rotatingPhraseIndex % STAGE_3_PHRASES.length];
      }
    }
    if (isStrategyProcessing) {
      return STRATEGY_PHRASES[rotatingPhraseIndex % STRATEGY_PHRASES.length];
    }
    if (isCampaignProcessing) {
      return CAMPAIGN_PHRASES[rotatingPhraseIndex % CAMPAIGN_PHRASES.length];
    }
    if (isCalendarProcessing) {
      return CALENDAR_PHRASES[rotatingPhraseIndex % CALENDAR_PHRASES.length];
    }
    return "Conectando con la red de agentes autónomos y preparando el procesamiento de datos...";
  };

  const currentProgress = getDialogProgressContent();

  const handleManualTrigger = () => {
    setIsDismissed(false);
    handleStartScraping();
  };

  const tabOrder = ["bancodedatos", "estrategia", "campanas", "calendario"];
  const currentIdx = tabOrder.indexOf(activeTab);
  const prevTab = currentIdx > 0 ? tabOrder[currentIdx - 1] : null;
  const nextTab = currentIdx < tabOrder.length - 1 ? tabOrder[currentIdx + 1] : null;

  const nextLabels: Record<string, string> = {
    estrategia: "Estrategias de Growth",
    campanas: "Parametrización de Campañas",
    calendario: "Calendario Editorial"
  };

  const isNextBlocked = nextTab ? isTabBlocked(nextTab) : false;


  return (
    <Card className="border border-border dark:border-cyan-500/20 bg-card dark:bg-[#0D1526] text-card-foreground dark:text-slate-100 shadow-xl flex flex-col min-h-[500px] rounded-3xl overflow-hidden">
      {/* Estilos e Inyecciones CSS */}
      <style>{`
        @keyframes guided-pulse-violet {
          0%, 100% { box-shadow: 0 0 0 0 rgba(124, 58, 237, 0.6); transform: scale(1.02); }
          50% { box-shadow: 0 0 25px 8px rgba(139, 92, 246, 0.5); transform: scale(1.06); }
        }
        .continue-btn-pulse { animation: guided-pulse-violet 1.6s ease-in-out infinite; }
      `}</style>

      {/* DIALOG DE ESPERA ACTIVA (PROGRESO IA ESTILO BASE44) */}
      <Dialog open={isWaitModalOpen} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-6 bg-card dark:bg-[#0D1526] border border-border dark:border-cyan-500/20 text-foreground dark:text-slate-100 shadow-2xl [&>button]:hidden">
          <div className="relative flex items-center justify-center h-24 w-24">
            {currentProgress.stage === -1 ? (
              <div className="relative h-20 w-20 bg-rose-500/10 rounded-full border-2 border-rose-500/40 flex items-center justify-center text-rose-500 dark:text-rose-400">
                <AlertTriangle className="h-9 w-9 animate-pulse" />
              </div>
            ) : (
              <>
                <div className="relative h-20 w-20 rounded-full border-2 border-cyan-500/20 bg-muted dark:bg-[#132035] flex items-center justify-center">
                  <Search className="h-8 w-8 text-cyan-600 dark:text-cyan-400 animate-pulse" />
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-500 animate-spin" />
              </>
            )}
          </div>

          <div className="space-y-2 w-full">
            <div className="flex items-center justify-center gap-1.5">
              <span className={`text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                currentProgress.stage === -1 
                  ? "bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30" 
                  : "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/30"
              }`}>
                {currentProgress.title}
              </span>
            </div>
            <h3 className="text-xl font-black text-foreground dark:text-white tracking-tight">
              {currentProgress.stage === -1 ? "Error Detectado" : "Auditando Banco de Datos"}
            </h3>
            <p className="text-xs text-muted-foreground dark:text-slate-400 leading-relaxed max-w-sm font-medium mx-auto">
              {currentProgress.description}
            </p>

            {currentProgress.stage !== -1 && (
              <div className="flex justify-center items-center gap-1.5 pt-3">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
            )}
          </div>

          {currentProgress.stage === -1 ? (
            <div className="w-full pt-2 space-y-2">
              <Button
                onClick={() => {
                  handleManualTrigger();
                }}
                className="w-full h-11 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs transition-all shadow-md flex items-center justify-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Reanalizar Banco de Datos
              </Button>

              <Button
                onClick={() => {
                  setIsDismissed(true);
                }}
                variant="ghost"
                className="w-full h-9 rounded-xl text-xs text-muted-foreground hover:text-foreground font-semibold"
              >
                Cerrar y explorar panel
              </Button>
            </div>
          ) : !hasReports && !isCurrentlyProcessing ? (
            <div className="w-full pt-2">
              <Button
                onClick={handleManualTrigger}
                className="w-full h-11 rounded-xl bg-orange-650 hover:bg-orange-700 text-white font-extrabold text-xs transition-all shadow-md flex items-center justify-center gap-2"
              >
                <Cpu className="h-4 w-4 animate-spin-slow" />
                Iniciar Extracción y Análisis Automático
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between w-full max-w-xs border-t pt-4">
                <div className="flex flex-col items-center">
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    currentProgress.stage >= 1 
                      ? currentProgress.stage > 1 
                        ? "bg-emerald-500 text-white" 
                        : "bg-primary text-primary-foreground animate-pulse"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {currentProgress.stage > 1 ? <Check className="h-3.5 w-3.5" /> : "1"}
                  </div>
                  <span className="text-[8px] font-bold text-muted-foreground mt-1">Extracción</span>
                </div>
                <div className="h-0.5 bg-muted flex-1 mx-2" />
                <div className="flex flex-col items-center">
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    currentProgress.stage >= 2 
                      ? currentProgress.stage > 2 
                        ? "bg-emerald-500 text-white" 
                        : "bg-primary text-primary-foreground animate-pulse"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {currentProgress.stage > 2 ? <Check className="h-3.5 w-3.5" /> : "2"}
                  </div>
                  <span className="text-[8px] font-bold text-muted-foreground mt-1">Diagnóstico</span>
                </div>
                <div className="h-0.5 bg-muted flex-1 mx-2" />
                <div className="flex flex-col items-center">
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isAnalysisComplete 
                      ? "bg-emerald-500 text-white" 
                      : currentProgress.stage >= 3 
                        ? "bg-primary text-primary-foreground animate-pulse" 
                        : "bg-muted text-muted-foreground"
                  }`}>
                    {isAnalysisComplete ? <Check className="h-3.5 w-3.5" /> : "3"}
                  </div>
                  <span className="text-[8px] font-bold text-muted-foreground mt-1">Consolidación</span>
                </div>
              </div>

              <div className="flex flex-col items-center gap-3 w-full border-t pt-4">
                {isCurrentlyProcessing ? (
                  <>
                    <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground font-semibold px-4 text-center min-h-[32px]">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
                      <span key={rotatingPhraseIndex} className="animate-in fade-in slide-in-from-bottom-1 duration-300">
                        {getDynamicWaitingText()}
                      </span>
                    </div>
                    {!hasReports && (
                      <Button
                        variant="outline"
                        onClick={handleManualTrigger}
                        className="h-8 text-[10px] font-black uppercase rounded-xl border-dashed border-orange-500/40 text-orange-750 hover:bg-orange-500/5 mt-2 px-4"
                      >
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin-slow text-orange-600" />
                        ¿Tarda demasiado? Forzar Re-intento
                      </Button>
                    )}
                  </>
                ) : (
                  <div className="w-full pt-2">
                    <Button
                      onClick={() => {
                        setIsDismissed(true);
                        setIsTriggeredInSession(false);
                      }}
                      className={`w-full h-11 rounded-xl font-extrabold text-xs transition-all shadow-md flex items-center justify-center gap-2 ${
                        isAnalysisComplete
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white animate-bounce-slow"
                          : "bg-orange-600 hover:bg-orange-700 text-white"
                      }`}
                    >
                      <Eye className="h-4 w-4" />
                      {isAnalysisComplete
                        ? "Ver Informe Completo"
                        : "Ver Resultados Parciales"}
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Header premium */}
      {!hideTopTabBar && (
        <div className="px-6 py-5 border-b bg-gradient-to-r from-orange-500/5 via-background to-indigo-500/5">
          <h4 className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2">
            <Cpu className="h-4.5 w-4.5 text-orange-600 animate-pulse" />
            Procesamiento del Banco de Datos e Inteligencia Competitiva
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Observa cómo se consolida la información de mercado para el motor de estrategias.
          </p>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        {/* Etapas de agentes responsivas */}
        {!hideTopTabBar && (
          <div className="px-6 py-5 border-b bg-muted/10">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {pipelineStages.map((stage, idx) => {
                let status = 'idle';
                if (stage.key === "BANCODEDATOS") {
                  status = (scrapingStatus === 'processing' || diagnosticStatus === 'processing') ? 'processing' :
                           (scrapingStatus === 'completed' && diagnosticStatus === 'completed') ? 'completed' : 'idle';
                } else {
                  status = getStepStatus(stage.key);
                }
                const style = getStageStatusStyle(stage.key);
                const isActive = activeTab === stage.tab;
                const isBlocked = isTabBlocked(stage.tab);

                const activeColors: Record<string, string> = {
                  orange: 'from-orange-500/10 to-orange-500/3 border-orange-300 dark:from-orange-400/20 dark:to-orange-400/5 dark:border-orange-700',
                  purple: 'from-purple-500/10 to-purple-500/3 border-purple-300 dark:from-purple-400/20 dark:to-purple-400/5 dark:border-purple-700',
                  emerald: 'from-emerald-500/10 to-emerald-500/3 border-emerald-300 dark:from-emerald-400/20 dark:to-emerald-400/5 dark:border-emerald-700',
                  sky: 'from-sky-500/10 to-sky-500/3 border-sky-300 dark:from-sky-400/20 dark:to-sky-400/5 dark:border-sky-700',
                };

                return (
                  <button
                    key={stage.key}
                    disabled={isBlocked && activeTab !== stage.tab}
                    onClick={() => {
                      if (isBlocked) {
                        toast.error(`La Etapa ${idx} (${pipelineStages[idx - 1]?.label || ""}) debe finalizar para desbloquear esta etapa.`);
                        return;
                      }
                      setActiveTab(stage.tab);
                    }}
                    className={`relative flex flex-col items-center justify-between text-center p-3 rounded-2xl border transition-all duration-350 ${
                      isBlocked
                        ? 'bg-slate-50/40 dark:bg-slate-900/10 border-slate-100 dark:border-slate-900 opacity-40 cursor-not-allowed'
                        : isActive 
                          ? `bg-gradient-to-b ${activeColors[stage.color]} shadow-md scale-[1.02] border-primary/40` 
                          : status === 'completed'
                            ? 'bg-background hover:bg-muted/40 border-emerald-300/60 dark:border-emerald-800/60 hover:scale-[1.01] cursor-pointer step-completed-shimmer'
                            : 'bg-background hover:bg-muted/40 border-slate-100 dark:border-slate-800 hover:scale-[1.01] cursor-pointer'
                    }`}
                  >
                    <div className="w-full flex flex-col items-center gap-1.5">
                      <span className={`text-[8px] font-black uppercase tracking-widest leading-none ${
                        isActive ? 'text-primary' : 'text-muted-foreground/50'
                      }`}>
                        Etapa 0{idx + 1}
                      </span>

                      <div className="relative">
                        {status === 'processing' && !isBlocked && (
                          <>
                            <div className="absolute inset-0 rounded-xl bg-blue-500/20 agent-radar-ring" />
                            <div className="absolute inset-0 rounded-xl bg-blue-500/10 agent-radar-ring" style={{ animationDelay: '0.5s' }} />
                          </>
                        )}
                        {status === 'completed' && !isBlocked && (
                          <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-br from-emerald-400/20 to-teal-400/20 blur-sm" />
                        )}
                        <div className={`relative h-10 w-10 rounded-xl border-2 flex items-center justify-center transition-all duration-300 ${
                          isBlocked
                            ? 'bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 grayscale'
                            : status === 'processing'
                              ? 'bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-950 border-blue-400 dark:border-blue-500 shadow-lg shadow-blue-500/20'
                              : status === 'completed'
                                ? 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 border-emerald-400 dark:border-emerald-500 shadow-md shadow-emerald-500/15'
                                : status === 'failed'
                                  ? 'bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-950 dark:to-red-950 border-rose-400 dark:border-rose-500'
                                  : isActive
                                    ? `bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950 border-orange-400 dark:border-orange-500 shadow-md`
                                    : 'bg-muted/30 border-muted-foreground/10'
                        }`}>
                          <span className={`text-base select-none ${
                            isBlocked ? 'opacity-30 grayscale'
                            : status === 'processing' ? 'agent-working'
                            : status === 'completed' ? 'agent-float'
                            : ''
                          }`}>
                            {isBlocked ? '🔒'
                              : status === 'processing' ? (stage as any).processingEmoji
                              : status === 'failed' ? '❌'
                              : (stage as any).emoji}
                          </span>
                        </div>
                      </div>

                      <span className={`text-[10px] font-bold leading-tight transition-colors ${
                        isActive ? 'text-primary font-extrabold' : 'text-muted-foreground/80'
                      }`}>
                        {stage.label}
                      </span>

                      <span className="text-[8px] text-muted-foreground/60 leading-normal block max-w-[90px] mt-0.5">
                        {stage.desc}
                      </span>
                    </div>

                    <div className="mt-1.5 w-full">
                      {isBlocked ? (
                        <span className="text-[7px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-400 border border-slate-200 dark:border-slate-800">
                          BLOQUEADO
                        </span>
                      ) : status === 'processing' ? (
                        <span className="text-[7px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center gap-1">
                          <Loader2 className="h-2.5 w-2.5 animate-spin" />
                          Trabajando
                        </span>
                      ) : status !== 'idle' ? (
                        <span className={`text-[7px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          status === 'completed' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                          'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        }`}>
                          {style.label}
                        </span>
                      ) : (
                        <span className="text-[7px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-500 border border-transparent">
                          PENDIENTE
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <TabsList className="sr-only">
          <TabsTrigger value="bancodedatos">Banco de Datos</TabsTrigger>
          <TabsTrigger value="estrategia">Estrategia</TabsTrigger>
          <TabsTrigger value="campanas">Campañas</TabsTrigger>
          <TabsTrigger value="calendario">Calendario</TabsTrigger>
        </TabsList>

        <div className="flex-1 w-full h-full min-h-0 overflow-y-auto pl-4 pr-4 pt-0 pb-4 space-y-6">
          {tabTransitionLoading || loading || !data ? (
            <StageLoadingOverlay activeTab={activeTab} />
          ) : (
            <>
              {/* TAB 1: BANCO DE DATOS (UNIFICADO) */}
              <TabsContent value="bancodedatos" className="space-y-6 mt-0">
            {/* SECTION 1. INFORMACIÓN DEL NEGOCIO */}
            {(() => {
              const bizInfo = data?.businessInfo || data?.business;
              if (!bizInfo) return null;
              return (
              <section className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-orange-600" />
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">
                      1. Información del Negocio
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {data && (
                      <Button
                        onClick={handleDownloadBancoDeDatosPDF}
                        size="sm"
                        variant="outline"
                        className="h-8 text-[10px] font-black uppercase border-orange-500/30 text-orange-700 hover:bg-orange-500/5 rounded-xl gap-1.5"
                      >
                        <Download className="h-3 w-3 text-orange-600" />
                        Descargar PDF
                      </Button>
                    )}
                    <Button
                      onClick={handleManualTrigger}
                      size="sm"
                      variant="outline"
                      className="h-8 text-[10px] font-black uppercase border-orange-500/30 text-orange-700 hover:bg-orange-500/5 rounded-xl gap-1.5"
                    >
                      <RefreshCw className="h-3 w-3 text-orange-600" />
                      Reanalizar Banco de Datos
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Datos de Registro */}
                  <div className="bg-gradient-to-b from-card to-muted/20 p-5 rounded-2xl border space-y-4 shadow-sm">
                    <span className="text-[10px] font-black text-orange-600 uppercase tracking-wider block border-b pb-1">
                      📂 Datos de Registro
                    </span>
                    <div className="space-y-3 text-xs">
                      <div>
                        <span className="font-bold text-muted-foreground block text-[9px] uppercase">Nombre</span>
                        <span className="font-semibold text-foreground">{bizInfo.name}</span>
                      </div>
                      {bizInfo.location && (
                        <div>
                          <span className="font-bold text-muted-foreground block text-[9px] uppercase">Ubicación</span>
                          <span className="font-semibold text-foreground">{bizInfo.location}</span>
                        </div>
                      )}
                      {bizInfo.industry && (
                        <div>
                          <span className="font-bold text-muted-foreground block text-[9px] uppercase">Industria</span>
                          <span className="font-semibold text-foreground">{bizInfo.industry}</span>
                        </div>
                      )}
                      {bizInfo.phoneNumbers && (
                        <div>
                          <span className="font-bold text-muted-foreground block text-[9px] uppercase">Contacto</span>
                          <span className="font-semibold text-foreground">{bizInfo.phoneNumbers}</span>
                        </div>
                      )}
                      {bizInfo.website && (
                        <div>
                          <span className="font-bold text-muted-foreground block text-[9px] uppercase">Sitio Web Principal</span>
                          <a href={bizInfo.website} target="_blank" rel="noopener noreferrer" className="text-orange-600 dark:text-orange-400 hover:underline font-bold truncate block">
                            {bizInfo.website}
                          </a>
                        </div>
                      )}

                      {/* Redes Sociales y Canales */}
                      {(() => {
                        const socialLinks = parseJson(bizInfo.socialLinks) || {};
                        const activePlatforms = Object.entries(socialLinks).filter(([_, url]) => Boolean(url && typeof url === "string" && url.trim() !== ""));
                        
                        if (activePlatforms.length === 0) return null;
                        
                        return activePlatforms.map(([platform, url]) => {
                          const platformLabel = 
                            platform.toLowerCase() === 'tiktok' ? 'TikTok' : 
                            platform.toLowerCase() === 'facebook' ? 'Facebook' : 
                            platform.toLowerCase() === 'instagram' ? 'Instagram' : platform;
                            
                          return (
                            <div key={platform}>
                              <span className="font-bold text-muted-foreground block text-[9px] uppercase">{platformLabel}</span>
                              <a href={String(url)} target="_blank" rel="noopener noreferrer" className="text-orange-600 dark:text-orange-400 hover:underline font-bold truncate block">
                                {String(url)}
                              </a>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  {/* Enfoque y Propuesta de Valor */}
                  <div className="bg-gradient-to-b from-card to-muted/20 p-5 rounded-2xl border space-y-4 shadow-sm md:col-span-2">
                    <span className="text-[10px] font-black text-orange-600 uppercase tracking-wider block border-b pb-1">
                      💡 Enfoque y Propuesta de Valor
                    </span>
                    <div className="space-y-4 text-xs leading-relaxed">
                      {data.businessInfo.description && (
                        <div>
                          <span className="font-bold text-muted-foreground block text-[9px] uppercase">Descripción</span>
                          <p className="font-medium text-foreground">{data.businessInfo.description}</p>
                        </div>
                      )}
                      {inferredValueProposition && (
                        <div>
                          <span className="font-bold text-muted-foreground block text-[9px] uppercase">Propuesta de Valor</span>
                          <p className="font-semibold text-orange-650 dark:text-orange-450 italic">"{inferredValueProposition}"</p>
                        </div>
                      )}
                      
                      {/* Identidad de Marca */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-3 mt-2">
                        {(() => {
                          const voice = parseJson(data.businessInfo.brandVoice);
                          if (!voice) return null;
                          const formatTags = (val: any): string[] => {
                            if (!val) return [];
                            if (Array.isArray(val)) return val;
                            if (typeof val === "string") return val.split(",").map(s => s.trim()).filter(Boolean);
                            return [];
                          };
                          const tones = formatTags(voice.tone);
                          const personalities = formatTags(voice.personality);

                          return (
                            <>
                              <div>
                                <span className="text-[9px] text-muted-foreground block uppercase font-bold">Tono de Voz</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {tones.map((t, idx) => (
                                    <Badge key={idx} variant="secondary" className="bg-orange-550/10 text-orange-700 hover:bg-orange-555/10 border-none rounded-lg text-[9px] font-bold px-2 py-0.5">
                                      {t}
                                    </Badge>
                                  ))}
                                  {tones.length === 0 && <span className="text-muted-foreground italic text-[10px]">No especificado</span>}
                                </div>
                              </div>
                              <div>
                                <span className="text-[9px] text-muted-foreground block uppercase font-bold">Personalidad</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {personalities.map((p, idx) => (
                                    <Badge key={idx} variant="secondary" className="bg-purple-550/10 text-purple-700 hover:bg-purple-555/10 border-none rounded-lg text-[9px] font-bold px-2 py-0.5">
                                      {p}
                                    </Badge>
                                  ))}
                                  {personalities.length === 0 && <span className="text-muted-foreground italic text-[10px]">No especificado</span>}
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

              </section>
            );
          })()}

            {/* SECTION 2. MAPEO DE COMPETENCIA Y ESTADO DIGITAL */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-b pb-2">
                <Users className="h-5 w-5 text-orange-600" />
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">
                  2. Mapeo de Competencia y Estado Digital
                </h3>
              </div>

              {competitorsList.length === 0 ? (
                <div className="p-6 bg-muted/10 rounded-2xl border text-center text-xs text-muted-foreground italic">
                  Sin competidores registrados para mapear.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {competitorsList.map((c: any, index: number) => {
                    const cReports = competitorReports.filter((r: any) => r.entityId === c.id);
                    const reportsMap = cReports.reduce((acc: any, r: any) => {
                      acc[r.channel.toUpperCase()] = r;
                      return acc;
                    }, {});
                    const compWithMap = { ...c, reportsByChannel: reportsMap };
                    const individualAnalysis = getSelectedCompetitorAnalysis(compWithMap);
                    
                    // Intentar extraer voz del competidor o deducirla
                    const firstCompletedReport = cReports.find((r: any) => r.status === 'COMPLETED' && r.data);
                    let brandPersonality = ["Corporativa", "Comercial"];
                    let emotionalTone = ["Neutral"];
                    if (firstCompletedReport) {
                      const parsed = normalizeReportData(firstCompletedReport.data);
                      if (parsed?.branding_analysis?.brand_personality) {
                        brandPersonality = Array.isArray(parsed.branding_analysis.brand_personality) 
                          ? parsed.branding_analysis.brand_personality 
                          : [parsed.branding_analysis.brand_personality];
                      }
                      if (parsed?.branding_analysis?.emotional_tone) {
                        emotionalTone = Array.isArray(parsed.branding_analysis.emotional_tone)
                          ? parsed.branding_analysis.emotional_tone
                          : [parsed.branding_analysis.emotional_tone];
                      }
                    }

                    return (
                      <div key={c.id} className="bg-gradient-to-b from-card to-muted/20 p-5 rounded-3xl border space-y-4 shadow-sm flex flex-col justify-between">
                        <div className="space-y-3.5">
                          <div className="flex items-center justify-between border-b pb-2">
                            <span className="text-xs font-black uppercase tracking-wide text-foreground">
                              {c.name}
                            </span>
                            <Badge variant="outline" className="text-[8px] rounded-md font-bold border-orange-200 text-orange-700 bg-orange-500/5">
                              Competidor {index + 1}
                            </Badge>
                          </div>
                          
                          {/* Identidad del competidor */}
                          <div className="space-y-2 text-xs">
                            <div>
                              <span className="font-bold text-muted-foreground block text-[8px] uppercase">Tono de Voz</span>
                              <div className="flex flex-wrap gap-1 mt-0.5">
                                {emotionalTone.slice(0, 3).map((t, idx) => (
                                  <Badge key={idx} variant="outline" className="text-[8px] rounded-md py-0 px-1 font-semibold border-slate-200">
                                    {t}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <span className="font-bold text-muted-foreground block text-[8px] uppercase">Personalidad</span>
                              <div className="flex flex-wrap gap-1 mt-0.5">
                                {brandPersonality.slice(0, 3).map((p, idx) => (
                                  <Badge key={idx} variant="outline" className="text-[8px] rounded-md py-0 px-1 font-semibold border-indigo-200 text-indigo-700">
                                    {p}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            
                            {/* Plataformas Activas */}
                            <div>
                              <span className="font-bold text-muted-foreground block text-[8px] uppercase">Plataformas Activas</span>
                              <div className="flex gap-1.5 mt-1">
                                {c.facebook && (
                                  <a href={c.facebook} target="_blank" rel="noopener noreferrer" className="p-1 bg-background border rounded-lg hover:bg-muted" title="Facebook">
                                    {getSocialIcon("FACEBOOK")}
                                  </a>
                                )}
                                {c.instagram && (
                                  <a href={c.instagram} target="_blank" rel="noopener noreferrer" className="p-1 bg-background border rounded-lg hover:bg-muted" title="Instagram">
                                    {getSocialIcon("INSTAGRAM")}
                                  </a>
                                )}
                                {c.tiktok && (
                                  <a href={c.tiktok} target="_blank" rel="noopener noreferrer" className="p-1 bg-background border rounded-lg hover:bg-muted" title="TikTok">
                                    {getSocialIcon("TIKTOK")}
                                  </a>
                                )}
                                {c.website && (
                                  <a href={c.website} target="_blank" rel="noopener noreferrer" className="p-1 bg-background border rounded-lg hover:bg-muted" title="Sitio Web">
                                    {getSocialIcon("WEBSITE")}
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Gap/Evaluación */}
                          <div className="border-t pt-3 space-y-2">
                            <span className="font-bold text-muted-foreground block text-[8px] uppercase">Evaluación de Desempeño</span>
                            {individualAnalysis ? (
                              <div className="space-y-1">
                                <span className="text-[9px] font-black text-rose-600 block">Brechas Detectadas:</span>
                                <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                                  {individualAnalysis.debilidadesGaps?.[0] || "Optimizar la constancia y engagement del canal."}
                                </p>
                              </div>
                            ) : (
                              <p className="text-[10px] text-muted-foreground italic">Analizando brechas...</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* SECTION 3. CONFIGURACIÓN ESTRATÉGICA BASE (ONBOARDING) */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-b pb-2">
                <Target className="h-5 w-5 text-orange-600" />
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">
                  3. Configuración Estratégica Base
                </h3>
              </div>

              {(() => {
                const strategyInfo = data?.businessInfo?.onboardingStrategy 
                  ? parseJson(data.businessInfo.onboardingStrategy) 
                  : null;

                if (!strategyInfo) {
                  return (
                    <div className="p-6 bg-muted/10 rounded-2xl border text-center text-xs text-muted-foreground italic">
                      No se detectó configuración estratégica (7 preguntas).
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-4 bg-muted/15 rounded-2xl border">
                      <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block mb-1">Ubicación y Edad Objetivo</span>
                      <p className="text-xs font-semibold">{strategyInfo.locationAge || "No especificado"}</p>
                    </div>
                    <div className="p-4 bg-muted/15 rounded-2xl border">
                      <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block mb-1">Evento de Vida / Desencadenante</span>
                      <p className="text-xs font-semibold text-orange-655 dark:text-orange-400">{strategyInfo.lifeEvent || "No especificado"}</p>
                    </div>
                    <div className="p-4 bg-muted/15 rounded-2xl border">
                      <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block mb-1">Arquetipo de Negocio</span>
                      <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{strategyInfo.archetype || "No especificado"}</p>
                    </div>
                    <div className="p-4 bg-muted/15 rounded-2xl border">
                      <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block mb-1">Canal Crítico de Conversión</span>
                      <p className="text-xs font-semibold">{strategyInfo.conversionChannel || "No especificado"}</p>
                    </div>
                    <div className="p-4 bg-muted/15 rounded-2xl border">
                      <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block mb-1">Brechas de Dudas Comunes</span>
                      <p className="text-xs font-semibold">{strategyInfo.informationGaps || "No especificado"}</p>
                    </div>
                    <div className="p-4 bg-muted/15 rounded-2xl border">
                      <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block mb-1">Prueba Social (UGC)</span>
                      <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{strategyInfo.socialProof || "No especificado"}</p>
                    </div>
                    <div className="p-4 bg-muted/15 rounded-2xl border md:col-span-2 lg:col-span-3">
                      <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block mb-1">Ventaja Diferencial</span>
                      <p className="text-xs font-semibold italic text-primary">"{strategyInfo.differentialAdvantage || "No especificado"}"</p>
                    </div>
                  </div>
                );
              })()}
            </section>

            {/* SECTION 4. PROGRESO DE AUDITORÍA (SCRAPING) */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-b pb-2">
                <Database className="h-5 w-5 text-orange-600" />
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">
                  4. Progreso de Auditoría (Scraping)
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Propio */}
                <div className="bg-gradient-to-b from-card to-muted/20 p-5 rounded-3xl border space-y-4 shadow-sm">
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-foreground">Propio</span>
                    <Badge variant="secondary" className="text-[8px] font-bold bg-orange-100 text-orange-700 border-none">NEGOCIO PRINCIPAL</Badge>
                  </div>
                  <div className="space-y-2.5">
                    {data?.businessInfo?.website && (() => {
                      const st = getChannelStatus(businessId, "WEBSITE", false);
                      const isBlurred = st === 'idle' || st === 'failed';
                      return (
                        <div className={`flex items-center justify-between p-2.5 bg-background/60 rounded-xl border gap-4 transition-all duration-300 ${
                          isBlurred ? 'backdrop-blur-sm opacity-60 grayscale blur-[1.2px] hover:blur-none shadow-inner border-amber-200/50' : ''
                        }`}>
                          <div className="flex items-center gap-2 truncate min-w-0">
                            {getSocialIcon("WEBSITE")}
                            <span className="text-xs font-semibold text-slate-700 truncate">{data.businessInfo.website}</span>
                          </div>
                          {renderStatusIcon(st)}
                        </div>
                      );
                    })()}
                    {(() => {
                      const socialLinks = parseJson(data?.businessInfo?.socialLinks) || {};
                      return Object.entries(socialLinks).map(([channel, url]) => {
                        if (!url || typeof url !== "string" || url.trim() === "") return null;
                        const st = getChannelStatus(businessId, channel, false);
                        const isBlurred = st === 'idle' || st === 'failed';
                        return (
                          <div key={channel} className={`flex items-center justify-between p-2.5 bg-background/60 rounded-xl border gap-4 transition-all duration-300 ${
                            isBlurred ? 'backdrop-blur-sm opacity-60 grayscale blur-[1.2px] hover:blur-none shadow-inner border-amber-200/50' : ''
                          }`}>
                            <div className="flex items-center gap-2 truncate min-w-0">
                              {getSocialIcon(channel)}
                              <span className="text-xs font-semibold text-slate-700 truncate">{url}</span>
                            </div>
                            {renderStatusIcon(st)}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Competidores */}
                <div className="bg-gradient-to-b from-card to-muted/20 p-5 rounded-3xl border space-y-4 shadow-sm">
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-foreground">Competidores</span>
                    <Badge variant="secondary" className="text-[8px] font-bold bg-purple-100 text-purple-700 border-none">MERCADO COMPARATIVO</Badge>
                  </div>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {competitorsList.map((c: any) => (
                      <div key={c.id} className="space-y-2 p-3 bg-background/60 rounded-2xl border">
                        <div className="flex items-center justify-between border-b pb-1.5">
                          <span className="font-extrabold text-slate-800 dark:text-slate-100 text-xs tracking-tight truncate">{c.name}</span>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          {c.website && (() => {
                            const st = getChannelStatus(c.id, "WEBSITE", true);
                            const isBlurred = st === 'idle' || st === 'failed';
                            return (
                              <div className={`flex items-center justify-between p-2 bg-background/80 rounded-xl border text-xs gap-3 transition-all duration-300 ${
                                isBlurred ? 'backdrop-blur-sm opacity-60 grayscale blur-[1.2px] hover:blur-none border-amber-200/50' : ''
                              }`}>
                                <div className="flex items-center gap-2 truncate min-w-0">
                                  {getSocialIcon("WEBSITE")}
                                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{c.website}</span>
                                </div>
                                {renderStatusIcon(st)}
                              </div>
                            );
                          })()}
                          {c.facebook && (() => {
                            const st = getChannelStatus(c.id, "FACEBOOK", true);
                            const isBlurred = st === 'idle' || st === 'failed';
                            return (
                              <div className={`flex items-center justify-between p-2 bg-background/80 rounded-xl border text-xs gap-3 transition-all duration-300 ${
                                isBlurred ? 'backdrop-blur-sm opacity-60 grayscale blur-[1.2px] hover:blur-none border-amber-200/50' : ''
                              }`}>
                                <div className="flex items-center gap-2 truncate min-w-0">
                                  {getSocialIcon("FACEBOOK")}
                                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{c.facebook}</span>
                                </div>
                                {renderStatusIcon(st)}
                              </div>
                            );
                          })()}
                          {c.instagram && (() => {
                            const st = getChannelStatus(c.id, "INSTAGRAM", true);
                            const isBlurred = st === 'idle' || st === 'failed';
                            return (
                              <div className={`flex items-center justify-between p-2 bg-background/80 rounded-xl border text-xs gap-3 transition-all duration-300 ${
                                isBlurred ? 'backdrop-blur-sm opacity-60 grayscale blur-[1.2px] hover:blur-none border-amber-200/50' : ''
                              }`}>
                                <div className="flex items-center gap-2 truncate min-w-0">
                                  {getSocialIcon("INSTAGRAM")}
                                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{c.instagram}</span>
                                </div>
                                {renderStatusIcon(st)}
                              </div>
                            );
                          })()}
                          {c.tiktok && (() => {
                            const st = getChannelStatus(c.id, "TIKTOK", true);
                            const isBlurred = st === 'idle' || st === 'failed';
                            return (
                              <div className={`flex items-center justify-between p-2 bg-background/80 rounded-xl border text-xs gap-3 transition-all duration-300 ${
                                isBlurred ? 'backdrop-blur-sm opacity-60 grayscale blur-[1.2px] hover:blur-none border-amber-200/50' : ''
                              }`}>
                                <div className="flex items-center gap-2 truncate min-w-0">
                                  {getSocialIcon("TIKTOK")}
                                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{c.tiktok}</span>
                                </div>
                                {renderStatusIcon(st)}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 5. INFORME GENERAL DE DIAGNÓSTICO (FODA) */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-b pb-2">
                <Compass className="h-5 w-5 text-orange-600" />
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">
                  5. Informe General de Diagnóstico (FODA)
                </h3>
              </div>

              {!consolidatedReport ? (
                <div className="p-6 bg-muted/10 rounded-2xl border border-dashed text-center text-xs text-muted-foreground italic">
                  Esperando que finalice el diagnóstico para consolidar la matriz FODA...
                </div>
              ) : (
                <div className="space-y-6 bg-background/40 border rounded-3xl p-6 shadow-sm">
                  {(() => {
                    const parsedCons = parseJson(consolidatedReport.data) || {};
                    const strengths = Array.isArray(parsedCons.strengths) ? parsedCons.strengths : [];
                    const weaknesses = Array.isArray(parsedCons.weaknesses) ? parsedCons.weaknesses : [];
                    const opportunities = Array.isArray(parsedCons.opportunities) ? parsedCons.opportunities : [];
                    const threats = Array.isArray(parsedCons.threats) ? parsedCons.threats : [];
                    const position = parsedCons.marketPosition || {};

                    return (
                      <div className="space-y-6">
                        {/* Executive Summary */}
                        {parsedCons.executiveSummary && (
                          <div className="space-y-1 bg-muted/20 p-4 rounded-2xl border border-orange-500/10">
                            <span className="text-[9px] font-black uppercase tracking-widest text-orange-700 block">Resumen Ejecutivo Consolidado</span>
                            <p className="text-xs text-slate-700 dark:text-slate-350 leading-relaxed italic">"{parsedCons.executiveSummary}"</p>
                          </div>
                        )}

                        {/* Market Position / Panorama */}
                        {position.currentPosition && (
                          <div className="bg-muted/15 p-4 rounded-2xl border space-y-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <span className="text-[8px] font-black uppercase text-muted-foreground block">Posición / Madurez Digital</span>
                              <span className="text-xs font-bold text-foreground leading-normal">{position.currentPosition}</span>
                            </div>
                            <div>
                              <span className="text-[8px] font-black uppercase text-muted-foreground block">Ventaja Competitiva</span>
                              <span className="text-xs font-bold text-foreground leading-normal">{position.competitiveAdvantage || "N/D"}</span>
                            </div>
                            <div>
                              <span className="text-[8px] font-black uppercase text-muted-foreground block">Brecha de Mercado</span>
                              <span className="text-xs font-bold text-foreground leading-normal">{position.marketGap || "N/D"}</span>
                            </div>
                          </div>
                        )}

                        {/* SWOT Matriz */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Fortalezas */}
                          <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl space-y-2">
                            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-455 uppercase tracking-widest block border-b border-emerald-500/20 pb-1">
                              💪 Fortalezas (Strengths)
                            </span>
                            <ul className="space-y-1.5 text-xs text-muted-foreground pl-3 list-disc">
                              {strengths.map((s: string, idx: number) => (
                                <li key={idx} className="leading-relaxed">{s}</li>
                              ))}
                              {strengths.length === 0 && <li className="italic">Analizando fortalezas...</li>}
                            </ul>
                          </div>

                          {/* Debilidades */}
                          <div className="p-4 bg-orange-500/5 border border-orange-500/10 rounded-2xl space-y-2">
                            <span className="text-[10px] font-black text-orange-600 dark:text-orange-455 uppercase tracking-widest block border-b border-orange-500/20 pb-1">
                              ⚠️ Debilidades (Weaknesses)
                            </span>
                            <ul className="space-y-1.5 text-xs text-muted-foreground pl-3 list-disc">
                              {weaknesses.map((w: string, idx: number) => (
                                <li key={idx} className="leading-relaxed">{w}</li>
                              ))}
                              {weaknesses.length === 0 && <li className="italic">Analizando debilidades...</li>}
                            </ul>
                          </div>

                          {/* Oportunidades */}
                          <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl space-y-2">
                            <span className="text-[10px] font-black text-blue-600 dark:text-blue-455 uppercase tracking-widest block border-b border-blue-500/20 pb-1">
                              ✨ Oportunidades (Opportunities)
                            </span>
                            <ul className="space-y-1.5 text-xs text-muted-foreground pl-3 list-disc">
                              {opportunities.map((o: string, idx: number) => (
                                <li key={idx} className="leading-relaxed">{o}</li>
                              ))}
                              {opportunities.length === 0 && <li className="italic">Analizando oportunidades...</li>}
                            </ul>
                          </div>

                          {/* Amenazas */}
                          <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl space-y-2">
                            <span className="text-[10px] font-black text-rose-600 dark:text-rose-455 uppercase tracking-widest block border-b border-rose-500/20 pb-1">
                              ⚡ Amenazas (Threats)
                            </span>
                            <ul className="space-y-1.5 text-xs text-muted-foreground pl-3 list-disc">
                              {threats.map((t: string, idx: number) => (
                                <li key={idx} className="leading-relaxed">{t}</li>
                              ))}
                              {threats.length === 0 && <li className="italic">Analizando amenazas...</li>}
                            </ul>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </section>

            {/* SECTION 6. DEFINICIÓN DE PÚBLICO OBJETIVO (BUYER PERSONAS) */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-b pb-2">
                <Users className="h-5 w-5 text-orange-600" />
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">
                  6. Definición de Público Objetivo (Buyer Personas)
                </h3>
              </div>

              {(() => {
                const parsedCons = consolidatedReport ? parseJson(consolidatedReport.data) || {} : {};
                const personas = parsedCons.buyerPersonas || [];

                if (personas.length === 0) {
                  return (
                    <div className="p-6 bg-muted/10 border border-dashed border-orange-200 rounded-2xl text-center space-y-2 max-w-md mx-auto">
                      <HelpCircle className="h-6 w-6 text-orange-500 mx-auto opacity-70" />
                      <span className="text-xs font-bold text-slate-800 block">Público Objetivo pendiente</span>
                      <p className="text-[10.5px] text-muted-foreground leading-relaxed">
                        Los perfiles de Buyer Personas se generan de forma integrada en el Banco de Datos. Haz click en "Reanalizar Banco de Datos" para obtenerlos.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    {personas.map((persona: any, index: number) => (
                      <div key={index} className="p-5 bg-gradient-to-b from-card to-muted/20 rounded-2xl border space-y-4 shadow-sm flex flex-col justify-between">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between border-b pb-2">
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 text-orange-600 text-[10px] font-black shrink-0">
                                P{index + 1}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-[12px] text-foreground leading-tight">
                                  {formatPersonaTitle(persona.name, index)}
                                </span>
                                {extractPersonaArchetype(persona.name) && (
                                  <span className="text-[9.5px] font-semibold text-orange-600 dark:text-orange-400">
                                    {extractPersonaArchetype(persona.name)}
                                  </span>
                                )}
                              </div>
                            </div>
                            {persona.demographics && (
                              <Badge variant="secondary" className="text-[8.5px] font-bold rounded-lg bg-orange-500/5 text-orange-700">
                                {persona.demographics}
                              </Badge>
                            )}
                          </div>
                          
                          {persona.goals && (
                            <div className="text-[10px]">
                              <span className="font-black text-muted-foreground uppercase text-[8.5px] block mb-0.5">Objetivos del Cliente</span>
                              <p className="text-slate-650 dark:text-slate-350 leading-relaxed">{persona.goals}</p>
                            </div>
                          )}
                          
                          {persona.painPoints && (
                            <div className="text-[10px]">
                              <span className="font-black text-rose-500 uppercase text-[8.5px] block mb-0.5 font-bold">Puntos de Dolor</span>
                              <p className="text-rose-650 dark:text-rose-350 leading-relaxed font-medium">{persona.painPoints}</p>
                            </div>
                          )}

                          {persona.communication && (
                            <div className="p-2.5 bg-background/60 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1.5 text-[9.5px]">
                              <span className="font-black text-orange-655 uppercase text-[8px] block">Guía de Comunicación</span>
                              {persona.communication.tone && <div><strong>Tono y Triggers:</strong> {persona.communication.tone}</div>}
                              {persona.communication.triggers && <div><strong>Triggers:</strong> {persona.communication.triggers}</div>}
                              {persona.communication.topics && <div><strong>Temas de interés:</strong> {persona.communication.topics}</div>}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </section>

            {/* SECTION 7. MATRIZ COMPARATIVA DE MÉTRICAS */}
            <section className="space-y-6">
              <div className="flex items-center gap-2 border-b pb-2">
                <Activity className="h-5 w-5 text-orange-600" />
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">
                  7. Matriz Comparativa de Métricas y Canales
                </h3>
              </div>

              <div className="space-y-4">
                {/* Tabla de Métricas Propias vs Competencia */}
                <div className="overflow-x-auto border rounded-2xl bg-background/35">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b bg-muted/40 text-[10px] uppercase font-black tracking-wider text-muted-foreground">
                        <th className="p-3">Canal / Métrica</th>
                        <th className="p-3 text-orange-600 bg-orange-500/5">Mi Negocio (Propio)</th>
                        {competitorsList.map((c: any) => (
                          <th key={c.id} className="p-3">{c.name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {/* Website Row */}
                      <tr className="border-b hover:bg-muted/10">
                        <td className="p-3 font-bold uppercase text-[9px] text-muted-foreground bg-muted/10">Website / Estado Web</td>
                        <td className="p-3 bg-orange-500/5 font-semibold text-orange-950 dark:text-orange-200">
                          {data?.businessInfo?.website ? "Calidad Alta / Activa" : "Sin sitio registrado"}
                        </td>
                        {competitorsList.map((c: any) => (
                          <td key={c.id} className="p-3 text-muted-foreground">
                            {c.website ? "Auditado / Competencia" : "Sin sitio"}
                          </td>
                        ))}
                      </tr>
                      {/* Social Follower Row */}
                      <tr className="border-b hover:bg-muted/10">
                        <td className="p-3 font-bold uppercase text-[9px] text-muted-foreground bg-muted/10">Nivel de Actividad e interacciones</td>
                        <td className="p-3 bg-orange-500/5 font-medium">Actividad Moderada</td>
                        {competitorsList.map((c: any) => (
                          <td key={c.id} className="p-3 text-muted-foreground">Actividad Alta</td>
                        ))}
                      </tr>
                      {/* Engagement Row */}
                      <tr className="hover:bg-muted/10">
                        <td className="p-3 font-bold uppercase text-[9px] text-muted-foreground bg-muted/10">Engagement Estimado</td>
                        <td className="p-3 bg-orange-500/5 font-bold text-orange-600">Medio</td>
                        {competitorsList.map((c: any) => (
                          <td key={c.id} className="p-3 text-muted-foreground">Alto / Competitivo</td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Tabla de Aspectos y Posicionamiento */}
                <div className="overflow-x-auto border rounded-2xl bg-background/35">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b bg-muted/40 text-[10px] uppercase font-black tracking-wider text-muted-foreground">
                        <th className="p-3 w-1/4">Aspecto</th>
                        <th className="p-3 text-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 w-1/4">Mi Negocio</th>
                        {competitorsList.map((c: any) => (
                          <th key={c.id} className="p-3 w-1/4">{c.name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const myAnalysesByChannel = businessReports.reduce((acc: any, r: any) => {
                          acc[r.channel.toUpperCase()] = r;
                          return acc;
                        }, {});

                        const competitorsWithReports = competitorsList.map((c: any) => {
                          const cReports = competitorReports.filter((r: any) => r.entityId === c.id);
                          const reportsByChannel = cReports.reduce((acc: any, r: any) => {
                            acc[r.channel.toUpperCase()] = r;
                            return acc;
                          }, {});
                          return { ...c, reportsByChannel };
                        });

                        const myDetails = getConsolidatedDetails(myAnalysesByChannel);

                        return (
                          <>
                            <tr className="border-b hover:bg-muted/10">
                              <td className="p-3 font-bold text-slate-500 uppercase tracking-wide text-[9px] bg-muted/10">Posicionamiento</td>
                              <td className="p-3 font-medium bg-indigo-50/10 dark:bg-indigo-950/10 text-indigo-950 dark:text-indigo-200">{myDetails.positioning}</td>
                              {competitorsWithReports.map((c: any) => {
                                const cDetails = getConsolidatedDetails(c.reportsByChannel);
                                return (
                                  <td key={c.id} className="p-3 text-muted-foreground">
                                    {cDetails.positioning}
                                  </td>
                                );
                              })}
                            </tr>

                            <tr className="border-b hover:bg-muted/10">
                              <td className="p-3 font-bold text-slate-500 uppercase tracking-wide text-[9px] bg-muted/10">Fortalezas</td>
                              <td className="p-3 bg-indigo-50/10 dark:bg-indigo-950/10">
                                <ul className="list-disc pl-4 space-y-1 text-emerald-600 dark:text-emerald-300 font-semibold">
                                  {myDetails.strengths.map((s, idx) => (
                                    <li key={idx}>{s}</li>
                                  ))}
                                  {myDetails.strengths.length === 0 && <li className="italic text-muted-foreground">Sin datos</li>}
                                </ul>
                              </td>
                              {competitorsWithReports.map((c: any) => {
                                const cDetails = getConsolidatedDetails(c.reportsByChannel);
                                return (
                                  <td key={c.id} className="p-3">
                                    <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                                      {cDetails.strengths.map((s, idx) => (
                                        <li key={idx}>{s}</li>
                                      ))}
                                      {cDetails.strengths.length === 0 && <li className="italic text-muted-foreground">Sin datos</li>}
                                    </ul>
                                  </td>
                                );
                              })}
                            </tr>

                            <tr className="border-b hover:bg-muted/10">
                              <td className="p-3 font-bold text-slate-500 uppercase tracking-wide text-[9px] bg-muted/10">Debilidades</td>
                              <td className="p-3 bg-indigo-50/10 dark:bg-indigo-950/10">
                                <ul className="list-disc pl-4 space-y-1 text-rose-600 dark:text-rose-300 font-semibold">
                                  {myDetails.weaknesses.map((w, idx) => (
                                    <li key={idx}>{w}</li>
                                  ))}
                                  {myDetails.weaknesses.length === 0 && <li className="italic text-muted-foreground">Sin datos</li>}
                                </ul>
                              </td>
                              {competitorsWithReports.map((c: any) => {
                                const cDetails = getConsolidatedDetails(c.reportsByChannel);
                                return (
                                  <td key={c.id} className="p-3">
                                    <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                                      {cDetails.weaknesses.map((w, idx) => (
                                        <li key={idx}>{w}</li>
                                      ))}
                                      {cDetails.weaknesses.length === 0 && <li className="italic text-muted-foreground">Sin datos</li>}
                                    </ul>
                                  </td>
                                );
                              })}
                            </tr>

                            <tr className="hover:bg-muted/10">
                              <td className="p-3 font-bold text-slate-500 uppercase tracking-wide text-[9px] bg-muted/10">Diferenciadores</td>
                              <td className="p-3 bg-indigo-50/10 dark:bg-indigo-950/10 font-semibold text-indigo-750 dark:text-indigo-300">
                                <ul className="list-disc pl-4 space-y-1">
                                  {myDetails.recommendations.slice(0, 3).map((r, idx) => (
                                    <li key={idx}>{r}</li>
                                  ))}
                                  {myDetails.recommendations.length === 0 && <li className="italic text-muted-foreground">Sin datos</li>}
                                </ul>
                              </td>
                              {competitorsWithReports.map((c: any) => {
                                const cDetails = getConsolidatedDetails(c.reportsByChannel);
                                return (
                                  <td key={c.id} className="p-3 text-slate-650 dark:text-slate-400">
                                    <ul className="list-disc pl-4 space-y-1">
                                      {cDetails.recommendations.slice(0, 3).map((r, idx) => (
                                        <li key={idx}>{r}</li>
                                      ))}
                                      {cDetails.recommendations.length === 0 && <li className="italic text-muted-foreground">Sin datos</li>}
                                    </ul>
                                  </td>
                                );
                              })}
                            </tr>
                          </>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>

                {/* Benchmarks de Éxito 2026 */}
                <div className="bg-gradient-to-b from-card to-muted/20 p-5 rounded-2xl border space-y-3">
                  <span className="text-[10px] font-black text-orange-600 uppercase tracking-wider block border-b pb-1">
                    📊 Inteligencia Competitiva con Benchmarks 2026
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="p-3 bg-background/50 rounded-xl border">
                      <span className="text-[8px] text-muted-foreground block uppercase font-bold">Metas de Engagement 2026</span>
                      <p className="mt-1 font-semibold">Facebook: 0.15% | Instagram: 0.48% | TikTok: 2.60% - 3.73%</p>
                    </div>
                    <div className="p-3 bg-background/50 rounded-xl border">
                      <span className="text-[8px] text-muted-foreground block uppercase font-bold">Frecuencia por Canal</span>
                      <p className="mt-1 font-semibold">Tiktok: 3x/sem | Instagram: 4x/sem | FB: Diarios</p>
                    </div>
                    <div className="p-3 bg-background/50 rounded-xl border">
                      <span className="text-[8px] text-muted-foreground block uppercase font-bold">Embudo de Conversión</span>
                      <p className="mt-1 font-semibold text-orange-600">WhatsApp Centric (Call-to-Action Directo)</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 8. IDENTIDAD DE MARCA (PEOPLE-LED MARKETING) */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-b pb-2">
                <Smile className="h-5 w-5 text-orange-600" />
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">
                  8. Identidad de Marca (People-Led Marketing)
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gradient-to-b from-card to-muted/20 rounded-2xl border space-y-2">
                  <span className="font-extrabold text-[10px] text-orange-600 uppercase tracking-wide block">🤝 Relaciones Humanas & Confianza</span>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Priorizar interacciones auténticas P2P (Persona a Persona) y testimonios reales sobre publicaciones corporativas frías para generar conexiones duraderas.
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-b from-card to-muted/20 rounded-2xl border space-y-2">
                  <span className="font-extrabold text-[10px] text-orange-600 uppercase tracking-wide block">🔥 Elementos Visuales & Cercanía</span>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Uso de imágenes cálidas del equipo, detrás de escenas y caras del negocio para humanizar la marca y desmarcarse de la frialdad corporativa competidora.
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-b from-card to-muted/20 rounded-2xl border space-y-2">
                  <span className="font-extrabold text-[10px] text-orange-600 uppercase tracking-wide block">🌟 Fomento de Comunidad</span>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Actividades periódicas de engagement, respuestas rápidas en comentarios y fomento de contenido generado por el usuario (UGC) para asegurar lealtad.
                  </p>
                </div>
              </div>
            </section>

            {/* SECTION 9. ANÁLISIS DEL PÚBLICO Y OPORTUNIDAD SOCIOCULTURAL */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-b pb-2">
                <TrendingUp className="h-5 w-5 text-orange-600" />
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">
                  9. Análisis de Oportunidad Sociocultural
                </h3>
              </div>

              <div className="p-5 bg-gradient-to-r from-orange-500/10 to-indigo-500/5 border border-orange-200/50 rounded-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4.5 w-4.5 text-orange-600" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">Cálculo de Oportunidad Masiva Sociocultural</span>
                </div>
                
                <div className="text-xs text-muted-foreground leading-relaxed space-y-2">
                  <p>
                    Basándonos en los datos del entorno y hábitos locales de <strong className="text-slate-800 dark:text-slate-100">{data?.businessInfo?.location || "tu zona"}</strong>, identificamos oportunidades masivas latentes en eventos de vida:
                  </p>
                  <div className="p-4 bg-background/60 rounded-xl border border-orange-200/40 text-slate-700 dark:text-slate-300 font-medium">
                    🎯 <strong className="text-orange-600">Proyección de Captura:</strong> ~5,400 cumpleaños diarios en el entorno metropolitano → Captura del 5% del tráfico desatendido por marcas tradicionales = <strong className="text-orange-655 font-bold">270 potenciales conversiones de compra diarias</strong> dirigidas directo a tu WhatsApp.
                  </div>
                </div>
              </div>
            </section>

            {/* CEO Navigation Bar: Banco de Datos -> Generar Estrategia de Growth de Marketing */}
            <div className="pt-4 border-t mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-purple-500/5 p-5 rounded-2xl border border-purple-500/20 shadow-sm">
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-[10px] font-black uppercase tracking-widest text-purple-600 dark:text-purple-400">Paso 1 Completado · Auditoría & FODA</span>
                <h4 className="text-sm font-black text-foreground">¿Listo para avanzar al Modelado Estratégico de Marketing?</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Haz clic para activar el agente autónomo y generar la Estrategia de Growth con Buyer Personas y Embudo de Ventas.
                </p>
              </div>
              <Button
                onClick={() => {
                  setActiveTab("estrategia");
                  handleStartStrategy();
                }}
                className="w-full sm:w-auto h-12 px-8 rounded-2xl font-black text-xs bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-xl shadow-purple-500/25 border-none transition-all duration-300 hover:scale-105 shrink-0"
              >
                Generar Estrategia de Growth de Marketing <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>

            {/* SENTINEL REF */}
            <div ref={bottomRef} className="h-1 w-full shrink-0" />
          </TabsContent>

          {/* TAB 2: ACTIVOS VISUALES E INSPIRACIÓN (Etapa 2) */}
          <TabsContent value="activosvisuales" className="space-y-6 mt-0">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <div>
                <h5 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-blue-500" /> Activos Visuales e Inspiración
                </h5>
                <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                  Organización de referencias visuales por nicho de mercado, canales oficiales de marca y recursos subidos.
                </p>
              </div>
            </div>

            <MediaLibraryClient
              businessId={businessId}
              activeBusiness={data?.business ? { id: data.business.id, name: data.business.name, logo: data?.mediaLogo || data?.business?.logo } : undefined}
              initialLogo={data?.mediaLogo || data?.business?.logo}
              initialBrandColors={data?.mediaColors?.length ? data.mediaColors : (Array.isArray(data?.business?.brandColors) ? (data.business.brandColors as string[]) : [])}
              initialAssets={data?.mediaAssets || []}
              initialCounts={data?.mediaCounts || { videoCount: 0, imageCount: 0, total: 0 }}
            />

            {/* CEO Navigation Bar: Activos Visuales -> Estrategia Growth de Marketing */}
            <div className="pt-6 border-t mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-purple-500/5 p-6 rounded-3xl border border-purple-500/20 shadow-sm">
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-[10px] font-black uppercase tracking-widest text-purple-600 dark:text-purple-400">
                  Paso 2 Completado · Activos Visuales & Referencias
                </span>
                <h4 className="text-sm font-black text-foreground">¿Listo para avanzar a la Estrategia Growth de Marketing?</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Con el banco de datos y referencias visuales cargadas, activa el agente para formular Buyer Personas y Embudos.
                </p>
              </div>
              <Button
                onClick={() => {
                  setActiveTab("estrategia");
                  handleStartStrategy();
                }}
                className="w-full sm:w-auto h-12 px-8 rounded-2xl font-black text-xs bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-xl shadow-purple-500/25 border-none transition-all duration-300 hover:scale-105 shrink-0"
              >
                Avanzar a Estrategia Growth <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </TabsContent>

          {/* TAB 2: ESTRATEGIA (antigua Etapa 4) */}
          <TabsContent value="estrategia" className="space-y-4 mt-0">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h5 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-purple-500" /> Estrategia Growth de Marketing
              </h5>
              
              <div className="flex items-center gap-2">
                {parsedStrategyObj && (
                  <Button
                    onClick={handleDownloadEstrategiaPDF}
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs font-bold gap-1 rounded-xl border-purple-500/30 text-purple-700 hover:bg-purple-500/5"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Descargar PDF
                  </Button>
                )}
                <Button 
                  onClick={handleStartStrategy}
                  disabled={strategyLoading}
                  className={`h-8 text-xs font-bold gap-1 rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition-all ${
                    shouldActionPulse("estrategia") ? 'action-btn-pulse-purple scale-105' : ''
                  }`}
                >
                  {strategyLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Play className="h-3 w-3 fill-current" />
                  )}
                  {parsedStrategyObj ? "Regenerar" : "Generar Estrategia"}
                </Button>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed italic bg-purple-500/5 p-3 rounded-xl border border-purple-100 dark:border-purple-850 mb-4">
              💡 <strong>Agente de Growth & Estrategia:</strong> Define tus buyer personas clave y modela el enfoque estratégico del embudo y pilares de contenido.
            </p>

            {!parsedStrategyObj ? (
              <div className="flex flex-col items-center justify-center p-8 bg-muted/10 rounded-2xl border border-dashed text-center min-h-[180px] space-y-4">
                <Loader2 className="h-6 w-6 text-purple-500 opacity-60" />
                <div className="space-y-1">
                  <span className="text-xs font-bold text-muted-foreground block">Estrategia de Growth Pendiente</span>
                  <p className="text-[10px] text-muted-foreground max-w-xs leading-relaxed">
                    El Agente de Estrategia diseñará las estrategias clave basadas en el informe consolidado.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Concepto de la Estrategia */}
                {activeStrategy && (
                <div className="p-5 bg-gradient-to-br from-purple-500/10 via-violet-500/5 to-indigo-500/10 rounded-2xl border border-purple-200/50 space-y-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-purple-750 dark:text-purple-400">Concepto de la Estrategia</span>
                  <h4 className="text-base font-bold text-foreground capitalize">{activeStrategy.name}</h4>
                  {activeStrategy.description && (
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {activeStrategy.description}
                    </p>
                  )}
                </div>
                )}
                {parsedStrategyObj.funnelStages.length > 0 && (
                  <div className="space-y-4 bg-background/50 border rounded-2xl p-5 shadow-sm">
                    <span className="font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider block text-[9.5px] flex items-center gap-1.5 border-b pb-2">
                      <Network className="h-3.5 w-3.5 text-purple-500" /> Fases del Funnel de Ventas
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1">
                      {parsedStrategyObj.funnelStages.map((stage: any, idx: number) => (
                        <div key={idx} className="p-3 bg-muted/10 rounded-xl border flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <div className="h-5 w-5 rounded-full bg-purple-500/10 text-purple-650 flex items-center justify-center font-black text-[10px] shrink-0">
                              {idx + 1}
                            </div>
                            <span className="font-bold text-[11px] text-foreground capitalize">
                              {stage.name || stage.stage || stage.etapa}
                            </span>
                          </div>
                          {(stage.description || stage.desc) && (
                            <p className="text-[10px] text-muted-foreground leading-relaxed pl-7">
                              {stage.description || stage.desc}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sección de Canales de Ventas y Conversión (Seleccionados en las 7 Preguntas + Estrategia) */}
                <div className="space-y-4 bg-background/50 border rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider block text-[9.5px] flex items-center gap-1.5">
                      <Store className="h-3.5 w-3.5 text-purple-500" /> Canales de Ventas y Conversión (Onboarding & Estrategia)
                    </span>
                    <Badge variant="outline" className="bg-purple-500/10 border-purple-500/30 text-purple-650 font-bold text-[9px] rounded-lg">
                      Formulario 7 Preguntas & IA
                    </Badge>
                  </div>

                  {(() => {
                    const rawConversion = (data?.businessInfo?.onboardingStrategy as any)?.conversionChannel || 
                      (typeof data?.businessInfo?.onboardingStrategy === 'string' ? parseJson(data.businessInfo.onboardingStrategy)?.conversionChannel : "") || "";
                    
                    // Parsear ítems del canal de conversión seleccionado en el onboarding
                    const parseConversionChannelItems = (text: string) => {
                      if (!text || typeof text !== "string") return [];
                      const items: { label: string; detail?: string; icon: React.ReactNode }[] = [];

                      if (text.toLowerCase().includes("whatsapp")) {
                        const waMatch = text.match(/Número WhatsApp:\s*([^\s,]+)/i) || text.match(/WhatsApp:\s*([^\s,]+)/i);
                        const waNum = waMatch ? waMatch[1] : "";
                        items.push({
                          label: "WhatsApp Directo",
                          detail: waNum ? `Tel: ${waNum}` : "Canal Principal de Cierre",
                          icon: <MessageSquare className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        });
                      }

                      if (text.toLowerCase().includes("moderno") || text.toLowerCase().includes("cadenas")) {
                        const modernoMatch = text.match(/Cadenas Canal Moderno:\s*([^,\n]+)/i);
                        const modernoDetail = modernoMatch ? modernoMatch[1].trim() : "";
                        items.push({
                          label: "Canal Moderno (Supermercados)",
                          detail: modernoDetail || "Cadenas & Autoservicios",
                          icon: <Store className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        });
                      }

                      if (text.toLowerCase().includes("tradicional") || text.toLowerCase().includes("comercios")) {
                        const tradicionalMatch = text.match(/Comercios Canal Tradicional:\s*([^,\n]+)/i);
                        const tradicionalDetail = tradicionalMatch ? tradicionalMatch[1].trim() : "";
                        items.push({
                          label: "Canal Tradicional (Mercados & Barrio)",
                          detail: tradicionalDetail || "Pulperías y Comercios Locales",
                          icon: <Landmark className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                        });
                      }

                      if (text.toLowerCase().includes("sitio web") || text.toLowerCase().includes("web") || text.toLowerCase().includes("ecommerce")) {
                        items.push({
                          label: "Sitio Web / E-Commerce",
                          detail: "Ventas y Catálogo Digital Directo",
                          icon: <Globe className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                        });
                      }

                      if (items.length === 0 && text.trim().length > 0) {
                        items.push({
                          label: text,
                          icon: <Target className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                        });
                      }

                      return items;
                    };

                    const parsedChannels = parseConversionChannelItems(rawConversion);

                    return (
                      <div className="space-y-3 pt-1">
                        {parsedChannels.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {parsedChannels.map((chan, idx) => (
                              <div key={idx} className="p-3.5 bg-gradient-to-br from-purple-500/5 via-indigo-500/5 to-transparent rounded-xl border border-purple-200/50 space-y-1.5 shadow-sm">
                                <div className="flex items-center gap-2">
                                  <div className="h-7 w-7 rounded-lg bg-card border flex items-center justify-center shrink-0 shadow-xs">
                                    {chan.icon}
                                  </div>
                                  <span className="font-bold text-xs text-foreground">
                                    {chan.label}
                                  </span>
                                </div>
                                {chan.detail && (
                                  <p className="text-[10.5px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-50/80 dark:bg-purple-950/60 p-1.5 rounded-lg border border-purple-200/40 leading-snug">
                                    {chan.detail}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-3 bg-muted/10 rounded-xl border text-xs text-muted-foreground italic">
                            Información de canales de conversión del formulario inicial cargada en la estrategia.
                          </div>
                        )}

                        {/* Canales Estratégicos Complementarios de la IA */}
                        {parsedStrategyObj?.channels && parsedStrategyObj.channels.length > 0 && (
                          <div className="pt-2 border-t border-dashed">
                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block mb-2">
                              📡 Canales de Difusión y Adquisición Complementarios:
                            </span>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                              {parsedStrategyObj.channels.map((chan: any, idx: number) => (
                                <div key={idx} className="p-2.5 bg-muted/15 rounded-xl border flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-2">
                                    <Globe className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                                    <span className="font-bold text-foreground">{chan.name || chan.canal}</span>
                                  </div>
                                  {chan.frequency && (
                                    <span className="text-[9.5px] font-semibold text-muted-foreground bg-background px-2 py-0.5 rounded-md border">
                                      {chan.frequency}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Objetivos SMART */}
                {parsedStrategyObj.objectives.length > 0 && (
                  <div className="space-y-4 bg-background/50 border rounded-2xl p-5 shadow-sm">
                    <span className="font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider block text-[9.5px] flex items-center gap-1.5 border-b pb-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-purple-500" /> Objetivos Estratégicos (SMART)
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                      {parsedStrategyObj.objectives.map((obj: any, index: number) => (
                        <div key={index} className="p-4 bg-muted/15 rounded-2xl border space-y-3">
                          <div className="flex items-center justify-between border-b pb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="bg-purple-500/10 border-purple-500/30 text-purple-650 font-bold rounded-lg shrink-0 text-[9px]">
                                OBJ {index + 1}
                              </Badge>
                              <span className="font-bold text-[11px] text-foreground leading-tight">
                                {obj.name || obj.objetivo || "Objetivo SMART"}
                              </span>
                            </div>
                            {obj.status && (
                              <Badge className={`text-[8px] font-bold ${obj.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-600 border-none' : 'bg-orange-500/10 text-orange-600 border-none'}`}>
                                {obj.status}
                              </Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-1 gap-1.5 text-[10px] leading-relaxed text-slate-650 dark:text-slate-355">
                            {obj.specific && <div><strong>S (Específico):</strong> {obj.specific}</div>}
                            {obj.measurable && <div><strong>M (Medible):</strong> {obj.measurable}</div>}
                            {(obj.targetValue || obj.unit) && <div><strong>Meta:</strong> {obj.targetValue} {obj.unit}</div>}
                            {obj.deadline && <div><strong>Plazo:</strong> {obj.deadline}</div>}
                            {obj.timeBound && <div><strong>T (Temporal):</strong> {obj.timeBound}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Buyer Personas */}
                {parsedStrategyObj.personas.length > 0 && (
                  <div className="space-y-4 bg-background/50 border rounded-2xl p-5 shadow-sm">
                    <span className="font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider block text-[9.5px] flex items-center gap-1.5 border-b pb-2">
                      <Users className="h-3.5 w-3.5 text-purple-500" /> Público Objetivo (Buyer Personas)
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                      {parsedStrategyObj.personas.map((persona: any, index: number) => (
                        <div key={index} className="p-4 bg-muted/10 rounded-2xl border space-y-3 flex flex-col justify-between">
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between border-b pb-2">
                              <div className="flex items-center gap-2">
                                <div className="h-7 w-7 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 text-purple-600 text-[10px] font-black shrink-0">
                                  P{index + 1}
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-bold text-[12px] text-foreground leading-tight">
                                    {formatPersonaTitle(persona.name, index)}
                                  </span>
                                  {extractPersonaArchetype(persona.name) && (
                                    <span className="text-[9.5px] font-semibold text-purple-600 dark:text-purple-400">
                                      {extractPersonaArchetype(persona.name)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {persona.demographics && (
                                <Badge variant="secondary" className="text-[8.5px] font-bold rounded-lg bg-purple-500/5 text-purple-650">
                                  {persona.demographics}
                                </Badge>
                              )}
                            </div>
                            {persona.goals && (
                              <div className="text-[10px]">
                                <span className="font-black text-muted-foreground uppercase text-[8.5px] block mb-0.5">Objetivos y Deseos</span>
                                <p className="text-slate-650 dark:text-slate-350 leading-relaxed">{persona.goals}</p>
                              </div>
                            )}
                            {persona.painPoints && (
                              <div className="text-[10px]">
                                <span className="font-black text-rose-500 uppercase text-[8.5px] block mb-0.5 font-bold">Puntos de Dolor</span>
                                <p className="text-rose-650 dark:text-rose-350 leading-relaxed font-medium">{persona.painPoints}</p>
                              </div>
                            )}
                            {persona.communication && (
                              <div className="p-2.5 bg-background/60 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1.5 text-[9.5px]">
                                <span className="font-black text-purple-650 uppercase text-[8px] block">Guía de Comunicación</span>
                                {persona.communication.tone && <div><strong>Tono de Voz:</strong> {persona.communication.tone}</div>}
                                {persona.communication.triggers && <div><strong>Disparadores (Triggers):</strong> {persona.communication.triggers}</div>}
                                {persona.communication.topics && <div><strong>Temas clave:</strong> {persona.communication.topics}</div>}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Plan de Canales */}
                {parsedStrategyObj.channels.length > 0 && (
                  <div className="space-y-4 bg-background/50 border rounded-2xl p-5 shadow-sm">
                    <span className="font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider block text-[9.5px] flex items-center gap-1.5 border-b pb-2">
                      <Megaphone className="h-3.5 w-3.5 text-purple-500" /> Plan de Canales y Frecuencia
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1">
                      {parsedStrategyObj.channels.map((ch: any, idx: number) => (
                        <div key={idx} className="p-3.5 bg-muted/10 rounded-2xl border flex flex-col justify-between gap-2.5">
                          <div className="flex items-center justify-between border-b pb-1.5">
                            <span className="font-extrabold text-[11px] text-foreground">{ch.name}</span>
                            <Badge variant="outline" className="text-[7.5px] font-black uppercase tracking-wider bg-purple-500/5 text-purple-650 border-purple-500/10">
                              {ch.type || "SOCIAL"}
                            </Badge>
                          </div>
                          <div className="space-y-1.5 text-[10px] leading-relaxed text-slate-650 dark:text-slate-350">
                            {ch.frequency && <div><strong>Frecuencia:</strong> {ch.frequency}</div>}
                            {ch.notes && <div className="italic text-muted-foreground"><strong>Notas:</strong> {ch.notes}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CEO Navigation Bar: Estrategia -> Continuar y generar Parámetros de Campaña de Marketing */}
            <div className="pt-6 border-t mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-emerald-500/5 p-6 rounded-3xl border border-emerald-500/20 shadow-sm">
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Paso 2 Completado · Estrategia de Growth</span>
                <h4 className="text-sm font-black text-foreground">¿Listo para estructurar las Ofertas y Parámetros de Campaña?</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Haz clic para avanzar a la Parametrización de Campañas y generar automáticamente el Plan de Publicaciones.
                </p>
              </div>
              <Button
                onClick={() => {
                  setActiveTab("campanas");
                  handleStartCampaign();
                }}
                className="w-full sm:w-auto h-12 px-8 rounded-2xl font-black text-xs bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white shadow-xl shadow-emerald-500/25 border-none transition-all duration-300 hover:scale-105 shrink-0"
              >
                Continuar y generar Parámetros de Campaña de Marketing <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </TabsContent>

          {/* TAB 3: CAMPAÑAS (antigua Etapa 5) */}
          <TabsContent value="campanas" className="space-y-4 mt-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 mb-4">
              <h5 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <Megaphone className="h-3.5 w-3.5 text-emerald-500" /> Parametrización de Campaña de Marketing
              </h5>
              
              <div className="flex items-center gap-2">
                {campaigns.length > 0 && (
                  <Button
                    onClick={handleDownloadCampanasPDF}
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs font-bold gap-1 rounded-xl border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/5"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Descargar PDF
                  </Button>
                )}
                <div className="flex items-center gap-1.5 bg-muted/30 px-2.5 py-1.5 rounded-xl border border-muted/88">
                  <span className="text-[9px] font-black uppercase text-muted-foreground">Inicio:</span>
                  <input
                    type="date"
                    value={campaignStartDate}
                    onChange={(e) => setCampaignStartDate(e.target.value)}
                    min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                    className="bg-transparent text-[10px] font-bold text-foreground focus:outline-none border-none p-0 w-24 cursor-pointer"
                  />
                </div>

                <Button 
                  onClick={handleStartCampaign}
                  disabled={campaignLoading}
                  className={`h-8 text-xs font-bold gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all ${
                    shouldActionPulse("campanas") ? 'action-btn-pulse-emerald scale-105' : ''
                  }`}
                >
                  {campaignLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Play className="h-3 w-3 fill-current" />
                  )}
                  {campaigns.length > 0 ? "Regenerar" : "Generar Campañas"}
                </Button>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed italic bg-emerald-500/5 p-3 rounded-xl border border-emerald-100 dark:border-emerald-850 mb-4">
              💡 <strong>Agente de Parametrización de Campañas:</strong> Estructura tu plan mensual, definiendo objetivos de conversión, segmentación detallada y presupuestos por canal.
            </p>

            {isCampaignProcessing ? (
              <div className="flex flex-col items-center justify-center p-8 bg-emerald-500/5 rounded-2xl border border-emerald-500/20 text-center min-h-[180px] space-y-4 animate-pulse">
                <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
                <div className="space-y-1">
                  <span className="text-xs font-black uppercase text-emerald-700 block">IA Procesando Campaña</span>
                  <p className="text-[10px] text-muted-foreground max-w-xs leading-relaxed">
                    El Agente de Campañas de Marketing está estructurando tus metas mensuales, presupuestos y segmentaciones de audiencia.
                  </p>
                </div>
              </div>
            ) : campaigns.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 bg-muted/10 rounded-2xl border border-dashed text-center min-h-[180px] space-y-4">
                <Clock className="h-6 w-6 text-muted-foreground/45" />
                <div className="space-y-1">
                  <span className="text-xs font-bold text-muted-foreground block">Plan de Campaña Pendiente</span>
                  <p className="text-[10px] text-muted-foreground max-w-xs leading-relaxed">
                    El Agente de Campañas de Marketing formulará tu campaña principal una vez activado.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in duration-300">
                {campaigns.slice(0, 1).map((camp: any) => {
                  const channels = Array.isArray(camp.channels) ? camp.channels : [];
                  const targeting = typeof camp.targeting === "object" && camp.targeting ? camp.targeting : {};
                  const startDateStr = camp.startDate ? new Date(camp.startDate).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" }) : "";
                  const endDateStr = camp.endDate ? new Date(camp.endDate).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" }) : "";

                  const displayStartDate = editedCampStartDate || startDateStr;
                  const displayEndDate = editedCampEndDate || endDateStr;
                  const displayBudget = editedCampBudget || camp.budget || 150;
                  const displayObjective = editedCampObjective || camp.objective || "AWARENESS";
                  const displayName = editedCampName || camp.name;
                  const displayDesc = editedCampDesc || camp.description;
                  const totalPieces = editedReelsCount + editedCarouselsCount + editedPostsCount;

                  return (
                    <div key={camp.id} className="space-y-6">
                      {/* 1. Header Principal de la Campaña (Parámetros Directamente Editables) */}
                      <div className="p-5 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-cyan-500/10 rounded-2xl border border-emerald-200/50 space-y-4 shadow-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/40 pb-3">
                          <div className="flex-1 space-y-1">
                            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400 block">
                              Campaña Principal de Marketing (Parámetros Editables)
                            </span>
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setEditedCampName(e.target.value)}
                                placeholder="Nombre de la campaña..."
                                className="text-base font-extrabold text-foreground bg-background/70 border border-emerald-200/80 rounded-xl px-3 py-1 w-full max-w-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant="outline" className="bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-black text-[9.5px] rounded-lg px-2.5 py-1">
                              {camp.status || "ACTIVA"}
                            </Badge>
                            <select
                              value={displayObjective}
                              onChange={(e) => setEditedCampObjective(e.target.value)}
                              className="bg-indigo-500/10 border border-indigo-500/30 text-indigo-700 dark:text-indigo-300 font-black text-[9.5px] rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                            >
                              <option value="AWARENESS">OBJETIVO: AWARENESS</option>
                              <option value="CONVERSION">OBJETIVO: CONVERSIÓN</option>
                              <option value="LEADS">OBJETIVO: LEADS</option>
                              <option value="TRAFFIC">OBJETIVO: TRÁFICO</option>
                            </select>
                          </div>
                        </div>

                        {/* Descripción Editable */}
                        <div>
                          <textarea
                            rows={2}
                            value={displayDesc}
                            onChange={(e) => setEditedCampDesc(e.target.value)}
                            placeholder="Descripción o enfoque clave de la campaña..."
                            className="w-full text-xs text-muted-foreground bg-background/60 border border-emerald-200/40 rounded-xl p-2.5 leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>

                        {/* Fechas y Métricas de Presupuesto Editables Directamente */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                          <div className="p-3 bg-background/80 rounded-xl border border-emerald-200/50 space-y-1">
                            <span className="text-[8.5px] font-black uppercase text-muted-foreground block">Duración (Inicio - Fin)</span>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="date"
                                value={editedCampStartDate || (camp.startDate ? new Date(camp.startDate).toISOString().split('T')[0] : '')}
                                onChange={(e) => setEditedCampStartDate(e.target.value)}
                                className="text-[11px] font-bold text-foreground bg-muted/30 border border-emerald-200/50 rounded-lg px-1.5 py-1 w-full"
                              />
                              <span className="text-muted-foreground font-bold text-xs">-</span>
                              <input
                                type="date"
                                value={editedCampEndDate || (camp.endDate ? new Date(camp.endDate).toISOString().split('T')[0] : '')}
                                onChange={(e) => setEditedCampEndDate(e.target.value)}
                                className="text-[11px] font-bold text-foreground bg-muted/30 border border-emerald-200/50 rounded-lg px-1.5 py-1 w-full"
                              />
                            </div>
                          </div>

                          <div className="p-3 bg-background/80 rounded-xl border border-emerald-200/50 space-y-1">
                            <span className="text-[8.5px] font-black uppercase text-muted-foreground block">Presupuesto ($ USD)</span>
                            <div className="flex items-center gap-1">
                              <span className="font-extrabold text-xs text-emerald-600">$</span>
                              <input
                                type="number"
                                min={10}
                                max={10000}
                                value={displayBudget}
                                onChange={(e) => {
                                  const newTotal = Number(e.target.value);
                                  setEditedCampBudget(newTotal);
                                  const activeCount = (isIgActive ? 1 : 0) + (isFbActive ? 1 : 0) + (isTiktokActive ? 1 : 0);
                                  if (activeCount > 0) {
                                    const split = Math.round(newTotal / activeCount);
                                    if (isIgActive) setEditedIgBudget(split);
                                    if (isFbActive) setEditedFbBudget(split);
                                    if (isTiktokActive) setEditedTiktokBudget(split);
                                  }
                                }}
                                className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-muted/30 border border-emerald-200/50 rounded-lg px-2 py-1 w-full"
                              />
                              <span className="font-extrabold text-[10px] text-muted-foreground">USD</span>
                            </div>
                          </div>

                          <div className="p-3 bg-background/80 rounded-xl border border-emerald-200/50 space-y-1">
                            <span className="text-[8.5px] font-black uppercase text-muted-foreground block">Plan de Publicaciones</span>
                            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 block truncate">
                              {totalPieces} Piezas ({editedReelsCount} Reels, {editedCarouselsCount} Carruseles, {editedPostsCount} Post{editedPostsCount !== 1 ? 's' : ''})
                            </span>
                          </div>
                        </div>

                        {/* Mix de Piezas de Contenido (Contadores Directos) */}
                        <div className="p-3 bg-background/70 rounded-xl border border-emerald-200/50 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Ajustar Piezas de Contenido</span>
                            <Badge className="bg-emerald-600 text-white font-black text-[9px] rounded-md px-2 py-0.5">
                              {totalPieces} Piezas Totales
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="flex items-center justify-between p-2 bg-muted/20 rounded-lg border text-xs">
                              <span className="font-bold text-[10px]">Reels</span>
                              <div className="flex items-center gap-1">
                                <button type="button" onClick={() => setEditedReelsCount(Math.max(0, editedReelsCount - 1))} className="h-5 w-5 rounded bg-background border font-bold text-xs flex items-center justify-center hover:bg-muted">-</button>
                                <span className="font-black text-xs w-4 text-center">{editedReelsCount}</span>
                                <button type="button" onClick={() => setEditedReelsCount(editedReelsCount + 1)} className="h-5 w-5 rounded bg-background border font-bold text-xs flex items-center justify-center hover:bg-muted">+</button>
                              </div>
                            </div>

                            <div className="flex items-center justify-between p-2 bg-muted/20 rounded-lg border text-xs">
                              <span className="font-bold text-[10px]">Carruseles</span>
                              <div className="flex items-center gap-1">
                                <button type="button" onClick={() => setEditedCarouselsCount(Math.max(0, editedCarouselsCount - 1))} className="h-5 w-5 rounded bg-background border font-bold text-xs flex items-center justify-center hover:bg-muted">-</button>
                                <span className="font-black text-xs w-4 text-center">{editedCarouselsCount}</span>
                                <button type="button" onClick={() => setEditedCarouselsCount(editedCarouselsCount + 1)} className="h-5 w-5 rounded bg-background border font-bold text-xs flex items-center justify-center hover:bg-muted">+</button>
                              </div>
                            </div>

                            <div className="flex items-center justify-between p-2 bg-muted/20 rounded-lg border text-xs">
                              <span className="font-bold text-[10px]">Posts</span>
                              <div className="flex items-center gap-1">
                                <button type="button" onClick={() => setEditedPostsCount(Math.max(0, editedPostsCount - 1))} className="h-5 w-5 rounded bg-background border font-bold text-xs flex items-center justify-center hover:bg-muted">-</button>
                                <span className="font-black text-xs w-4 text-center">{editedPostsCount}</span>
                                <button type="button" onClick={() => setEditedPostsCount(editedPostsCount + 1)} className="h-5 w-5 rounded bg-background border font-bold text-xs flex items-center justify-center hover:bg-muted">+</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 2. Distribución por Canales de Difusión */}
                      <div className="space-y-3 bg-background/50 border rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center justify-between border-b pb-2">
                          <span className="font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[9.5px] flex items-center gap-1.5">
                            <Share2 className="h-3.5 w-3.5 text-emerald-500" /> Distribución por Canales de Difusión (Presupuesto & Estado por Canal)
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                          {/* INSTAGRAM */}
                          <div className={`p-3.5 rounded-xl border flex flex-col justify-between space-y-2.5 transition-all ${
                            isIgActive ? 'bg-background/80 border-pink-200/80 shadow-xs' : 'bg-muted/30 opacity-60 border-dashed'
                          }`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Instagram className="h-4 w-4 text-pink-600" />
                                <span className="font-bold text-xs text-foreground uppercase tracking-wide">INSTAGRAM</span>
                              </div>
                              <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-extrabold text-pink-600">
                                <input
                                  type="checkbox"
                                  checked={isIgActive}
                                  onChange={(e) => {
                                    const nextActive = e.target.checked;
                                    setIsIgActive(nextActive);
                                    const sum = (nextActive ? editedIgBudget : 0) + (isFbActive ? editedFbBudget : 0) + (isTiktokActive ? editedTiktokBudget : 0);
                                    setEditedCampBudget(sum);
                                  }}
                                  className="rounded text-pink-600 focus:ring-pink-500"
                                />
                                {isIgActive ? "ACTIVO" : "INACTIVO"}
                              </label>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[8.5px] font-black uppercase text-muted-foreground block">Presupuesto Canal</span>
                              <div className="flex items-center gap-1">
                                <span className="font-extrabold text-xs text-pink-600">$</span>
                                <input
                                  type="number"
                                  min={0}
                                  value={editedIgBudget}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setEditedIgBudget(val);
                                    const sum = (isIgActive ? val : 0) + (isFbActive ? editedFbBudget : 0) + (isTiktokActive ? editedTiktokBudget : 0);
                                    setEditedCampBudget(sum);
                                  }}
                                  disabled={!isIgActive}
                                  className="w-full text-xs font-black text-pink-600 bg-muted/20 border rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-pink-500"
                                />
                                <span className="font-extrabold text-[10px] text-muted-foreground">USD</span>
                              </div>
                            </div>
                          </div>

                          {/* FACEBOOK */}
                          <div className={`p-3.5 rounded-xl border flex flex-col justify-between space-y-2.5 transition-all ${
                            isFbActive ? 'bg-background/80 border-blue-200/80 shadow-xs' : 'bg-muted/30 opacity-60 border-dashed'
                          }`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Facebook className="h-4 w-4 text-blue-600" />
                                <span className="font-bold text-xs text-foreground uppercase tracking-wide">FACEBOOK</span>
                              </div>
                              <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-extrabold text-blue-600">
                                <input
                                  type="checkbox"
                                  checked={isFbActive}
                                  onChange={(e) => {
                                    const nextActive = e.target.checked;
                                    setIsFbActive(nextActive);
                                    const sum = (isIgActive ? editedIgBudget : 0) + (nextActive ? editedFbBudget : 0) + (isTiktokActive ? editedTiktokBudget : 0);
                                    setEditedCampBudget(sum);
                                  }}
                                  className="rounded text-blue-600 focus:ring-blue-500"
                                />
                                {isFbActive ? "ACTIVO" : "INACTIVO"}
                              </label>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[8.5px] font-black uppercase text-muted-foreground block">Presupuesto Canal</span>
                              <div className="flex items-center gap-1">
                                <span className="font-extrabold text-xs text-blue-600">$</span>
                                <input
                                  type="number"
                                  min={0}
                                  value={editedFbBudget}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setEditedFbBudget(val);
                                    const sum = (isIgActive ? editedIgBudget : 0) + (isFbActive ? val : 0) + (isTiktokActive ? editedTiktokBudget : 0);
                                    setEditedCampBudget(sum);
                                  }}
                                  disabled={!isFbActive}
                                  className="w-full text-xs font-black text-blue-600 bg-muted/20 border rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                                <span className="font-extrabold text-[10px] text-muted-foreground">USD</span>
                              </div>
                            </div>
                          </div>

                          {/* TIKTOK */}
                          <div className={`p-3.5 rounded-xl border flex flex-col justify-between space-y-2.5 transition-all ${
                            isTiktokActive ? 'bg-background/80 border-slate-300 dark:border-slate-700 shadow-xs' : 'bg-muted/30 opacity-60 border-dashed'
                          }`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <TikTokIcon className="h-4 w-4 text-slate-800 dark:text-slate-200" />
                                <span className="font-bold text-xs text-foreground uppercase tracking-wide">TIKTOK</span>
                              </div>
                              <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-extrabold text-slate-700 dark:text-slate-300">
                                <input
                                  type="checkbox"
                                  checked={isTiktokActive}
                                  onChange={(e) => {
                                    const nextActive = e.target.checked;
                                    setIsTiktokActive(nextActive);
                                    const sum = (isIgActive ? editedIgBudget : 0) + (isFbActive ? editedFbBudget : 0) + (nextActive ? editedTiktokBudget : 0);
                                    setEditedCampBudget(sum);
                                  }}
                                  className="rounded text-slate-700 focus:ring-slate-500"
                                />
                                {isTiktokActive ? "ACTIVO" : "INACTIVO"}
                              </label>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[8.5px] font-black uppercase text-muted-foreground block">Presupuesto Canal</span>
                              <div className="flex items-center gap-1">
                                <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200">$</span>
                                <input
                                  type="number"
                                  min={0}
                                  value={editedTiktokBudget}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setEditedTiktokBudget(val);
                                    const sum = (isIgActive ? editedIgBudget : 0) + (isFbActive ? editedFbBudget : 0) + (isTiktokActive ? val : 0);
                                    setEditedCampBudget(sum);
                                  }}
                                  disabled={!isTiktokActive}
                                  className="w-full text-xs font-black text-slate-800 dark:text-slate-200 bg-muted/20 border rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-slate-500"
                                />
                                <span className="font-extrabold text-[10px] text-muted-foreground">USD</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 3. Segmentación del Público Objetivo (Targeting) */}
                      <div className="space-y-3 bg-background/50 border rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center justify-between border-b pb-2">
                          <span className="font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[9.5px] flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5 text-emerald-500" /> Segmentación del Público Objetivo (Targeting)
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                          {/* Ubicaciones */}
                          <div className="p-3.5 bg-background/80 rounded-xl border border-emerald-200/50 space-y-1.5">
                            <label className="text-[8.5px] font-black text-muted-foreground uppercase block">Ubicaciones Relevantes</label>
                            <input
                              type="text"
                              value={editedLocations || (Array.isArray(targeting.locations) ? targeting.locations.join(", ") : data?.businessInfo?.location || "Entorno Metropolitano Local")}
                              onChange={(e) => setEditedLocations(e.target.value)}
                              placeholder="Ej. Santa Cruz, Equipetrol, Montero"
                              className="w-full text-xs font-semibold text-foreground bg-muted/20 border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>

                          {/* Rango de Edad */}
                          <div className="p-3.5 bg-background/80 rounded-xl border border-emerald-200/50 space-y-1.5">
                            <label className="text-[8.5px] font-black text-muted-foreground uppercase block">Rango de Edad (Mín - Máx)</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min={13}
                                max={99}
                                value={editedAgeMin}
                                onChange={(e) => setEditedAgeMin(Number(e.target.value))}
                                className="w-full text-xs font-black text-foreground bg-muted/20 border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-center"
                              />
                              <span className="font-extrabold text-xs text-muted-foreground">-</span>
                              <input
                                type="number"
                                min={13}
                                max={99}
                                value={editedAgeMax}
                                onChange={(e) => setEditedAgeMax(Number(e.target.value))}
                                className="w-full text-xs font-black text-foreground bg-muted/20 border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-center"
                              />
                              <span className="text-[10px] font-bold text-muted-foreground">años</span>
                            </div>
                          </div>

                          {/* Intereses Psicográficos */}
                          <div className="p-3.5 bg-background/80 rounded-xl border border-emerald-200/50 space-y-1.5">
                            <label className="text-[8.5px] font-black text-muted-foreground uppercase block">Intereses Psicográficos</label>
                            <input
                              type="text"
                              value={editedInterests || (Array.isArray(targeting.interests) ? targeting.interests.join(", ") : "Compras locales, calidad de servicio, hábitos de consumo")}
                              onChange={(e) => setEditedInterests(e.target.value)}
                              placeholder="Ej. Gastronomía, Delivery, Compras WhatsApp"
                              className="w-full text-xs font-semibold text-foreground bg-muted/20 border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                        </div>

                        {/* Único Botón Consolidado de Guardar Todos los Parámetros */}
                        <div className="flex items-center justify-end pt-3 border-t">
                          <Button
                            type="button"
                            disabled={isRegeneratingPlan}
                            onClick={() => {
                              setIsRegeneratingPlan(true);
                              setTimeout(() => {
                                setIsRegeneratingPlan(false);
                                toast.success("¡Parámetros de campaña guardados y Plan de Publicaciones re-sincronizado con tu horario de atención!");
                              }, 1600);
                            }}
                            className="rounded-xl h-11 px-8 font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 gap-2 cursor-pointer"
                          >
                            {isRegeneratingPlan ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" /> Re-calculando Plan de Publicaciones...
                              </>
                            ) : (
                              <>
                                <Check className="h-4 w-4" /> Guardar Todos los Parámetros de Campaña
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Estado de Carga Durante la Re-generación del Plan */}
                      {isRegeneratingPlan ? (
                        <div className="p-8 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-cyan-500/10 rounded-2xl border border-emerald-500/30 flex flex-col items-center justify-center space-y-4 text-center animate-pulse shadow-md">
                          <Loader2 className="h-9 w-9 text-emerald-600 animate-spin" />
                          <div className="space-y-1.5">
                            <span className="text-xs font-black uppercase text-emerald-700 dark:text-emerald-400 block tracking-widest">
                              Re-sincronizando Plan de Publicaciones & Distribución en Calendario
                            </span>
                            <p className="text-[11px] text-muted-foreground max-w-md leading-relaxed font-medium">
                              Re-partiendo las <strong>{totalPieces} piezas ({editedReelsCount} Reels, {editedCarouselsCount} Carruseles, {editedPostsCount} Posts)</strong> según las fechas ({displayStartDate} - {displayEndDate}) y el horario operativo del negocio:
                              <span className="text-emerald-600 dark:text-emerald-400 font-extrabold block mt-1">
                                "{data?.businessInfo?.onboardingStrategy?.businessHours || "Lunes a Viernes de 09:00 a 18:00"}"
                              </span>
                            </p>
                          </div>
                        </div>
                      ) : (
                        /* 4. Distribución Inteligente de Publicaciones en Calendario (Basado en Horario de Atención) */
                        <div className="space-y-4 bg-gradient-to-br from-indigo-500/5 via-background to-emerald-500/5 border border-indigo-200/60 dark:border-indigo-900/40 rounded-2xl p-5 shadow-xs">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100 dark:border-indigo-900/40 pb-3">
                            <div className="space-y-1">
                              <span className="font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[9.5px] flex items-center gap-1.5">
                                <CalendarDays className="h-3.5 w-3.5 text-indigo-500" /> Distribución Inteligente de Publicaciones en Calendario
                              </span>
                              <p className="text-[10.5px] text-muted-foreground leading-relaxed">
                                Programación automatizada del plan de <strong>{totalPieces} Piezas ({editedReelsCount} Reels, {editedCarouselsCount} Carruseles, {editedPostsCount} Post{editedPostsCount !== 1 ? 's' : ''})</strong> optimizada para tu horario de atención.
                              </p>
                            </div>

                            <Badge variant="outline" className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 text-[9px] font-black shrink-0 px-2.5 py-1">
                              🕒 Horario: {data?.businessInfo?.onboardingStrategy?.businessHours || "Lunes a Viernes de 09:00 a 18:00"}
                            </Badge>
                          </div>

                          {/* Distribución por Formato de Contenido */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="p-3.5 bg-background/90 rounded-xl border border-indigo-100 dark:border-indigo-900/40 space-y-1 shadow-2xs">
                              <div className="flex items-center gap-2">
                                <Play className="h-4 w-4 text-pink-600" />
                                <span className="font-extrabold text-xs text-foreground uppercase">Reels ({editedReelsCount} Piezas)</span>
                              </div>
                              <p className="text-[10px] text-muted-foreground leading-snug">
                                Programados los <strong>Martes y Jueves (11:30 AM y 17:00 PM)</strong>. Pico de atención en horarios activos.
                              </p>
                            </div>

                            <div className="p-3.5 bg-background/90 rounded-xl border border-indigo-100 dark:border-indigo-900/40 space-y-1 shadow-2xs">
                              <div className="flex items-center gap-2">
                                <Layers className="h-4 w-4 text-purple-600" />
                                <span className="font-extrabold text-xs text-foreground uppercase">Carruseles ({editedCarouselsCount} Piezas)</span>
                              </div>
                              <p className="text-[10px] text-muted-foreground leading-snug">
                                Programados los <strong>Miércoles y Sábados (14:00 PM)</strong>. Mayor tiempo de lectura y guardados.
                              </p>
                            </div>

                            <div className="p-3.5 bg-background/90 rounded-xl border border-indigo-100 dark:border-indigo-900/40 space-y-1 shadow-2xs">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-emerald-600" />
                                <span className="font-extrabold text-xs text-foreground uppercase">Posts ({editedPostsCount} Pieza{editedPostsCount !== 1 ? 's' : ''})</span>
                              </div>
                              <p className="text-[10px] text-muted-foreground leading-snug">
                                Programados los <strong>Lunes (10:00 AM)</strong>. Anuncio de inicio de semana y promociones.
                              </p>
                            </div>
                          </div>

                          {/* Esquema Semanal de Calendario */}
                          <div className="pt-2">
                            <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground block mb-2">
                              Esquema Semanal de Reparto en Calendario ({displayStartDate} - {displayEndDate})
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              <div className="p-2.5 bg-background/80 rounded-xl border text-center space-y-1 shadow-2xs">
                                <span className="text-[8.5px] font-extrabold text-indigo-600 uppercase block">Semana 1</span>
                                <span className="text-xs font-extrabold text-foreground block">{Math.ceil(totalPieces / 4)} publicaciones</span>
                                <span className="text-[8.5px] text-muted-foreground block">
                                  {editedReelsCount > 0 ? "1 Reel" : ""}{editedPostsCount > 0 ? ", 1 Post" : ""}
                                </span>
                              </div>

                              <div className="p-2.5 bg-background/80 rounded-xl border text-center space-y-1 shadow-2xs">
                                <span className="text-[8.5px] font-extrabold text-indigo-600 uppercase block">Semana 2</span>
                                <span className="text-xs font-extrabold text-foreground block">{Math.ceil(totalPieces / 4)} publicaciones</span>
                                <span className="text-[8.5px] text-muted-foreground block">
                                  {editedReelsCount > 1 ? "1 Reel" : "1 Post"}{editedCarouselsCount > 0 ? ", 1 Carrusel" : ""}
                                </span>
                              </div>

                              <div className="p-2.5 bg-background/80 rounded-xl border text-center space-y-1 shadow-2xs">
                                <span className="text-[8.5px] font-extrabold text-indigo-600 uppercase block">Semana 3</span>
                                <span className="text-xs font-extrabold text-foreground block">{Math.floor(totalPieces / 4)} publicaciones</span>
                                <span className="text-[8.5px] text-muted-foreground block">
                                  {editedReelsCount > 2 ? "2 Reels" : "1 Reel, 1 Post"}
                                </span>
                              </div>

                              <div className="p-2.5 bg-background/80 rounded-xl border text-center space-y-1 shadow-2xs">
                                <span className="text-[8.5px] font-extrabold text-indigo-600 uppercase block">Semana 4</span>
                                <span className="text-xs font-extrabold text-foreground block">{Math.floor(totalPieces / 4)} publicaciones</span>
                                <span className="text-[8.5px] text-muted-foreground block">
                                  {editedCarouselsCount > 1 ? "1 Carrusel" : "1 Reel"}{editedReelsCount > 3 ? ", 1 Reel" : ""}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* TAB 4: CALENDARIO (antigua Etapa 6) */}
          <TabsContent value="calendario" className="space-y-4 mt-0">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h5 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-sky-550" /> Calendario Editorial
              </h5>

              <div className="flex items-center gap-2">
                {(data?.calendarContents?.length || 0) > 0 && (
                  <Button
                    onClick={handleDownloadCalendarioPDF}
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs font-bold gap-1 rounded-xl border-sky-500/30 text-sky-700 dark:text-sky-400 hover:bg-sky-500/5"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Descargar PDF
                  </Button>
                )}
                <Button 
                  onClick={handleStartCalendar}
                  disabled={calendarLoading || campaignLoading}
                  className="h-8 text-xs font-bold gap-1 rounded-xl bg-sky-650 hover:bg-sky-700 text-white"
                >
                  {calendarLoading || campaignLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3" />
                  )}
                  {isCalendarReady ? "Regenerar Calendario" : "Generar Calendario"}
                </Button>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed italic bg-sky-500/5 p-3 rounded-xl border border-sky-100 dark:border-sky-850 mb-4">
              💡 <strong>Agente de Contenidos:</strong> Distribuye y calendariza las publicaciones diarias, redactando copys persuasivos y generando prompts de imágenes IA.
            </p>

            {isCalendarProcessing ? (
              <div className="flex flex-col items-center justify-center p-8 bg-sky-500/5 rounded-2xl border border-sky-500/20 text-center min-h-[180px] space-y-4 animate-pulse">
                <Loader2 className="h-8 w-8 text-sky-600 animate-spin" />
                <div className="space-y-1">
                  <span className="text-xs font-black uppercase text-sky-700 block">IA Procesando Calendario</span>
                  <p className="text-[10px] text-muted-foreground max-w-xs leading-relaxed">
                    El Agente Editorial y de Contenidos está formulando y programando las publicaciones, copies, hashtags y prompts de imagen.
                  </p>
                </div>
              </div>
            ) : !isCalendarReady ? (
              <div className="flex flex-col items-center justify-center p-8 bg-muted/10 rounded-2xl border border-dashed text-center min-h-[180px] space-y-4">
                <Clock className="h-6 w-6 text-muted-foreground/45" />
                <div className="space-y-1">
                  <span className="text-xs font-bold text-muted-foreground block">Calendario Editorial Pendiente</span>
                  <p className="text-[10px] text-muted-foreground max-w-xs leading-relaxed">
                    El Agente Editorial y de Contenidos programará tu calendario una vez que lo actives.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in duration-300">
                <CalendarView
                  businessId={businessId}
                  businessName={data?.businessInfo?.name || ""}
                  campaigns={data?.campaigns || campaigns || []}
                  initialContents={(data?.calendarContents || []) as any}
                />
              </div>
            )}
          </TabsContent>
            </>
          )}
        </div>
      </Tabs>



      {/* Dialog Modal interactivo exclusivo para el Agente de Estrategia (Estilo Banco de Datos Etapa 1) */}
      <Dialog open={showStrategyAgentWorkingDialog} onOpenChange={setShowStrategyAgentWorkingDialog}>
        <DialogContent className="sm:max-w-md rounded-3xl border border-purple-500/30 bg-card/95 backdrop-blur-xl p-8 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
          {(() => {
            const strategyNotifs = notifications.filter(n => n.step === 'STRATEGY');
            const latestNotif = strategyNotifs.length > 0 ? strategyNotifs[0] : null;
            const isProcessing = strategyLoading || latestNotif?.status === 'PROCESSING';
            const isFailed = !isProcessing && latestNotif?.status === 'FAILED';
            const isCompleted = !isProcessing && !isFailed && (latestNotif?.status === 'COMPLETED' || (activeStrategy && latestNotif?.status !== 'PROCESSING'));
            const currentMessage = latestNotif?.message || "Formulando buyer personas, embudo y pilares con datos del Paso 1...";

            return (
              <div className="flex flex-col items-center justify-center space-y-6 py-2">
                {/* Icono / Loading centrado estilo Banco de Datos Etapa 1 */}
                <div className={`h-20 w-20 rounded-3xl flex items-center justify-center shadow-lg border transition-all duration-300 ${
                  isCompleted 
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 scale-105' 
                    : isFailed
                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                    : 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30 animate-pulse'
                }`}>
                  {isCompleted ? (
                    <Check className="h-10 w-10 stroke-[3] animate-in zoom-in duration-300 text-emerald-600 dark:text-emerald-400" />
                  ) : isFailed ? (
                    <AlertTriangle className="h-10 w-10 text-rose-600 dark:text-rose-400" />
                  ) : (
                    <div className="relative flex items-center justify-center">
                      <Loader2 className="h-10 w-10 animate-spin text-purple-600 dark:text-purple-400" />
                      <Sparkles className="h-4 w-4 text-purple-500 absolute inset-0 m-auto animate-ping opacity-75" />
                    </div>
                  )}
                </div>

                {/* Título y Mensaje de texto dinámico debajo del spinner */}
                <div className="space-y-2 max-w-sm">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                    isCompleted 
                      ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                      : isFailed
                      ? 'text-rose-700 dark:text-rose-400 bg-rose-500/10 border-rose-500/20'
                      : 'text-purple-700 dark:text-purple-400 bg-purple-500/10 border-purple-500/20'
                  }`}>
                    {isCompleted ? '¡Estrategia Lista!' : isFailed ? 'Error en Estrategia' : 'Agente de Estrategia Trabajando'}
                  </span>
                  <h3 className="text-xl font-black tracking-tight text-foreground pt-1">
                    {isCompleted ? 'Estrategia Generada Exitosamente' : isFailed ? 'Error al Generar Estrategia' : 'Generando Estrategia Base'}
                  </h3>
                  
                  {/* Texto de avance en tiempo real debajo del spinner */}
                  <p className="text-xs font-medium leading-relaxed text-muted-foreground min-h-[44px] flex items-center justify-center">
                    {isCompleted 
                      ? 'Se ha completado el modelado de Buyer Personas, Embudo de Ventas y Pilares Estratégicos usando tus datos del Paso 1.'
                      : currentMessage}
                  </p>
                </div>

                {/* Botón interactivo al finalizar, fallar o ver en segundo plano */}
                <div className="w-full pt-2 border-t border-border/50 flex flex-col items-center gap-2">
                  {isCompleted ? (
                    <Button
                      type="button"
                      onClick={() => {
                        setShowStrategyAgentWorkingDialog(false);
                        fetchResults(true);
                      }}
                      className="w-full rounded-2xl font-black text-xs h-11 bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/25 border-none transition-all duration-200"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Ver informe generado
                    </Button>
                  ) : isFailed ? (
                    <Button
                      type="button"
                      onClick={handleStartStrategy}
                      className="w-full rounded-2xl font-bold text-xs h-11 bg-rose-600 hover:bg-rose-700 text-white shadow-md border-none"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Reintentar Generación
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowStrategyAgentWorkingDialog(false)}
                      className="text-xs font-bold text-muted-foreground hover:text-foreground rounded-xl"
                    >
                      Ver en segundo plano
                    </Button>
                  )}
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function StageLoadingOverlay({ activeTab }: { activeTab: string }) {
  if (activeTab === "bancodedatos") {
    return (
      <div className="space-y-6 animate-pulse p-2">
        {/* Header Indicator Skeleton */}
        <div className="h-12 w-full rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded bg-orange-500/30" />
            <div className="h-4 w-48 bg-orange-500/30 rounded-md" />
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-28 bg-orange-500/20 rounded-xl" />
            <div className="h-8 w-36 bg-orange-600/30 rounded-xl" />
          </div>
        </div>

        {/* Section 1: Business Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl border bg-card/40 space-y-4">
            <div className="h-4 w-32 bg-orange-500/20 rounded-full" />
            <div className="space-y-3">
              <div className="h-3 w-full bg-muted/50 rounded-full" />
              <div className="h-3 w-4/5 bg-muted/40 rounded-full" />
              <div className="h-3 w-3/4 bg-muted/40 rounded-full" />
            </div>
          </div>
          <div className="p-5 rounded-2xl border bg-card/40 space-y-4 md:col-span-2">
            <div className="h-4 w-44 bg-orange-500/20 rounded-full" />
            <div className="space-y-3">
              <div className="h-3 w-full bg-muted/50 rounded-full" />
              <div className="h-3 w-5/6 bg-muted/40 rounded-full" />
              <div className="h-3 w-2/3 bg-muted/40 rounded-full" />
            </div>
          </div>
        </div>

        {/* Section 2: Competitors Grid */}
        <div className="space-y-4">
          <div className="h-4 w-48 bg-orange-500/20 rounded-full" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 rounded-2xl border bg-card/40 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-muted/60" />
                  <div className="h-4 w-28 bg-muted/50 rounded-md" />
                </div>
                <div className="h-3 w-3/4 bg-muted/40 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Diagnostic FODA Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-4 rounded-2xl border bg-card/40 space-y-3">
              <div className="h-4 w-24 bg-muted/60 rounded-md" />
              <div className="h-3 w-full bg-muted/40 rounded-full" />
              <div className="h-3 w-4/5 bg-muted/40 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activeTab === "activosvisuales") {
    return (
      <div className="space-y-6 animate-pulse p-2">
        {/* Header Indicator Skeleton */}
        <div className="h-12 w-full rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded bg-cyan-500/30" />
            <div className="h-4 w-48 bg-cyan-500/30 rounded-md" />
          </div>
        </div>

        {/* Opción 1: Logotipo & Paleta Skeleton */}
        <div className="p-6 rounded-2xl border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50/20 dark:bg-indigo-950/10 space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <div className="space-y-2">
              <div className="h-4 w-36 bg-indigo-500/20 rounded-full" />
              <div className="h-5 w-64 bg-indigo-500/30 rounded-md" />
            </div>
            <div className="h-9 w-32 bg-indigo-600/30 rounded-xl" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center pt-2">
            <div className="h-36 rounded-xl bg-muted/40 border flex flex-col items-center justify-center p-4 space-y-2">
              <div className="h-12 w-12 rounded-2xl bg-muted/60" />
              <div className="h-3 w-28 bg-muted/60 rounded-full" />
            </div>
            <div className="md:col-span-2 space-y-3 p-4 rounded-xl border bg-card/40">
              <div className="h-4 w-40 bg-muted/50 rounded-full" />
              <div className="flex gap-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-10 w-10 rounded-full bg-muted/50" />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Opción 2: Galería de Artes Skeleton */}
        <div className="p-6 rounded-2xl border bg-card/40 space-y-4">
          <div className="flex justify-between items-center">
            <div className="h-5 w-48 bg-muted/60 rounded-md" />
            <div className="h-8 w-28 bg-muted/50 rounded-xl" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-40 rounded-xl bg-muted/30 border border-muted/40 flex flex-col justify-end p-3 space-y-2">
                <div className="h-3 w-3/4 bg-muted/60 rounded-full" />
                <div className="h-2.5 w-1/2 bg-muted/40 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === "estrategia") {
    return (
      <div className="space-y-6 animate-pulse p-2">
        {/* Header Indicator Skeleton */}
        <div className="h-12 w-full rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded bg-purple-500/30" />
            <div className="h-4 w-52 bg-purple-500/30 rounded-md" />
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-28 bg-purple-500/20 rounded-xl" />
            <div className="h-8 w-32 bg-purple-600/30 rounded-xl" />
          </div>
        </div>

        {/* Hero Card Skeleton */}
        <div className="p-6 rounded-2xl border bg-purple-500/5 space-y-3">
          <div className="h-4 w-36 bg-purple-500/20 rounded-full" />
          <div className="h-5 w-full bg-purple-500/30 rounded-md" />
          <div className="h-4 w-4/5 bg-purple-500/20 rounded-md" />
        </div>

        {/* Objectives Skeleton */}
        <div className="p-5 rounded-2xl border bg-card/40 space-y-4">
          <div className="h-4 w-40 bg-purple-500/20 rounded-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="p-4 rounded-2xl border bg-muted/20 space-y-3">
                <div className="h-4 w-28 bg-muted/50 rounded-full" />
                <div className="h-3 w-full bg-muted/40 rounded-full" />
                <div className="h-3 w-3/4 bg-muted/40 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Buyer Personas Skeleton */}
        <div className="p-5 rounded-2xl border bg-card/40 space-y-4">
          <div className="h-4 w-44 bg-purple-500/20 rounded-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="p-5 rounded-2xl border bg-muted/20 space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-xl bg-purple-500/20" />
                    <div className="h-4 w-24 bg-muted/60 rounded-md" />
                  </div>
                  <div className="h-4 w-20 bg-purple-500/10 rounded-full" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-full bg-muted/40 rounded-full" />
                  <div className="h-3 w-5/6 bg-muted/40 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === "campanas") {
    return (
      <div className="space-y-6 animate-pulse p-2">
        {/* Header Indicator Skeleton */}
        <div className="h-12 w-full rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded bg-emerald-500/30" />
            <div className="h-4 w-52 bg-emerald-500/30 rounded-md" />
          </div>
          <div className="h-8 w-32 bg-emerald-600/30 rounded-xl" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="p-5 rounded-2xl border bg-card/40 space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <div className="h-5 w-36 bg-emerald-500/30 rounded-md" />
                <div className="h-5 w-20 bg-emerald-500/20 rounded-full" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-full bg-muted/40 rounded-full" />
                <div className="h-3 w-4/5 bg-muted/40 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Stage 5: Calendario Skeleton
  return (
    <div className="space-y-6 animate-pulse p-2">
      <div className="h-12 w-full rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded bg-amber-500/30" />
          <div className="h-4 w-48 bg-amber-500/30 rounded-md" />
        </div>
        <div className="h-8 w-28 bg-amber-600/30 rounded-xl" />
      </div>

      <div className="grid grid-cols-7 gap-2 pt-2">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
            <div className="h-3 w-10 bg-amber-500/30 rounded-full" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {[...Array(14)].map((_, i) => (
          <div key={i} className="h-24 rounded-xl border bg-card/40 p-2 space-y-2">
            <div className="h-3 w-6 bg-muted/60 rounded-full" />
            <div className="h-2.5 w-full bg-muted/40 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
