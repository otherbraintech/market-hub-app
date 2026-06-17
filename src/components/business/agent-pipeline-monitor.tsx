"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, Loader2, Check, AlertTriangle, Terminal, 
  Trash2, RefreshCw, Layers, ShieldCheck, Cpu, Bot
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface AgentNotification {
  id: string;
  title: string;
  message: string;
  step: "SCRAPING" | "DIAGNOSTIC" | "STRATEGY" | "CAMPAIGN" | "CALENDAR";
  status: "PROCESSING" | "COMPLETED" | "FAILED";
  createdAt: string;
}

interface AgentPipelineMonitorProps {
  businessId: string;
}

const stepsMeta = [
  { key: "SCRAPING", label: "Agente de Extracción", icon: Cpu, desc: "Escaneo de audiencias y canales digitales del negocio y rivales" },
  { key: "DIAGNOSTIC", label: "Agente de Diagnóstico", icon: Layers, desc: "Benchmark y consolidación de brechas de posicionamiento" },
  { key: "STRATEGY", label: "Agente de Growth & Estrategia", icon: Sparkles, desc: "Modelado inteligente de 6 estrategias de crecimiento" },
  { key: "CAMPAIGN", label: "Agente de Planificación", icon: Bot, desc: "Diseño y estructuración de 6 campañas automatizadas" },
  { key: "CALENDAR", label: "Agente Editorial", icon: ShieldCheck, desc: "Distribución y calendarización de contenidos multicanal" },
];

