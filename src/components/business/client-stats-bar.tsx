"use client";

import React from "react";
import { CheckCircle2, Zap, Calendar, CheckSquare, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClientStatsBarProps {
  flowPercentage: number;
  flowDone: number;
  activeNetworksCount: number;
  activeNetworksList?: string[];
  calendarCount: number;
  latestCalendarStatus?: string;
  approvedPiecesCount: number;
  totalPiecesCount: number;
}

export function ClientStatsBar({
  flowPercentage,
  flowDone,
  activeNetworksCount,
  activeNetworksList = [],
  calendarCount,
  latestCalendarStatus = "Sin generar",
  approvedPiecesCount,
  totalPiecesCount
}: ClientStatsBarProps) {
  const stats = [
    {
      label: "Flujo Operativo",
      value: `${flowPercentage}%`,
      sub: `${flowDone}/4 etapas listos`,
      color: flowPercentage === 100 ? "#10B981" : "#00B4D8",
      icon: CheckCircle2
    },
    {
      label: "Redes Activas",
      value: activeNetworksCount,
      sub: activeNetworksList.length > 0 ? activeNetworksList.join(", ") : "Sin vincular",
      color: "#7C3AED",
      icon: Zap
    },
    {
      label: "Calendarios",
      value: calendarCount,
      sub: latestCalendarStatus,
      color: "#2563EB",
      icon: Calendar
    },
    {
      label: "Piezas Aprobadas",
      value: totalPiecesCount > 0 ? `${approvedPiecesCount}/${totalPiecesCount}` : "0",
      sub: totalPiecesCount > 0 ? `${Math.round((approvedPiecesCount / totalPiecesCount) * 100)}% del mes` : "Sin piezas",
      color: "#10B981",
      icon: CheckSquare
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((item, idx) => {
        const Icon = item.icon;
        return (
          <div
            key={idx}
            className="bg-card dark:bg-[#0D1526] border border-border dark:border-cyan-500/10 rounded-xl p-3.5 flex flex-col justify-between transition-all hover:border-cyan-500/30 shadow-xs"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground dark:text-slate-400">
                {item.label}
              </span>
              <div
                className="p-1.5 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${item.color}15`, border: `1px solid ${item.color}30` }}
              >
                <Icon className="h-3.5 w-3.5" style={{ color: item.color }} />
              </div>
            </div>

            <div>
              <div className="text-xl font-black tracking-tight text-foreground dark:text-white" style={{ color: item.color }}>
                {item.value}
              </div>
              <p className="text-[10.5px] text-muted-foreground dark:text-slate-400 mt-0.5 truncate font-medium">
                {item.sub}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
