"use client";

import React, { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Bot, Terminal, Loader2, Sparkles } from "lucide-react";
import { AgentPipelineMonitor } from "./agent-pipeline-monitor";
import { Badge } from "@/components/ui/badge";

interface AgentPipelineBaulProps {
  businessId: string;
}

export function AgentPipelineBaul({ businessId }: AgentPipelineBaulProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasActiveAgents, setHasActiveAgents] = useState(false);

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

          // Si hay agentes activos procesando, abrir automáticamente "El Baúl" para mostrar feedback visual de "IA Trabajando"
          if (processing) {
            setIsOpen(true);
          }
        }
      } catch (err) {
        console.error("Error checking active agents:", err);
      }
    };

    checkActiveAgents();
    const interval = setInterval(checkActiveAgents, 5000); // Polling cada 5 segundos
    return () => clearInterval(interval);
  }, [businessId]);

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
        
        <div className="flex-1 p-6 overflow-y-auto bg-background">
          <AgentPipelineMonitor businessId={businessId} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
