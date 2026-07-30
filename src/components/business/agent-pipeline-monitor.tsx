"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, Loader2, Check, AlertTriangle, Terminal, 
  Trash2, RefreshCw, Layers, ShieldCheck, Cpu, Bot, FileText
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface AgentNotification {
  id: string;
  title: string;
  message: string;
  step: "SCRAPING" | "ANALYSIS" | "DIAGNOSTIC" | "STRATEGY" | "CAMPAIGN" | "CALENDAR";
  status: "PROCESSING" | "COMPLETED" | "FAILED";
  createdAt: string;
}

interface AgentPipelineMonitorProps {
  businessId: string;
}

const stepsMeta = [
  { key: "SCRAPING", label: "Agente de Extracción Web", icon: Cpu, desc: "Escaneo web y redes de tu negocio", emoji: "🕵️", processingEmoji: "🔍" },
  { key: "ANALYSIS", label: "Agente de Canales y Métricas", icon: FileText, desc: "Diagnóstico inicial de canales", emoji: "📊", processingEmoji: "🔬" },
  { key: "DIAGNOSTIC", label: "Agente de Diagnóstico Competitivo", icon: Layers, desc: "Análisis competitivo de rivales", emoji: "🧠", processingEmoji: "⚡" },
  { key: "STRATEGY", label: "Agente de Growth & Estrategia", icon: Sparkles, desc: "Diseña buyer personas y plan estratégico", emoji: "🎯", processingEmoji: "✨" },
  { key: "CAMPAIGN", label: "Agente de Parametrización de Campañas de Marketing", icon: Bot, desc: "Formula tus campañas y presupuestos", emoji: "📢", processingEmoji: "🚀" },
  { key: "CALENDAR", label: "Agente Editorial y de Contenidos", icon: ShieldCheck, desc: "Crea copys, hashtags y prompts de imagen", emoji: "📝", processingEmoji: "🤖" },
];

export function AgentPipelineMonitor({ businessId }: AgentPipelineMonitorProps) {
  const [notifications, setNotifications] = useState<AgentNotification[]>([]);
  const [onboardingData, setOnboardingData] = useState<{ strategyCount?: number; competitorCount?: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  const fetchNotifications = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`/api/business/${businessId}/agent-notifications`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setOnboardingData(data.onboarding || null);
      }
    } catch (e) {
      console.error("Error fetching agent notifications:", e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(() => {
      fetchNotifications(true);
    }, 8000);
    return () => clearInterval(interval);
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

    if (latestNotif.status === 'COMPLETED') {
      if (stepKey === 'STRATEGY' && (onboardingData?.strategyCount || 0) === 0) return 'idle';
      return 'completed';
    }
    if (latestNotif.status === 'FAILED') return 'failed';

    return 'idle';
  };

  return (
    <Card className="border border-cyan-500/20 bg-[#0D1526] text-slate-100 shadow-2xl overflow-hidden rounded-2xl mh-glow-cyan">
      {/* Cabecera futurista estilo Terminal Base44 */}
      <CardHeader className="border-b border-cyan-500/10 bg-[#080E1A]/60 pb-4 flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle className="text-base font-extrabold tracking-tight flex items-center gap-2">
            <Cpu className="h-4.5 w-4.5 text-cyan-400 animate-pulse" />
            <span className="mh-gradient-text font-black">Progreso de Procesamiento Inteligente</span>
          </CardTitle>
          <CardDescription className="text-[11px] text-slate-400">
            Visualiza el avance del diagnóstico y planificación estratégica en tiempo real.
          </CardDescription>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fetchNotifications()}
            className="h-7 w-7 rounded-lg border border-cyan-500/20 text-slate-400 hover:text-white hover:bg-cyan-500/10 bg-[#132035]"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {/* Animaciones de Agente */}
        <style>{` 
          @keyframes monitor-radar {
            0% { transform: scale(0.8); opacity: 0.7; }
            50% { transform: scale(1.35); opacity: 0; }
            100% { transform: scale(0.8); opacity: 0; }
          }
          @keyframes monitor-working {
            0%, 100% { transform: rotate(0deg) scale(1); }
            25% { transform: rotate(-5deg) scale(1.08); }
            75% { transform: rotate(5deg) scale(1.08); }
          }
          @keyframes monitor-float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-2px); }
          }
          .monitor-radar-ring { animation: monitor-radar 1.5s ease-out infinite; }
          .monitor-agent-working { animation: monitor-working 0.6s ease-in-out infinite; }
          .monitor-agent-float { animation: monitor-float 2.5s ease-in-out infinite; }
        `}</style>

        {/* PIPELINE INTERACTIVO */}
        <div className="relative">
          {/* Línea conectora base */}
          <div className="absolute top-5 left-6 right-6 h-0.5 bg-violet-100 dark:bg-white/5 z-0 hidden md:block" />

          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 relative z-10">
            {stepsMeta.map((step, idx) => {
              const status = getStepStatus(step.key);

              return (
                <div key={step.key} className="flex md:flex-col items-center gap-3 md:text-center group select-none">
                  {/* Avatar del Agente con efectos */}
                  <div className="relative">
                    {status === 'processing' && (
                      <>
                        <div className="absolute inset-0 rounded-xl bg-blue-500/20 monitor-radar-ring" />
                        <div className="absolute inset-0 rounded-xl bg-blue-500/10 monitor-radar-ring" style={{ animationDelay: '0.5s' }} />
                      </>
                    )}
                    {status === 'completed' && (
                      <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-br from-emerald-400/20 to-teal-400/20 blur-sm" />
                    )}
                    <div className={`relative h-10 w-10 rounded-xl border-2 flex items-center justify-center transition-all duration-300 ${
                      status === 'processing'
                        ? 'bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-950 border-blue-400 dark:border-blue-500 shadow-lg shadow-blue-500/20'
                        : status === 'completed'
                          ? 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 border-emerald-400 dark:border-emerald-500 shadow-md shadow-emerald-500/15'
                          : status === 'failed'
                            ? 'bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-950 dark:to-red-950 border-rose-400 dark:border-rose-500'
                            : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                    }`}>
                      <span className={`text-base select-none ${
                        status === 'processing' ? 'monitor-agent-working'
                        : status === 'completed' ? 'monitor-agent-float'
                        : 'opacity-50'
                      }`}>
                        {status === 'processing' ? step.processingEmoji
                          : status === 'failed' ? '❌'
                          : step.emoji}
                      </span>
                    </div>
                  </div>

                  {/* Nombre y descripción */}
                  <div className="flex flex-col gap-0.5 text-left md:text-center items-start md:items-center">
                    <p className="text-[11px] font-black tracking-tight text-slate-800 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors leading-tight">
                      {step.label}
                    </p>
                    <p className="text-[9.5px] text-slate-500 dark:text-slate-400 block max-w-[130px] leading-normal">
                      {step.desc}
                    </p>
                    {status === 'processing' ? (
                      <span className="text-[8px] font-black uppercase tracking-wider inline-flex items-center gap-1 px-1.5 py-0.5 rounded mt-1 bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        <Loader2 className="h-2.5 w-2.5 animate-spin" />
                        Trabajando
                      </span>
                    ) : status !== 'idle' ? (
                      <span className={`text-[8px] font-black uppercase tracking-wider inline-block px-1.5 py-0.5 rounded mt-1 ${
                        status === 'completed' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                        'bg-red-500/10 text-red-600 dark:text-red-400'
                      }`}>
                        {status === 'completed' ? 'Completado' : 'Error'}
                      </span>
                    ) : (
                      <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-600 mt-1">
                        Inactivo
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
