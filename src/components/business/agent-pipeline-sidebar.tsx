"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AgentStepCard, StepStatus } from "./agent-step-card";
import { Cpu, Search, Target, Megaphone, Calendar, RefreshCw, Sparkles, Activity } from "lucide-react";
import { toast } from "sonner";
import { 
  startScrapingStage, 
  startStrategyStage, 
  startCampaignStage,
  startCalendarStage 
} from "@/actions/business";
import { useRouter } from "next/navigation";

interface AgentPipelineSidebarProps {
  businessId: string;
  hasAudit: boolean;
  hasStrategy: boolean;
  hasCampaign?: boolean;
  hasCalendar: boolean;
  auditId?: string;
  strategyId?: string;
  calendarId?: string;
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
  onRunStage?: (stageName: "scraping" | "strategy" | "campaign" | "calendar") => void;
}

export function AgentPipelineSidebar({
  businessId,
  hasAudit,
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

  // Calculate total progress (4 steps total)
  const completedStepsCount = (hasAudit ? 1 : 0) + (hasStrategy ? 1 : 0) + (hasCampaign ? 1 : 0) + (hasCalendar ? 1 : 0);
  const progressPercentage = Math.round((completedStepsCount / 4) * 100);

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

    // Obtener la notificación más reciente para estos pasos
    const latest = matching[0];
    if (latest.status !== "PROCESSING") return null;

    // Ignorar si la notificación fue creada hace más de 3 minutos (proceso atascado o viejo)
    const createdMs = new Date(latest.createdAt).getTime();
    const ageMinutes = (Date.now() - createdMs) / 60000;
    if (ageMinutes > 3) return null;

    return latest.message || "Agente procesando...";
  };

  const handleRunAudit = async () => {
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

  const handleRunStrategy = async () => {
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
    if (onRunStage) return onRunStage("calendar");
    setRunningStep("calendar");
    toast.info("Agente Editorial construyendo el calendario de 30 días...");
    try {
      const res = await startCalendarStage(businessId);
      if (res.success) {
        toast.success("Calendario de contenido publicado y programado.");
        router.refresh();
      } else {
        toast.error(res.error || "No se pudo generar el calendario.");
      }
    } catch (err) {
      toast.error("Error al procesar el calendario.");
    } finally {
      setRunningStep(null);
    }
  };

  const auditProcessingMsg = getStepProcessingStatus(["SCRAPING", "DIAGNOSTIC"]);
  const strategyProcessingMsg = getStepProcessingStatus(["STRATEGY"]);
  const campaignProcessingMsg = getStepProcessingStatus(["CAMPAIGN"]);
  const calendarProcessingMsg = getStepProcessingStatus(["CALENDAR"]);

  const auditStatus: StepStatus = runningStep === "audit" || !!auditProcessingMsg
    ? "processing"
    : hasAudit ? "completed" : "idle";

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
    <Card className="border border-cyan-500/20 bg-[#0D1526] text-slate-100 shadow-2xl overflow-hidden rounded-2xl mh-glow-cyan sticky top-6">
      {/* Header */}
      <CardHeader className="border-b border-cyan-500/10 bg-[#080E1A]/80 pb-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="h-4.5 w-4.5 text-cyan-400 animate-pulse" />
            <CardTitle className="text-sm font-extrabold tracking-tight">
              Flujo Operativo IA
            </CardTitle>
          </div>
          <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 text-[10px] font-black">
            {progressPercentage}% Listo (4 Etapas)
          </Badge>
        </div>
        <CardDescription className="text-[10.5px] text-slate-400 mt-1">
          Ejecuta paso a paso las 4 etapas con agentes autónomos de IA.
        </CardDescription>

        {/* Global Progress Bar */}
        <div className="w-full bg-slate-900 h-2 rounded-full mt-2.5 overflow-hidden border border-slate-800">
          <div
            className="bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </CardHeader>

      <CardContent className="p-3.5 space-y-3">
        {/* Step 1: Digital Audit */}
        <AgentStepCard
          stepNumber={1}
          title="1. Auditoría Digital & FODA"
          description="Escaneo web, redes sociales y competidores"
          icon={Search}
          status={auditStatus}
          processingMessage={auditProcessingMsg || "Escaneando sitio y competidores..."}
          onExecute={handleRunAudit}
          onViewReport={() => onSelectTab?.("bancodedatos")}
          actionText="Auditar Canales"
          isActive={activeTab === "bancodedatos"}
        />

        {/* Step 2: Strategic Plan */}
        <AgentStepCard
          stepNumber={2}
          title="2. Plan Estratégico IA"
          description="Modelado de 8 pilares, buyer personas y gaps"
          icon={Target}
          status={strategyStatus}
          processingMessage={strategyProcessingMsg || "Agente analizando 8 pilares..."}
          onExecute={handleRunStrategy}
          onViewReport={() => onSelectTab?.("estrategia")}
          actionText="Generar Plan"
          isActive={activeTab === "estrategia"}
        />

        {/* Step 3: Campaigns */}
        <AgentStepCard
          stepNumber={3}
          title="3. Campañas de Marketing"
          description="Formulación de campañas, presupuestos y objetivos"
          icon={Megaphone}
          status={campaignStatus}
          processingMessage={campaignProcessingMsg || "Agente diseñando campañas..."}
          onExecute={handleRunCampaign}
          onViewReport={() => onSelectTab?.("campanas")}
          actionText="Generar Campañas"
          isActive={activeTab === "campanas"}
        />

        {/* Step 4: Content Calendar */}
        <AgentStepCard
          stepNumber={4}
          title="4. Calendario Editorial"
          description="Contenido mensual 60-25-15, copies y prompts"
          icon={Calendar}
          status={calendarStatus}
          processingMessage={calendarProcessingMsg || "Redactando copies y guiones..."}
          onExecute={handleRunCalendar}
          onViewReport={() => onSelectTab?.("calendario")}
          actionText="Crear Calendario"
          isActive={activeTab === "calendario"}
        />

        {/* Footer info */}
        <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
          <span className="flex items-center gap-1">
            <Activity className="h-3 w-3 text-cyan-400" /> 4 Agentes Autónomos Activos
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchNotifications}
            className="h-6 px-2 text-[10px] text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <RefreshCw className="h-2.5 w-2.5 mr-1" /> Actualizar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
