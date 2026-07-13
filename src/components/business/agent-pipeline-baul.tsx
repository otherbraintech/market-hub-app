"use client";

import React, { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Bot, Terminal, Loader2, Sparkles } from "lucide-react";
import { AgentPipelineMonitor } from "./agent-pipeline-monitor";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface AgentPipelineBaulProps {
  businessId: string;
}

export function AgentPipelineBaul({ businessId }: AgentPipelineBaulProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasActiveAgents, setHasActiveAgents] = useState(false);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);
  const [onboarding, setOnboarding] = useState<{
    isBusinessConfigured: boolean;
    competitorCount: number;
    strategyCount: number;
    scheduledContentCount: number;
  } | null>(null);

  useEffect(() => {
    if (!businessId) return;

    const checkActiveAgents = async () => {
      try {
        const res = await fetch(`/api/business/${businessId}/agent-notifications`);
        if (res.ok) {
          const data = await res.json();
          const notifications = data.notifications || [];
          // Buscar si hay alguno en estado PROCESSING
          const processing = notifications.some((n: any) => n.status === "PROCESSING");
          setHasActiveAgents(processing);

          if (data.onboarding) {
            setOnboarding(data.onboarding);
          }

          // Si hay agentes activos procesando, abrir automáticamente "El Baúl" una sola vez
          if (processing) {
            if (!hasAutoOpened) {
              setIsOpen(true);
              setHasAutoOpened(true);
            }
          } else {
            setHasAutoOpened(false);
          }
        }
      } catch (err) {
        console.error("Error checking active agents:", err);
      }
    };

    checkActiveAgents();
    const interval = setInterval(checkActiveAgents, 5000); // Polling cada 5 segundos
    return () => clearInterval(interval);
  }, [businessId, hasAutoOpened]);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={`h-9 px-3 text-xs font-bold gap-2 relative overflow-hidden transition-all duration-500 border-violet-200/80 text-violet-700 hover:bg-violet-50/50 hover:border-violet-300 dark:border-violet-950 dark:text-violet-400 dark:hover:bg-violet-950/20 ${
            hasActiveAgents ? "animate-pulse ring-2 ring-violet-500/20 shadow-md shadow-violet-500/10 border-violet-400" : ""
          }`}
        >
          {hasActiveAgents ? (
            <>
              <Loader2 className="h-3.5 w-3.5 text-violet-650 animate-spin" />
              <span>IA Trabajando...</span>
              <span className="absolute top-1 right-1 flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-violet-500"></span>
              </span>
            </>
          ) : (
            <>
              <Bot className="h-4 w-4 text-violet-650" />
              <span>El Baúl (IA)</span>
            </>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent side="right" className="w-[90%] sm:max-w-md md:max-w-lg p-0 overflow-hidden flex flex-col border-l border-muted/20 bg-background shadow-2xl">
        <SheetHeader className="p-6 bg-muted/5 border-b border-muted/20 shrink-0">
          <SheetTitle className="text-base font-bold flex items-center gap-2 text-foreground">
            <Terminal className="h-4.5 w-4.5 text-violet-600" />
            <span>El Baúl de los Agentes</span>
          </SheetTitle>
          <SheetDescription className="text-[11px] text-muted-foreground">
            Monitoreo en tiempo real de los procesos asíncronos, extracción, diagnóstico y autogeneración de posts.
          </SheetDescription>
        </SheetHeader>
        
        <div className="flex-1 p-6 overflow-y-auto bg-background flex flex-col justify-between">
          <div className="space-y-6">
            <AgentPipelineMonitor businessId={businessId} />
          </div>

          {/* Guía de Pasos Onboarding Directa en el Baúl */}
          {onboarding && (
            <div className="mt-8 p-4 rounded-2xl border border-violet-100 bg-violet-50/20 dark:border-violet-950/40 dark:bg-violet-950/10 space-y-3 shrink-0">
              <span className="text-[10px] font-black uppercase tracking-widest text-violet-650 dark:text-violet-400">Pasos Recomendados</span>
              
              {!onboarding.isBusinessConfigured ? (
                <>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    ⚠️ Paso 1: Configura el perfil de tu negocio para que los agentes tengan base de datos.
                  </p>
                  <Button asChild size="sm" className="w-full bg-violet-650 hover:bg-violet-750 text-white text-xs font-bold gap-1 rounded-xl">
                    <Link href={`/business/${businessId}`} onClick={() => setIsOpen(false)}>
                      Configurar Negocio ➔
                    </Link>
                  </Button>
                </>
              ) : onboarding.competitorCount === 0 ? (
                <>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    👤 Paso 2: El análisis de negocio finalizó. Agrega competidores para benchmarking de mercado.
                  </p>
                  <Button asChild size="sm" className="w-full bg-violet-650 hover:bg-violet-750 text-white text-xs font-bold gap-1 rounded-xl">
                    <Link href={`/business/${businessId}?new=true`} onClick={() => setIsOpen(false)}>
                      Registrar Competidor ➔
                    </Link>
                  </Button>
                </>
              ) : onboarding.strategyCount === 0 ? (
                <>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    ✨ Paso 3: Diagnóstico consolidado listo. Genera tu estrategia de marketing con IA.
                  </p>
                  <Button asChild size="sm" className="w-full bg-violet-650 hover:bg-violet-750 text-white text-xs font-bold gap-1 rounded-xl">
                    <Link href="/strategies" onClick={() => setIsOpen(false)}>
                      Generar Estrategia con IA ➔
                    </Link>
                  </Button>
                </>
              ) : onboarding.scheduledContentCount === 0 ? (
                <>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    📅 Paso 4: Estrategia guardada. Ve al calendario y genera el plan de contenidos.
                  </p>
                  <Button asChild size="sm" className="w-full bg-violet-650 hover:bg-violet-750 text-white text-xs font-bold gap-1 rounded-xl">
                    <Link href="/calendar" onClick={() => setIsOpen(false)}>
                      Ver Calendario Editorial ➔
                    </Link>
                  </Button>
                </>
              ) : (
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <Sparkles className="h-4 w-4" />
                  <span>¡Felicidades! Tienes tu calendario de contenidos activo.</span>
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
