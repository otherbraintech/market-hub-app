"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Badge } from "@/components/ui/badge";
import { strategySchema, StrategyFormValues } from "@/lib/schemas/strategy";
import { getSelectedBusinessId } from "@/actions/business";
import { upsertStrategyAction } from "@/actions/strategy";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Edit, 
  Trash, 
  Megaphone, 
  Lightbulb, 
  Target, 
  Users, 
  ArrowRight,
  HelpCircle,
  Sparkles,
  RefreshCw,
  TrendingUp
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BuyerPersonaForm } from "./buyer-persona-form";
import { FunnelStageForm } from "./funnel-stage-form";
import { ChannelForm } from "./channel-form";
import { ObjectivesForm } from "./objectives-form";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface StrategyFormProps {
  businessId: string;
  defaultValues?: Partial<StrategyFormValues>;
  onSuccess?: () => void;
}

export function StrategyForm({ businessId, defaultValues, onSuccess }: StrategyFormProps) {
  const [loading, setLoading] = useState(false);
  const [generatingStrategy, setGeneratingStrategy] = useState(false);
  const [aiMode, setAiMode] = useState(true);
  const [focuses, setFocuses] = useState<Array<{ 
    name: string; 
    description: string; 
    icon: string;
    suggestedChannels?: string[];
    suggestedPillars?: string[];
    suggestedTones?: string[];
  }>>([]);
  const [loadingFocuses, setLoadingFocuses] = useState(false);
  const [selectedFocus, setSelectedFocus] = useState<number | null>(null);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [selectedPillars, setSelectedPillars] = useState<string[]>([]);
  const [selectedTone, setSelectedTone] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    if (aiMode && focuses.length === 0) {
      fetchFocuses();
    }
  }, [aiMode, businessId]);

  const fetchFocuses = async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setSelectedFocus(null);
        setSelectedChannels([]);
        setSelectedPillars([]);
        setSelectedTone("");
      } else {
        const cached = sessionStorage.getItem(`strategy_focuses_${businessId}`);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            setFocuses(parsed);
            return;
          } catch (e) {
            console.error("Error parsing cached focuses:", e);
          }
        }
      }

      setLoadingFocuses(true);
      const res = await fetch(`/api/business/${businessId}/suggest-strategy-focuses${forceRefresh ? "?refresh=true" : ""}`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.focuses) {
          setFocuses(data.focuses);
          sessionStorage.setItem(`strategy_focuses_${businessId}`, JSON.stringify(data.focuses));
        }
      }
    } catch (error) {
      console.error("Error fetching focuses:", error);
    } finally {
      setLoadingFocuses(false);
    }
  };

  const handleSelectFocus = (index: number, focus: any) => {
    setSelectedFocus(index);
    form.setValue("name", focus.name);
    form.setValue("description", focus.description);
    
    // Auto-populate options with AI suggested defaults
    setSelectedChannels(focus.suggestedChannels || []);
    setSelectedPillars(focus.suggestedPillars || []);
    setSelectedTone(focus.suggestedTones?.[0] || "");
  };

  const getFocusIcon = (iconName: string) => {
    switch (iconName) {
      case 'Target': return <Target className="h-5 w-5 text-indigo-600" />;
      case 'Sparkles': return <Sparkles className="h-5 w-5 text-violet-600" />;
      default: return <TrendingUp className="h-5 w-5 text-purple-600" />;
    }
  };
  const [openPersonaDialog, setOpenPersonaDialog] = useState(false);
  const [openFunnelDialog, setOpenFunnelDialog] = useState(false);
  const [openChannelDialog, setOpenChannelDialog] = useState(false);
  const [openObjectiveDialog, setOpenObjectiveDialog] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const form = useForm<StrategyFormValues>({
    resolver: zodResolver(strategySchema) as any,
    defaultValues: {
      name: defaultValues?.name || "",
      description: defaultValues?.description || "",
      isActive: true,
      objectives: defaultValues?.objectives || [],
      personas: defaultValues?.personas || [], 
      funnelStages: defaultValues?.funnelStages || [],
      channels: defaultValues?.channels || []
    },
  });

  const watchedObjectives = form.watch("objectives") || [];
  const watchedPersonas = form.watch("personas") || [];
  const watchedChannels = form.watch("channels") || [];
  const watchedName = form.watch("name");
  const watchedDescription = form.watch("description");

  const { fields: objectivesFields, append: appendObjective, update: updateObjective, remove: removeObjective } = useFieldArray({
    control: form.control,
    name: "objectives"
  });

  const { fields: personasFields, append: appendPersona, update: updatePersona, remove: removePersona } = useFieldArray({
    control: form.control,
    name: "personas"
  });

  const { fields: funnelFields, append: appendFunnel, update: updateFunnel, remove: removeFunnel } = useFieldArray({
    control: form.control,
    name: "funnelStages"
  });

  const { fields: channelFields, append: appendChannel, update: updateChannel, remove: removeChannel } = useFieldArray({
    control: form.control,
    name: "channels"
  });

  const handleGenerateWithAI = async () => {
    try {
      setGeneratingStrategy(true);
      const res = await fetch(`/api/business/${businessId}/generate-strategy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: watchedName,
          description: watchedDescription,
          selectedChannels,
          selectedPillars,
          selectedTone,
        }),
      });

      if (!res.ok) {
        throw new Error("Error al comunicarse con la IA");
      }

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Populate form fields
      form.reset({
        name: data.name || "Estrategia Sugerida",
        description: data.description || "",
        isActive: true,
        objectives: data.objectives || [],
        personas: data.personas || [],
        funnelStages: data.funnelStages || [],
        channels: data.channels || [],
      });

      toast.success("¡Estrategia generada con éxito! Revisa las pestañas y presiona Guardar.");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error al generar la estrategia con IA");
    } finally {
      setGeneratingStrategy(false);
    }
  };

  async function onSubmit(data: StrategyFormValues) {
    setLoading(true);
    try {
      const result = await upsertStrategyAction(businessId, data);
      if (result.success) {
        toast.success(result.message);
        onSuccess?.();
        router.push("/strategies");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Error inesperado al guardar");
    } finally {
      setLoading(false);
    }
  }

  // Handlers para Persona
  const handleSavePersona = (data: any) => {
    if (editingIndex !== null) {
      updatePersona(editingIndex, data);
    } else {
      appendPersona(data);
    }
    setOpenPersonaDialog(false);
    setEditingIndex(null);
  };

  // Handlers para Funnel
  const handleSaveFunnel = (data: any) => {
    if (editingIndex !== null) {
      updateFunnel(editingIndex, data);
    } else {
      appendFunnel(data);
    }
    setOpenFunnelDialog(false);
    setEditingIndex(null);
  };

  // Handlers para Channel
  const handleSaveChannel = (data: any) => {
    if (editingIndex !== null) {
      updateChannel(editingIndex, data);
    } else {
      appendChannel(data);
    }
    setOpenChannelDialog(false);
    setEditingIndex(null);
  };

  // Handlers para Objective
  const handleSaveObjective = (data: any) => {
    if (editingIndex !== null) {
      updateObjective(editingIndex, data);
    } else {
      appendObjective(data);
    }
    setOpenObjectiveDialog(false);
    setEditingIndex(null);
  };
  
  const LabelHelp = ({ label, help }: { label: string; help: string }) => (
    <div className="flex items-center gap-2">
      <FormLabel>{label}</FormLabel>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-[200px]">
          {help}
        </TooltipContent>
      </Tooltip>
    </div>
  );

  return (
    <TooltipProvider delayDuration={200}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center justify-between">
           <div>
              <h3 className="text-lg font-medium">Definición Estratégica</h3>
              <p className="text-sm text-muted-foreground">Define los pilares de tu marketing para guiar a la IA.</p>
           </div>
           <div className="flex items-center gap-2">
             {aiMode && (
               <Button
                 type="button"
                 variant="outline"
                 className="bg-gradient-to-r from-violet-600/10 to-indigo-600/10 hover:from-violet-600/20 hover:to-indigo-600/20 text-violet-700 dark:text-violet-300 border-violet-200/50 dark:border-violet-800/50 flex items-center gap-2 transition-all duration-300 animate-in fade-in zoom-in-95"
                 disabled={generatingStrategy || loading}
                 onClick={handleGenerateWithAI}
               >
                 {generatingStrategy ? (
                   <>
                     <RefreshCw className="h-4 w-4 animate-spin text-violet-600 dark:text-violet-400" />
                     <span>Generando...</span>
                   </>
                 ) : (
                   <>
                     <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400 animate-pulse" />
                     <span>Generar con IA</span>
                   </>
                 )}
               </Button>
             )}
             <Button type="submit" disabled={loading || generatingStrategy}>
               {loading ? "Guardando..." : "Guardar Cambios"}
             </Button>
           </div>
        </div>

        <Card className="border border-violet-100 dark:border-violet-950 bg-violet-50/20 dark:bg-violet-950/10">
          <CardContent className="py-4 flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="text-sm font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                Modo Asistido por IA (Recomendado)
              </h4>
              <p className="text-xs text-muted-foreground">
                La IA diseña tus objetivos SMART, buyer personas y funnels a partir del perfil del negocio. Desactívalo si prefieres editarlos manualmente.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="ai-mode" className="text-xs font-semibold text-muted-foreground cursor-pointer">
                {aiMode ? "IA Activada" : "Modo Manual"}
              </Label>
              <Switch
                id="ai-mode"
                checked={aiMode}
                onCheckedChange={setAiMode}
                disabled={generatingStrategy || loading}
              />
            </div>
          </CardContent>
        </Card>

        {aiMode ? (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Paso 1: Enfoques sugeridos por IA */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400 animate-pulse" />
                  Paso 1: Elige un Enfoque Estratégico propuesto por IA
                </span>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="text-[10px] font-bold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 h-7 px-2 hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors"
                  disabled={loadingFocuses}
                  onClick={() => fetchFocuses(true)}
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${loadingFocuses ? 'animate-spin' : ''}`} />
                  Regenerar Propuestas
                </Button>
              </h4>
              <p className="text-xs text-muted-foreground">
                Basado en tu descripción del negocio, productos y competidores scrapeados, la IA propone estas ideas. Haz clic en una para rellenar los datos.
              </p>

              {loadingFocuses ? (
                <div className="grid gap-4 md:grid-cols-3">
                  {[1, 2, 3].map((n) => (
                    <Card key={n} className="animate-pulse border-dashed bg-slate-50/10">
                      <CardContent className="p-4 space-y-3">
                        <div className="h-7 w-7 bg-slate-200 rounded-lg" />
                        <div className="h-4 w-2/3 bg-slate-200 rounded" />
                        <div className="h-3 w-full bg-slate-200 rounded" />
                        <div className="h-3 w-5/6 bg-slate-200 rounded" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-3">
                  {focuses.map((focus, index) => {
                    const isSelected = selectedFocus === index;
                    return (
                      <Card 
                        key={index} 
                        className={`cursor-pointer transition-all duration-300 hover:shadow-md border ${
                          isSelected 
                            ? 'border-violet-500 dark:border-violet-400 bg-violet-50/50 dark:bg-violet-950/20 shadow-sm ring-1 ring-violet-500/20' 
                            : 'border-slate-200 dark:border-slate-800 bg-card hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                        onClick={() => handleSelectFocus(index, focus)}
                      >
                        <CardContent className="p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                              {getFocusIcon(focus.icon)}
                            </div>
                            {isSelected && <Badge className="text-[9px] bg-violet-600 dark:bg-violet-500 font-bold text-white">Elegido</Badge>}
                          </div>
                          <h5 className="font-bold text-xs text-slate-900 dark:text-slate-100 leading-tight">{focus.name}</h5>
                          <p className="text-[10px] text-muted-foreground leading-normal line-clamp-4">{focus.description}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {focuses[selectedFocus ?? -1] && watchedObjectives.length === 0 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Paso 2: Canales Activos */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Megaphone className="h-4.5 w-4.5 text-violet-600 dark:text-violet-400" />
                    Paso 2: Canales de Distribución Sugeridos
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Activa o desactiva los canales donde quieres enfocar tu estrategia. Haz clic en ellos para seleccionarlos.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {focuses[selectedFocus ?? -1].suggestedChannels?.map((channel: string) => {
                      const isSelected = selectedChannels.includes(channel);
                      return (
                        <Badge
                          key={channel}
                          variant={isSelected ? "default" : "outline"}
                          className={`cursor-pointer text-xs px-3 py-1.5 transition-all duration-200 select-none flex items-center gap-1.5 ${
                            isSelected 
                              ? 'bg-violet-600 dark:bg-violet-500 hover:bg-violet-700 dark:hover:bg-violet-600 text-white shadow-sm ring-1 ring-violet-500/10' 
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                          }`}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedChannels(selectedChannels.filter(c => c !== channel));
                            } else {
                              setSelectedChannels([...selectedChannels, channel]);
                            }
                          }}
                        >
                          <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-colors ${
                            isSelected ? 'bg-white/20' : 'border border-slate-300 dark:border-slate-700'
                          }`}>
                            {isSelected ? (
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-2 h-2 text-white">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                              </svg>
                            ) : (
                              <span className="text-[10px] leading-none font-bold text-slate-400 dark:text-slate-500">+</span>
                            )}
                          </div>
                          {channel}
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                {/* Paso 3: Pilares Temáticos */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Lightbulb className="h-4.5 w-4.5 text-violet-600 dark:text-violet-400" />
                    Paso 3: Pilares Temáticos de Contenido
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Selecciona los temas principales sobre los cuales la IA estructurará las temáticas de las buyer personas e ideas.
                  </p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {focuses[selectedFocus ?? -1].suggestedPillars?.map((pillar: string) => {
                      const isSelected = selectedPillars.includes(pillar);
                      return (
                        <Card
                          key={pillar}
                          className={`cursor-pointer transition-all duration-200 border ${
                            isSelected 
                              ? 'border-violet-500 dark:border-violet-400 bg-violet-50/40 dark:bg-violet-950/20 ring-1 ring-violet-500/10' 
                              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-card'
                          }`}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedPillars(selectedPillars.filter(p => p !== pillar));
                            } else {
                              setSelectedPillars([...selectedPillars, pillar]);
                            }
                          }}
                        >
                          <CardContent className="p-3 flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-850 dark:text-slate-200">{pillar}</span>
                            <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-colors ${
                              isSelected ? 'bg-violet-600 dark:bg-violet-500 border-violet-600 dark:border-violet-500' : 'border-slate-300 dark:border-slate-700'
                            }`}>
                              {isSelected && <div className="w-1.5 h-1.5 bg-white dark:bg-slate-900 rounded-full" />}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>

                {/* Paso 4: Tono de Voz */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Sparkles className="h-4.5 w-4.5 text-violet-600 dark:text-violet-400 animate-pulse" />
                    Paso 4: Tono de Comunicación de Marca
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Elige el tono de voz que la IA usará para generar la estrategia y el estilo de comunicación de las personas.
                  </p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {focuses[selectedFocus ?? -1].suggestedTones?.map((tone: string) => {
                      const isSelected = selectedTone === tone;
                      return (
                        <Card
                          key={tone}
                          className={`cursor-pointer transition-all duration-200 border ${
                            isSelected 
                              ? 'border-violet-500 dark:border-violet-400 bg-violet-50/40 dark:bg-violet-950/20 ring-1 ring-violet-500/10' 
                              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-card'
                          }`}
                          onClick={() => setSelectedTone(tone)}
                        >
                          <CardContent className="p-3 flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-800 dark:text-slate-200">{tone}</span>
                            <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-colors ${
                              isSelected ? 'bg-violet-600 dark:bg-violet-500 border-violet-600 dark:border-violet-500' : 'border-slate-300 dark:border-slate-700'
                            }`}>
                              {isSelected && <div className="w-1.5 h-1.5 bg-white dark:bg-slate-900 rounded-full" />}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>

                {/* Resumen & Generador */}
                <Card className="border border-violet-100 dark:border-violet-900 bg-violet-50/10 dark:bg-violet-950/5 animate-in fade-in duration-300">
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="space-y-3 flex-1">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">Enfoque Elegido</span>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{watchedName}</h4>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold">Descripción Estratégica</span>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{watchedDescription}</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white flex items-center gap-2 shadow-md shrink-0 w-full md:w-auto"
                        disabled={generatingStrategy || loading}
                        onClick={handleGenerateWithAI}
                      >
                        {generatingStrategy ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            <span>Diseñando...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4" />
                            <span>Generar Plan de Acción</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {watchedObjectives.length > 0 && (
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="border border-violet-100/50 bg-violet-50/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2 text-violet-800">
                      <Target className="h-4 w-4" />
                      Objetivos SMART sugeridos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-[300px] overflow-y-auto">
                    {watchedObjectives.map((obj: any, index: number) => (
                      <div key={index} className="text-xs border-b pb-2 last:border-0 last:pb-0">
                        <span className="font-semibold">{obj.name}:</span> {obj.specific}
                        <div className="text-[10px] text-muted-foreground mt-1">Meta: {obj.targetValue} {obj.unit} • Plazo: {obj.deadline}</div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="border border-indigo-100/50 bg-indigo-50/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2 text-indigo-800">
                      <Users className="h-4 w-4" />
                      Público Objetivo (Buyer Personas)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 max-h-[300px] overflow-y-auto">
                    {watchedPersonas.map((p: any, index: number) => (
                      <div key={index} className="text-xs border-b pb-2 last:border-0 last:pb-0">
                        <div className="font-semibold text-indigo-950">{p.name}</div>
                        <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">{p.demographics}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="md:col-span-2 border border-violet-100/50 bg-violet-50/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2 text-violet-800">
                      <Megaphone className="h-4 w-4" />
                      Plan de Canales y Frecuencia de Publicación
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {watchedChannels.map((ch: any, index: number) => (
                      <div key={index} className="text-xs bg-white p-3 border rounded-xl flex items-center justify-between shadow-sm">
                        <div>
                          <div className="font-semibold text-slate-800">{ch.name}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">{ch.frequency}</div>
                        </div>
                        <span className="text-[9px] bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{ch.type}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        ) : (
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
               <TabsTrigger value="general">General</TabsTrigger>
               <TabsTrigger value="objectives">Objetivos</TabsTrigger>
               <TabsTrigger value="personas">Personas</TabsTrigger>
               <TabsTrigger value="channels">Canales</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4 py-4">
               <Card>
                  <CardHeader>
                     <CardTitle>Información Básica</CardTitle>
                     <CardDescription>Nombre y propósito de esta estrategia.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <LabelHelp label="Nombre de la Estrategia" help="Un nombre descriptivo para identificar este plan maestro (ej. Campaña Navideña 2024)." />
                          <FormControl>
                            <Input placeholder="Ej. Lanzamiento Q3" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <LabelHelp label="Visión General" help="Explica el propósito principal y lo que esperas lograr con esta estrategia." />
                          <FormControl>
                            <Textarea 
                              placeholder="Describe el enfoque general..." 
                              className="min-h-[120px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                           <div className="flex items-center space-x-2">
                              <FormControl>
                                  <Input 
                                      type="checkbox" 
                                      checked={field.value} 
                                      onChange={field.onChange}
                                      className="h-4 w-4"
                                  />
                              </FormControl>
                              <LabelHelp label="Estrategia Activa" help="Si está activa, la IA usará los pilares de esta estrategia para generar contenido." />
                           </div>
                      )}
                    />
                  </CardContent>
               </Card>
               
               <Card>
                   <CardHeader>
                       <CardTitle>Funnel de Ventas</CardTitle>
                       <CardDescription>Configura las etapas por las que pasan tus clientes.</CardDescription>
                   </CardHeader>
                   <CardContent>
                      {funnelFields.length > 0 ? (
                          <div className="space-y-2">
                          {funnelFields.map((field, index) => (
                              <div key={field.id} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                              <div className="flex items-center gap-4">
                                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                                  {index + 1}
                                  </div>
                                  <div>
                                  <h4 className="font-semibold">{field.name}</h4>
                                  <p className="text-sm text-muted-foreground line-clamp-1">{field.description}</p>
                                  </div>
                              </div>
                              {!aiMode && (
                                 <div className="flex gap-2">
                                   <Button variant="ghost" size="icon" onClick={() => { setEditingIndex(index); setOpenFunnelDialog(true); }}>
                                       <Edit className="h-4 w-4" />
                                   </Button>
                                   <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeFunnel(index)}>
                                       <Trash className="h-4 w-4" />
                                   </Button>
                                 </div>
                               )}
                              </div>
                          ))}
                          </div>
                      ) : (
                          <div className="text-center p-4 text-muted-foreground">No hay etapas definidas</div>
                      )}
                      {!aiMode && (
                         <Button onClick={() => { setEditingIndex(null); setOpenFunnelDialog(true); }} type="button" variant="outline" className="w-full mt-4">
                             <Plus className="mr-2 h-4 w-4" /> Añadir Etapa de Funnel
                         </Button>
                      )}
                   </CardContent>
               </Card>
            </TabsContent>

            <TabsContent value="objectives" className="py-4 space-y-4">
               {objectivesFields.length > 0 && (
                 <div className="grid gap-4 md:grid-cols-2">
                   {objectivesFields.map((field, index) => (
                     <Card key={field.id} className="relative group">
                       <CardHeader>
                         <CardTitle className="text-base">{field.name}</CardTitle>
                         <CardDescription>Meta: {field.targetValue} {field.unit} • Límite: {field.deadline}</CardDescription>
                       </CardHeader>
                       <CardContent>
                         <div className="text-sm text-muted-foreground line-clamp-2">
                           {field.specific}
                         </div>
                         <div className="mt-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              field.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 
                              field.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {field.status}
                            </span>
                         </div>
                         {!aiMode && (
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                              <Button variant="ghost" size="icon" onClick={() => { setEditingIndex(index); setOpenObjectiveDialog(true); }}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeObjective(index)}>
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                       </CardContent>
                     </Card>
                   ))}
                 </div>
               )}
               
               {objectivesFields.length === 0 && (
                  <div className="flex flex-col items-center justify-center min-h-[200px] border rounded-lg bg-muted/10 border-dashed text-center p-8">
                    <Target className="h-10 w-10 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">No hay objetivos SMART definidos.</p>
                  </div>
               )}

               {!aiMode && (
                  <Button onClick={() => { setEditingIndex(null); setOpenObjectiveDialog(true); }} type="button" className="w-full">
                    <Plus className="mr-2 h-4 w-4" /> Añadir Objetivo SMART
                  </Button>
               )}
            </TabsContent>

            <TabsContent value="personas" className="py-4 space-y-4">
               {personasFields.length > 0 && (
                 <div className="grid gap-4 md:grid-cols-2">
                   {personasFields.map((field, index) => (
                     <Card key={field.id} className="relative group">
                       <CardHeader>
                         <CardTitle>{field.name}</CardTitle>
                         <CardDescription className="line-clamp-2">{field.demographics}</CardDescription>
                       </CardHeader>
                       <CardContent>
                         <div className="text-sm text-muted-foreground">
                           <strong>Metas:</strong> {field.goals}
                         </div>
                         {!aiMode && (
                           <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                             <Button variant="ghost" size="icon" onClick={() => { setEditingIndex(index); setOpenPersonaDialog(true); }}>
                               <Edit className="h-4 w-4" />
                             </Button>
                             <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removePersona(index)}>
                               <Trash className="h-4 w-4" />
                             </Button>
                           </div>
                         )}
                       </CardContent>
                     </Card>
                   ))}
                 </div>
               )}
              
               {personasFields.length === 0 && (
                  <div className="flex flex-col items-center justify-center min-h-[200px] border rounded-lg bg-muted/10 border-dashed text-center p-8">
                    <Users className="h-10 w-10 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">No hay perfiles definidos.</p>
                  </div>
               )}

               {!aiMode && (
                 <Button onClick={() => { setEditingIndex(null); setOpenPersonaDialog(true); }} type="button" className="w-full">
                   <Plus className="mr-2 h-4 w-4" /> Añadir Buyer Persona
                 </Button>
               )}
            </TabsContent>

            <TabsContent value="channels" className="py-4 space-y-4">
               {channelFields.length > 0 && (
                 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                   {channelFields.map((field, index) => (
                     <Card key={field.id} className="relative group overflow-hidden">
                       <div className={`absolute top-0 left-0 w-1 h-full ${field.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                       <CardHeader className="pl-6">
                         <CardTitle className="text-base flex items-center justify-between">
                            {field.name}
                            {!field.isActive && <span className="text-xs font-normal text-muted-foreground">(Inactivo)</span>}
                         </CardTitle>
                         <CardDescription>{field.type} • {field.frequency}</CardDescription>
                       </CardHeader>
                       <CardContent className="pl-6">
                         <div className="text-sm">
                           Audiencia: <span className="font-mono">{field.audienceSize}</span>
                         </div>
                         {!aiMode && (
                           <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                             <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingIndex(index); setOpenChannelDialog(true); }}>
                               <Edit className="h-4 w-4" />
                             </Button>
                             <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeChannel(index)}>
                               <Trash className="h-4 w-4" />
                             </Button>
                           </div>
                         )}
                       </CardContent>
                     </Card>
                   ))}
                 </div>
               )}

               {channelFields.length === 0 && (
                  <div className="flex flex-col items-center justify-center min-h-[200px] border rounded-lg bg-muted/10 border-dashed text-center p-8">
                    <Megaphone className="h-10 w-10 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">No hay canales configurados.</p>
                  </div>
               )}

               {!aiMode && (
                 <Button onClick={() => { setEditingIndex(null); setOpenChannelDialog(true); }} type="button" className="w-full">
                   <Plus className="mr-2 h-4 w-4" /> Añadir Canal
                 </Button>
               )}
            </TabsContent>
          </Tabs>
        )}
      </form>

      {/* Dialogs */}
      <Dialog open={openPersonaDialog} onOpenChange={setOpenPersonaDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingIndex !== null ? "Editar Persona" : "Nuevo Buyer Persona"}</DialogTitle>
            <DialogDescription>Define a tu cliente ideal.</DialogDescription>
          </DialogHeader>
          <BuyerPersonaForm 
             defaultValues={editingIndex !== null ? form.getValues(`personas.${editingIndex}`) : undefined}
             onSave={handleSavePersona}
             onCancel={() => setOpenPersonaDialog(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={openFunnelDialog} onOpenChange={setOpenFunnelDialog}>
        <DialogContent>
          <DialogHeader>
             <DialogTitle>{editingIndex !== null ? "Editar Etapa" : "Nueva Etapa del Funnel"}</DialogTitle>
             <DialogDescription>Configura las fases de tu embudo de ventas.</DialogDescription>
          </DialogHeader>
          <FunnelStageForm
             defaultValues={editingIndex !== null ? form.getValues(`funnelStages.${editingIndex}`) : undefined}
             onSave={handleSaveFunnel}
             onCancel={() => setOpenFunnelDialog(false)}
          />
        </DialogContent>
      </Dialog>
      
      <Dialog open={openChannelDialog} onOpenChange={setOpenChannelDialog}>
        <DialogContent>
          <DialogHeader>
             <DialogTitle>{editingIndex !== null ? "Editar Canal" : "Nuevo Canal"}</DialogTitle>
             <DialogDescription>¿Dónde distribuirás tu contenido?</DialogDescription>
          </DialogHeader>
          <ChannelForm
             defaultValues={editingIndex !== null ? form.getValues(`channels.${editingIndex}`) : undefined}
             onSave={handleSaveChannel}
             onCancel={() => setOpenChannelDialog(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={openObjectiveDialog} onOpenChange={setOpenObjectiveDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingIndex !== null ? "Editar Objetivo" : "Nuevo Objetivo SMART"}</DialogTitle>
            <DialogDescription>Define metas claras y medibles para tu estrategia.</DialogDescription>
          </DialogHeader>
          <ObjectivesForm 
             defaultValues={editingIndex !== null ? form.getValues(`objectives.${editingIndex}`) : undefined}
             onSave={handleSaveObjective}
             onCancel={() => setOpenObjectiveDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </Form>
    </TooltipProvider>
  );
}
