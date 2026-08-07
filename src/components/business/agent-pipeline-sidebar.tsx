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
    const interval = setInterval(fetchNotifications, 6000);
    return () => clearInterval(interval);
  }, [businessId]);

  const getStepProcessingStatus = (stepKeys: string[]) => {
    const matching = notifications.filter(n => stepKeys.includes(n.step));
    if (matching.length === 0) return null;

    const latest = matching[0];
    if (latest.status !== "PROCESSING") return null;

    const createdMs = new Date(latest.createdAt).getTime();
    const ageMinutes = (Date.now() - createdMs) / 60000;
    if (ageMinutes > 3) return null;

    return latest.message || "Agente procesando...";
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
      const { startMediaAnalysisStage } = await import("@/actions/business");
      const res = await startMediaAnalysisStage(businessId);
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

  const auditStatus: StepStatus = runningStep === "audit" || !!auditProcessingMsg
    ? "processing"
    : hasAudit ? "completed" : "idle";

  const mediaStatus: StepStatus = runningStep === "media" || !!mediaProcessingMsg
    ? "processing"
    : hasMediaAnalysis ? "completed" : !hasAudit ? "locked" : "idle";

  const strategyStatus: StepStatus = runningStep === "strategy" || !!strategyProcessingMsg
    ? "processing"
    : hasStrategy ? "completed" : !hasAudit ? "locked" : "idle";

  const campaignStatus: StepStatus = runningStep === "campaign" || !!campaignProcessingMsg
    ? "processing"
    : hasCampaign ? "completed" : !hasStrategy ? "locked" : "idle";

  const calendarStatus: StepStatus = runningStep === "calendar" || !!calendarProcessingMsg
    ? "processing"
    : hasCalendar ? "completed" : !hasStrategy ? "locked" : "idle";

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
        <CardDescription className="text-[10.5px] text-muted-foreground dark:text-slate-400 mt-1">
          Ejecuta paso a paso las 5 etapas del flujo inteligente.
        </CardDescription>

        {/* Global Progress Bar */}
        <div className="w-full bg-muted dark:bg-slate-900 h-2 rounded-full mt-2.5 overflow-hidden border border-border dark:border-slate-800">
          <div
            className="bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </CardHeader>

      {/* Contenedor de las 5 Etapas con Scroll Independiente */}
      <CardContent className="flex-1 min-h-0 overflow-y-auto p-3.5 space-y-3">
        {/* Step 1: Digital Audit */}
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
          subAgents={(() => {
            if (hasAudit) {
              return [
                { name: "Agente Extractor", icon: "🕸️", status: "completed" as const },
                { name: "Agente Analista FODA", icon: "📊", status: "completed" as const },
                { name: "Agente Radar de Tendencias", icon: "🔥", status: "completed" as const },
                { name: "Agente Redactor", icon: "📝", status: "completed" as const },
              ];
            }
            if (auditStatus !== "processing") {
              return [
                { name: "Agente Extractor", icon: "🕸️", status: "idle" as const },
                { name: "Agente Analista FODA", icon: "📊", status: "idle" as const },
                { name: "Agente Radar de Tendencias", icon: "🔥", status: "idle" as const },
                { name: "Agente Redactor", icon: "📝", status: "idle" as const },
              ];
            }
            // Sequential cascade: determine phase from notification step
            const latestAuditNotif = notifications.find(n => n.step === "SCRAPING" || n.step === "DIAGNOSTIC");
            const isDiagnostic = latestAuditNotif?.step === "DIAGNOSTIC";
            const scrapingDone = isDiagnostic || notifications.some(n => n.step === "SCRAPING" && n.status === "COMPLETED");

            if (isDiagnostic) {
              // Scraping done → Analista/Radar/Redactor in progress
              return [
                { name: "Agente Extractor", icon: "🕸️", status: "completed" as const },
                { name: "Agente Analista FODA", icon: "📊", status: "processing" as const },
                { name: "Agente Radar de Tendencias", icon: "🔥", status: "processing" as const },
                { name: "Agente Redactor", icon: "📝", status: "idle" as const },
              ];
            }
            if (scrapingDone) {
              // Scraping completed but diagnostic not yet started
              return [
                { name: "Agente Extractor", icon: "🕸️", status: "completed" as const },
                { name: "Agente Analista FODA", icon: "📊", status: "processing" as const },
                { name: "Agente Radar de Tendencias", icon: "🔥", status: "idle" as const },
                { name: "Agente Redactor", icon: "📝", status: "idle" as const },
              ];
            }
            // Still in scraping phase → only Extractor active
            return [
              { name: "Agente Extractor", icon: "🕸️", status: "processing" as const },
              { name: "Agente Analista FODA", icon: "📊", status: "idle" as const },
              { name: "Agente Radar de Tendencias", icon: "🔥", status: "idle" as const },
              { name: "Agente Redactor", icon: "📝", status: "idle" as const },
            ];
          })()}
        />

        {/* Step 2: Visual Assets & Inspiration */}
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
          subAgents={[
            { name: "Agente Paleta & Estética", icon: "🎨", status: mediaStatus === "processing" ? "processing" : hasMediaAnalysis ? "completed" : "idle" },
            { name: "Agente Moodboard", icon: "🖼️", status: mediaStatus === "processing" ? "processing" : hasMediaAnalysis ? "completed" : "idle" }
          ]}
        />

        {/* Step 3: Strategic Plan */}
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
          subAgents={[
            { name: "Agente Buyer Persona", icon: "👤", status: strategyStatus === "processing" ? "processing" : hasStrategy ? "completed" : "idle" },
            { name: "Agente Funnel & Conversión", icon: "🎯", status: strategyStatus === "processing" ? "processing" : hasStrategy ? "completed" : "idle" },
            { name: "Agente Posicionamiento", icon: "📢", status: strategyStatus === "processing" ? "processing" : hasStrategy ? "completed" : "idle" },
            { name: "Agente 8 Pilares Growth", icon: "🚀", status: strategyStatus === "processing" ? "processing" : hasStrategy ? "completed" : "idle" }
          ]}
        />

        {/* Step 4: Campaigns */}
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
          subAgents={[
            { name: "Agente Media Planner", icon: "💰", status: campaignStatus === "processing" ? "processing" : hasCampaign ? "completed" : "idle" },
            { name: "Agente Feriados & Eventos", icon: "🇧🇴", status: campaignStatus === "processing" ? "processing" : hasCampaign ? "completed" : "idle" }
          ]}
        />

        {/* Step 5: Content Calendar */}
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
          subAgents={[
            { name: "Agente Copywriter", icon: "✍️", status: calendarStatus === "processing" ? "processing" : hasCalendar ? "completed" : "idle" },
            { name: "Agente Adaptador 3 Redes", icon: "📱", status: calendarStatus === "processing" ? "processing" : hasCalendar ? "completed" : "idle" },
            { name: "Agente Horarios & Tráfico", icon: "⏰", status: calendarStatus === "processing" ? "processing" : hasCalendar ? "completed" : "idle" },
            { name: "Agente Prompter Visual", icon: "🎨", status: calendarStatus === "processing" ? "processing" : hasCalendar ? "completed" : "idle" }
          ]}
        />

        {/* Footer info */}
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
