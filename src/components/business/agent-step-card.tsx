"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, Clock, Loader2, AlertCircle, ArrowRight, Sparkles, Eye, Play
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type StepStatus = "idle" | "processing" | "completed" | "failed" | "locked";

interface AgentStepCardProps {
  stepNumber: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: StepStatus;
  processingMessage?: string;
  onExecute?: () => void;
  onViewReport?: () => void;
  resultLink?: string;
  actionText?: string;
  viewText?: string;
  accentColor?: string;
  isActive?: boolean;
  subAgents?: Array<{ name: string; icon?: string; status: "idle" | "processing" | "completed" }>;
}

export function AgentStepCard({
  stepNumber,
  title,
  description,
  icon: Icon,
  status,
  processingMessage = "Agente procesando...",
  onExecute,
  onViewReport,
  resultLink,
  actionText,
  viewText,
  accentColor = "cyan",
  isActive = false,
  subAgents
}: AgentStepCardProps) {
  const isCompleted = status === "completed";
  const isProcessing = status === "processing";
  const isLocked = status === "locked";
  const isFailed = status === "failed";

  const getStatusBadge = () => {
    if (isCompleted) {
      return (
        <Badge variant="outline" className="text-emerald-700 dark:text-emerald-400 border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-[10px] font-bold uppercase tracking-wider">
          Completado
        </Badge>
      );
    }
    if (isProcessing) {
      return (
        <Badge variant="outline" className="text-blue-700 dark:text-blue-400 border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 text-[10px] font-bold uppercase tracking-wider animate-pulse flex items-center gap-1">
          <Loader2 className="h-2.5 w-2.5 animate-spin" /> En Proceso
        </Badge>
      );
    }
    if (isLocked) {
      return (
        <Badge variant="outline" className="text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-[10px] font-bold uppercase tracking-wider">
          Bloqueado
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-amber-700 dark:text-amber-400 border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-[10px] font-bold uppercase tracking-wider">
        Pendiente
      </Badge>
    );
  };

  return (
    <div className={cn(
      "p-3.5 rounded-xl border transition-all duration-300 relative overflow-hidden group cursor-default shadow-2xs",
      isActive && "ring-2 ring-indigo-500/40 dark:ring-cyan-500/50 border-indigo-500/60 dark:border-cyan-500/80 bg-indigo-500/5 dark:bg-[#132035]",
      !isActive && isCompleted && "bg-card dark:bg-[#0D1526]/80 border-emerald-500/30 dark:border-emerald-500/20",
      !isActive && isProcessing && "bg-card dark:bg-[#0D1526] border-blue-500/40",
      !isActive && isLocked && "bg-muted/40 dark:bg-[#080E1A]/60 border-border dark:border-slate-800/60 opacity-60",
      !isActive && !isCompleted && !isProcessing && !isLocked && "bg-card dark:bg-[#0D1526]/90 border-border dark:border-cyan-500/15"
    )}>
      {/* Decorative gradient indicator line */}
      <div className={cn(
        "absolute top-0 left-0 bottom-0 w-1 transition-colors",
        isActive && "bg-indigo-500 dark:bg-cyan-500",
        !isActive && isCompleted && "bg-gradient-to-b from-emerald-500 to-teal-600",
        !isActive && isProcessing && "bg-gradient-to-b from-blue-500 to-indigo-600 animate-pulse",
        !isActive && isFailed && "bg-rose-500",
        !isActive && isLocked && "bg-slate-300 dark:bg-slate-800",
        !isActive && status === "idle" && "bg-gradient-to-b from-slate-400 dark:from-cyan-400 to-slate-600 dark:to-blue-600"
      )} />

      <div className="pl-2 space-y-2.5">
        {/* Header with Title, Description, and Status Badge on Top Right */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className={cn(
              "h-6 w-6 rounded-lg flex items-center justify-center font-black text-[11px] shrink-0 border mt-0.5",
              isCompleted && "bg-emerald-100 dark:bg-emerald-500/20 border-emerald-300 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-400",
              isProcessing && "bg-blue-100 dark:bg-blue-500/20 border-blue-300 dark:border-blue-500/40 text-blue-700 dark:text-blue-400 animate-bounce",
              isLocked && "bg-muted border-border text-muted-foreground dark:bg-slate-900 dark:border-slate-800 dark:text-slate-600",
              status === "idle" && "bg-slate-100 dark:bg-cyan-500/10 border-slate-300 dark:border-cyan-500/30 text-slate-700 dark:text-cyan-400"
            )}>
              {isCompleted ? "✓" : stepNumber}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-1.5">
                <Icon className={cn("h-3.5 w-3.5 shrink-0 mt-0.5", isCompleted ? "text-emerald-600 dark:text-emerald-500" : isProcessing ? "text-blue-600 dark:text-blue-500" : "text-slate-600 dark:text-cyan-500")} />
                <h4 className="text-xs font-bold text-foreground dark:text-slate-100 tracking-tight leading-snug line-clamp-2">{title}</h4>
              </div>
              {description && (
                <p className="text-[10px] text-muted-foreground dark:text-slate-400 leading-snug line-clamp-2 mt-0.5">{description}</p>
              )}
            </div>
          </div>
          <div className="shrink-0 pt-0.5">
            {getStatusBadge()}
          </div>
        </div>

        {/* Sub-agents breakdown with semáforo indicator */}
        {subAgents && subAgents.length > 0 && (
          <div className="pt-2 border-t border-border dark:border-slate-800/60 space-y-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Agentes Especializados:</span>
            </div>
            <div className="grid grid-cols-1 gap-1">
              {subAgents.map((sa, idx) => (
                <div key={idx} className="flex items-center justify-between text-[10px] p-1.5 rounded-lg bg-slate-100/80 dark:bg-[#080E1A] border border-slate-200/80 dark:border-slate-800/50">
                  <div className="flex items-center gap-1.5 truncate pr-1">
                    <span className="text-xs shrink-0">{sa.icon || "🤖"}</span>
                    <span className="font-bold text-foreground dark:text-slate-200 truncate">{sa.name}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className={cn(
                      "h-2 w-2 rounded-full shrink-0",
                      sa.status === "completed" && "bg-emerald-500 shadow-xs shadow-emerald-500/50",
                      sa.status === "processing" && "bg-amber-400 animate-ping shadow-xs shadow-amber-400/50",
                      sa.status === "idle" && "bg-slate-400 dark:bg-rose-500 shadow-xs"
                    )} />
                    <span className={cn(
                      "text-[9px] font-extrabold uppercase",
                      sa.status === "completed" && "text-emerald-700 dark:text-emerald-400",
                      sa.status === "processing" && "text-amber-700 dark:text-amber-400",
                      sa.status === "idle" && "text-slate-500 dark:text-slate-400"
                    )}>
                      {sa.status === "completed" ? "Completado" : sa.status === "processing" ? "En Proceso" : "Inactivo"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action button at very bottom of card */}
        <div className="flex items-center justify-end gap-1.5 pt-1.5 border-t border-border dark:border-slate-800/50">
          {onViewReport && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onViewReport}
              className={cn(
                "h-6.5 px-2.5 text-[10px] font-bold gap-1 rounded-lg border transition-all cursor-pointer shadow-2xs",
                isCompleted 
                  ? "text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 border-emerald-300 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20" 
                  : isActive
                    ? "text-indigo-700 dark:text-cyan-400 hover:text-indigo-800 dark:hover:text-cyan-300 border-indigo-300 dark:border-cyan-500/40 bg-indigo-50 dark:bg-cyan-500/10 hover:bg-indigo-100 dark:hover:bg-cyan-500/20"
                    : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border-slate-300 dark:border-slate-700/60 bg-slate-100 dark:bg-slate-900/40 hover:bg-slate-200 dark:hover:bg-slate-800/60"
              )}
            >
              <Eye className="h-3 w-3" /> {viewText || "Ver pantalla"}
            </Button>
          )}

          {!isCompleted && !isLocked && onExecute && (
            <Button
              size="sm"
              disabled={isProcessing}
              onClick={onExecute}
              className={cn(
                "h-6.5 px-2.5 text-[10px] font-bold gap-1 text-white transition-all rounded-lg cursor-pointer shadow-xs",
                isProcessing 
                  ? "bg-blue-600/50 cursor-not-allowed" 
                  : "bg-indigo-600 hover:bg-indigo-700 dark:bg-gradient-to-r dark:from-cyan-600 dark:to-blue-600 dark:hover:from-cyan-500 dark:hover:to-blue-500"
              )}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" /> Procesando
                </>
              ) : (
                <>
                  <Play className="h-3 w-3 fill-current" /> {actionText || "Ejecutar"}
                </>
              )}
            </Button>
          )}
        </div>

        {/* Processing message display */}
        {isProcessing && (
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-500/20 text-[10px] text-blue-700 dark:text-blue-300 flex items-center gap-2 animate-in fade-in duration-300">
            <Sparkles className="h-3 w-3 text-blue-500 dark:text-blue-400 shrink-0 animate-spin" />
            <span className="truncate">{processingMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}
