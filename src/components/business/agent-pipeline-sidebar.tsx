"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AgentStepCard, StepStatus } from "./agent-step-card";
import { Cpu, Search, Target, Megaphone, Calendar, RefreshCw, Sparkles, Activity, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { 
  startScrapingStage, 
  startStrategyStage, 
  startCampaignStage,
  startCalendarStage 
} from "@/actions/business";

interface AgentPipelineSidebarProps {
  businessId: string;
  hasAudit: boolean;
  hasMediaAnalysis?: boolean;
  hasStrategy: boolean;
  hasCampaign?: boolean;
  hasCalendar: boolean;
  auditId?: string;
  strategyId?: string;
  calendarId?: string;
  activeTab?: string;
  externalRunningStep?: string | null;
  onSelectTab?: (tab: string) => void;
  onRunStage?: (stageName: "scraping" | "media" | "strategy" | "campaign" | "calendar") => void;
}

export function AgentPipelineSidebar({
  businessId,
  hasAudit,
  hasMediaAnalysis = false,
  hasStrategy,
  hasCampaign = false,
  hasCalendar,
  auditId,
  strategyId,
  calendarId,
  activeTab = "bancodedatos",
  externalRunningStep,
  onSelectTab,
  onRunStage
}: AgentPipelineSidebarProps) {
  const router = useRouter();
  const [runningStep, setRunningStep] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Calculate total progress (5 steps total)
  const completedStepsCount = (hasAudit ? 1 : 0) + (hasMediaAnalysis ? 1 : 0) + (hasStrategy ? 1 : 0) + (hasCampaign ? 1 : 0) + (hasCalendar ? 1 : 0);
  const progressPercentage = Math.round((completedStepsCount / 5) * 100);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`/api/business/${businessId}/agent-notifications`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (e) {
      console.error("Error fetching agent notifications:", e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const pollTime = (runningStep || externalRunningStep) ? 2500 : 4500;
    const interval = setInterval(fetchNotifications, pollTime);
    return () => clearInterval(interval);
  }, [businessId, runningStep, externalRunningStep]);

  const getStepProcessingStatus = (stepKeys: string[]) => {
    const matching = notifications.filter(n => stepKeys.includes(n.step));
    if (matching.length === 0) return null;

    const activeProcessing = matching.find(n => {
      if (n.status !== "PROCESSING") return false;
      const createdMs = new Date(n.createdAt).getTime();
      const ageMinutes = (Date.now() - createdMs) / 60000;
      return ageMinutes <= 4;
    });

    if (activeProcessing) {
      return activeProcessing.message || "Agente procesando...";
    }

    return null;
  };

  const handleRunAudit = async () => {
    onSelectTab?.("bancodedatos");
    if (onRunStage) return onRunStage("scraping");
    setRunningStep("audit");
    toast.info("Iniciando Agentes de Extracción y Auditoría Web...");
    try {
      const res = await startScrapingStage(businessId);
      if (res.success) {
        toast.success("Auditoría digital en marcha.");
        router.refresh();
      } else {
        toast.error(res.error || "No se pudo iniciar la auditoría.");
      }
    } catch (err) {
      toast.error("Error al conectar con los agentes de extracción.");
    } finally {
      setRunningStep(null);
    }
  };

  const handleRunMediaAnalysis = async () => {
    onSelectTab?.("activosvisuales");
    if (onRunStage) return onRunStage("media");
    setRunningStep("media");
    toast.info("Agente Vision IA analizando composición y patrones estéticos...");
    try {
      const { analyzeVisualAssetsAction } = await import("@/actions/business");
      const res = await analyzeVisualAssetsAction(businessId);
      if (res.success) {
        toast.success("Análisis visual de IA completado.");
        router.refresh();
      } else {
        toast.info(res.error || "Navegando a la sección de recursos para cargar imágenes.");
      }
    } catch (err) {
      toast.info("Navegando a la sección de recursos visuales.");
    } finally {
      setRunningStep(null);
    }
  };

  const handleRunStrategy = async () => {
    onSelectTab?.("estrategia");
    if (onRunStage) return onRunStage("strategy");
    setRunningStep("strategy");
    toast.info("Agente de Growth formulando los 8 pilares...");
    try {
      const res = await startStrategyStage(businessId);
      if (res.success) {
        toast.success("Plan Estratégico generado exitosamente.");
        router.refresh();
      } else {
        toast.error(res.error || "No se pudo generar la estrategia.");
      }
    } catch (err) {
      toast.error("Error al ejecutar la generación estratégica.");
    } finally {
      setRunningStep(null);
    }
  };

  const handleRunCampaign = async () => {
    onSelectTab?.("campanas");
    if (onRunStage) return onRunStage("campaign");
    setRunningStep("campaign");
    toast.info("Agente de Campañas formulando presupuestos y canales...");
    try {
      const res = await startCampaignStage(businessId);
      if (res.success) {
        toast.success("Campañas de marketing generadas.");
        router.refresh();
      } else {
        toast.error(res.error || "No se pudo generar campañas.");
      }
    } catch (err) {
      toast.error("Error al procesar campañas.");
    } finally {
      setRunningStep(null);
    }
  };

  const handleRunCalendar = async () => {
    router.push("/calendar?openPlanModal=true");
  };

  const auditProcessingMsg = getStepProcessingStatus(["SCRAPING", "DIAGNOSTIC"]);
  const mediaProcessingMsg = getStepProcessingStatus(["MEDIA"]);
  const strategyProcessingMsg = getStepProcessingStatus(["STRATEGY"]);
  const campaignProcessingMsg = getStepProcessingStatus(["CAMPAIGN"]);
  const calendarProcessingMsg = getStepProcessingStatus(["CALENDAR"]);

  // Determinar estrictamente qué ÚNICA etapa está en procesamiento activo (1 a la vez)
  let activeProcessingStep: "scraping" | "diagnostic" | "media" | "strategy" | "campaign" | "calendar" | null = null;
  const effectiveStep = runningStep || externalRunningStep;

  if (effectiveStep) {
    if (effectiveStep === "audit" || effectiveStep === "scraping") activeProcessingStep = "scraping";
    else if (effectiveStep === "media") activeProcessingStep = "media";
    else if (effectiveStep === "strategy") activeProcessingStep = "strategy";
    else if (effectiveStep === "campaign") activeProcessingStep = "campaign";
    else if (effectiveStep === "calendar") activeProcessingStep = "calendar";
  } else {
    // Considerar notificaciones PROCESSING recientes (< 4 min) para cualquier etapa
    const recentProcessing = notifications.filter(n => {
      if (n.status !== "PROCESSING") return false;
      const ageMin = (Date.now() - new Date(n.createdAt).getTime()) / 60000;
      return ageMin <= 4;
    });

    for (const notif of recentProcessing) {
      if (notif.step === "SCRAPING") { activeProcessingStep = "scraping"; break; }
      if (notif.step === "DIAGNOSTIC") { activeProcessingStep = "diagnostic"; break; }
      if (notif.step === "STRATEGY") { activeProcessingStep = "strategy"; break; }
      if (notif.step === "MEDIA") { activeProcessingStep = "media"; break; }
      if (notif.step === "CAMPAIGN") { activeProcessingStep = "campaign"; break; }
      if (notif.step === "CALENDAR") { activeProcessingStep = "calendar"; break; }
    }
  }

  const isAuditDone = hasAudit || hasStrategy;

  const auditStatus: StepStatus = activeProcessingStep === "scraping"
    ? "processing"
    : isAuditDone ? "completed" : "idle";

  const mediaStatus: StepStatus = activeProcessingStep === "media"
    ? "processing"
    : hasMediaAnalysis ? "completed" : !hasAudit ? "locked" : "idle";

  const strategyStatus: StepStatus = (activeProcessingStep === "strategy" || activeProcessingStep === "diagnostic")
    ? "processing"
    : hasStrategy ? "completed" : !hasAudit ? "locked" : "idle";

  const campaignStatus: StepStatus = activeProcessingStep === "campaign"
    ? "processing"
    : hasCampaign ? "completed" : !hasStrategy ? "locked" : "idle";

  const calendarStatus: StepStatus = activeProcessingStep === "calendar"
    ? "processing"
    : hasCalendar ? "completed" : !hasStrategy ? "locked" : "idle";

  const [queueTick, setQueueTick] = useState<number>(0);

  useEffect(() => {
    setQueueTick(0);
  }, [activeProcessingStep]);

  useEffect(() => {
    if (!activeProcessingStep) return;
    const timer = setInterval(() => {
      setQueueTick((prev) => prev + 1);
    }, 2200);
    return () => clearInterval(timer);
  }, [activeProcessingStep]);

  const getRealStage1SubAgents = () => {
    const stage1Notifs = notifications
      .filter(n => n.step === "SCRAPING" || n.step === "DIAGNOSTIC")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const latestNotif = stage1Notifs.length > 0 ? stage1Notifs[0] : null;

    const isDiagnosticActive = (latestNotif?.step === "DIAGNOSTIC" && latestNotif?.status === "PROCESSING");
    const isScrapingActive = (latestNotif?.step === "SCRAPING" && latestNotif?.status === "PROCESSING");
    const isStage1Processing = isScrapingActive || isDiagnosticActive || auditStatus === "processing" || externalRunningStep === "scraping" || runningStep === "scraping";

    if (!isStage1Processing) {
      const defaultStatus = hasAudit ? ("completed" as const) : ("idle" as const);
      return [
        { name: "Agente Extractor", icon: "🕸️", status: defaultStatus },
        { name: "Agente Analista FODA", icon: "📊", status: defaultStatus },
        { name: "Agente Radar de Tendencias", icon: "🔥", status: defaultStatus },
        { name: "Agente Redactor", icon: "📝", status: defaultStatus }
      ];
    }

    let activeIdx = 0;
    if (isDiagnosticActive || latestNotif?.step === "DIAGNOSTIC" || queueTick >= 2) {
      activeIdx = queueTick >= 3 ? 3 : 2;
    } else {
      activeIdx = queueTick >= 1 ? 1 : 0;
    }

    const agents = [
      { name: "Agente Extractor", icon: "🕸️" },
      { name: "Agente Analista FODA", icon: "📊" },
      { name: "Agente Radar de Tendencias", icon: "🔥" },
      { name: "Agente Redactor", icon: "📝" }
    ];

    return agents.map((a, idx) => {
      if (idx < activeIdx) return { ...a, status: "completed" as const };
      if (idx === activeIdx) return { ...a, status: "processing" as const };
      return { ...a, status: "idle" as const };
    });
  };

  const getSequentialSubAgents = (
    agentsList: Array<{ name: string; icon: string }>,
    isProcessing: boolean,
    isCompleted: boolean
  ) => {
    // Si está procesando activamente, avanzar de 1 en 1 sin bucle
    if (isProcessing) {
      const activeIdx = Math.min(queueTick, agentsList.length - 1);
      return agentsList.map((a, idx) => {
        if (idx < activeIdx) return { ...a, status: "completed" as const };
        if (idx === activeIdx) return { ...a, status: "processing" as const };
        return { ...a, status: "idle" as const };
      });
    }
    if (isCompleted) {
      return agentsList.map(a => ({ ...a, status: "completed" as const }));
    }
    return agentsList.map(a => ({ ...a, status: "idle" as const }));
  };

  const isAuditProc = effectiveStep === "audit" || effectiveStep === "scraping" || auditStatus === "processing";
  const isMediaProc = effectiveStep === "media" || mediaStatus === "processing";
  const isStratProc = effectiveStep === "strategy" || strategyStatus === "processing";
  const isCampProc = effectiveStep === "campaign" || campaignStatus === "processing";
  const isCalProc = effectiveStep === "calendar" || calendarStatus === "processing";

  return (
    <Card className="h-full min-h-0 flex flex-col border border-border dark:border-cyan-500/20 bg-card dark:bg-[#0D1526] text-card-foreground dark:text-slate-100 shadow-lg overflow-hidden rounded-2xl">
      {/* Header (Fijo al inicio de la columna) */}
      <CardHeader className="shrink-0 border-b border-border dark:border-cyan-500/10 bg-muted/40 dark:bg-[#080E1A]/80 pb-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="h-4.5 w-4.5 text-slate-700 dark:text-cyan-400 animate-pulse" />
            <CardTitle className="text-sm font-extrabold tracking-tight">
              Flujo Operativo IA
            </CardTitle>
          </div>
          <Badge className="bg-slate-100 dark:bg-cyan-500/10 text-slate-700 dark:text-cyan-400 border-slate-200 dark:border-cyan-500/20 text-[10px] font-black">
            {progressPercentage}% Listo (5 Etapas)
          </Badge>
        </div>

        <div className="space-y-1 pt-1">
          <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground">
            <span>Progreso del Pipeline</span>
            <span className="text-orange-600 dark:text-orange-400 font-extrabold">{progressPercentage}%</span>
          </div>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-500 rounded-full" 
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 min-h-0 overflow-y-auto p-3.5 space-y-3">
        <AgentStepCard
          stepNumber={1}
          title="1. Banco de Datos & Auditoría Digital"
          description=""
          icon={Search}
          status={auditStatus}
          processingMessage={auditProcessingMsg || "Escaneando sitio y competidores..."}
          onExecute={handleRunAudit}
          onViewReport={() => onSelectTab?.("bancodedatos")}
          viewText="Ver Banco de Datos"
          actionText="Auditar Canales"
          isActive={activeTab === "bancodedatos"}
          subAgents={getRealStage1SubAgents()}
        />

        <AgentStepCard
          stepNumber={2}
          title="2. Activos Visuales e Inspiración"
          description=""
          icon={ImageIcon}
          status={mediaStatus}
          processingMessage={mediaProcessingMsg || "Agente Vision IA analizando composición y estilos..."}
          onExecute={handleRunMediaAnalysis}
          onViewReport={() => onSelectTab?.("activosvisuales")}
          viewText="Gestionar Recursos"
          actionText="Analizar Recursos"
          isActive={activeTab === "activosvisuales"}
          subAgents={getSequentialSubAgents([
            { name: "Agente Paleta & Estética", icon: "🎨" },
            { name: "Agente Moodboard", icon: "🖼️" }
          ], isMediaProc, hasMediaAnalysis)}
        />

        <AgentStepCard
          stepNumber={3}
          title="3. Estrategia Growth de Marketing"
          description=""
          icon={Target}
          status={strategyStatus}
          processingMessage={strategyProcessingMsg || "Agente analizando 8 pilares..."}
          onExecute={handleRunStrategy}
          onViewReport={() => onSelectTab?.("estrategia")}
          viewText="Ver Estrategia"
          actionText="Generar Plan"
          isActive={activeTab === "estrategia"}
          subAgents={getSequentialSubAgents([
            { name: "Agente Buyer Persona", icon: "👤" },
            { name: "Agente Funnel & Conversión", icon: "🎯" },
            { name: "Agente Posicionamiento", icon: "📢" },
            { name: "Agente 8 Pilares Growth", icon: "🚀" }
          ], isStratProc, hasStrategy)}
        />

        <AgentStepCard
          stepNumber={4}
          title="4. Campaña Principal de Marketing"
          description=""
          icon={Megaphone}
          status={campaignStatus}
          processingMessage={campaignProcessingMsg || "Agente diseñando campañas..."}
          onExecute={handleRunCampaign}
          onViewReport={() => onSelectTab?.("campanas")}
          viewText="Ver Campañas"
          actionText="Generar Campañas"
          isActive={activeTab === "campanas"}
          subAgents={getSequentialSubAgents([
            { name: "Agente Media Planner", icon: "💰" },
            { name: "Agente Feriados & Eventos", icon: "🇧🇴" }
          ], isCampProc, hasCampaign)}
        />

        <AgentStepCard
          stepNumber={5}
          title="5. Calendario & Plan de Publicaciones"
          description=""
          icon={Calendar}
          status={calendarStatus}
          processingMessage={calendarProcessingMsg || "Redactando copies y guiones..."}
          onExecute={handleRunCalendar}
          onViewReport={() => onSelectTab?.("calendario")}
          viewText="Ver Calendario"
          actionText="Crear Calendario"
          isActive={activeTab === "calendario"}
          subAgents={getSequentialSubAgents([
            { name: "Agente Copywriter", icon: "✍️" },
            { name: "Agente Adaptador 3 Redes", icon: "📱" },
            { name: "Agente Horarios & Tráfico", icon: "⏰" },
            { name: "Agente Prompter Visual", icon: "🎨" }
          ], isCalProc, hasCalendar)}
        />

        <div className="pt-2 border-t border-border dark:border-slate-800/60 flex items-center justify-between text-[10px] text-muted-foreground dark:text-slate-400">
          <span className="flex items-center gap-1">
            <Activity className="h-3 w-3 text-slate-500 dark:text-cyan-400" /> 5 Etapas del Pipeline Activas
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchNotifications}
            className="h-6 px-2 text-[10px] text-muted-foreground dark:text-slate-400 hover:text-foreground dark:hover:text-white hover:bg-muted dark:hover:bg-slate-800"
          >
            <RefreshCw className="h-2.5 w-2.5 mr-1" /> Actualizar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
