"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, RefreshCw, Loader2, ArrowRight, Target, Calendar, Check, 
  Megaphone, DollarSign, ListTodo
} from "lucide-react";
import { toast } from "sonner";
import { importCampaignAction } from "@/actions/campaign";
import { useRouter } from "next/navigation";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface AiCampaignsPanelProps {
  businessId: string;
  existingCampaigns: any[];
}

export function AiCampaignsPanel({ businessId, existingCampaigns }: AiCampaignsPanelProps) {
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [importingIdx, setImportingIdx] = useState<number | null>(null);
  const [importedIndices, setImportedIndices] = useState<number[]>([]);
  const router = useRouter();

  // Helper to determine if a suggested campaign has already been imported/saved
  const isCampaignAlreadyImported = (campaignName: string) => {
    const cleanCampName = campaignName.trim().toLowerCase();
    return existingCampaigns.some((c: any) => {
      const cleanExistingName = c.name.trim().toLowerCase();
      return cleanExistingName === cleanCampName;
    });
  };

  // Carga automática inicial de las sugerencias preguardadas
  useEffect(() => {
    const fetchSavedProposals = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/business/${businessId}/suggest-campaigns`, {
          method: "GET"
        });
        if (res.ok) {
          const data = await res.json();
          if (data.campaigns && data.campaigns.length > 0) {
            setCampaigns(data.campaigns);
          }
        }
      } catch (error) {
        console.error("Error fetching saved campaign proposals:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSavedProposals();
  }, [businessId]);

  const handleGenerate = async (forceRefresh = false) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/business/${businessId}/suggest-campaigns${forceRefresh ? '?refresh=true' : ''}`, {
        method: "POST"
      });
      if (res.ok) {
        const data = await res.json();
        if (data.campaigns && data.campaigns.length > 0) {
          setCampaigns(data.campaigns);
          if (forceRefresh) {
            toast.success("¡Propuestas de campaña regeneradas y actualizadas!");
          } else {
            toast.success("¡Propuestas de campaña generadas con éxito!");
          }
          setImportedIndices([]);
        } else {
          toast.error("No se pudieron generar propuestas de campaña viables.");
        }
      } else {
        const errData = await res.json();
        toast.error(errData.error || "Error al conectar con la IA.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error inesperado en la comunicación.");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (idx: number, campaign: any) => {
    try {
      setImportingIdx(idx);
      const res = await importCampaignAction(businessId, campaign);

      if (res.success) {
        toast.success(res.message);
        setImportedIndices([...importedIndices, idx]);
        window.location.reload();
      } else {
        toast.error(res.error || "Error al importar la campaña.");
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
      for (let i = 0; i < campaigns.length; i++) {
        if (importedIndices.includes(i) || isCampaignAlreadyImported(campaigns[i].name)) continue;
        
        const campaign = campaigns[i];
        const res = await importCampaignAction(businessId, campaign);

        if (res.success) {
          successCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`¡${successCount} campañas importadas exitosamente!`);
        setImportedIndices(campaigns.map((_, idx) => idx));
        window.location.reload();
      } else {
        toast.error("Error al importar las campañas.");
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
      {campaigns.length === 0 ? (
        loading ? (
          <Card className="border border-violet-100 dark:border-violet-950 bg-gradient-to-br from-violet-50/20 via-white to-white shadow-sm flex flex-col items-center justify-center py-24 text-center space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="relative">
              <div className="absolute inset-0 bg-violet-200/40 rounded-full blur-xl animate-pulse" />
              <div className="relative h-16 w-16 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20 animate-spin duration-3000">
                <Sparkles className="h-7 w-7 text-white" />
              </div>
            </div>
            <div className="space-y-2 max-w-sm">
              <CardTitle className="text-lg font-bold text-slate-800">
                Cargando sugerencias de campaña...
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Buscando propuestas preguardadas o analizando tus estrategias activas.
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
              Campañas recomendadas por IA
            </CardTitle>
            <CardDescription className="max-w-md mt-2 mb-6 text-slate-500 text-sm px-4">
              Genera 3 propuestas completas de campañas de marketing con su cronograma de publicaciones en base a las estrategias y pilares definidos para tu negocio.
            </CardDescription>
            <Button 
              onClick={() => handleGenerate(false)} 
              disabled={loading}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold px-6 py-5 rounded-xl shadow-md shadow-violet-500/15 flex items-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
            >
              <Sparkles className="h-4 w-4 text-violet-100" />
              Generar 3 Campañas con IA
            </Button>
          </Card>
        )
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-4 duration-300">
            <div>
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-350">Propuestas de Campañas Listas</h3>
              <p className="text-xs text-muted-foreground">Revisa las campañas y el plan de contenidos sugeridos.</p>
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
                disabled={loading || campaigns.every((camp, idx) => importedIndices.includes(idx) || isCampaignAlreadyImported(camp.name))}
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
              <p className="text-xs text-muted-foreground">La IA está formulando las propuestas de campaña detalladas y su planificación...</p>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-3">
              {campaigns.map((camp, idx) => {
                const isImported = importedIndices.includes(idx) || isCampaignAlreadyImported(camp.name);
                return (
                  <Card key={idx} className="border border-violet-100/80 bg-gradient-to-b from-white to-slate-50/20 shadow-sm flex flex-col justify-between group hover:shadow-md hover:border-violet-200/50 transition-all duration-300">
                    <CardHeader className="pb-4 border-b border-slate-50">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Badge className="bg-violet-100 text-violet-700 border-none font-bold text-[10px] uppercase">Campaña Sugerida {idx + 1}</Badge>
                      </div>
                      <CardTitle className="text-lg font-extrabold text-slate-900 group-hover:text-violet-700 transition-colors leading-snug">
                        {camp.name}
                      </CardTitle>
                      <CardDescription className="text-xs mt-1.5 leading-relaxed">
                        {camp.description}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-4 pt-4 flex-1">
                      {/* Meta y Presupuesto */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            <Target className="h-3.5 w-3.5 text-blue-500" />
                            Objetivo
                          </h4>
                          <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md inline-block">
                            {camp.objective === "AWARENESS" ? "Reconocimiento de Marca" :
                             camp.objective === "ENGAGEMENT" ? "Interacción / Comunidad" :
                             camp.objective === "TRAFFIC" ? "Tráfico / Visitas" :
                             camp.objective === "LEADS" ? "Generación de Leads" :
                             camp.objective === "SALES" ? "Ventas / Conversión" :
                             camp.objective === "RETENTION" ? "Fidelización / Retención" :
                             camp.objective}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            <DollarSign className="h-3.5 w-3.5 text-green-500" />
                            Presupuesto
                          </h4>
                          <span className="text-xs font-bold text-foreground">
                            ${camp.budget || 100} USD
                          </span>
                        </div>
                      </div>

                      {/* Canales recomendados */}
                      <div className="space-y-1.5">
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          <Megaphone className="h-3.5 w-3.5 text-indigo-500" />
                          Canales
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {camp.channels?.map((chan: string, cIdx: number) => (
                            <Badge key={cIdx} variant="outline" className="text-[10px] border-slate-200 text-slate-650 bg-slate-50 px-2 py-0.5">
                              {chan}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Fecha de ejecución */}
                      <div className="space-y-1">
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-orange-500" />
                          Fechas Estimadas
                        </h4>
                        <p className="text-xs text-slate-700">
                          {format(new Date(camp.startDate), "d MMM", { locale: es })} - {camp.endDate ? format(new Date(camp.endDate), "d MMM yyyy", { locale: es }) : "Continuo"}
                        </p>
                      </div>

                      {/* Acordeón para Planificación de Contenidos */}
                      <Accordion type="single" collapsible className="w-full pt-2">
                        <AccordionItem value="contents" className="border-b-0">
                          <AccordionTrigger className="text-xs py-1.5 hover:no-underline font-bold text-slate-750 flex items-center gap-1">
                            <div className="flex items-center gap-1">
                              <ListTodo className="h-3.5 w-3.5 text-violet-500" />
                              <span>Ver Contenidos Planificados ({camp.contents?.length || 0})</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pt-2 pb-1">
                            <ul className="space-y-2">
                              {camp.contents?.map((post: any, pIdx: number) => (
                                <li key={pIdx} className="bg-slate-50 p-2.5 rounded-lg border border-slate-100/50 text-xs">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-slate-800 text-[11px] truncate max-w-[130px]">{post.title}</span>
                                    <Badge className="bg-slate-200 text-slate-700 border-none font-bold text-[9px] uppercase">
                                      {post.type} - Idea {pIdx + 1}
                                    </Badge>
                                  </div>
                                  <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">{post.caption}</p>
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
                          onClick={() => handleImport(idx, camp)}
                          disabled={importingIdx !== null}
                          className="w-full bg-violet-600 hover:bg-violet-700 text-white flex items-center justify-center gap-1.5 font-bold transition-all active:scale-[0.98] cursor-pointer"
                        >
                          {importingIdx === idx ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Importando...
                            </>
                          ) : (
                            <>
                              Guardar como Campaña
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
