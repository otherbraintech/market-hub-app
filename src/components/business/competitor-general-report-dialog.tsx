"use client";

import React, { useState } from 'react';
import { 
  Eye, Compass, ShieldAlert, Sparkles, Brain, 
  ArrowRight, Award, Lightbulb, Users, Target, BookOpen
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

interface CompetitorGeneralReportDialogProps {
  reportData: any;
}

export function CompetitorGeneralReportDialog({ reportData }: CompetitorGeneralReportDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Parse safely
  let data = reportData;
  if (typeof reportData === 'string') {
    try {
      data = JSON.parse(reportData);
    } catch (e) {
      data = null;
    }
  }

  if (!data) {
    return (
      <Button variant="outline" size="sm" disabled className="gap-2 text-xs">
        <Eye className="h-3 w-3" />
        No hay reporte disponible
      </Button>
    );
  }

  // Safe rendering of any nested object or string to prevent React child crash
  const renderSectionContent = (val: any): React.ReactNode => {
    if (val === undefined || val === null) return null;
    if (typeof val === "string") {
      return <p className="text-xs leading-relaxed text-muted-foreground whitespace-pre-line">{val}</p>;
    }
    if (Array.isArray(val)) {
      return (
        <ul className="space-y-1.5">
          {val.map((item, i) => (
            <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5 leading-relaxed">
              <ArrowRight className="h-3 w-3 text-purple-500 shrink-0 mt-0.5" />
              <span>{typeof item === "string" ? item : JSON.stringify(item)}</span>
            </li>
          ))}
        </ul>
      );
    }
    if (typeof val === "object") {
      return (
        <div className="space-y-3">
          {Object.entries(val).map(([key, value]) => (
            <div key={key} className="space-y-1 bg-muted/20 p-3 rounded-lg border">
              <span className="text-xs font-bold text-foreground capitalize block border-b pb-1 mb-2">
                {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}
              </span>
              {renderSectionContent(value)}
            </div>
          ))}
        </div>
      );
    }
    return String(val);
  };

  // Detect structures
  const isSpanishKeysStructure = !!(
    data.panoramaGlobal || 
    data.analisisCanales || 
    data.oportunidadesGaps || 
    data.estrategiaContenidos || 
    data.estrategiaPosicionamiento || 
    data.tacticasConversionPrecios
  );

  const competitors = Array.isArray(data.competitors) ? data.competitors : [];
  const metadata = data.metadata || {};

  // Extract executiveSummary safely
  let executiveSummary = "No se ha generado un resumen ejecutivo.";
  if (typeof data.executiveSummary === "string") {
    executiveSummary = data.executiveSummary;
  } else if (typeof data.panoramaGlobal === "string") {
    executiveSummary = data.panoramaGlobal;
  } else if (data.executiveSummary && typeof data.executiveSummary === "object") {
    const values = Object.values(data.executiveSummary).filter(v => typeof v === "string");
    if (values.length > 0) executiveSummary = values[0] as string;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 px-3 text-xs gap-1.5 cursor-pointer font-semibold border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/20">
          <Brain className="h-3.5 w-3.5" />
          Ver Diagnóstico Competitivo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-[90vw] max-h-[85vh] flex flex-col p-0 overflow-hidden rounded-2xl border border-muted/20 bg-background shadow-2xl animate-in fade-in-50">
        <DialogHeader className="p-6 border-b shrink-0 bg-muted/5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Compass className="h-5 w-5 text-purple-500" />
                Diagnóstico y Análisis de Competidores
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Auditoría consolidada e inteligencia competitiva generada por el Agente de Diagnóstico.
              </p>
            </div>
            {metadata.channelsAnalyzed && (
              <div className="hidden sm:flex gap-1">
                {metadata.channelsAnalyzed.map((chan: string) => (
                  <Badge key={chan} variant="secondary" className="text-[10px] uppercase font-bold">
                    {chan}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Executive Summary / Panorama Global */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <Sparkles className="h-4 w-4 text-purple-500" />
              Resumen Ejecutivo / Panorama Global
            </h3>
            <div className="p-4 bg-purple-50/50 dark:bg-purple-950/10 border border-purple-100 dark:border-purple-900/30 rounded-xl text-xs leading-relaxed text-muted-foreground whitespace-pre-line">
              {renderSectionContent(executiveSummary)}
            </div>
          </div>

          {/* Spanish Keys Tabbed Structure */}
          {isSpanishKeysStructure && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <BookOpen className="h-4 w-4 text-purple-500" />
                Capítulos del Diagnóstico
              </h3>

              <Tabs defaultValue="analisisCanales" className="w-full">
                <TabsList className="w-full flex justify-start overflow-x-auto bg-muted/30 p-1 mb-4 h-auto flex-wrap">
                  {data.analisisCanales && (
                    <TabsTrigger value="analisisCanales" className="text-xs px-3 py-1.5 rounded-lg data-[state=active]:bg-background cursor-pointer">
                      Análisis de Canales
                    </TabsTrigger>
                  )}
                  {data.oportunidadesGaps && (
                    <TabsTrigger value="oportunidadesGaps" className="text-xs px-3 py-1.5 rounded-lg data-[state=active]:bg-background cursor-pointer">
                      Oportunidades & Gaps
                    </TabsTrigger>
                  )}
                  {data.estrategiaContenidos && (
                    <TabsTrigger value="estrategiaContenidos" className="text-xs px-3 py-1.5 rounded-lg data-[state=active]:bg-background cursor-pointer">
                      Contenidos
                    </TabsTrigger>
                  )}
                  {data.estrategiaPosicionamiento && (
                    <TabsTrigger value="estrategiaPosicionamiento" className="text-xs px-3 py-1.5 rounded-lg data-[state=active]:bg-background cursor-pointer">
                      Posicionamiento
                    </TabsTrigger>
                  )}
                  {data.tacticasConversionPrecios && (
                    <TabsTrigger value="tacticasConversionPrecios" className="text-xs px-3 py-1.5 rounded-lg data-[state=active]:bg-background cursor-pointer">
                      Conversión & Precios
                    </TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="analisisCanales" className="mt-0 focus-visible:outline-none">
                  <Card className="border-none shadow-none"><CardContent className="p-0">{renderSectionContent(data.analisisCanales)}</CardContent></Card>
                </TabsContent>
                <TabsContent value="oportunidadesGaps" className="mt-0 focus-visible:outline-none">
                  <Card className="border-none shadow-none"><CardContent className="p-0">{renderSectionContent(data.oportunidadesGaps)}</CardContent></Card>
                </TabsContent>
                <TabsContent value="estrategiaContenidos" className="mt-0 focus-visible:outline-none">
                  <Card className="border-none shadow-none"><CardContent className="p-0">{renderSectionContent(data.estrategiaContenidos)}</CardContent></Card>
                </TabsContent>
                <TabsContent value="estrategiaPosicionamiento" className="mt-0 focus-visible:outline-none">
                  <Card className="border-none shadow-none"><CardContent className="p-0">{renderSectionContent(data.estrategiaPosicionamiento)}</CardContent></Card>
                </TabsContent>
                <TabsContent value="tacticasConversionPrecios" className="mt-0 focus-visible:outline-none">
                  <Card className="border-none shadow-none"><CardContent className="p-0">{renderSectionContent(data.tacticasConversionPrecios)}</CardContent></Card>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* Original Competitors Tabbed Structure */}
          {!isSpanishKeysStructure && competitors.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <Users className="h-4 w-4 text-blue-500" />
                Análisis Detallado por Competidor
              </h3>
              
              <Tabs defaultValue={String(competitors[0].id || 0)} className="w-full">
                <TabsList className="w-full flex justify-start overflow-x-auto bg-muted/30 p-1 mb-4 h-auto flex-wrap">
                  {competitors.map((comp: any, idx: number) => (
                    <TabsTrigger 
                      key={comp.id || idx} 
                      value={String(comp.id || idx)}
                      className="text-xs px-3 py-1.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm cursor-pointer"
                    >
                      {comp.name || `Competidor ${idx + 1}`}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {competitors.map((comp: any, idx: number) => {
                  const insights = comp.insights || {};
                  
                  return (
                    <TabsContent key={comp.id || idx} value={String(comp.id || idx)} className="space-y-4 mt-0 focus-visible:outline-none">
                      {insights.strategicAnalysis && (
                        <div className="p-3.5 bg-muted/40 border rounded-xl text-xs text-muted-foreground leading-relaxed">
                          <strong className="text-foreground block mb-1">Análisis Estratégico:</strong>
                          {renderSectionContent(insights.strategicAnalysis)}
                        </div>
                      )}

                      <div className="grid gap-4 sm:grid-cols-2">
                        {/* Strengths */}
                        <div className="p-4 bg-emerald-50/20 dark:bg-emerald-950/5 border border-emerald-100 dark:border-emerald-900/20 rounded-xl space-y-2">
                          <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                            <Award className="h-3.5 w-3.5" />
                            Fortalezas Principales
                          </h4>
                          {renderSectionContent(insights.strengths)}
                        </div>

                        {/* Weaknesses */}
                        <div className="p-4 bg-rose-50/20 dark:bg-rose-950/5 border border-rose-100 dark:border-rose-900/20 rounded-xl space-y-2">
                          <h4 className="text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                            <ShieldAlert className="h-3.5 w-3.5" />
                            Debilidades y Brechas
                          </h4>
                          {renderSectionContent(insights.weaknesses)}
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        {/* Marketing Tactics */}
                        <div className="p-4 bg-blue-50/20 dark:bg-blue-950/5 border border-blue-100 dark:border-blue-900/20 rounded-xl space-y-2">
                          <h4 className="text-xs font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                            <Target className="h-3.5 w-3.5" />
                            Tácticas de Venta y Canales
                          </h4>
                          {renderSectionContent(insights.marketingTactics)}
                        </div>

                        {/* Recommendations */}
                        <div className="p-4 bg-amber-50/20 dark:bg-amber-950/5 border border-amber-100 dark:border-amber-900/20 rounded-xl space-y-2">
                          <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                            <Lightbulb className="h-3.5 w-3.5" />
                            Recomendaciones de Ataque
                          </h4>
                          {renderSectionContent(insights.recommendations)}
                        </div>
                      </div>
                    </TabsContent>
                  );
                })}
              </Tabs>
            </div>
          )}

          {!isSpanishKeysStructure && competitors.length === 0 && (
            <div className="text-center py-6 text-xs text-muted-foreground italic bg-muted/10 rounded-xl border">
              Aún no se ha consolidado el informe detallado por competidores. Registra y analiza a tus competidores para activarlo.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