export function AgentPipelineMonitor({ businessId }: AgentPipelineMonitorProps) {
  const [notifications, setNotifications] = useState<AgentNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  const fetchNotifications = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`/api/business/${businessId}/agent-notifications`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (e) {
      console.error("Error fetching agent notifications:", e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(() => fetchNotifications(true), 4000); // Polling cada 4 segundos
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  const handleClear = async () => {
    setClearing(true);
    try {
      const res = await fetch(`/api/business/${businessId}/agent-notifications`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setNotifications([]);
        toast.success("Historial de logs limpio.");
      }
    } catch (e) {
      toast.error("Error al limpiar historial.");
    } finally {
      setClearing(false);
    }
  };

  // Determinar el estado general de cada paso del pipeline
  const getStepStatus = (stepKey: string) => {
    const stepNotifs = notifications.filter(n => n.step === stepKey);
    if (stepNotifs.length === 0) return 'idle'; // No iniciado

    // Como las notificaciones vienen ordenadas por fecha descendente (más recientes primero),
    // tomamos la más reciente para saber el estado real actual del agente.
    const latestNotif = stepNotifs[0];

    if (latestNotif.status === 'PROCESSING') {
      // Evitar quedarse atascado si el proceso murió (timeout de 10 minutos)
      const createdTime = new Date(latestNotif.createdAt).getTime();
      const now = Date.now();
      const diffMinutes = (now - createdTime) / 60000;
      if (diffMinutes > 10) {
        return 'idle';
      }
      return 'processing';
    }

    if (latestNotif.status === 'COMPLETED') return 'completed';
    if (latestNotif.status === 'FAILED') return 'failed';

    return 'idle';
  };

  return (
    <Card className="border border-violet-100/80 dark:border-violet-950/40 bg-gradient-to-br from-white via-violet-50/20 to-indigo-50/40 dark:from-slate-900 dark:via-slate-950 dark:to-indigo-950 text-slate-800 dark:text-slate-100 shadow-md dark:shadow-2xl overflow-hidden card-shadow rounded-2xl">
      {/* Cabecera futurista estilo Terminal */}
      <CardHeader className="border-b border-violet-100/60 dark:border-white/5 bg-violet-50/10 dark:bg-black/30 pb-4 flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle className="text-base font-black tracking-tight flex items-center gap-2 text-violet-600 dark:text-violet-400">
            <Cpu className="h-4.5 w-4.5 text-violet-600 dark:text-violet-400 animate-pulse" />
            <span>Monitoreo del Pipeline de Agentes IA</span>
          </CardTitle>
          <CardDescription className="text-[11px] text-slate-500 dark:text-slate-400">
            Flujo en cascada de los agentes de growth, contenidos y campañas.
          </CardDescription>
        </div>
        
        <div className="flex items-center gap-2">
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={clearing}
              className="text-[10px] text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-violet-100/50 dark:hover:bg-white/5 font-bold h-7 px-2.5 rounded-lg border border-violet-100 dark:border-white/5 bg-white dark:bg-transparent shadow-sm dark:shadow-none"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Limpiar Terminal
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fetchNotifications()}
            className="h-7 w-7 rounded-lg border border-violet-100 dark:border-white/5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-violet-100/50 dark:hover:bg-white/5 bg-white dark:bg-transparent shadow-sm dark:shadow-none"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* PIPELINE INTERACTIVO */}
        <div className="relative">
          {/* Línea conectora base */}
          <div className="absolute top-4.5 left-6 right-6 h-0.5 bg-violet-100 dark:bg-white/5 z-0 hidden md:block" />

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative z-10">
            {stepsMeta.map((step, idx) => {
              const status = getStepStatus(step.key);
              const StepIcon = step.icon;

              let statusColor = "bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-white/5";
              let glowEffect = "";
              let statusLabel = "Inactivo";

              if (status === 'processing') {
                statusColor = "bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-500 shadow-md shadow-blue-500/20";
                glowEffect = "animate-pulse ring-2 ring-blue-500/30";
                statusLabel = "Procesando";
              } else if (status === 'completed') {
                statusColor = "bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500 shadow-md shadow-emerald-500/15";
                statusLabel = "Activo";
              } else if (status === 'failed') {
                statusColor = "bg-red-50 dark:bg-red-950/80 text-red-600 dark:text-red-400 border-red-300 dark:border-red-500 shadow-md shadow-red-500/20 animate-bounce";
                statusLabel = "Error";
              }

              return (
                <div key={step.key} className="flex md:flex-col items-center gap-3 md:text-center group select-none">
                  {/* Icono de Estado */}
                  <div className={`h-9 w-9 rounded-xl border flex items-center justify-center transition-all duration-300 ${statusColor} ${glowEffect}`}>
                    {status === 'processing' ? (
                      <Loader2 className="h-4.5 w-4.5 animate-spin" />
                    ) : status === 'completed' ? (
                      <Check className="h-4.5 w-4.5 font-bold" />
                    ) : status === 'failed' ? (
                      <AlertTriangle className="h-4.5 w-4.5" />
                    ) : (
                      <StepIcon className="h-4.5 w-4.5 opacity-60" />
                    )}
                  </div>

                  {/* Nombre y descripción */}
                  <div className="md:space-y-0.5 text-left md:text-center">
                    <p className="text-[11px] font-black tracking-tight text-slate-800 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                      {step.label}
                    </p>
                    <p className="text-[9.5px] text-slate-500 dark:text-slate-400 hidden md:block max-w-[120px] mx-auto leading-normal">
                      {step.desc}
                    </p>
                    {status !== 'idle' && (
                      <span className={`text-[8.5px] font-black uppercase tracking-wider inline-block px-1.5 py-0.5 rounded border-none mt-1 ${
                        status === 'completed' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                        status === 'failed' ? 'bg-red-500/10 text-red-600 dark:text-red-400' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      }`}>
                        {statusLabel}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="h-px bg-violet-100 dark:bg-white/5" />

        {/* LOGS DE LA TERMINAL DE IA */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            <Terminal className="h-3.5 w-3.5 text-slate-400" />
            <span>Consola de Agentes Autónomos</span>
          </div>

          <div className="bg-slate-50 dark:bg-black/45 border border-violet-100/80 dark:border-white/5 rounded-xl p-4 font-mono text-[10.5px] h-[150px] overflow-y-auto space-y-2 text-slate-700 dark:text-slate-300 custom-scrollbar shadow-inner relative">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-slate-450 space-y-1">
                <Cpu className="h-6 w-6 opacity-25 animate-pulse text-violet-500 dark:text-violet-400" />
                <p className="text-[10px] text-slate-400 dark:text-slate-500">Consola inactiva. Esperando comandos de agentes...</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const isFailed = notif.status === 'FAILED';
                const isProcessing = notif.status === 'PROCESSING';

                return (
                  <div key={notif.id} className="flex items-start gap-2 border-b border-violet-100/40 dark:border-white/2 pb-1.5 last:border-b-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <span className="text-slate-400 dark:text-slate-500 shrink-0 select-none">
                      [{format(new Date(notif.createdAt), "HH:mm:ss")}]
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className={`font-bold shrink-0 mr-1.5 ${
                        isFailed ? 'text-red-600 dark:text-red-400' : isProcessing ? 'text-blue-600 dark:text-blue-400' : 'text-violet-600 dark:text-violet-400'
                      }`}>
                        {notif.title}:
                      </span>
                      <span className="text-slate-700 dark:text-slate-300 leading-relaxed">{notif.message}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
