"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, Clock, Loader2, AlertCircle, ArrowRight, Sparkles, Eye, Play
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
  accentColor?: string;
  isActive?: boolean;
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
  accentColor = "cyan",
  isActive = false
}: AgentStepCardProps) {
  const isCompleted = status === "completed";
  const isProcessing = status === "processing";
  const isLocked = status === "locked";
  const isFailed = status === "failed";

  const getStatusBadge = () => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider gap-1">
            <CheckCircle2 className="h-3 w-3" /> Completado
          </Badge>
        );
      case "processing":
        return (
          <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px] font-bold uppercase tracking-wider gap-1 animate-pulse">
            <Loader2 className="h-3 w-3 animate-spin" /> En ejecución
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20 text-[10px] font-bold uppercase tracking-wider gap-1">
            <AlertCircle className="h-3 w-3" /> Error
          </Badge>
        );
      case "locked":
        return (
          <Badge variant="outline" className="text-slate-500 border-slate-800 text-[10px] font-bold uppercase tracking-wider">
            Bloqueado
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-amber-400 border-amber-500/20 bg-amber-500/5 text-[10px] font-bold uppercase tracking-wider">
            Pendiente
          </Badge>
        );
    }
  };

  return (
    <div className={cn(
      "p-3.5 rounded-xl border transition-all duration-300 relative overflow-hidden group cursor-pointer",
      isActive && "ring-2 ring-cyan-400/50 border-cyan-400/80 bg-[#132035]",
      !isActive && isCompleted && "bg-[#0D1526]/80 border-emerald-500/20 shadow-lg hover:border-emerald-500/40",
      !isActive && isProcessing && "bg-[#0D1526] border-blue-500/40 shadow-xl shadow-blue-950/30",
      !isActive && isLocked && "bg-[#080E1A]/60 border-slate-800/60 opacity-60",
      !isActive && !isCompleted && !isProcessing && !isLocked && "bg-[#0D1526]/90 border-cyan-500/15 hover:border-cyan-500/30"
    )}
    onClick={onViewReport}
    >
      {/* Decorative gradient indicator line */}
      <div className={cn(
        "absolute top-0 left-0 bottom-0 w-1 transition-colors",
        isActive && "bg-cyan-400",
        !isActive && isCompleted && "bg-gradient-to-b from-emerald-400 to-teal-600",
        !isActive && isProcessing && "bg-gradient-to-b from-blue-400 to-indigo-600 animate-pulse",
        !isActive && isFailed && "bg-rose-500",
        !isActive && isLocked && "bg-slate-800",
        !isActive && status === "idle" && "bg-gradient-to-b from-cyan-400 to-blue-600"
      )} />

      <div className="pl-2 space-y-2.5">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className={cn(
              "h-6 w-6 rounded-lg flex items-center justify-center font-black text-[11px] shrink-0 border",
              isCompleted && "bg-emerald-500/20 border-emerald-500/40 text-emerald-400",
              isProcessing && "bg-blue-500/20 border-blue-500/40 text-blue-400 animate-bounce",
              isLocked && "bg-slate-900 border-slate-800 text-slate-600",
              status === "idle" && "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
            )}>
              {isCompleted ? "✓" : stepNumber}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <Icon className={cn("h-3.5 w-3.5", isCompleted ? "text-emerald-400" : isProcessing ? "text-blue-400" : "text-cyan-400")} />
                <h4 className="text-xs font-bold text-slate-100 tracking-tight">{title}</h4>
              </div>
              <p className="text-[10px] text-slate-400 leading-snug">{description}</p>
            </div>
          </div>
        </div>

        {/* Status indicator row */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-800/50">
          {getStatusBadge()}

          {/* Action or Result links */}
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            {onViewReport && (
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={onViewReport}
                className="h-6 px-2 text-[10px] text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 font-bold gap-1"
              >
                <Eye className="h-3 w-3" /> Ver informe
              </Button>
            )}

            {!isCompleted && !isLocked && onExecute && (
              <Button
                size="sm"
                disabled={isProcessing}
                onClick={onExecute}
                className={cn(
                  "h-6 px-2.5 text-[10px] font-bold gap-1 shadow-sm text-white transition-all",
                  isProcessing ? "bg-blue-600/50 cursor-not-allowed" : "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
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
        </div>

        {/* Processing message display */}
        {isProcessing && (
          <div className="p-2 rounded-lg bg-blue-950/40 border border-blue-500/20 text-[10px] text-blue-300 flex items-center gap-2 animate-in fade-in duration-300">
            <Sparkles className="h-3 w-3 text-blue-400 shrink-0 animate-spin" />
            <span className="truncate">{processingMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}
