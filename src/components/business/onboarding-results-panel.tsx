"use client";

import { useState, useEffect } from "react";
import { 
  getOnboardingResults, 
  startScrapingStage, 
  startDiagnosticStage, 
  startStrategyStage, 
  startCampaignStage,
  startCalendarStage
} from "@/actions/business";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ScrapingReportDialog } from "@/components/business/scraping-report-dialog";
import { CompetitorGeneralReportDialog } from "@/components/business/competitor-general-report-dialog";
import { 
  FileText, ShieldCheck, Target, Users, Megaphone, 
  CheckCircle2, Loader2, Network, HelpCircle, ArrowRight, ArrowLeft,
  Database, Eye, EyeIcon, CalendarDays, Compass, MessageSquare,
  Play, RefreshCw, Check, X, Clock, Cpu, Bot, Sparkles, Layers, AlertTriangle,
  Facebook, Instagram, Globe, Lock
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

interface OnboardingResultsPanelProps {
  businessId: string;
}

export function OnboardingResultsPanel({ businessId }: OnboardingResultsPanelProps) {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("extracciones");

  const [scrapingLoading, setScrapingLoading] = useState(false);
  const [diagnosticLoading, setDiagnosticLoading] = useState(false);
  const [strategyLoading, setStrategyLoading] = useState(false);
  const [campaignLoading, setCampaignLoading] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(false);

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
    setScrapingLoading(true);
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

  const handleStartCampaign = async () => {
    setCampaignLoading(true);
    try {
      const res = await startCampaignStage(businessId);
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

  // Detectar si hay algún agente activamente procesando
  const hasActiveProcessing = notifications.some(n => n.status === 'PROCESSING') ||
    scrapingLoading || diagnosticLoading || strategyLoading || campaignLoading || calendarLoading;

  useEffect(() => {
    fetchResults();
    fetchNotifications();
  }, [businessId]);

  // Polling inteligente: solo cuando hay agentes trabajando, y a ritmo moderado
  useEffect(() => {
    if (!hasActiveProcessing) return;
    const interval = setInterval(() => {
      fetchResults(true);
      fetchNotifications(true);
    }, 8000);
    return () => clearInterval(interval);
  }, [businessId, hasActiveProcessing]);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-card/40 border rounded-3xl min-h-[350px] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
        <div className="text-center space-y-1">
          <p className="text-sm font-bold text-foreground">Cargando resultados generados...</p>
          <p className="text-xs text-muted-foreground">La IA está compilando los informes y diagnósticos.</p>
        </div>
      </div>
    );
  }

  const businessReports = data?.businessReports || [];
  const competitorReports = data?.competitorReports || [];
  const activeStrategy = data?.activeStrategy;
  const campaigns = data?.campaigns || [];
  const competitorsList = data?.competitorsList || [];

  // Filtrar los reportes de canales individuales (excluir CONSOLIDATED de la pestaña de Análisis)
  const individualBusinessReports = businessReports.filter((r: any) => r.channel !== "CONSOLIDATED");
  const consolidatedReport = businessReports.find((r: any) => r.channel === "CONSOLIDATED");

  // Parse JSON payloads safely
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
    
    if (!report) return 'idle'; // En cola / No iniciado
    if (report.status === 'COMPLETED') return 'completed';
    if (report.status === 'FAILED') return 'failed';
    return 'processing'; // Procesando
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

  // Verificar si ya se completó el calendario (usualmente cuando hay campañas generadas)
  const isCalendarReady = campaigns.length > 0;

  const isTabBlocked = (tabName: string): boolean => {
    // 1. Si los datos específicos de esta pestaña ya existen, NUNCA la bloqueamos
    if (tabName === "extracciones") return false;
    if (tabName === "analisis" && (individualBusinessReports.length > 0 || competitorReports.length > 0)) return false;
    if (tabName === "informe" && (consolidatedReport || data?.businessInfo?.competitorGeneralReport)) return false;
    if (tabName === "estrategia" && activeStrategy) return false;
    if (tabName === "campanas" && campaigns.length > 0) return false;
    if (tabName === "calendario" && isCalendarReady) return false;

    // 2. Si no existen los datos, evaluamos la secuencia en base al estado del paso anterior
    if (tabName === "analisis") {
      return getStepStatus("SCRAPING") !== "completed";
    }
    if (tabName === "informe") {
      return getStepStatus("ANALYSIS") !== "completed";
    }
    if (tabName === "estrategia") {
      return getStepStatus("DIAGNOSTIC") !== "completed";
    }
    if (tabName === "campanas") {
      return getStepStatus("STRATEGY") !== "completed";
    }
    if (tabName === "calendario") {
      return getStepStatus("CAMPAIGN") !== "completed";
    }
    return false;
  };

  const getStepStatus = (stepKey: string) => {
    // 1. Primero checar si hay notificación activa de procesamiento para la etapa
    const stepNotifs = notifications.filter(n => n.step === stepKey);
    if (stepNotifs.length > 0) {
      const latestNotif = stepNotifs[0];
      if (latestNotif.status === 'PROCESSING') {
        const createdTime = new Date(latestNotif.createdAt).getTime();
        if (Date.now() - createdTime > 600000) {
          // Timeout 10 min — caer al fallback de datos
        } else {
          return 'processing';
        }
      }
      if (latestNotif.status === 'FAILED') return 'failed';
      if (latestNotif.status === 'COMPLETED') return 'completed';
    }

    // 2. Si es la etapa de Extracción (SCRAPING), SOLO se marca como completada o en proceso
    // si hay notificaciones específicas de ella (evitando activarse de la nada).
    if (stepKey === 'SCRAPING') {
      if (scrapingLoading) return 'processing';
      const hasScrapingNotifications = stepNotifs.length > 0;
      if (!hasScrapingNotifications) return 'idle';
      
      // Si hay notificaciones y tenemos reportes individuales, consideramos completado
      if (individualBusinessReports.length > 0 || competitorReports.length > 0) {
        return 'completed';
      }
      return 'idle';
    }

    // 3. Para las demás etapas, evaluamos secuencialmente. 
    // Ninguna etapa posterior puede estar activa si su predecesor no está completado.
    switch (stepKey) {
      case 'ANALYSIS':
        // Requiere que SCRAPING esté completed
        if (getStepStatus('SCRAPING') !== 'completed') return 'idle';
        if (individualBusinessReports.length > 0 || competitorReports.length > 0) return 'completed';
        break;
      case 'DIAGNOSTIC':
        // Requiere que ANALYSIS esté completed
        if (getStepStatus('ANALYSIS') !== 'completed') return 'idle';
        if (diagnosticLoading) return 'processing';
        if (consolidatedReport || data?.businessInfo?.competitorGeneralReport) return 'completed';
        break;
      case 'STRATEGY':
        // Requiere que DIAGNOSTIC esté completed
        if (getStepStatus('DIAGNOSTIC') !== 'completed') return 'idle';
        if (strategyLoading) return 'processing';
        if (activeStrategy) return 'completed';
        break;
      case 'CAMPAIGN':
        // Requiere que STRATEGY esté completed
        if (getStepStatus('STRATEGY') !== 'completed') return 'idle';
        if (campaignLoading) return 'processing';
        if (campaigns.length > 0) return 'completed';
        break;
      case 'CALENDAR':
        // Requiere que CAMPAIGN esté completed
        if (getStepStatus('CAMPAIGN') !== 'completed') return 'idle';
        if (isCalendarReady) return 'completed';
        break;
    }

    return 'idle';
  };



  const parsedStrategyObj = activeStrategy ? {
    objectives: parseJson(activeStrategy.objectives) || [],
    personas: parseJson(activeStrategy.personas) || [],
    funnelStages: parseJson(activeStrategy.funnelStages) || [],
    channels: parseJson(activeStrategy.channels) || []
  } : null;

  // Determinar si el botón de acción de una etapa debe pulsar para guiar al usuario
  const shouldActionPulse = (tabName: string): boolean => {
    if (activeTab !== tabName) return false;
    switch (tabName) {
      case "extracciones":
        return getStepStatus("SCRAPING") === "idle" && !scrapingLoading;
      case "analisis":
        return (individualBusinessReports.length === 0 && competitorReports.length === 0) && !diagnosticLoading;
      case "informe":
        return (!consolidatedReport && !data?.businessInfo?.competitorGeneralReport) && !diagnosticLoading;
      case "estrategia":
        return !activeStrategy && !strategyLoading;
      case "campanas":
        return campaigns.length === 0 && !campaignLoading;
      default:
        return false;
    }
  };

  const pipelineAgents = [
    { key: "SCRAPING", label: "Agente de Extracción", icon: Cpu, tab: "extracciones", color: "slate" },
    { key: "ANALYSIS", label: "Agente de Análisis", icon: FileText, tab: "analisis", color: "blue" },
    { key: "DIAGNOSTIC", label: "Agente de Diagnóstico", icon: Layers, tab: "informe", color: "orange" },
    { key: "STRATEGY", label: "Agente de Estrategia", icon: Sparkles, tab: "estrategia", color: "purple" },
    { key: "CAMPAIGN", label: "Agente de Planificación", icon: Bot, tab: "campanas", color: "emerald" },
    { key: "CALENDAR", label: "Agente Editorial", icon: ShieldCheck, tab: "calendario", color: "sky" },
  ];

  const getAgentStatusStyle = (stepKey: string) => {
    const status = getStepStatus(stepKey);
    if (status === 'processing') return { ring: 'ring-2 ring-blue-500/40 animate-pulse', bg: 'bg-blue-500/10 border-blue-400/40', text: 'text-blue-600 dark:text-blue-400', label: 'Procesando' };
    if (status === 'completed') return { ring: '', bg: 'bg-emerald-500/10 border-emerald-400/40', text: 'text-emerald-600 dark:text-emerald-400', label: 'Completado' };
    if (status === 'failed') return { ring: '', bg: 'bg-rose-500/10 border-rose-400/40', text: 'text-rose-600 dark:text-rose-400', label: 'Error' };
    return { ring: '', bg: 'bg-muted/40 border-transparent', text: 'text-muted-foreground/50', label: '' };
  };

  return (
    <Card className="border border-slate-100 dark:border-slate-800/80 shadow-xl bg-card/60 backdrop-blur-md flex flex-col min-h-[500px] rounded-3xl overflow-hidden">
      {/* Animaciones CSS para el efecto tutorial guiado */}
      <style>{`
        @keyframes guided-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.5); }
          50% { box-shadow: 0 0 16px 4px rgba(249, 115, 22, 0.35); }
        }
        @keyframes guided-pulse-violet {
          0%, 100% { 
            box-shadow: 0 0 0 0 rgba(124, 58, 237, 0.6), 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            transform: scale(1.02);
          }
          50% { 
            box-shadow: 0 0 25px 8px rgba(139, 92, 246, 0.5), 0 10px 15px -3px rgba(139, 92, 246, 0.3);
            transform: scale(1.06);
          }
        }
        @keyframes guided-pulse-emerald {
          0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5); }
          50% { box-shadow: 0 0 16px 4px rgba(16, 185, 129, 0.35); }
        }
        @keyframes guided-pulse-purple {
          0%, 100% { box-shadow: 0 0 0 0 rgba(147, 51, 234, 0.5); }
          50% { box-shadow: 0 0 16px 4px rgba(147, 51, 234, 0.35); }
        }
        @keyframes bounce-arrow-right {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(6px); }
        }
        @keyframes celebration-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .action-btn-pulse { animation: guided-pulse 2s ease-in-out infinite; }
        .action-btn-pulse-purple { animation: guided-pulse-purple 2s ease-in-out infinite; }
        .action-btn-pulse-emerald { animation: guided-pulse-emerald 2s ease-in-out infinite; }
        .continue-btn-pulse { 
          animation: guided-pulse-violet 1.6s ease-in-out infinite;
        }
        .nudge-arrow { animation: bounce-arrow-right 0.8s ease-in-out infinite; }
        .step-completed-shimmer {
          background: linear-gradient(90deg, transparent 0%, rgba(16,185,129,0.08) 50%, transparent 100%);
          background-size: 200% 100%;
          animation: celebration-shimmer 3s ease-in-out infinite;
        }
      `}</style>

      {/* Header premium */}
      <div className="px-6 py-5 border-b bg-gradient-to-r from-violet-500/5 via-background to-indigo-500/5">
        <h4 className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2">
          <Cpu className="h-4.5 w-4.5 text-violet-600 dark:text-violet-400 animate-pulse" />
          Progreso del Diagnóstico e Inteligencia de Marca
        </h4>
        <p className="text-xs text-muted-foreground mt-0.5">
          Sigue el flujo de trabajo de los agentes de Inteligencia Artificial etapa por etapa.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        {/* Etapas de agentes responsivas */}
        <div className="px-6 py-5 border-b bg-muted/10">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {pipelineAgents.map((agent, idx) => {
              const status = getStepStatus(agent.key);
              const style = getAgentStatusStyle(agent.key);
              const AgentIcon = agent.icon;
              const isActive = activeTab === agent.tab;
              const isBlocked = isTabBlocked(agent.tab);

              const activeColors: Record<string, string> = {
                slate: 'from-slate-500/10 to-slate-500/3 border-slate-300 dark:from-slate-400/20 dark:to-slate-400/5 dark:border-slate-700',
                blue: 'from-blue-500/10 to-blue-500/3 border-blue-300 dark:from-blue-400/20 dark:to-blue-400/5 dark:border-blue-700',
                orange: 'from-orange-500/10 to-orange-500/3 border-orange-300 dark:from-orange-400/20 dark:to-orange-400/5 dark:border-orange-700',
                purple: 'from-purple-500/10 to-purple-500/3 border-purple-300 dark:from-purple-400/20 dark:to-purple-400/5 dark:border-purple-700',
                emerald: 'from-emerald-500/10 to-emerald-500/3 border-emerald-300 dark:from-emerald-400/20 dark:to-emerald-400/5 dark:border-emerald-700',
                sky: 'from-sky-500/10 to-sky-500/3 border-sky-300 dark:from-sky-400/20 dark:to-sky-400/5 dark:border-sky-700',
              };

              const activeTextColors: Record<string, string> = {
                slate: 'text-slate-800 dark:text-slate-200',
                blue: 'text-blue-700 dark:text-blue-300',
                orange: 'text-orange-700 dark:text-orange-300',
                purple: 'text-purple-700 dark:text-purple-300',
                emerald: 'text-emerald-700 dark:text-emerald-300',
                sky: 'text-sky-700 dark:text-sky-300',
              };

              const activeIconBg: Record<string, string> = {
                slate: 'bg-slate-500/15 border-slate-400/40 shadow-sm',
                blue: 'bg-blue-500/15 border-blue-400/40 shadow-sm',
                orange: 'bg-orange-500/15 border-orange-400/40 shadow-sm',
                purple: 'bg-purple-500/15 border-purple-400/40 shadow-sm',
                emerald: 'bg-emerald-500/15 border-emerald-400/40 shadow-sm',
                sky: 'bg-sky-500/15 border-sky-400/40 shadow-sm',
              };

              return (
                <button
                  key={agent.key}
                  disabled={isBlocked && activeTab !== agent.tab}
                  onClick={() => {
                    if (isBlocked) {
                      toast.error(`La Etapa ${idx} (${pipelineAgents[idx - 1]?.label || ""}) debe finalizar para desbloquear esta etapa.`);
                      return;
                    }
                    setActiveTab(agent.tab);
                  }}
                  className={`relative flex flex-col items-center justify-between text-center p-3 rounded-2xl border transition-all duration-300 ${
                    isBlocked
                      ? 'bg-slate-50/40 dark:bg-slate-900/10 border-slate-100 dark:border-slate-900 opacity-40 cursor-not-allowed'
                      : isActive 
                        ? `bg-gradient-to-b ${activeColors[agent.color]} shadow-md scale-[1.02] border-violet-500/40 dark:border-violet-500/30 ring-1 ring-violet-500/10` 
                        : status === 'completed'
                          ? 'bg-background hover:bg-muted/40 border-emerald-300/60 dark:border-emerald-800/60 hover:scale-[1.01] cursor-pointer step-completed-shimmer'
                          : 'bg-background hover:bg-muted/40 border-slate-100 dark:border-slate-800 hover:scale-[1.01] cursor-pointer'
                  }`}
                >
                  <div className="w-full flex flex-col items-center gap-1.5">
                    {/* Número de Etapa */}
                    <span className={`text-[8px] font-black uppercase tracking-widest leading-none ${
                      isActive ? 'text-violet-600 dark:text-violet-400' : 'text-muted-foreground/50'
                    }`}>
                      Etapa 0{idx + 1}
                    </span>

                    {/* Icono */}
                    <div className={`h-9 w-9 rounded-xl border flex items-center justify-center transition-all duration-300 ${
                      isBlocked
                        ? 'bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-900 text-slate-400'
                        : isActive 
                          ? activeIconBg[agent.color]
                          : status !== 'idle' ? `${style.bg} ${style.ring}` : 'bg-muted/40 border-muted-foreground/10'
                    }`}>
                      {isBlocked ? (
                        <Lock className="h-3.5 w-3.5" />
                      ) : status === 'processing' ? (
                        <Loader2 className={`h-4.5 w-4.5 animate-spin ${isActive ? activeTextColors[agent.color] : style.text}`} />
                      ) : status === 'completed' ? (
                        <Check className={`h-4.5 w-4.5 stroke-[3] ${isActive ? activeTextColors[agent.color] : style.text}`} />
                      ) : status === 'failed' ? (
                        <AlertTriangle className={`h-4.5 w-4.5 ${isActive ? 'text-rose-600' : style.text}`} />
                      ) : (
                        <AgentIcon className={`h-4.5 w-4.5 transition-all duration-200 ${
                          isActive ? activeTextColors[agent.color] : 'text-muted-foreground/40'
                        }`} />
                      )}
                    </div>

                    {/* Label del Agente */}
                    <span className={`text-[10px] font-bold leading-tight transition-colors ${
                      isActive ? 'text-violet-700 dark:text-violet-300 font-extrabold' : 'text-muted-foreground/80'
                    }`}>
                      {agent.label}
                    </span>
                  </div>

                  {/* Estado Badge */}
                  <div className="mt-2 w-full">
                    {isBlocked ? (
                      <span className="text-[7px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-400 border border-slate-200 dark:border-slate-800">
                        BLOQUEADO
                      </span>
                    ) : status !== 'idle' ? (
                      <span className={`text-[7px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        status === 'processing' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
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

        {/* TabsList oculto para Radix — la navegación visual la manejan los botones del pipeline */}
        <TabsList className="sr-only">
          <TabsTrigger value="extracciones">Extrac.</TabsTrigger>
          <TabsTrigger value="analisis">Análisis</TabsTrigger>
          <TabsTrigger value="informe">Informe</TabsTrigger>
          <TabsTrigger value="estrategia">Estrat.</TabsTrigger>
          <TabsTrigger value="campanas">Camp.</TabsTrigger>
          <TabsTrigger value="calendario">Calend.</TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1 p-5 h-[420px]">
          {/* TAB 1: EXTRACCIONES */}
          <TabsContent value="extracciones" className="space-y-4 mt-0">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h5 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <Database className="h-3.5 w-3.5 text-slate-500" /> Canales Registrados para Scraping
              </h5>
              
              <div className="flex items-center gap-2">
                {data?.businessInfo && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 text-xs font-bold gap-1 rounded-xl">
                        <Eye className="h-3.5 w-3.5 text-orange-600" /> Perfil
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg rounded-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
                      <DialogHeader className="p-6 pb-2">
                        <DialogTitle className="text-sm font-black uppercase tracking-widest text-orange-700">
                          Perfil del Negocio e Identidad de Marca
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                          Datos generales e identidad de marca estructurados a partir de la propuesta de valor.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="flex-1 overflow-y-auto p-6 pt-2 max-h-[60vh] pr-4 space-y-4">
                        <div className="space-y-4 text-xs pb-4">
                          {/* 1. Información General */}
                          <div className="space-y-3 bg-muted/20 p-3.5 rounded-xl border">
                            <span className="font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider block text-[10px] border-b pb-1">
                              Información General
                            </span>
                            <div className="grid grid-cols-2 gap-3 pb-1">
                              <div>
                                <span className="font-bold text-slate-700 dark:text-slate-300 block text-[9px] uppercase">Nombre del Negocio</span>
                                <span className="text-muted-foreground font-medium">{data.businessInfo.name}</span>
                              </div>
                              {data.businessInfo.website && (
                                <div>
                                  <span className="font-bold text-slate-700 dark:text-slate-300 block text-[9px] uppercase">Sitio Web</span>
                                  <a href={data.businessInfo.website} target="_blank" rel="noopener noreferrer" className="text-orange-600 dark:text-orange-400 hover:underline font-bold">
                                    {data.businessInfo.website}
                                  </a>
                                </div>
                              )}
                            </div>
                            
                            {/* Voz de Marca */}
                            {(() => {
                              const voice = parseJson(data.businessInfo.brandVoice);
                              if (!voice) return null;
                              
                              const formatTags = (val: any): string[] => {
                                if (!val) return [];
                                if (Array.isArray(val)) return val;
                                if (typeof val === "string") {
                                  if (val.includes(",")) {
                                    return val.split(",").map(s => s.trim()).filter(Boolean);
                                  }
                                  // Separar mayúsculas pegadas como "AlegreFestivoAmigable"
                                  const separated = val.replace(/([A-Z])/g, ' $1').trim();
                                  return separated.split(/\s+/).map(s => s.trim()).filter(Boolean);
                                }
                                  return [];
                              };

                              const tones = formatTags(voice.tone);
                              const personalities = formatTags(voice.personality);

                              return (
                                <div className="space-y-2.5">
                                  <span className="font-bold text-slate-700 dark:text-slate-300 block text-[9px] uppercase">Tono y Personalidad</span>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                    {tones.length > 0 && (
                                      <div className="bg-background/80 p-2.5 rounded-lg border space-y-1">
                                        <span className="text-[9px] text-muted-foreground block uppercase font-bold">Tono de Voz</span>
                                        <div className="flex flex-wrap gap-1">
                                          {tones.map((t, idx) => (
                                            <Badge key={idx} variant="secondary" className="bg-orange-500/10 text-orange-700 hover:bg-orange-500/10 border-none rounded-lg text-[9px] font-bold px-1.5 py-0.5">
                                              {t}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {personalities.length > 0 && (
                                      <div className="bg-background/80 p-2.5 rounded-lg border space-y-1">
                                        <span className="text-[9px] text-muted-foreground block uppercase font-bold">Personalidad</span>
                                        <div className="flex flex-wrap gap-1">
                                          {personalities.map((p, idx) => (
                                            <Badge key={idx} variant="secondary" className="bg-purple-500/10 text-purple-700 hover:bg-purple-500/10 border-none rounded-lg text-[9px] font-bold px-1.5 py-0.5">
                                              {p}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })()}

                            {/* Colores y Fuentes */}
                            {(() => {
                              const colors = parseJson(data.businessInfo.brandColors);
                              const fonts = parseJson(data.businessInfo.brandFonts);
                              if (!colors && !fonts) return null;
                              return (
                                <div className="grid grid-cols-2 gap-3 pt-1">
                                  {colors && (
                                    <div>
                                      <span className="font-bold text-slate-700 dark:text-slate-300 block text-[9px] uppercase">Paleta de Colores</span>
                                      <div className="flex gap-2 items-center mt-1">
                                        {colors.primary && (
                                          <div className="flex items-center gap-1">
                                            <div className="h-4 w-4 rounded-full border border-slate-300 shadow-sm" style={{ backgroundColor: colors.primary }} />
                                            <span className="text-[8px] font-mono text-muted-foreground">{colors.primary}</span>
                                          </div>
                                        )}
                                        {colors.secondary && (
                                          <div className="flex items-center gap-1">
                                            <div className="h-4 w-4 rounded-full border border-slate-300 shadow-sm" style={{ backgroundColor: colors.secondary }} />
                                            <span className="text-[8px] font-mono text-muted-foreground">{colors.secondary}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                  {fonts && (
                                    <div>
                                      <span className="font-bold text-slate-700 dark:text-slate-300 block text-[9px] uppercase">Tipografía</span>
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

                          {/* 2. DAFO y Posicionamiento */}
                          <div className="space-y-3 bg-muted/20 p-3.5 rounded-xl border">
                            <span className="font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider block text-[10px] border-b pb-1">
                              Foco Estratégico
                            </span>
                            <div>
                              <span className="font-bold text-slate-700 dark:text-slate-300 block text-[9px] uppercase">Propuesta de Valor</span>
                              <p className="text-muted-foreground mt-0.5 leading-relaxed font-medium">
                                {data.businessInfo.valueProposition}
                              </p>
                            </div>
                            {data.businessInfo.targetAudience && (() => {
                              const audience = parseJson(data.businessInfo.targetAudience);
                              if (!audience) return null;
                              
                              // Si es un objeto estructurado
                              if (audience && (audience.demographics || audience.psychographics)) {
                                return (
                                  <div className="space-y-2">
                                    <span className="font-bold text-slate-700 dark:text-slate-300 block text-[9px] uppercase">Público Objetivo Modelado</span>
                                    <div className="space-y-2">
                                      {audience.demographics && (
                                        <div className="bg-background/80 p-2.5 rounded-lg border">
                                          <span className="text-[9px] text-muted-foreground block uppercase font-bold">Demografía</span>
                                          <p className="text-[11px] text-foreground mt-0.5 leading-relaxed font-medium">{audience.demographics}</p>
                                        </div>
                                      )}
                                      {audience.psychographics && (
                                        <div className="bg-background/80 p-2.5 rounded-lg border">
                                          <span className="text-[9px] text-muted-foreground block uppercase font-bold">Psicografía</span>
                                          <p className="text-[11px] text-foreground mt-0.5 leading-relaxed font-medium">{audience.psychographics}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              }

                              const audienceText = typeof audience === "string" ? audience : audience.profile || audience.description || JSON.stringify(audience);
                              return (
                                <div>
                                  <span className="font-bold text-slate-700 dark:text-slate-300 block text-[9px] uppercase">Público Objetivo Modelado</span>
                                  <p className="text-muted-foreground bg-background/80 p-2 rounded-lg border mt-0.5 leading-relaxed font-medium">
                                    {audienceText}
                                  </p>
                                </div>
                              );
                            })()}
                          </div>

                          {/* 3. Colores y Fuentes */}
                          {(() => {
                            const colors = parseJson(data.businessInfo.brandColors);
                            const fonts = parseJson(data.businessInfo.brandFonts);
                            if (!colors && !fonts) return null;
                            return (
                              <div className="space-y-3 bg-muted/20 p-3.5 rounded-xl border">
                                <span className="font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider block text-[10px] border-b pb-1">
                                  Identidad Visual
                                </span>
                                <div className="grid grid-cols-2 gap-3">
                                  {colors && (
                                    <div>
                                      <span className="font-bold text-slate-700 dark:text-slate-300 block text-[9px] uppercase">Paleta de Colores</span>
                                      <div className="flex gap-2 items-center mt-1">
                                        {colors.primary && (
                                          <div className="flex items-center gap-1">
                                            <div className="h-4 w-4 rounded-full border border-slate-300 shadow-sm" style={{ backgroundColor: colors.primary }} />
                                            <span className="text-[8px] font-mono text-muted-foreground">{colors.primary}</span>
                                          </div>
                                        )}
                                        {colors.secondary && (
                                          <div className="flex items-center gap-1">
                                            <div className="h-4 w-4 rounded-full border border-slate-300 shadow-sm" style={{ backgroundColor: colors.secondary }} />
                                            <span className="text-[8px] font-mono text-muted-foreground">{colors.secondary}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                  {fonts && (
                                    <div>
                                      <span className="font-bold text-slate-700 dark:text-slate-300 block text-[9px] uppercase">Tipografía</span>
                                      <p className="font-medium text-foreground mt-0.5">
                                        {fonts.body || fonts.heading || "Google Fonts (Inter)"}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
                
                <Button 
                  onClick={handleStartScraping}
                  disabled={scrapingLoading}
                  className={`h-8 text-xs font-bold gap-1 rounded-xl bg-orange-600 hover:bg-orange-700 text-white transition-all ${
                    shouldActionPulse("extracciones") ? 'action-btn-pulse scale-105' : ''
                  }`}
                >
                  {scrapingLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Play className="h-3 w-3 fill-current" />
                  )}
                  Iniciar Extracción
                </Button>
              </div>
            </div>



            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bloque: Mi Negocio */}
              <div className="bg-gradient-to-b from-slate-50/50 to-background dark:from-slate-900/30 dark:to-card p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-violet-500 animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">Mi Negocio</span>
                  </div>
                  <Badge variant="secondary" className="text-[9px] font-bold">Propio</Badge>
                </div>

                {data?.businessInfo ? (
                  <div className="space-y-2">
                    {data.businessInfo.website && (
                      <div className="flex items-center justify-between p-2.5 bg-background/50 hover:bg-background/80 transition-all rounded-xl border border-slate-100 dark:border-slate-800 gap-4">
                        <div className="flex items-center gap-2.5 truncate min-w-0">
                          {getSocialIcon("WEBSITE")}
                          <div className="flex flex-col truncate">
                            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-none">Sitio Web</span>
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate mt-0.5">{data.businessInfo.website}</span>
                          </div>
                        </div>
                        {renderStatusIcon(getChannelStatus(businessId, "WEBSITE", false))}
                      </div>
                    )}
                    {(() => {
                      const socialLinks = parseJson(data.businessInfo.socialLinks) || {};
                      return Object.entries(socialLinks).map(([channel, url]) => {
                        if (!url || typeof url !== "string" || url.trim() === "") return null;
                        return (
                          <div key={channel} className="flex items-center justify-between p-2.5 bg-background/50 hover:bg-background/80 transition-all rounded-xl border border-slate-100 dark:border-slate-800 gap-4">
                            <div className="flex items-center gap-2.5 truncate min-w-0">
                              {getSocialIcon(channel)}
                              <div className="flex flex-col truncate">
                                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-none">{channel}</span>
                                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate mt-0.5">{url}</span>
                              </div>
                            </div>
                            {renderStatusIcon(getChannelStatus(businessId, channel, false))}
                          </div>
                        );
                      });
                    })()}
                  </div>
                ) : (
                  <div className="flex items-center justify-center p-6 text-xs text-muted-foreground">
                    Cargando canales registrados...
                  </div>
                )}
              </div>

              {/* Bloque: Competidores */}
              <div className="bg-gradient-to-b from-slate-50/50 to-background dark:from-slate-900/30 dark:to-card p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">Competidores Analizados</span>
                  </div>
                  <Badge variant="secondary" className="text-[9px] font-bold bg-orange-500/10 text-orange-700 border-none">Mercado</Badge>
                </div>

                {competitorsList.length === 0 ? (
                  <div className="flex items-center justify-center p-6 text-xs text-muted-foreground italic">
                    Sin competidores registrados.
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                    {competitorsList.map((c: any) => (
                      <div key={c.id} className="space-y-2 p-3 bg-muted/20 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                        <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wide block">
                          {c.name}
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {c.website && (
                            <div className="flex items-center justify-between p-2 bg-background/50 rounded-lg border border-slate-100 dark:border-slate-800 gap-3">
                              <div className="flex items-center gap-2 min-w-0 truncate">
                                {getSocialIcon("WEBSITE")}
                                <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400 truncate">{c.website}</span>
                              </div>
                              {renderStatusIcon(getChannelStatus(c.id, "WEBSITE", true))}
                            </div>
                          )}
                          {c.facebook && (
                            <div className="flex items-center justify-between p-2 bg-background/50 rounded-lg border border-slate-100 dark:border-slate-800 gap-3">
                              <div className="flex items-center gap-2 min-w-0 truncate">
                                {getSocialIcon("FACEBOOK")}
                                <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400 truncate">{c.facebook}</span>
                              </div>
                              {renderStatusIcon(getChannelStatus(c.id, "FACEBOOK", true))}
                            </div>
                          )}
                          {c.instagram && (
                            <div className="flex items-center justify-between p-2 bg-background/50 rounded-lg border border-slate-100 dark:border-slate-800 gap-3">
                              <div className="flex items-center gap-2 min-w-0 truncate">
                                {getSocialIcon("INSTAGRAM")}
                                <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400 truncate">{c.instagram}</span>
                              </div>
                              {renderStatusIcon(getChannelStatus(c.id, "INSTAGRAM", true))}
                            </div>
                          )}
                          {c.tiktok && (
                            <div className="flex items-center justify-between p-2 bg-background/50 rounded-lg border border-slate-100 dark:border-slate-800 gap-3">
                              <div className="flex items-center gap-2 min-w-0 truncate">
                                {getSocialIcon("TIKTOK")}
                                <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400 truncate">{c.tiktok}</span>
                              </div>
                              {renderStatusIcon(getChannelStatus(c.id, "TIKTOK", true))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: ANÁLISIS */}
          <TabsContent value="analisis" className="space-y-4 mt-0">
            {individualBusinessReports.length === 0 && competitorReports.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 bg-muted/10 rounded-2xl border border-dashed text-center min-h-[220px] space-y-4">
                <Loader2 className="h-6 w-6 text-orange-600 opacity-60" />
                <div className="space-y-1">
                  <span className="text-xs font-bold text-muted-foreground block">Auditoría y Análisis Pendiente</span>
                  <p className="text-[10px] text-muted-foreground max-w-xs leading-relaxed">
                    Aún no se han extraído ni analizado los canales registrados. Activa el agente de extracción para comenzar.
                  </p>
                </div>
                <Button
                  onClick={handleStartScraping}
                  disabled={scrapingLoading}
                  className="h-9 px-6 text-xs font-bold gap-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white shadow-sm"
                >
                  {scrapingLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Play className="h-3 w-3 fill-current" />
                  )}
                  Iniciar Auditoría y Análisis
                </Button>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                  <h5 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-blue-500" /> Auditoría e Informes de Canales
                  </h5>
                  
                  <Button 
                    onClick={handleStartDiagnostic}
                    disabled={diagnosticLoading}
                    className={`h-8 text-xs font-bold gap-1 rounded-xl bg-orange-600 hover:bg-orange-700 text-white transition-all ${
                      shouldActionPulse("informe") ? 'action-btn-pulse scale-105' : ''
                    }`}
                  >
                    {diagnosticLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Play className="h-3 w-3 fill-current" />
                    )}
                    Generar Diagnóstico e Informe
                  </Button>
                </div>



                <div>
                  <h5 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5 border-t pt-3">
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" /> Mi Negocio (Canales Auditados)
                  </h5>
                  {individualBusinessReports.length === 0 ? (
                    <div className="p-4 bg-muted/20 rounded-2xl border border-dashed text-center text-xs text-muted-foreground">
                      Esperando que los agentes de scraping finalicen de auditar tus canales...
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2.5">
                      {individualBusinessReports.map((report: any) => (
                        <div key={report.id} className="p-3 bg-muted/30 hover:bg-muted/40 rounded-xl border flex items-center justify-between transition-all group">
                          <div className="space-y-0.5">
                            <span className="text-[11px] font-bold text-foreground capitalize">
                              Canal: {report.channel}
                            </span>
                            <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                              URL: {report.url || "Autodetectada"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-emerald-500/10 border-emerald-500/30 text-emerald-600 font-black text-[9px] rounded-lg">
                              AUDITADO
                            </Badge>
                            <ScrapingReportDialog data={report.data} channel={report.channel} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <h5 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-orange-500" /> Competidores (Canales Analizados)
                  </h5>
                  {competitorReports.length === 0 ? (
                    <div className="p-4 bg-muted/20 rounded-2xl border border-dashed text-center text-xs text-muted-foreground">
                      Esperando que los agentes de scraping extraigan la huella digital de tus rivales...
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2.5">
                      {competitorReports.map((report: any) => {
                        const compName = competitorsList.find((c: any) => c.id === report.entityId)?.name || "Competidor";
                        return (
                          <div key={report.id} className="p-3 bg-muted/30 hover:bg-muted/40 rounded-xl border flex items-center justify-between transition-all group">
                            <div className="space-y-0.5">
                              <span className="text-[11px] font-bold text-foreground">
                                {compName} ({report.channel})
                              </span>
                              <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                                URL: {report.url || "Autodetectada"}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="bg-emerald-500/10 border-emerald-500/30 text-emerald-600 font-black text-[9px] rounded-lg">
                                ANALIZADO
                              </Badge>
                              <ScrapingReportDialog data={report.data} channel={report.channel} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}

          </TabsContent>

          {/* TAB 3: INFORME CONSOLIDADO */}
          <TabsContent value="informe" className="space-y-4 mt-0">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h5 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <Compass className="h-3.5 w-3.5 text-orange-500" /> Diagnóstico y Reportes Consolidados
              </h5>
              
              <Button 
                onClick={handleStartDiagnostic}
                disabled={diagnosticLoading}
                className="h-8 text-xs font-bold gap-1 rounded-xl bg-orange-600 hover:bg-orange-700 text-white"
              >
                {diagnosticLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Play className="h-3 w-3 fill-current" />
                )}
                {consolidatedReport || data?.businessInfo?.competitorGeneralReport ? "Regenerar" : "Generar Diagnóstico"}
              </Button>
            </div>



            {!consolidatedReport && !data?.businessInfo?.competitorGeneralReport ? (
              <div className="flex flex-col items-center justify-center p-8 bg-muted/10 rounded-2xl border border-dashed text-center min-h-[180px] space-y-4">
                <Loader2 className="h-6 w-6 text-orange-500 opacity-60" />
                <div className="space-y-1">
                  <span className="text-xs font-bold text-muted-foreground block">Informes Pendientes de Generación</span>
                  <p className="text-[10px] text-muted-foreground max-w-xs leading-relaxed">
                    El Agente de Diagnóstico integrará los datos de todos tus canales y de tus competidores para formular los informes globales.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="p-4 bg-orange-500/5 rounded-2xl border border-orange-200/50 space-y-1.5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-orange-700 dark:text-orange-400">Diagnóstico Estratégico</span>
                  <h6 className="text-xs font-bold text-foreground">Informes Consolidados de Mercado</h6>
                  <p className="text-[10px] text-muted-foreground leading-relaxed max-w-xs">
                    La IA ha analizado las fortalezas, debilidades y métricas SEO de tu negocio y tus competidores.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Bloque 1: Mi Negocio */}
                  <div className="p-4 bg-background/50 border rounded-2xl flex flex-col justify-between min-h-[140px] space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Badge className="bg-blue-500/10 text-blue-700 border-none font-bold text-[8px] rounded-lg">PROPIO</Badge>
                        {consolidatedReport ? (
                          <Badge variant="outline" className="bg-emerald-500/10 border-emerald-500/20 text-emerald-600 font-bold text-[8px] rounded-lg py-0 px-1.5 flex items-center gap-1 shrink-0 h-4">
                            <Check className="h-2 w-2 stroke-[4]" /> GENERADO
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-slate-500/10 border-slate-500/20 text-slate-500 font-bold text-[8px] rounded-lg py-0 px-1.5 flex items-center gap-1 shrink-0 h-4">
                            <Clock className="h-2.5 w-2.5" /> PENDIENTE
                          </Badge>
                        )}
                      </div>
                      <h6 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">Diagnóstico de Mi Negocio</h6>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        Análisis integral de tus canales digitales registrados, SEO y experiencia de usuario.
                      </p>
                    </div>
                    {consolidatedReport ? (
                      <div className="pt-2 flex justify-start">
                        <ScrapingReportDialog data={consolidatedReport.data} channel="CONSOLIDATED" />
                      </div>
                    ) : (
                      <span className="text-[9px] text-muted-foreground italic">Generando análisis propio...</span>
                    )}
                  </div>

                  {/* Bloque 2: Competidores */}
                  <div className="p-4 bg-background/50 border rounded-2xl flex flex-col justify-between min-h-[140px] space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Badge className="bg-orange-500/10 text-orange-700 border-none font-bold text-[8px] rounded-lg">COMPETENCIA</Badge>
                        {data?.businessInfo?.competitorGeneralReport ? (
                          <Badge variant="outline" className="bg-emerald-500/10 border-emerald-500/20 text-emerald-600 font-bold text-[8px] rounded-lg py-0 px-1.5 flex items-center gap-1 shrink-0 h-4">
                            <Check className="h-2 w-2 stroke-[4]" /> GENERADO
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-slate-500/10 border-slate-500/20 text-slate-500 font-bold text-[8px] rounded-lg py-0 px-1.5 flex items-center gap-1 shrink-0 h-4">
                            <Clock className="h-2.5 w-2.5" /> PENDIENTE
                          </Badge>
                        )}
                      </div>
                      <h6 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">Informe de Competencia</h6>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        Análisis comparativo de posicionamiento de mercado frente a tus competidores registrados.
                      </p>
                    </div>
                    {data?.businessInfo?.competitorGeneralReport ? (
                      <div className="pt-2 flex justify-start">
                        <CompetitorGeneralReportDialog reportData={data.businessInfo.competitorGeneralReport} />
                      </div>
                    ) : (
                      <span className="text-[9px] text-muted-foreground italic">Generando análisis comparativo...</span>
                    )}
                  </div>
                </div>

              </div>
            )}
          </TabsContent>

          {/* TAB 4: ESTRATEGIA */}
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
              <div className="space-y-4 animate-in fade-in duration-300">
                {/* Header de la estrategia */}
                <div className="p-4 bg-gradient-to-br from-purple-500/5 via-violet-500/3 to-indigo-500/5 rounded-2xl border border-purple-200/50 dark:border-purple-900/40 space-y-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-purple-700 dark:text-purple-400">Estrategia Activa</span>
                  <h6 className="text-sm font-bold text-foreground capitalize">{activeStrategy.name}</h6>
                  {activeStrategy.description && (
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      {activeStrategy.description}
                    </p>
                  )}
                </div>

                {/* Buyer Personas */}
                {parsedStrategyObj.personas.length > 0 && (
                  <div className="space-y-2">
                    <h6 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-purple-500" /> Buyer Personas Definidos
                    </h6>
                    <div className="grid grid-cols-1 gap-2.5">
                      {parsedStrategyObj.personas.map((persona: any, index: number) => (
                        <div key={index} className="p-3.5 bg-muted/30 rounded-xl border space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/20 text-purple-600 text-[10px] font-black shrink-0">
                              P{index + 1}
                            </div>
                            <span className="text-[11px] font-bold text-foreground">{persona.name || persona.nombre || `Audiencia ${index + 1}`}</span>
                          </div>
                          {(persona.description || persona.profile || persona.perfil) && (
                            <p className="text-[10px] text-muted-foreground leading-relaxed">{persona.description || persona.profile || persona.perfil}</p>
                          )}
                          <div className="flex flex-wrap gap-1.5">
                            {persona.age && <Badge variant="secondary" className="text-[8px] font-bold rounded-md bg-purple-500/5 border-none">{persona.age}</Badge>}
                            {persona.edad && <Badge variant="secondary" className="text-[8px] font-bold rounded-md bg-purple-500/5 border-none">{persona.edad}</Badge>}
                            {persona.gender && <Badge variant="secondary" className="text-[8px] font-bold rounded-md bg-purple-500/5 border-none">{persona.gender}</Badge>}
                            {persona.location && <Badge variant="secondary" className="text-[8px] font-bold rounded-md bg-blue-500/5 border-none">{persona.location}</Badge>}
                            {persona.ubicacion && <Badge variant="secondary" className="text-[8px] font-bold rounded-md bg-blue-500/5 border-none">{persona.ubicacion}</Badge>}
                            {persona.income && <Badge variant="secondary" className="text-[8px] font-bold rounded-md bg-emerald-500/5 border-none">{persona.income}</Badge>}
                          </div>
                          {(persona.painPoints || persona.pain_points || persona.problemas) && (
                            <div className="space-y-1">
                              <span className="text-[8px] font-black uppercase tracking-wider text-muted-foreground">Puntos de Dolor</span>
                              <div className="flex flex-wrap gap-1">
                                {(Array.isArray(persona.painPoints || persona.pain_points || persona.problemas) 
                                  ? (persona.painPoints || persona.pain_points || persona.problemas) 
                                  : [persona.painPoints || persona.pain_points || persona.problemas]
                                ).map((p: any, i: number) => (
                                  <Badge key={i} variant="outline" className="text-[8px] font-medium rounded-md bg-rose-500/5 border-rose-200/50 text-rose-700 dark:text-rose-400">
                                    {typeof p === 'string' ? p : p.title || p.description || JSON.stringify(p)}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Objetivos */}
                {parsedStrategyObj.objectives.length > 0 && (
                  <div className="space-y-2">
                    <h6 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-purple-500" /> Objetivos de Crecimiento
                    </h6>
                    <div className="grid grid-cols-1 gap-2">
                      {parsedStrategyObj.objectives.map((obj: any, index: number) => (
                        <div key={index} className="p-3 bg-muted/30 rounded-xl border space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-purple-500/10 border-purple-500/30 text-purple-600 font-bold rounded-lg shrink-0 text-[9px]">
                              OBJ {index + 1}
                            </Badge>
                            <span className="text-[10px] font-bold text-foreground leading-tight">
                              {typeof obj === "string" ? obj : obj.title || obj.name || obj.objetivo || obj.description}
                            </span>
                          </div>
                          {typeof obj !== "string" && (obj.description || obj.details || obj.detalle || obj.kpi) && (
                            <p className="text-[9px] text-muted-foreground leading-relaxed pl-[52px]">
                              {obj.description || obj.details || obj.detalle}
                              {obj.kpi && <span className="font-bold text-purple-600"> · KPI: {obj.kpi}</span>}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Embudo de Conversión */}
                {parsedStrategyObj.funnelStages.length > 0 && (
                  <div className="space-y-2">
                    <h6 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                      <Network className="h-3.5 w-3.5 text-purple-500" /> Embudo de Conversión
                    </h6>
                    <div className="flex flex-wrap gap-1.5">
                      {parsedStrategyObj.funnelStages.map((stage: any, i: number) => (
                        <div key={i} className="flex items-center gap-1">
                          <Badge variant="outline" className="bg-violet-500/5 border-violet-300/40 text-violet-700 dark:text-violet-300 font-bold text-[9px] rounded-lg px-2.5 py-1">
                            {typeof stage === 'string' ? stage : stage.name || stage.stage || stage.etapa}
                          </Badge>
                          {i < parsedStrategyObj.funnelStages.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground/40" />}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Canales */}
                {parsedStrategyObj.channels.length > 0 && (
                  <div className="space-y-2">
                    <h6 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                      <Compass className="h-3.5 w-3.5 text-purple-500" /> Canales de Distribución
                    </h6>
                    <div className="flex flex-wrap gap-1.5">
                      {parsedStrategyObj.channels.map((ch: any, i: number) => (
                        <Badge key={i} variant="secondary" className="bg-indigo-500/5 text-indigo-700 dark:text-indigo-300 font-bold text-[9px] rounded-lg border border-indigo-200/40">
                          {typeof ch === 'string' ? ch : ch.name || ch.platform || ch.canal}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pilares de Contenido */}
                {(() => {
                  const pillars = parseJson(activeStrategy.contentPillars) || [];
                  if (!Array.isArray(pillars) || pillars.length === 0) return null;
                  return (
                    <div className="space-y-2">
                      <h6 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                        <Layers className="h-3.5 w-3.5 text-purple-500" /> Pilares de Contenido
                      </h6>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {pillars.map((pillar: any, i: number) => (
                          <div key={i} className="p-2.5 bg-muted/20 rounded-xl border space-y-0.5">
                            <span className="text-[10px] font-bold text-foreground">
                              {typeof pillar === 'string' ? pillar : pillar.name || pillar.title || pillar.pilar}
                            </span>
                            {typeof pillar !== 'string' && (pillar.description || pillar.descripcion) && (
                              <p className="text-[9px] text-muted-foreground leading-relaxed">{pillar.description || pillar.descripcion}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

              </div>
            )}
          </TabsContent>

          {/* TAB 5: CAMPAÑAS */}
          <TabsContent value="campanas" className="space-y-4 mt-0">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h5 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <Megaphone className="h-3.5 w-3.5 text-emerald-500" /> Plan de Campañas y Calendario
              </h5>
              
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



            {campaigns.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 bg-muted/10 rounded-2xl border border-dashed text-center min-h-[180px] space-y-4">
                <Loader2 className="h-6 w-6 text-emerald-500 opacity-60" />
                <div className="space-y-1">
                  <span className="text-xs font-bold text-muted-foreground block">Plan de Campañas Pendiente</span>
                  <p className="text-[10px] text-muted-foreground max-w-xs leading-relaxed">
                    El Agente de Planificación diseñará tu plan de campañas y calendario editorial multicanal.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 animate-in fade-in duration-300">
                <div className="p-3 bg-muted/20 rounded-xl border flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Plan Editorial</span>
                    <h6 className="text-[11px] font-bold text-foreground">Campañas e Ideas de Contenido Listas</h6>
                  </div>
                  <Button
                    onClick={handleStartCampaign}
                    disabled={campaignLoading}
                    variant="outline"
                    className="h-8 text-[10px] font-bold gap-1 rounded-xl"
                  >
                    <RefreshCw className={`h-3 w-3 ${campaignLoading ? 'animate-spin' : ''}`} /> Regenerar
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {campaigns.map((camp: any) => {
                    const channelsList = parseJson(camp.channels) || [];
                    const targeting = parseJson(camp.targeting) || {};
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
                          
                          {camp.description && (
                            <p className="text-[10px] text-muted-foreground leading-relaxed">
                              {camp.description}
                            </p>
                          )}

                          {/* Metadatos Rápidos */}
                          <div className="flex flex-wrap gap-2 pt-1">
                            {camp.objective && (
                              <Badge variant="secondary" className="text-[8px] font-bold bg-blue-500/5 text-blue-700 border-none rounded-md px-1.5">
                                Objetivo: {camp.objective}
                              </Badge>
                            )}
                            {camp.budget && (
                              <Badge variant="secondary" className="text-[8px] font-bold bg-emerald-500/5 text-emerald-700 border-none rounded-md px-1.5">
                                Presupuesto: ${Number(camp.budget)} USD
                              </Badge>
                            )}
                          </div>

                          {/* Canales */}
                          {channelsList.length > 0 && (
                            <div className="flex items-center gap-1.5 pt-1.5">
                              <span className="text-[8px] font-black uppercase text-muted-foreground">Canales:</span>
                              <div className="flex gap-1">
                                {channelsList.map((chan: any, index: number) => {
                                  const platform = typeof chan === 'object' ? (chan.platform || chan.name) : String(chan);
                                  return (
                                    <Badge key={index} variant="outline" className="text-[8px] font-bold rounded-md bg-slate-500/5 text-slate-700 dark:text-slate-300">
                                      {platform}
                                    </Badge>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Botón para Detalles / Modal */}
                        <div className="pt-2 flex justify-end border-t border-dashed mt-1">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="h-7 text-[9px] font-black rounded-lg gap-1 border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/5">
                                <EyeIcon className="h-3 w-3" /> Ver Segmentación y Contenido
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg rounded-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
                              <DialogHeader className="p-5 pb-2">
                                <DialogTitle className="text-xs font-black uppercase tracking-widest text-emerald-700 flex items-center gap-2">
                                  <Megaphone className="h-4 w-4" /> Detalle de Campaña: {camp.name}
                                </DialogTitle>
                              </DialogHeader>

                              <div className="flex-1 overflow-y-auto p-5 pt-1 space-y-4 max-h-[60vh] text-xs">
                                {/* Segmentación (Targeting) */}
                                <div className="p-3 bg-muted/20 rounded-xl border space-y-2">
                                  <span className="font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider block text-[9.5px] border-b pb-1">
                                    Segmentación de Audiencia
                                  </span>
                                  {targeting.demographics && (
                                    <div>
                                      <span className="font-bold text-[9px] text-muted-foreground uppercase block">Demografía</span>
                                      <span className="text-foreground">{targeting.demographics}</span>
                                    </div>
                                  )}
                                  {targeting.interests && (
                                    <div>
                                      <span className="font-bold text-[9px] text-muted-foreground uppercase block">Intereses Clave</span>
                                      <span className="text-foreground">{Array.isArray(targeting.interests) ? targeting.interests.join(", ") : targeting.interests}</span>
                                    </div>
                                  )}
                                  {targeting.geography && (
                                    <div>
                                      <span className="font-bold text-[9px] text-muted-foreground uppercase block">Ubicación Geográfica</span>
                                      <span className="text-foreground">{targeting.geography}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Fechas y Presupuesto */}
                                <div className="grid grid-cols-2 gap-3 p-3 bg-muted/20 rounded-xl border">
                                  <div>
                                    <span className="font-bold text-[9px] text-muted-foreground uppercase block">Fecha de Inicio</span>
                                    <span className="text-foreground font-semibold">
                                      {camp.startDate ? new Date(camp.startDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : 'No definida'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="font-bold text-[9px] text-muted-foreground uppercase block">Fecha de Cierre</span>
                                    <span className="text-foreground font-semibold">
                                      {camp.endDate ? new Date(camp.endDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : 'No definida'}
                                    </span>
                                  </div>
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

          {/* TAB 6: CALENDARIO */}
          <TabsContent value="calendario" className="space-y-4 mt-0">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h5 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-sky-500" /> Calendario Editorial
              </h5>

              <Button 
                onClick={handleStartCalendar}
                disabled={calendarLoading || campaignLoading}
                className="h-8 text-xs font-bold gap-1 rounded-xl bg-sky-600 hover:bg-sky-700 text-white"
              >
                {calendarLoading || campaignLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
                {isCalendarReady ? "Regenerar Calendario" : "Generar Calendario"}
              </Button>
            </div>

            {!isCalendarReady ? (
              <div className="flex flex-col items-center justify-center p-8 bg-muted/10 rounded-2xl border border-dashed text-center min-h-[180px] space-y-4">
                <Loader2 className="h-6 w-6 text-sky-500 opacity-60" />
                <div className="space-y-1">
                  <span className="text-xs font-bold text-muted-foreground block">Calendario Pendiente</span>
                  <p className="text-[10px] text-muted-foreground max-w-xs leading-relaxed">
                    El Agente Editorial generará tu calendario de publicaciones una vez que las campañas estén listas.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="p-4 bg-sky-500/5 rounded-2xl border border-sky-200/50 space-y-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-sky-700 dark:text-sky-400">Calendario Listo</span>
                  <h6 className="text-xs font-bold text-foreground">Tu calendario de contenidos está disponible</h6>
                  
                  {/* Rango de fechas dinámico */}
                  {(() => {
                    const startDates = campaigns.map((c: any) => c.startDate ? new Date(c.startDate).getTime() : Date.now());
                    const endDates = campaigns.map((c: any) => c.endDate ? new Date(c.endDate).getTime() : Date.now());
                    const minDate = new Date(Math.min(...startDates));
                    const maxDate = new Date(Math.max(...endDates));
                    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
                    
                    return (
                      <div className="flex items-center gap-1.5 text-[10px] text-sky-700 dark:text-sky-400 font-bold bg-sky-500/10 px-2.5 py-1 rounded-lg w-fit mt-1">
                        <CalendarDays className="h-3 w-3 shrink-0" />
                        <span>Rango: {minDate.toLocaleDateString('es-ES', options)} - {maxDate.toLocaleDateString('es-ES', options)}</span>
                      </div>
                    );
                  })()}

                  <p className="text-[10px] text-muted-foreground leading-relaxed pt-1">
                    Las campañas y publicaciones han sido distribuidas en tu calendario editorial multicanal de forma automatizada.
                  </p>
                </div>

                {/* Lista resumida de contenidos generados */}
                {data?.calendarContents && data.calendarContents.length > 0 && (
                  <div className="space-y-2.5">
                    <h6 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5 text-sky-500" /> Próximas Publicaciones Planificadas
                    </h6>
                    <div className="grid grid-cols-1 gap-2 max-h-[220px] overflow-y-auto pr-1">
                      {data.calendarContents.map((post: any) => (
                        <div key={post.id} className="p-3 bg-muted/20 hover:bg-muted/30 rounded-xl border flex items-center justify-between gap-3 transition-all">
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              {post.channel && (
                                <Badge variant="outline" className="text-[8px] font-bold rounded bg-sky-500/5 text-sky-700 dark:text-sky-300 py-0 px-1 border-sky-200/50">
                                  {post.channel}
                                </Badge>
                              )}
                              <span className="text-[10px] font-bold text-foreground truncate block">{post.title}</span>
                            </div>
                            {post.scheduledAt && (
                              <span className="text-[9px] text-muted-foreground block">
                                {new Date(post.scheduledAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                          
                          {/* Visualización rápida de caption */}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 text-[9px] font-semibold text-sky-600 hover:text-sky-700 hover:bg-sky-500/5 px-2">
                                Ver Copia
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md rounded-2xl text-xs space-y-3">
                              <DialogHeader>
                                <DialogTitle className="text-xs font-black uppercase tracking-widest text-sky-700">
                                  Contenido del Post ({post.channel || 'Red Social'})
                                </DialogTitle>
                              </DialogHeader>
                              <div className="space-y-2">
                                <span className="font-bold text-[10px] text-muted-foreground block uppercase">Título</span>
                                <p className="text-foreground font-semibold p-2.5 bg-muted/40 rounded-xl border">{post.title}</p>
                              </div>
                              {(post.body || post.caption) && (
                                <div className="space-y-2">
                                  <span className="font-bold text-[10px] text-muted-foreground block uppercase">Mensaje (Caption)</span>
                                  <p className="text-foreground leading-relaxed whitespace-pre-line p-3 bg-muted/40 rounded-xl border max-h-[200px] overflow-y-auto">
                                    {post.caption || post.body}
                                  </p>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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

      {/* Barra de Navegación Unificada Anclada */}
      {(() => {
        const tabOrder = ["extracciones", "analisis", "informe", "estrategia", "campanas", "calendario"];
        const currentIdx = tabOrder.indexOf(activeTab);
        const prevTab = currentIdx > 0 ? tabOrder[currentIdx - 1] : null;
        const nextTab = currentIdx < tabOrder.length - 1 ? tabOrder[currentIdx + 1] : null;

        const nextLabels: Record<string, string> = {
          analisis: "Análisis Detallado",
          informe: "Informe de Competencia",
          estrategia: "Estrategia Inteligente",
          campanas: "Plan de Campañas",
          calendario: "Calendario Editorial"
        };

        return (
          <div className="px-5 py-4 border-t bg-muted/20 flex flex-col gap-2 shadow-inner shrink-0">
            {/* Hint de guía tutorial cuando el siguiente paso está desbloqueado */}
            {nextTab && !isTabBlocked(nextTab) && (
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
                  disabled={isTabBlocked(nextTab)}
                  className={`rounded-xl h-11 font-extrabold px-7 text-white shadow-md transition-all text-xs flex items-center gap-2 ${
                    isTabBlocked(nextTab)
                      ? 'bg-slate-300 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none hover:scale-100'
                      : 'bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:via-purple-700 hover:to-indigo-700 hover:shadow-xl scale-100 hover:scale-[1.03] active:scale-[0.98] continue-btn-pulse'
                  }`}
                >
                  Continuar: {nextLabels[nextTab] || nextTab} <ArrowRight className={`h-4 w-4 ${!isTabBlocked(nextTab) ? 'nudge-arrow' : ''}`} />
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
