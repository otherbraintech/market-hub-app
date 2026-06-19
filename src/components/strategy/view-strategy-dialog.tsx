"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Target, Users, Megaphone, Compass } from "lucide-react";

interface ViewStrategyDialogProps {
  strategy: {
    id: string;
    name: string;
    description: string | null;
    isActive: boolean;
    objectives: any;
    personas: any;
    funnelStages: any;
    channels: any;
    business?: {
      name: string;
    };
  };
}

export function ViewStrategyDialog({ strategy }: ViewStrategyDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Parse JSON data safely
  const objectives = Array.isArray(strategy.objectives) ? strategy.objectives : [];
  const personas = Array.isArray(strategy.personas) ? strategy.personas : [];
  const funnelStages = Array.isArray(strategy.funnelStages) ? strategy.funnelStages : [];
  const channels = Array.isArray(strategy.channels) ? strategy.channels : [];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 px-3 text-xs gap-1.5 cursor-pointer">
          <Eye className="h-3.5 w-3.5" />
          Ver Datos
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-[90vw] max-h-[85vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader className="pb-4 border-b">
          <div className="flex items-center justify-between gap-4">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                {strategy.name}
                <Badge variant={strategy.isActive ? "default" : "secondary"} className="ml-2">
                  {strategy.isActive ? "Activa" : "Inactiva"}
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                Estrategia de marketing para {strategy.business?.name || "tu negocio"}.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto pr-3 mt-4 max-h-[60vh] space-y-6">
          <div className="space-y-6 pb-4">
            {strategy.description && (
              <div className="py-3 px-4 bg-muted/45 rounded-lg text-xs text-slate-700 dark:text-slate-350 border border-muted/70">
                <span className="font-bold block mb-1 text-slate-800 dark:text-slate-200">Descripción / Visión general:</span>
                {strategy.description}
              </div>
            )}

            {/* SECCIÓN OBJETIVOS */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold flex items-center gap-2 text-violet-850 dark:text-violet-400 border-b pb-1.5">
                <Target className="h-4.5 w-4.5 text-violet-600" />
                Objetivos SMART
              </h3>
              {objectives.length === 0 ? (
                <p className="text-xs text-muted-foreground italic pl-6">No hay objetivos registrados.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {objectives.map((obj: any, idx: number) => (
                    <Card key={idx} className="border shadow-none bg-violet-50/5">
                      <CardHeader className="p-3.5 pb-2">
                        <div className="flex justify-between items-start gap-2">
                          <CardTitle className="text-xs font-bold text-slate-800 dark:text-slate-200">{obj.name}</CardTitle>
                          <Badge variant="outline" className="text-[9px] uppercase font-bold text-violet-750 bg-violet-50/50 border-violet-200 shrink-0">
                            {obj.status || "PENDIENTE"}
                          </Badge>
                        </div>
                        <CardDescription className="text-[11px] mt-1 text-slate-700 dark:text-slate-355 font-medium leading-relaxed">
                          <span className="font-semibold text-slate-900 dark:text-slate-100">Específico (S): </span>
                          {obj.specific}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-3.5 pt-0 space-y-1.5 text-[11px] text-muted-foreground border-t border-muted/50 bg-muted/5">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="font-bold text-foreground">Meta:</span> {obj.targetValue} {obj.unit || ""}
                          </div>
                          <div>
                            <span className="font-bold text-foreground">Plazo:</span> {obj.deadline || "Sin plazo"}
                          </div>
                        </div>
                        {obj.measurable && (
                          <div className="pt-1 border-t border-dashed border-muted/50">
                            <span className="font-bold text-foreground">Medible (M):</span> {obj.measurable}
                          </div>
                        )}
                        {obj.timeBound && (
                          <div>
                            <span className="font-bold text-foreground">Temporal (T):</span> {obj.timeBound}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* SECCIÓN BUYER PERSONAS */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold flex items-center gap-2 text-indigo-855 dark:text-indigo-400 border-b pb-1.5">
                <Users className="h-4.5 w-4.5 text-indigo-650" />
                Público Objetivo (Buyer Personas)
              </h3>
              {personas.length === 0 ? (
                <p className="text-xs text-muted-foreground italic pl-6">No hay Buyer Personas registrados.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {personas.map((p: any, idx: number) => (
                    <Card key={idx} className="border shadow-none overflow-hidden bg-indigo-50/5">
                      <CardHeader className="bg-muted/10 p-3.5 pb-2 border-b">
                        <CardTitle className="text-xs font-bold text-indigo-850 dark:text-indigo-400">{p.name}</CardTitle>
                        <CardDescription className="text-[10px] mt-0.5 leading-relaxed text-slate-700 dark:text-slate-300">
                          {p.demographics}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-3.5 space-y-2.5 text-[11px]">
                        <div className="space-y-0.5">
                          <span className="font-bold text-foreground block">Objetivos y Deseos:</span>
                          <p className="text-muted-foreground leading-relaxed">{p.goals || "No definidas"}</p>
                        </div>
                        <div className="space-y-0.5">
                          <span className="font-bold text-foreground block">Puntos de Dolor (Pain Points):</span>
                          <p className="text-muted-foreground leading-relaxed">{p.painPoints || "No definidos"}</p>
                        </div>
                        {p.communication && (
                          <div className="space-y-1.5 mt-2.5 pt-2.5 border-t border-dashed border-muted">
                            {p.communication.tone && (
                              <div>
                                <span className="font-bold text-foreground">Tono de Voz:</span>
                                <span className="text-muted-foreground ml-1.5">{p.communication.tone}</span>
                              </div>
                            )}
                            {p.communication.triggers && (
                              <div>
                                <span className="font-bold text-foreground">Disparadores (Triggers):</span>
                                <span className="text-muted-foreground ml-1.5">{p.communication.triggers}</span>
                              </div>
                            )}
                            {p.communication.topics && (
                              <div>
                                <span className="font-bold text-foreground block">Temas de Interés:</span>
                                <span className="text-muted-foreground mt-0.5 block italic">{p.communication.topics}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* SECCIÓN FUNNEL */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200 border-b pb-1.5">
                <Compass className="h-4.5 w-4.5 text-violet-600" />
                Fases del Funnel de Ventas
              </h3>
              {funnelStages.length === 0 ? (
                <p className="text-xs text-muted-foreground italic pl-6">No hay fases del funnel definidas.</p>
              ) : (
                <div className="space-y-2">
                  {funnelStages.map((stage: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 p-3 border rounded-lg bg-slate-50/10 hover:bg-slate-50/20 transition-colors">
                      <div className="h-6 w-6 rounded-full bg-violet-600/10 text-violet-750 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <div className="space-y-0.5 text-[11px]">
                        <h4 className="font-bold text-slate-900 dark:text-slate-100">{stage.name}</h4>
                        <p className="text-muted-foreground leading-normal">{stage.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SECCIÓN CANALES */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold flex items-center gap-2 text-violet-850 dark:text-violet-400 border-b pb-1.5">
                <Megaphone className="h-4.5 w-4.5 text-violet-600" />
                Plan de Canales y Frecuencia de Publicación
              </h3>
              {channels.length === 0 ? (
                <p className="text-xs text-muted-foreground italic pl-6">No hay canales de comunicación configurados.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {channels.map((ch: any, idx: number) => (
                    <Card key={idx} className="border shadow-none bg-violet-50/5">
                      <CardHeader className="p-3 pb-1.5">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-xs font-bold text-slate-800 dark:text-slate-200">{ch.name}</CardTitle>
                          <Badge variant="secondary" className="text-[9px] uppercase font-bold bg-violet-100/50 text-violet-700">
                            {ch.type || "SOCIAL"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-3 pt-0 text-[11px] text-muted-foreground space-y-1">
                        {ch.frequency && (
                          <div>
                            <span className="font-semibold text-foreground">Frecuencia:</span> {ch.frequency}
                          </div>
                        )}
                        {ch.notes && (
                          <div className="mt-1 pt-1 border-t border-dashed border-muted">
                            <span className="font-semibold text-foreground block mb-0.5 text-[10px]">Notas:</span>
                            <p className="italic text-[10px] leading-tight">{ch.notes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
