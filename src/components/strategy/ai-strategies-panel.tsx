"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, RefreshCw, Loader2, ArrowRight, Target, Users, Megaphone, Check, 
  HelpCircle, Compass, Flame, ShieldAlert, Award
} from "lucide-react";
import { toast } from "sonner";
import { createStrategyAction } from "@/actions/strategy";
import { useRouter } from "next/navigation";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface AiStrategiesPanelProps {
  businessId: string;
  existingStrategiesCount: number;
}

export function AiStrategiesPanel({ businessId, existingStrategiesCount }: AiStrategiesPanelProps) {
  const [loading, setLoading] = useState(true);
  const [strategies, setStrategies] = useState<any[]>([]);
  const [importingIdx, setImportingIdx] = useState<number | null>(null);
  const [importedIndices, setImportedIndices] = useState<number[]>([]);
  const router = useRouter();

  // Carga automática inicial de las sugerencias preguardadas en la base de datos
  useEffect(() => {
    const fetchSavedProposals = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/business/${businessId}/suggest-complete-strategies`, {
          method: "GET"
        });
        if (res.ok) {
          const data = await res.json();
          if (data.strategies && data.strategies.length > 0) {
            setStrategies(data.strategies);
          }
        }
      } catch (error) {
        console.error("Error fetching saved proposals:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSavedProposals();
  }, [businessId]);

  const handleGenerate = async (forceRefresh = false) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/business/${businessId}/suggest-complete-strategies${forceRefresh ? '?refresh=true' : ''}`, {
        method: "POST"
      });
      if (res.ok) {
        const data = await res.json();
        if (data.strategies && data.strategies.length > 0) {
          if (forceRefresh) {
            // Si es regenerar, añadimos las nuevas al final de las ya existentes (acumular abajo)
            setStrategies(prev => [...prev, ...data.strategies]);
            toast.success("¡Nuevas estrategias generadas y guardadas!");
          } else {
            setStrategies(data.strategies);
            toast.success("¡Estrategias generadas con éxito!");
          }
          // Limpiar índices importados anteriores al regenerar
          setImportedIndices([]);
        } else {
          toast.error("No se pudieron generar propuestas viables.");
        }
      } else {
        toast.error("Error al conectar con la IA.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error inesperado en la comunicación.");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (idx: number, strategy: any) => {
    try {
      setImportingIdx(idx);
      const res = await createStrategyAction(businessId, {
        name: strategy.name.startsWith("✨") ? strategy.name : `✨ ${strategy.name}`,
        description: strategy.description,
        isActive: false, // Inactiva por defecto para que el usuario la active cuando quiera
        objectives: strategy.objectives,
        personas: strategy.personas,
        funnelStages: strategy.funnelStages,
        channels: strategy.channels,
      });

      if (res.success) {
        toast.success(`Estrategia "${strategy.name}" importada exitosamente.`);
        setImportedIndices([...importedIndices, idx]);
        router.refresh();
      } else {
        toast.error(res.error || "Error al importar la estrategia.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error inesperado al intentar guardar.");
    } finally {
      setImportingIdx(null);
    }
  };

  const handleImportAll = async () => {
    try {
      setLoading(true);
      let successCount = 0;
      for (let i = 0; i < strategies.length; i++) {
        // Omitir si ya está importada
        if (importedIndices.includes(i)) continue;
        
        const strategy = strategies[i];
        const res = await createStrategyAction(businessId, {
          name: strategy.name.startsWith("✨") ? strategy.name : `✨ ${strategy.name}`,
          description: strategy.description,
          isActive: false,
          objectives: strategy.objectives,
          personas: strategy.personas,
          funnelStages: strategy.funnelStages,
          channels: strategy.channels,
        });

        if (res.success) {
          successCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`¡${successCount} estrategias importadas exitosamente!`);
        setImportedIndices(strategies.map((_, idx) => idx));
        router.refresh();
      } else {
        toast.error("Error al importar las estrategias.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error inesperado al intentar guardar todas.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {strategies.length === 0 ? (
        loading ? (
          <Card className="border border-violet-100 dark:border-violet-950 bg-gradient-to-br from-violet-50/20 via-white to-white shadow-sm flex flex-col items-center justify-center py-24 text-center space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-violet-200/40 rounded-full blur-xl animate-pulse" />
              <div className="relative h-16 w-16 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20 animate-spin duration-3000">
                <Sparkles className="h-7 w-7 text-white" />
              </div>
            </div>
            <div className="space-y-2 max-w-sm">
              <CardTitle className="text-lg font-bold text-slate-800">
                Cargando sugerencias...
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Buscando propuestas preguardadas o analizando el perfil del negocio.
              </CardDescription>
            </div>
            <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
          </Card>
        ) : (
          <Card className="border border-violet-100 dark:border-violet-950 bg-gradient-to-br from-violet-50/20 via-white to-white shadow-sm flex flex-col items-center justify-center py-16 text-center">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-violet-200/40 rounded-full blur-xl animate-pulse" />
              <div className="relative h-14 w-14 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                <Sparkles className="h-6 w-6 text-white animate-pulse" />
              </div>
            </div>
            <CardTitle className="text-xl font-extrabold text-slate-800 tracking-tight">
              Estrategias recomendadas por IA
            </CardTitle>
            <CardDescription className="max-w-md mt-2 mb-6 text-slate-500 text-sm px-4">
              Genera 3 propuestas completas de estrategias de marketing digital y growth hacking diseñadas en base a tu negocio, productos registrados y las brechas detectadas de tu competencia directa.
            </CardDescription>
            <Button 
              onClick={() => handleGenerate(false)} 
              disabled={loading}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold px-6 py-5 rounded-xl shadow-md shadow-violet-500/15 flex items-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
            >
              <Sparkles className="h-4 w-4 text-violet-100" />
              Generar 3 Estrategias con IA
            </Button>
          </Card>
        )
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Propuestas Estratégicas Listas</h3>
              <p className="text-xs text-muted-foreground">Revisa las opciones detalladas y guarda la que mejor se adapte.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleGenerate(true)}
                disabled={loading}
                className="gap-1.5 text-xs border-violet-200/80 bg-violet-50 hover:bg-violet-100 text-violet-700 cursor-pointer"
              >
                <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                Regenerar Propuestas
              </Button>
              <Button 
                variant="default"
                size="sm"
                onClick={handleImportAll}
                disabled={loading || importedIndices.length === strategies.length}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold text-xs gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-all"
              >
                <Check className="h-3.5 w-3.5" />
                Guardar todas
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-violet-600" />
              <p className="text-xs text-muted-foreground">La IA está evaluando los reportes de tus competidores para crear estrategias viables...</p>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-3">
              {strategies.map((strat, idx) => {
                const isImported = importedIndices.includes(idx);
                return (
                  <Card key={idx} className="border border-violet-100/80 bg-gradient-to-b from-white to-slate-50/20 shadow-sm flex flex-col justify-between group hover:shadow-md hover:border-violet-200/50 transition-all duration-300">
                    <CardHeader className="pb-4 border-b border-slate-50">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Badge className="bg-violet-100 text-violet-700 border-none font-bold text-[10px] uppercase">IA Sugerida {idx + 1}</Badge>
                      </div>
                      <CardTitle className="text-lg font-extrabold text-slate-900 group-hover:text-violet-700 transition-colors leading-snug">
                        {strat.name}
                      </CardTitle>
                      <CardDescription className="text-xs mt-1.5 leading-relaxed">
                        {strat.description}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-4 pt-4 flex-1">
                      {/* Pilares de Contenido */}
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          <Flame className="h-3.5 w-3.5 text-orange-500" />
                          Pilares de Contenido
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {strat.contentPillars?.map((pillar: string, pIdx: number) => (
                            <Badge key={pIdx} variant="outline" className="text-[10px] border-slate-200 text-slate-650 bg-slate-50/50 px-2 py-0.5">
                              {pillar}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Canales recomendados */}
                      <div className="space-y-1.5">
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          <Megaphone className="h-3.5 w-3.5 text-blue-500" />
                          Canales y Frecuencia
                        </h4>
                        <ul className="space-y-1">
                          {strat.channels?.map((chan: any, cIdx: number) => (
                            <li key={cIdx} className="text-xs text-slate-650 flex items-center justify-between">
                              <span className="font-semibold text-slate-750">{chan.name}</span>
                              <span className="text-[10px] text-muted-foreground">{chan.frequency}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Acordeón para Detalles Profundos */}
                      <Accordion type="single" collapsible className="w-full pt-2">
                        <AccordionItem value="objectives" className="border-b-0">
                          <AccordionTrigger className="text-xs py-1.5 hover:no-underline font-bold text-slate-750 flex items-center gap-1">
                            <div className="flex items-center gap-1">
                              <Target className="h-3.5 w-3.5 text-violet-500" />
                              <span>Ver Objetivos SMART ({strat.objectives?.length || 0})</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pt-2 pb-1">
                            <ul className="space-y-2">
                              {strat.objectives?.map((obj: any, oIdx: number) => (
                                <li key={oIdx} className="bg-slate-50 p-2 rounded-lg border border-slate-100/50 text-xs">
                                  <p className="font-bold text-slate-800">{obj.title}</p>
                                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                                    <span>Meta: {obj.target} {obj.metric}</span>
                                    <span className="font-medium text-slate-500">{obj.timeframe}</span>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="personas" className="border-b-0">
                          <AccordionTrigger className="text-xs py-1.5 hover:no-underline font-bold text-slate-750 flex items-center gap-1">
                            <div className="flex items-center gap-1">
                              <Users className="h-3.5 w-3.5 text-emerald-500" />
                              <span>Buyer Personas ({strat.personas?.length || 0})</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pt-2 pb-1">
                            <ul className="space-y-3">
                              {strat.personas?.map((pers: any, pIdx: number) => (
                                <li key={pIdx} className="bg-emerald-50/20 p-2.5 rounded-lg border border-emerald-100/30 text-xs space-y-1">
                                  <p className="font-extrabold text-emerald-950">{pers.name}</p>
                                  <p className="text-[10px] text-emerald-800/80 font-medium">{pers.role} ({pers.demographics})</p>
                                  <div className="text-[10px] space-y-0.5 mt-1 text-slate-600">
                                    <p><strong className="text-emerald-900">Dolor:</strong> {pers.painPoints?.[0]}</p>
                                    <p><strong className="text-emerald-900">Tema:</strong> {pers.contentTheme}</p>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="funnel" className="border-b-0">
                          <AccordionTrigger className="text-xs py-1.5 hover:no-underline font-bold text-slate-750 flex items-center gap-1">
                            <div className="flex items-center gap-1">
                              <Compass className="h-3.5 w-3.5 text-indigo-500" />
                              <span>Embudo e Ideas de Contenido</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pt-2 pb-1">
                            <ul className="space-y-2">
                              {strat.funnelStages?.map((stage: any, fIdx: number) => (
                                <li key={fIdx} className="bg-slate-50 p-2 rounded-lg border border-slate-100/50 text-xs">
                                  <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-650 bg-indigo-50 px-1.5 py-0.5 rounded">{stage.stage}</span>
                                  <p className="text-[10px] text-slate-650 leading-relaxed mt-1">{stage.strategy}</p>
                                </li>
                              ))}
                            </ul>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </CardContent>

                    <CardFooter className="pt-2 pb-4 border-t border-slate-50/80">
                      {isImported ? (
                        <Button disabled className="w-full bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border border-emerald-100 flex items-center justify-center gap-1.5">
                          <Check className="h-4 w-4" />
                          Importada con éxito
                        </Button>
                      ) : (
                        <Button 
                          onClick={() => handleImport(idx, strat)}
                          disabled={importingIdx !== null}
                          className="w-full bg-violet-600 hover:bg-violet-700 text-white flex items-center justify-center gap-1.5 font-bold transition-all active:scale-[0.98]"
                        >
                          {importingIdx === idx ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Importando...
                            </>
                          ) : (
                            <>
                              Guardar como Estrategia
                              <ArrowRight className="h-3.5 w-3.5" />
                            </>
                          )}
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
