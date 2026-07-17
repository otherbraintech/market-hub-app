"use client";

import { useState, useEffect, useRef } from "react";
import { 
  getOnboardingResults, 
  startScrapingStage, 
  startDiagnosticStage, 
  startStrategyStage, 
  startCampaignStage,
  startCalendarStage
} from "@/actions/business";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileText, ShieldCheck, Target, Users, Megaphone, 
  CheckCircle2, Loader2, Network, HelpCircle, ArrowRight, ArrowLeft,
  Database, Eye, EyeIcon, CalendarDays, Compass, MessageSquare,
  Play, RefreshCw, Check, X, Clock, Cpu, Bot, Sparkles, Layers, AlertTriangle,
  Facebook, Instagram, Globe, Lock, Pencil, Lightbulb, BookOpen, Smile, Brain, Award, XCircle, Search, TrendingUp, ThumbsUp, Activity, MapPin, Briefcase, Star, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
}

export function OnboardingResultsPanel({ businessId }: OnboardingResultsPanelProps) {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("bancodedatos");

  const [scrapingLoading, setScrapingLoading] = useState(false);
  const [diagnosticLoading, setDiagnosticLoading] = useState(false);
  const [strategyLoading, setStrategyLoading] = useState(false);
  const [campaignLoading, setCampaignLoading] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isTriggeredInSession, setIsTriggeredInSession] = useState(false);

  const [selectedCompetitorId, setSelectedCompetitorId] = useState<string>("");

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

  const fetchResults = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await getOnboardingResults(businessId);
      if (res.success) {
        setData(res);
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
    if (!hasActiveProcessing) return;
    const interval = setInterval(() => {
      fetchResults(true);
      fetchNotifications(true);
    }, 8000);
    return () => clearInterval(interval);
  }, [businessId, hasActiveProcessing]);

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
  const competitorsList = data?.competitorsList || [];

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
          <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/50 font-bold text-[9px] rounded-full py-0.5 px-2 flex items-center gap-1 shrink-0 shadow-sm">
            <X className="h-2.5 w-2.5 stroke-[3]" /> FALLIDO
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-800 font-bold text-[9px] rounded-full py-0.5 px-2 flex items-center gap-1 shrink-0 shadow-sm">
            <Clock className="h-2.5 w-2.5" /> EN COLA
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
        const maxAgeMs = 15 * 60 * 1000; // 15 minutos
        if (ageMs > maxAgeMs) {
          return 'idle'; // Considerar estancado
        }
        return 'processing';
      }
      if (latestNotif.status === 'FAILED') return 'failed';
      if (latestNotif.status === 'COMPLETED') return 'completed';
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
    if (tabName === "estrategia" && activeStrategy) return false;
    if (tabName === "campanas" && campaigns.length > 0) return false;
    if (tabName === "calendario" && isCalendarReady) return false;

    const isDiagnosticActive = diagnosticLoading || getStepStatus("DIAGNOSTIC") === "processing" || getStepStatus("SCRAPING") === "processing" || getStepStatus("ANALYSIS") === "processing";
    const isStrategyActive = strategyLoading || getStepStatus("STRATEGY") === "processing" || isDiagnosticActive;
    const isCampaignActive = campaignLoading || getStepStatus("CAMPAIGN") === "processing" || isStrategyActive;

    if (tabName === "estrategia" && isDiagnosticActive) return true;
    if (tabName === "campanas" && isStrategyActive) return true;
    if (tabName === "calendario" && isCampaignActive) return true;

    if (tabName === "estrategia") {
      const status = getStepStatus("DIAGNOSTIC");
      return status !== "completed" && status !== "failed";
    }
    if (tabName === "campanas") {
      const status = getStepStatus("STRATEGY");
      return status !== "completed" && status !== "failed";
    }
    if (tabName === "calendario") {
      const status = getStepStatus("CAMPAIGN");
      return status !== "completed" && status !== "failed";
    }
    return false;
  };

  const isCampaignProcessing = getStepStatus("CAMPAIGN") === "processing" || campaignLoading;
  const isCalendarProcessing = getStepStatus("CALENDAR") === "processing" || calendarLoading;

  const parsedStrategyObj = activeStrategy ? {
    objectives: parseJson(activeStrategy.objectives) || [],
    personas: parseJson(activeStrategy.personas) || [],
    funnelStages: parseJson(activeStrategy.funnelStages) || [],
    channels: parseJson(activeStrategy.channels) || []
  } : null;

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
    { key: "BANCODEDATOS", label: "Banco de Datos", icon: Database, tab: "bancodedatos", color: "orange", desc: "Perfil, competencia e informes", emoji: "🗄️", processingEmoji: "⚡" },
    { key: "STRATEGY", label: "Estrategia de Growth", icon: Sparkles, tab: "estrategia", color: "purple", desc: "Buyer personas y plan", emoji: "🎯", processingEmoji: "✨" },
    { key: "CAMPAIGN", label: "Campañas de Marketing", icon: Bot, tab: "campanas", color: "emerald", desc: "Campañas y presupuestos", emoji: "📢", processingEmoji: "🚀" },
    { key: "CALENDAR", label: "Calendario Editorial", icon: ShieldCheck, tab: "calendario", color: "sky", desc: "Copies y publicaciones", emoji: "📝", processingEmoji: "🤖" },
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
    !isDismissed && (
      (loading && !data) ||
      !isAnalysisComplete ||
      isCurrentlyProcessing ||
      isStrategyProcessing ||
      isCampaignProcessing ||
      isCalendarProcessing ||
      isTriggeredInSession ||
      scrapingStatus === "failed" ||
      diagnosticStatus === "failed" ||
      getStepStatus("STRATEGY") === "failed" ||
      getStepStatus("CAMPAIGN") === "failed" ||
      getStepStatus("CALENDAR") === "failed"
    );

  const getDialogProgressContent = () => {
    if (loading && !data) {
      return {
        stage: 1,
        title: "Cargando Banco de Datos",
        description: "Iniciando la conexión con los agentes de inteligencia artificial y recuperando el estado de tu negocio..."
      };
    }
    // Estados fallidos de todas las fases
    if (scrapingStatus === "failed") {
      return {
        stage: -1,
        title: "Fallo en la Extracción Digital",
        description: "El Agente de Extracción ha reportado un problema de red o conexión al consultar tus canales digitales o los de tus competidores. Por favor, reintenta el proceso."
      };
    }
    if (diagnosticStatus === "failed") {
      return {
        stage: -1,
        title: "Fallo en el Diagnóstico FODA",
        description: "El Agente de Inteligencia no pudo consolidar la información del mercado. Puedes intentar realizar el análisis de nuevo."
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
        title: "Fallo en las Campañas de Marketing",
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
        title: "Etapa 3: Estructurando Campañas",
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

  const getDynamicWaitingText = () => {
    if (scrapingStatus === "processing" || scrapingLoading) {
      return "Analizando código fuente de sitios web e indexando publicaciones recientes en redes sociales...";
    }
    if (diagnosticStatus === "processing" || diagnosticLoading) {
      const hasSomeIndividualReports = individualBusinessReports.length > 0 || competitorReports.length > 0;
      if (!hasSomeIndividualReports) {
        return "Evaluando engagement, frecuencia de publicación y coherencia visual en cada canal digital...";
      } else {
        return "Cruzando información del mercado, detectando debilidades competitivas y compilando matriz FODA...";
      }
    }
    if (isStrategyProcessing) {
      return "Modelando enfoque estratégico, definiendo metas comerciales SMART y perfilando Buyer Personas...";
    }
    if (isCampaignProcessing) {
      return "Estructurando presupuestos ideales, definiendo ofertas de conversión y asignando canales de adquisición...";
    }
    if (isCalendarProcessing) {
      return "Generando el plan de contenidos mensual y redactando copies con IA bajo la regla 60-25-15...";
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
    campanas: "Plan de Campañas",
    calendario: "Calendario Editorial"
  };

  const isNextBlocked = nextTab ? isTabBlocked(nextTab) || (activeTab === "bancodedatos" && !hasScrolledToBottom) : false;


  return (
    <Card className="border border-slate-100 dark:border-slate-800/80 shadow-xl bg-card/60 backdrop-blur-md flex flex-col min-h-[500px] rounded-3xl overflow-hidden">
      {/* Estilos e Inyecciones CSS */}
      <style>{`
        @keyframes guided-pulse-violet {
          0%, 100% { box-shadow: 0 0 0 0 rgba(124, 58, 237, 0.6); transform: scale(1.02); }
          50% { box-shadow: 0 0 25px 8px rgba(139, 92, 246, 0.5); transform: scale(1.06); }
        }
        .continue-btn-pulse { animation: guided-pulse-violet 1.6s ease-in-out infinite; }
      `}</style>

      {/* DIALOG DE ESPERA ACTIVA (PROGRESO IA) */}
      <Dialog open={isWaitModalOpen} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-6 [&>button]:hidden">
          <div className="relative flex items-center justify-center h-20 w-20">
            {currentProgress.stage === -1 ? (
              <div className="relative h-16 w-16 bg-rose-550/10 rounded-2xl border border-rose-500/25 flex items-center justify-center text-rose-600">
                <AlertTriangle className="h-8 w-8 animate-pulse" />
              </div>
            ) : (
              <>
                {isCurrentlyProcessing && (
                  <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                )}
                <div className="relative h-16 w-16 bg-primary/10 rounded-2xl border border-primary/25 flex items-center justify-center text-primary">
                  <Bot className={`h-8 w-8 ${isCurrentlyProcessing ? 'animate-bounce-slow' : ''}`} />
                </div>
              </>
            )}
          </div>

          <div className="space-y-2 w-full">
            <div className="flex items-center justify-center gap-1.5">
              <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                currentProgress.stage === -1 
                  ? "bg-rose-500/10 text-rose-700" 
                  : "bg-primary/10 text-primary"
              }`}>
                {currentProgress.title}
              </span>
            </div>
            <h3 className="text-lg font-bold text-foreground">
              {currentProgress.stage === -1 ? "Error Detectado" : "Procesando Banco de Datos"}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-sm font-medium mx-auto">
              {currentProgress.description}
            </p>
          </div>

          {currentProgress.stage === -1 ? (
            <div className="w-full pt-2">
              <Button
                onClick={() => {
                  if (getStepStatus("STRATEGY") === "failed") {
                    handleStartStrategy();
                  } else if (getStepStatus("CAMPAIGN") === "failed") {
                    handleStartCampaign();
                  } else if (getStepStatus("CALENDAR") === "failed") {
                    handleStartCalendar();
                  } else {
                    handleManualTrigger();
                  }
                }}
                className="w-full h-11 rounded-xl bg-rose-650 hover:bg-rose-750 text-white font-extrabold text-xs transition-all shadow-md flex items-center justify-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Reintentar Etapa Fallida
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
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-semibold px-4 text-center">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
                      <span className="animate-pulse">{getDynamicWaitingText()}</span>
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
      <div className="px-6 py-5 border-b bg-gradient-to-r from-orange-500/5 via-background to-indigo-500/5">
        <h4 className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2">
          <Cpu className="h-4.5 w-4.5 text-orange-600 animate-pulse" />
          Procesamiento del Banco de Datos e Inteligencia Competitiva
        </h4>
        <p className="text-xs text-muted-foreground mt-0.5">
          Observa cómo se consolida la información de mercado para el motor de estrategias.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        {/* Etapas de agentes responsivas */}
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

        <TabsList className="sr-only">
          <TabsTrigger value="bancodedatos">Banco de Datos</TabsTrigger>
          <TabsTrigger value="estrategia">Estrategia</TabsTrigger>
          <TabsTrigger value="campanas">Campañas</TabsTrigger>
          <TabsTrigger value="calendario">Calendario</TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1 p-5 h-[480px]">
          {/* TAB 1: BANCO DE DATOS (UNIFICADO) */}
          <TabsContent value="bancodedatos" className="space-y-8 mt-0">
            {/* 1. INFORMACIÓN DE MI NEGOCIO */}
            {data?.businessInfo && (
              <section className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-orange-600" />
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">
                      Información de Mi Negocio
                    </h3>
                  </div>
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Datos Básicos */}
                  <div className="bg-muted/20 p-4 rounded-2xl border space-y-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block border-b pb-1">
                      Datos de Registro
                    </span>
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="font-bold text-muted-foreground block text-[9px] uppercase">Nombre</span>
                        <span className="font-semibold text-foreground">{data.businessInfo.name}</span>
                      </div>
                      {data.businessInfo.industry && (
                        <div>
                          <span className="font-bold text-muted-foreground block text-[9px] uppercase">Industria</span>
                          <span className="font-semibold text-foreground">{data.businessInfo.industry}</span>
                        </div>
                      )}
                      {data.businessInfo.location && (
                        <div>
                          <span className="font-bold text-muted-foreground block text-[9px] uppercase">Ubicación</span>
                          <span className="font-semibold text-foreground">{data.businessInfo.location}</span>
                        </div>
                      )}
                      {data.businessInfo.phoneNumbers && (
                        <div>
                          <span className="font-bold text-muted-foreground block text-[9px] uppercase">Teléfono</span>
                          <span className="font-semibold text-foreground">{data.businessInfo.phoneNumbers}</span>
                        </div>
                      )}
                      {data.businessInfo.website && (
                        <div>
                          <span className="font-bold text-muted-foreground block text-[9px] uppercase">Sitio Web</span>
                          <a href={data.businessInfo.website} target="_blank" rel="noopener noreferrer" className="text-orange-600 dark:text-orange-400 hover:underline font-bold">
                            {data.businessInfo.website}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Descripción y Propuesta */}
                  <div className="bg-muted/20 p-4 rounded-2xl border space-y-3 md:col-span-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block border-b pb-1">
                      Enfoque y Propuesta de Valor
                    </span>
                    <div className="space-y-3 text-xs leading-relaxed">
                      {data.businessInfo.description && (
                        <div>
                          <span className="font-bold text-muted-foreground block text-[9px] uppercase">Descripción</span>
                          <p className="font-medium text-foreground">{data.businessInfo.description}</p>
                        </div>
                      )}
                      {data.businessInfo.valueProposition && (
                        <div>
                          <span className="font-bold text-muted-foreground block text-[9px] uppercase">Propuesta de Valor</span>
                          <p className="font-semibold text-orange-600 dark:text-orange-400 italic">"{data.businessInfo.valueProposition}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Canales y Redes Vinculadas */}
                  <div className="bg-muted/20 p-4 rounded-2xl border space-y-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block border-b pb-1">
                      Canales y Redes
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(() => {
                        const socialLinks = parseJson(data.businessInfo.socialLinks);
                        if (!socialLinks) return <span className="text-xs text-muted-foreground italic">Sin redes vinculadas</span>;
                        const links = Object.entries(socialLinks).filter(([, v]) => v && String(v).trim());
                        if (links.length === 0) return <span className="text-xs text-muted-foreground italic">Sin redes vinculadas</span>;
                        return links.map(([platform, url]) => (
                          <a
                            key={platform}
                            href={String(url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-background border rounded-xl text-[10px] font-bold text-orange-600 dark:text-orange-400 hover:bg-orange-500/5 transition-colors"
                          >
                            {getSocialIcon(platform)}
                            <span className="capitalize">{platform}</span>
                          </a>
                        ));
                      })()}
                    </div>
                  </div>

                  {/* Identidad de Marca */}
                  <div className="bg-muted/20 p-4 rounded-2xl border space-y-3 md:col-span-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block border-b pb-1">
                      Identidad Visual & Voz de Marca
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      {/* Tono y personalidad */}
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
                          <div className="space-y-2">
                            {tones.length > 0 && (
                              <div>
                                <span className="text-[9px] text-muted-foreground block uppercase font-bold">Tono de Voz</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {tones.map((t, idx) => (
                                    <Badge key={idx} variant="secondary" className="bg-orange-500/10 text-orange-700 hover:bg-orange-500/10 border-none rounded-lg text-[9px] font-bold px-1.5 py-0.5">
                                      {t}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            {personalities.length > 0 && (
                              <div className="pt-1.5">
                                <span className="text-[9px] text-muted-foreground block uppercase font-bold">Personalidad</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {personalities.map((p, idx) => (
                                    <Badge key={idx} variant="secondary" className="bg-purple-500/10 text-purple-700 hover:bg-purple-500/10 border-none rounded-lg text-[9px] font-bold px-1.5 py-0.5">
                                      {p}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Colores y Fuentes */}
                      {(() => {
                        const colors = parseJson(data.businessInfo.brandColors);
                        const fonts = parseJson(data.businessInfo.brandFonts);
                        if (!colors && !fonts) return null;
                        return (
                          <div className="space-y-2">
                            {colors && (
                              <div>
                                <span className="text-[9px] text-muted-foreground block uppercase font-bold">Paleta de Colores</span>
                                <div className="flex gap-2 items-center mt-1">
                                  {colors.primary && (
                                    <div className="flex items-center gap-1 bg-background p-1 rounded-lg border">
                                      <div className="h-3 w-3 rounded-full border border-slate-350" style={{ backgroundColor: colors.primary }} />
                                      <span className="text-[8px] font-mono font-bold text-muted-foreground">{colors.primary}</span>
                                    </div>
                                  )}
                                  {colors.secondary && (
                                    <div className="flex items-center gap-1 bg-background p-1 rounded-lg border">
                                      <div className="h-3 w-3 rounded-full border border-slate-350" style={{ backgroundColor: colors.secondary }} />
                                      <span className="text-[8px] font-mono font-bold text-muted-foreground">{colors.secondary}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            {fonts && (
                              <div className="pt-1">
                                <span className="text-[9px] text-muted-foreground block uppercase font-bold">Tipografía</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {fonts.heading && (
                                    <Badge variant="outline" className="text-[8px] rounded-lg py-0 px-1 border-slate-200">
                                      Títulos: {fonts.heading}
                                    </Badge>
                                  )}
                                  {fonts.body && (
                                    <Badge variant="outline" className="text-[8px] rounded-lg py-0 px-1 border-slate-200">
                                      Cuerpo: {fonts.body}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* 2. REGISTRO DE COMPETENCIA */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-b pb-2">
                <Users className="h-5 w-5 text-orange-600" />
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">
                  Competidores Registrados
                </h3>
              </div>

              {competitorsList.length === 0 ? (
                <div className="p-4 bg-muted/10 rounded-2xl border text-center text-xs text-muted-foreground italic">
                  Sin competidores registrados.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {competitorsList.map((c: any, index: number) => (
                    <div key={c.id} className="p-4 bg-muted/20 rounded-2xl border space-y-3">
                      <div className="flex items-center justify-between border-b pb-1.5">
                        <span className="text-xs font-black uppercase tracking-wide text-foreground">
                          {c.name}
                        </span>
                        <Badge variant="outline" className="text-[8px] rounded-md">Competidor {index + 1}</Badge>
                      </div>
                      <div className="space-y-1.5">
                        {c.website && (
                          <div className="flex items-center gap-2 text-xs truncate">
                            {getSocialIcon("WEBSITE")}
                            <a href={c.website} target="_blank" rel="noopener noreferrer" className="text-orange-600 truncate font-semibold hover:underline">
                              {c.website}
                            </a>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-1 pt-1.5">
                          {c.facebook && (
                            <a href={c.facebook} target="_blank" rel="noopener noreferrer" className="p-1 bg-background border rounded-lg" title="Facebook">
                              {getSocialIcon("FACEBOOK")}
                            </a>
                          )}
                          {c.instagram && (
                            <a href={c.instagram} target="_blank" rel="noopener noreferrer" className="p-1 bg-background border rounded-lg" title="Instagram">
                              {getSocialIcon("INSTAGRAM")}
                            </a>
                          )}
                          {c.tiktok && (
                            <a href={c.tiktok} target="_blank" rel="noopener noreferrer" className="p-1 bg-background border rounded-lg" title="TikTok">
                              {getSocialIcon("TIKTOK")}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* 3. PROGRESO DE SCRAPING */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-b pb-2">
                <Database className="h-5 w-5 text-orange-600" />
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">
                  Progreso de Extracción Web (Scraping)
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Mi Negocio Channels */}
                <div className="bg-muted/10 p-5 rounded-2xl border space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-foreground">Mi Negocio</span>
                    <Badge variant="secondary" className="text-[8px] font-bold">PROPIO</Badge>
                  </div>
                  <div className="space-y-2">
                    {data?.businessInfo?.website && (
                      <div className="flex items-center justify-between p-2.5 bg-background/50 rounded-xl border gap-4">
                        <div className="flex items-center gap-2 truncate min-w-0">
                          {getSocialIcon("WEBSITE")}
                          <span className="text-xs font-semibold text-slate-700 truncate">{data.businessInfo.website}</span>
                        </div>
                        {renderStatusIcon(getChannelStatus(businessId, "WEBSITE", false))}
                      </div>
                    )}
                    {(() => {
                      const socialLinks = parseJson(data?.businessInfo?.socialLinks) || {};
                      return Object.entries(socialLinks).map(([channel, url]) => {
                        if (!url || typeof url !== "string" || url.trim() === "") return null;
                        return (
                          <div key={channel} className="flex items-center justify-between p-2.5 bg-background/50 rounded-xl border gap-4">
                            <div className="flex items-center gap-2 truncate min-w-0">
                              {getSocialIcon(channel)}
                              <span className="text-xs font-semibold text-slate-700 truncate">{url}</span>
                            </div>
                            {renderStatusIcon(getChannelStatus(businessId, channel, false))}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Competidores Channels */}
                <div className="bg-muted/10 p-5 rounded-2xl border space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-foreground">Competidores</span>
                    <Badge variant="secondary" className="text-[8px] font-bold bg-orange-100 text-orange-700 border-none">MERCADO</Badge>
                  </div>
                  <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                    {competitorsList.map((c: any) => (
                      <div key={c.id} className="space-y-1.5 p-2 bg-background/30 rounded-xl border">
                        <span className="font-extrabold text-slate-800 text-[10.5px] uppercase tracking-wide block">{c.name}</span>
                        <div className="grid grid-cols-1 gap-1.5">
                          {c.website && (
                            <div className="flex items-center justify-between p-1.5 bg-background/60 rounded-lg border text-[10.5px]">
                              <span className="truncate max-w-[120px]">{c.website}</span>
                              {renderStatusIcon(getChannelStatus(c.id, "WEBSITE", true))}
                            </div>
                          )}
                          {c.facebook && (
                            <div className="flex items-center justify-between p-1.5 bg-background/60 rounded-lg border text-[10.5px]">
                              <span className="truncate max-w-[120px]">Facebook</span>
                              {renderStatusIcon(getChannelStatus(c.id, "FACEBOOK", true))}
                            </div>
                          )}
                          {c.instagram && (
                            <div className="flex items-center justify-between p-1.5 bg-background/60 rounded-lg border text-[10.5px]">
                              <span className="truncate max-w-[120px]">Instagram</span>
                              {renderStatusIcon(getChannelStatus(c.id, "INSTAGRAM", true))}
                            </div>
                          )}
                          {c.tiktok && (
                            <div className="flex items-center justify-between p-1.5 bg-background/60 rounded-lg border text-[10.5px]">
                              <span className="truncate max-w-[120px]">TikTok</span>
                              {renderStatusIcon(getChannelStatus(c.id, "TIKTOK", true))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* 4. INFORME GENERAL DE MI NEGOCIO (FODA + POSICIONAMIENTO + RECOMENDACIONES INLINE) */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-b pb-2">
                <Compass className="h-5 w-5 text-orange-600" />
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">
                  Informe General de Mi Negocio (FODA e Inferencia IA)
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
                    const recommendations = parsedCons.strategicRecommendations || parsedCons.recommendations || [];

                    return (
                      <div className="space-y-6">
                        {/* Executive Summary */}
                        {parsedCons.executiveSummary && (
                          <div className="space-y-1 bg-muted/20 p-4 rounded-2xl border border-orange-500/10">
                            <span className="text-[9px] font-black uppercase tracking-widest text-orange-700 block">Resumen Ejecutivo Consolidado</span>
                            <p className="text-xs text-slate-700 dark:text-slate-350 leading-relaxed italic">"{parsedCons.executiveSummary}"</p>
                          </div>
                        )}

                        {/* Market Position */}
                        {position.currentPosition && (
                          <div className="bg-muted/15 p-4 rounded-2xl border space-y-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <span className="text-[8px] font-black uppercase text-muted-foreground block">Posición Actual</span>
                              <span className="text-xs font-bold text-foreground leading-normal">{position.currentPosition}</span>
                            </div>
                            <div>
                              <span className="text-[8px] font-black uppercase text-muted-foreground block">Ventaja Competitiva</span>
                              <span className="text-xs font-bold text-foreground leading-normal">{position.competitiveAdvantage || "N/D"}</span>
                            </div>
                            <div>
                              <span className="text-[8px] font-black uppercase text-muted-foreground block">Brecha Identificada</span>
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

                        {/* Recommendations table/list */}
                        {recommendations.length > 0 && (
                          <div className="space-y-3 border-t pt-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 block">Recomendaciones Estratégicas del Negocio</span>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {recommendations.map((rec: any, idx: number) => {
                                const action = typeof rec === 'string' ? rec : rec.action || rec.description;
                                const category = typeof rec === 'string' ? 'General' : rec.category || 'Recomendación';
                                return (
                                  <div key={idx} className="p-3 bg-muted/20 border rounded-xl flex gap-2.5 items-start">
                                    <span className="bg-primary/10 text-primary h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">
                                      {idx + 1}
                                    </span>
                                    <div>
                                      <span className="text-[9px] font-bold text-muted-foreground uppercase block">{category}</span>
                                      <p className="text-xs text-slate-700 dark:text-slate-350 font-medium leading-relaxed">{action}</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Buyer Personas Generados en el Banco de Datos */}
                        {(!parsedCons.buyerPersonas || parsedCons.buyerPersonas.length === 0) ? (
                          <div className="space-y-3 border-t pt-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 block flex items-center gap-1.5">
                              <Users className="h-3.5 w-3.5 text-orange-600" /> Público Objetivo y Buyer Personas (Consolidado Banco de Datos)
                            </span>
                            <div className="p-5 bg-orange-500/5 border border-dashed border-orange-200 rounded-2xl text-center space-y-2 max-w-md mx-auto">
                              <HelpCircle className="h-6 w-6 text-orange-500 mx-auto opacity-70" />
                              <span className="text-xs font-bold text-slate-800 block">Requiere Reanálisis</span>
                              <p className="text-[10.5px] text-muted-foreground leading-relaxed">
                                Los perfiles de Buyer Personas se generan de forma integrada en el consolidado del Banco de Datos. Pulsa el botón <strong>"Reanalizar Banco de Datos"</strong> arriba para generarlos por primera vez con el prompt sociocultural.
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3 border-t pt-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 block flex items-center gap-1.5">
                              <Users className="h-3.5 w-3.5 text-orange-600" /> Público Objetivo y Buyer Personas (Consolidado Banco de Datos)
                            </span>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                              {parsedCons.buyerPersonas.map((persona: any, index: number) => (
                                <div key={index} className="p-4 bg-muted/10 rounded-2xl border space-y-3 flex flex-col justify-between">
                                  <div className="space-y-2.5">
                                    <div className="flex items-center justify-between border-b pb-2">
                                      <div className="flex items-center gap-2">
                                        <div className="h-7 w-7 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 text-orange-600 text-[10px] font-black shrink-0">
                                          P{index + 1}
                                        </div>
                                        <span className="font-bold text-[11.5px] text-foreground">{persona.name || `Audiencia ${index + 1}`}</span>
                                      </div>
                                      {persona.demographics && (
                                        <Badge variant="secondary" className="text-[8.5px] font-bold rounded-lg bg-orange-500/5 text-orange-700">
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
                                        <span className="font-black text-orange-600 uppercase text-[8px] block">Guía de Comunicación</span>
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
                      </div>
                    );
                  })()}
                </div>
              )}
            </section>

            {/* 5. INFORME GENERAL DE COMPETENCIA E INTELIGENCIA COMPETITIVA */}
            <section className="space-y-6">
              <div className="flex items-center gap-2 border-b pb-2">
                <Users className="h-5 w-5 text-orange-600" />
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">
                  Informe General de Competidores e Inteligencia Competitiva
                </h3>
              </div>

              {!data?.businessInfo?.competitorGeneralReport ? (
                <div className="p-6 bg-muted/10 rounded-2xl border border-dashed text-center text-xs text-muted-foreground italic">
                  Esperando que finalice el diagnóstico comparativo de competidores...
                </div>
              ) : (
                <div className="space-y-6">
                  {(() => {
                    const parsedReport = parseJson(data.businessInfo.competitorGeneralReport);
                    if (!parsedReport) return null;

                    const summaryObj = parsedReport.executiveSummary || {};
                    let executiveSummary = "No se ha generado un resumen ejecutivo.";
                    const rawPanorama = parsedReport.panoramaGlobal || summaryObj.panoramaGlobal;
                    if (rawPanorama) {
                      if (typeof rawPanorama === "string") {
                        executiveSummary = rawPanorama;
                      } else if (typeof rawPanorama === "object") {
                        executiveSummary = rawPanorama.resumen || rawPanorama.panorama || Object.values(rawPanorama).filter(v => typeof v === "string").join("\n");
                      }
                    } else if (typeof parsedReport.executiveSummary === "string") {
                      executiveSummary = parsedReport.executiveSummary;
                    }

                    const execSummary = parsedReport.executiveSummary || {};

                    // Extraer brechas y oportunidades
                    const gaps = parsedReport.oportunidadesGaps || parsedReport.opportunitiesGaps || execSummary.oportunidadesGaps || execSummary.opportunitiesGaps || {};
                    const needs = gaps.necesidadesNoResueltas || gaps.unresolvedNeeds || [];
                    const formats = gaps.formatosDesatendidos || gaps.unattendedFormats || [];
                    const growthOpportunities = gaps.oportunidadesCrecimiento || gaps.growthOpportunities || [];

                    // Extraer pilares de contenido
                    const contents = parsedReport.estrategiaContenidos || parsedReport.contentStrategy || execSummary.estrategiaContenidos || execSummary.contentStrategy || {};
                    const pillars = contents.pilaresContenido || contents.pilaresSugeridos || contents.suggestedPillars || contents.contentPillars || [];
                    const frequencies = contents.frecuenciaCanal || contents.channelFrequencies || [];

                    return (
                      <div className="space-y-6">
                        {/* Executive Summary */}
                        <div className="p-5 bg-purple-550/5 border border-purple-500/10 rounded-3xl space-y-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-purple-700 block">Resumen Ejecutivo Competitivo</span>
                          <p className="text-xs text-muted-foreground leading-relaxed italic bg-background/50 p-4 rounded-2xl border">
                            "{executiveSummary}"
                          </p>
                        </div>

                        {/* Oportunidades y Brechas */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl space-y-2">
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block border-b border-blue-500/20 pb-1">
                              🎯 Oportunidades de Diferenciación (Brechas)
                            </span>
                            <div className="space-y-2 text-xs">
                              {needs.length > 0 && (
                                <div>
                                  <span className="font-bold text-[9px] uppercase text-muted-foreground">Necesidades no Resueltas</span>
                                  <p className="text-muted-foreground">{Array.isArray(needs) ? needs.join(", ") : needs}</p>
                                </div>
                              )}
                              {formats.length > 0 && (
                                <div>
                                  <span className="font-bold text-[9px] uppercase text-muted-foreground">Formatos Desatendidos</span>
                                  <p className="text-muted-foreground">{Array.isArray(formats) ? formats.join(", ") : formats}</p>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl space-y-2">
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block border-b border-emerald-500/20 pb-1">
                              📈 Oportunidades de Crecimiento
                            </span>
                            <div className="space-y-2 text-xs">
                              {growthOpportunities.map((op: any, i: number) => {
                                const name = typeof op === "string" ? op : op.title || op.name;
                                const impact = typeof op === "string" ? "Alto" : op.impact || "Alto";
                                return (
                                  <div key={i} className="flex justify-between items-center bg-background/50 p-2 rounded-xl border">
                                    <span className="font-semibold text-slate-700">{name}</span>
                                    <Badge variant="secondary" className="text-[8px] bg-emerald-100 text-emerald-800 border-none font-bold">Impacto: {impact}</Badge>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Pilares y Frecuencias */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl space-y-2">
                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block border-b border-indigo-500/20 pb-1">
                              📌 Pilares de Contenido Sugeridos
                            </span>
                            <ul className="space-y-1 text-xs text-muted-foreground pl-3 list-disc">
                              {pillars.map((p: string, idx: number) => (
                                <li key={idx} className="leading-relaxed">{p}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="p-4 bg-sky-500/5 border border-sky-500/10 rounded-2xl space-y-2">
                            <span className="text-[10px] font-black text-sky-600 uppercase tracking-widest block border-b border-sky-500/20 pb-1">
                              📅 Frecuencia por Canal Recomendada
                            </span>
                            <ul className="space-y-1 text-xs text-muted-foreground pl-3 list-disc">
                              {frequencies.map((f: string, idx: number) => (
                                <li key={idx} className="leading-relaxed">{f}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* TABLA COMPARATIVA GENERAL */}
                  <div className="space-y-3 bg-background/35 border rounded-3xl p-5 shadow-sm">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 block border-l-2 border-primary pl-2">
                      Tabla Comparativa General (Yo vs Competencia)
                    </span>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b bg-muted/30">
                            <th className="p-3 font-black uppercase tracking-wider text-[10px] text-muted-foreground w-1/4">Aspecto</th>
                            <th className="p-3 font-black uppercase tracking-wider text-[10px] text-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 w-1/4">Mi Negocio</th>
                            {(() => {
                              return competitorsList.map((c: any) => (
                                <th key={c.id} className="p-3 font-black uppercase tracking-wider text-[10px] text-foreground w-1/4">
                                  {c.name}
                                </th>
                              ));
                            })()}
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
                                <tr className="border-b hover:bg-muted/10 transition-colors">
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

                                <tr className="border-b hover:bg-muted/10 transition-colors">
                                  <td className="p-3 font-bold text-slate-500 uppercase tracking-wide text-[9px] bg-muted/10">Fortalezas / Productos</td>
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

                                <tr className="border-b hover:bg-muted/10 transition-colors">
                                  <td className="p-3 font-bold text-slate-500 uppercase tracking-wide text-[9px] bg-muted/10">Debilidades / Brechas</td>
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

                                <tr className="hover:bg-muted/10 transition-colors">
                                  <td className="p-3 font-bold text-slate-500 uppercase tracking-wide text-[9px] bg-muted/10">Recomendaciones Clave</td>
                                  <td className="p-3 bg-indigo-50/10 dark:bg-indigo-950/10 font-semibold text-indigo-750 dark:text-indigo-300">
                                    <ul className="list-disc pl-4 space-y-1">
                                      {myDetails.recommendations.map((r, idx) => (
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
                                          {cDetails.recommendations.map((r, idx) => (
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
                  </div>

                  {/* DIAGNÓSTICO ESTRATÉGICO PARTICULAR POR COMPETIDOR */}
                  <div className="space-y-4 pt-4 border-t">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 block border-l-2 border-primary pl-2">
                      Diagnóstico Particular por Competidor
                    </span>

                    <Tabs value={selectedCompetitorId} onValueChange={setSelectedCompetitorId} className="w-full">
                      <TabsList className="w-full flex justify-start overflow-x-auto bg-muted/30 p-1 mb-4 h-auto flex-wrap gap-1">
                        {competitorsList.map((c: any) => (
                          <TabsTrigger 
                            key={c.id} 
                            value={c.id}
                            className="text-xs px-3.5 py-1.5 rounded-lg data-[state=active]:bg-background cursor-pointer font-bold"
                          >
                            {c.name}
                          </TabsTrigger>
                        ))}
                      </TabsList>

                      {competitorsList.map((c: any) => {
                        const cReports = competitorReports.filter((r: any) => r.entityId === c.id);
                        const reportsMap = cReports.reduce((acc: any, r: any) => {
                          acc[r.channel.toUpperCase()] = r;
                          return acc;
                        }, {});
                        const compWithMap = { ...c, reportsByChannel: reportsMap };
                        const individualAnalysis = getSelectedCompetitorAnalysis(compWithMap);

                        return (
                          <TabsContent key={c.id} value={c.id} className="space-y-6 mt-0">
                            {individualAnalysis ? (
                              <Card className="border shadow-sm bg-white dark:bg-slate-900 p-5 rounded-2xl space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                  {/* Desempeño Canales */}
                                  <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                      Desempeño de Canales
                                    </h4>
                                    <ul className="space-y-2">
                                      {individualAnalysis.desempenoCanales.map((item: string, i: number) => (
                                        <li key={i} className="text-xs text-slate-600 dark:text-slate-200 leading-relaxed flex items-start gap-2">
                                          <ChevronRight className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                          <span>{item}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>

                                  {/* Debilidades */}
                                  <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                                      <span className="h-2 w-2 rounded-full bg-rose-500" />
                                      Debilidades e Identificación de Brechas
                                    </h4>
                                    <ul className="space-y-2">
                                      {individualAnalysis.debilidadesGaps.map((item: string, i: number) => (
                                        <li key={i} className="text-xs text-slate-600 dark:text-slate-200 leading-relaxed flex items-start gap-2">
                                          <ChevronRight className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                                          <span>{item}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>

                                  {/* Plan Acción Contramedida */}
                                  <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                                      <span className="h-2 w-2 rounded-full bg-indigo-500" />
                                      Plan de Acción Contramedida
                                    </h4>
                                    <ul className="space-y-2">
                                      {individualAnalysis.planContramedida.map((item: string, i: number) => (
                                        <li key={i} className="text-xs text-slate-600 dark:text-slate-200 leading-relaxed flex items-start gap-2">
                                          <ChevronRight className="h-3.5 w-3.5 text-indigo-500 shrink-0 mt-0.5" />
                                          <span>{item}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              </Card>
                            ) : (
                              <div className="p-6 bg-muted/10 rounded-2xl border text-center text-xs text-muted-foreground italic">
                                Sin diagnóstico estratégico específico disponible para este competidor.
                              </div>
                            )}

                            {/* Tarjetas de Canales de este Competidor */}
                            <div className="space-y-3">
                              <span className="text-[10px] font-black uppercase text-muted-foreground block">
                                Canales Auditados ({c.name})
                              </span>
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                {(() => {
                                  const channels = ["WEBSITE", "FACEBOOK", "INSTAGRAM", "TIKTOK"];
                                  return channels.map(chan => {
                                    const report = reportsMap[chan];
                                    const status = getChannelStatus(c.id, chan, true);
                                    if (status === 'idle') return null;

                                    let followers = "N/D";
                                    let likes = "N/D";
                                    let engagement = "N/D";

                                    if (report && report.data) {
                                      const dataObj = normalizeReportData(report.data);
                                      if (dataObj) {
                                        if (chan === "TIKTOK") {
                                          followers = formatSocialMetric(dataObj.engagement?.followers_count || dataObj.followers);
                                          likes = formatSocialMetric(dataObj.engagement?.likes_count || dataObj.likes);
                                          engagement = dataObj.engagement?.engagement_level || "Medium";
                                        } else if (chan === "FACEBOOK") {
                                          followers = formatSocialMetric(dataObj.facebook_presence?.audience_metrics?.followers);
                                          likes = formatSocialMetric(dataObj.facebook_presence?.audience_metrics?.talking_about_count);
                                          engagement = dataObj.facebook_presence?.audience_metrics?.talking_about_count ? "Media" : "N/D";
                                        } else if (chan === "INSTAGRAM") {
                                          followers = formatSocialMetric(dataObj.instagram_presence?.audience_size?.followers || dataObj.followers);
                                          likes = formatSocialMetric(dataObj.instagram_presence?.audience_size?.posts_count || dataObj.posts);
                                          engagement = dataObj.engagement_analysis?.engagement_level || "Medium";
                                        } else if (chan === "WEBSITE") {
                                          followers = dataObj.brand_identity?.market_positioning ? "Web Activa" : "Completado";
                                          likes = dataObj.data_quality?.confidence_score ? `Confianza: ${Math.round(dataObj.data_quality.confidence_score * 100)}%` : "Alta";
                                          engagement = "N/D";
                                        }
                                      }
                                    }

                                    return (
                                      <Card key={chan} className="p-4 bg-muted/10 border flex flex-col justify-between space-y-3">
                                        <div className="flex items-center justify-between border-b pb-1.5">
                                          <div className="flex items-center gap-2">
                                            {getSocialIcon(chan)}
                                            <span className="text-xs font-black uppercase text-foreground">{chan.toLowerCase()}</span>
                                          </div>
                                          {renderStatusIcon(status)}
                                        </div>
                                        <div className="space-y-1 text-xs">
                                          {chan === "WEBSITE" ? (
                                            <>
                                              <div><span className="text-[8px] text-muted-foreground block uppercase font-bold">Estado</span> <span className="font-semibold text-foreground">{followers}</span></div>
                                              <div><span className="text-[8px] text-muted-foreground block uppercase font-bold">Calidad</span> <span className="font-semibold text-foreground">{likes}</span></div>
                                            </>
                                          ) : (
                                            <>
                                              <div><span className="text-[8px] text-muted-foreground block uppercase font-bold">Seguidores</span> <span className="font-semibold text-slate-700">{followers}</span></div>
                                              <div><span className="text-[8px] text-muted-foreground block uppercase font-bold">Likes / Actividad</span> <span className="font-semibold text-slate-700">{likes}</span></div>
                                              <div><span className="text-[8px] text-muted-foreground block uppercase font-bold">Engagement</span> <span className="font-semibold text-primary">{engagement}</span></div>
                                            </>
                                          )}
                                        </div>
                                      </Card>
                                    );
                                  });
                                })()}
                              </div>
                            </div>
                          </TabsContent>
                        );
                      })}
                    </Tabs>
                  </div>
                </div>
              )}
            </section>

            {/* SENTINEL Y ESPACIO EXTRA AL BOTTOM */}
            <div ref={bottomRef} className="h-10 w-full" />
          </TabsContent>

          {/* TAB 2: ESTRATEGIA (antigua Etapa 4) */}
          <TabsContent value="estrategia" className="space-y-4 mt-0">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h5 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-purple-500" /> Estrategia Inteligente y Buyer Personas
              </h5>
              
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
                <div className="p-5 bg-gradient-to-br from-purple-500/10 via-violet-500/5 to-indigo-500/10 rounded-2xl border border-purple-200/50 space-y-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-purple-750 dark:text-purple-400">Concepto de la Estrategia</span>
                  <h4 className="text-base font-bold text-foreground capitalize">{activeStrategy.name}</h4>
                  {activeStrategy.description && (
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {activeStrategy.description}
                    </p>
                  )}
                </div>
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
                                <span className="font-bold text-[11.5px] text-foreground">{persona.name || `Audiencia ${index + 1}`}</span>
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
          </TabsContent>

          {/* TAB 3: CAMPAÑAS (antigua Etapa 5) */}
          <TabsContent value="campanas" className="space-y-4 mt-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 mb-4">
              <h5 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <Megaphone className="h-3.5 w-3.5 text-emerald-500" /> Plan de Campañas y Calendario
              </h5>
              
              <div className="flex items-center gap-2">
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
              💡 <strong>Agente de Campañas de Marketing:</strong> Estructura tu plan mensual, definiendo objetivos de conversión, segmentación detallada y presupuestos por canal.
            </p>

            {isCampaignProcessing ? (
              <div className="flex flex-col items-center justify-center p-8 bg-emerald-500/5 rounded-2xl border border-emerald-500/20 text-center min-h-[180px] space-y-4 animate-pulse">
                <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
                <div className="space-y-1">
                  <span className="text-xs font-black uppercase text-emerald-700 block">IA Procesando Campañas</span>
                  <p className="text-[10px] text-muted-foreground max-w-xs leading-relaxed">
                    El Agente de Campañas de Marketing está estructurando tus metas mensuales, presupuestos y segmentaciones de audiencia.
                  </p>
                </div>
              </div>
            ) : campaigns.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 bg-muted/10 rounded-2xl border border-dashed text-center min-h-[180px] space-y-4">
                <Clock className="h-6 w-6 text-muted-foreground/45" />
                <div className="space-y-1">
                  <span className="text-xs font-bold text-muted-foreground block">Plan de Campañas Pendiente</span>
                  <p className="text-[10px] text-muted-foreground max-w-xs leading-relaxed">
                    El Agente de Campañas de Marketing formulará tu plan de campañas mensuales una vez activado.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 gap-3">
                  {campaigns.map((camp: any) => {
                    return (
                      <div key={camp.id} className="p-4 bg-muted/30 hover:bg-muted/40 rounded-xl border space-y-3 transition-all flex flex-col justify-between">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11.5px] font-bold text-foreground line-clamp-1">
                              {camp.name}
                            </span>
                            <Badge variant="outline" className="bg-emerald-500/10 border-emerald-500/30 text-emerald-600 font-black text-[9px] rounded-lg shrink-0">
                              {camp.status || "ACTIVA"}
                            </Badge>
                          </div>
                          {camp.description && <p className="text-[10px] text-muted-foreground leading-relaxed">{camp.description}</p>}
                        </div>

                        <div className="pt-2 flex justify-end border-t border-dashed mt-1">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="h-7 text-[9px] font-black rounded-lg gap-1 border-emerald-500/30 text-emerald-700 hover:bg-emerald-50/5">
                                <EyeIcon className="h-3 w-3" /> Ver Detalles
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg rounded-2xl h-[85vh] md:h-[80vh] flex flex-col p-0 overflow-hidden bg-background">
                              <DialogHeader className="p-6 pb-3 border-b shrink-0 bg-muted/20">
                                <DialogTitle className="text-sm font-black uppercase tracking-wider text-emerald-700 flex items-center gap-2">
                                  <Megaphone className="h-4.5 w-4.5 text-emerald-600" /> Plan de Campaña
                                </DialogTitle>
                              </DialogHeader>

                              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-emerald-200 scrollbar-track-transparent">
                                <div className="p-4 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-cyan-500/10 rounded-2xl border border-emerald-200/50 space-y-2">
                                  <span className="text-[9px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">Campaña de Marketing</span>
                                  <h4 className="text-base font-bold text-foreground capitalize">{camp.name}</h4>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </TabsContent>

          {/* TAB 4: CALENDARIO (antigua Etapa 6) */}
          <TabsContent value="calendario" className="space-y-4 mt-0">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h5 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-sky-550" /> Calendario Editorial
              </h5>

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
                <div className="p-4 bg-sky-500/5 rounded-2xl border border-sky-200/50 space-y-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-sky-700 dark:text-sky-400">Calendario Listo</span>
                  <h6 className="text-xs font-bold text-foreground">Tu calendario de contenidos está disponible</h6>
                </div>

                <Button 
                  onClick={() => router.push(`/calendar`)}
                  className="w-full h-11 rounded-xl bg-sky-600 text-white hover:bg-sky-700 font-bold flex items-center justify-center gap-2 shadow-sm"
                >
                  <CalendarDays className="h-4 w-4" /> Ver Calendario de Contenidos
                </Button>
              </div>
            )}
          </TabsContent>
        </ScrollArea>
      </Tabs>

      {/* Barra de Navegación Anclada */}
      {(() => {
        const tabOrder = ["bancodedatos", "estrategia", "campanas", "calendario"];
        const currentIdx = tabOrder.indexOf(activeTab);
        const prevTab = currentIdx > 0 ? tabOrder[currentIdx - 1] : null;
        const nextTab = currentIdx < tabOrder.length - 1 ? tabOrder[currentIdx + 1] : null;

        const nextLabels: Record<string, string> = {
          estrategia: "Estrategias de Growth",
          campanas: "Plan de Campañas",
          calendario: "Calendario Editorial"
        };

        const isNextBlocked = nextTab ? isTabBlocked(nextTab) || (activeTab === "bancodedatos" && !hasScrolledToBottom) : false;

        return (
          <div className="px-5 py-4 border-t bg-muted/20 flex flex-col gap-2 shadow-inner shrink-0">
            {activeTab === "bancodedatos" && !hasScrolledToBottom && (
              <div className="flex items-center justify-center gap-2 animate-pulse">
                <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 tracking-wide">
                  ⚠️ Por favor, realiza scroll hasta el final del informe para habilitar la navegación a Estrategias.
                </span>
              </div>
            )}
            {nextTab && !isNextBlocked && (
              <div className="flex items-center justify-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" />
                <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 tracking-wide">
                  ¡Etapa completada! Presiona continuar para avanzar al siguiente paso
                </span>
                <div className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" />
              </div>
            )}

            <div className="flex items-center justify-between">
              {prevTab ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab(prevTab)}
                  className="rounded-xl h-10 font-bold px-4 hover:bg-muted text-xs transition-all gap-1.5"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Atrás
                </Button>
              ) : (
                <div />
              )}

              {nextTab ? (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setActiveTab(nextTab)}
                  disabled={isNextBlocked}
                  className={`rounded-xl h-11 font-extrabold px-7 text-white shadow-md transition-all text-xs flex items-center gap-2 ${
                    isNextBlocked
                      ? 'bg-slate-300 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none hover:scale-100'
                      : 'bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:via-purple-700 hover:to-indigo-700 hover:shadow-xl scale-100 hover:scale-[1.03] active:scale-[0.98] continue-btn-pulse'
                  }`}
                >
                  Continuar: {nextLabels[nextTab] || nextTab} <ArrowRight className={`h-4 w-4 ${!isNextBlocked ? 'nudge-arrow' : ''}`} />
                </Button>
              ) : (
                <Button
                  onClick={() => router.push(`/business/${businessId}?skipOnboarding=true`)}
                  className="rounded-xl h-11 font-extrabold px-7 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 text-white shadow-md hover:shadow-xl transition-all scale-100 hover:scale-[1.03] active:scale-[0.98] text-xs flex items-center gap-2 action-btn-pulse-emerald"
                >
                  Finalizar y Ver Dashboard <Check className="h-4 w-4 stroke-[3]" />
                </Button>
              )}
            </div>
          </div>
        );
      })()}
    </Card>
  );
}
