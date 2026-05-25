"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectTrigger, 
  SelectValue, 
  SelectContent, 
  SelectItem 
} from "@/components/ui/select";
import { 
  Sparkles, 
  Loader2, 
  Calendar as CalendarIcon, 
  DollarSign, 
  Target, 
  TrendingUp, 
  Users, 
  Flame, 
  Zap, 
  Check, 
  Edit2, 
  Save, 
  Plus, 
  X, 
  AlertCircle, 
  CheckCircle,
  Megaphone,
  Briefcase
} from "lucide-react";
import { toast } from "sonner";
import { suggestCampaignsAction } from "@/actions/campaign-suggestions";
import { CampaignSuggestion } from "@/lib/schemas/campaign-suggestions";
import { createCampaignAction } from "@/actions/campaign";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";

interface CampaignSuggestionsModalProps {
  businessId: string;
}

const objectiveTranslations: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  AWARENESS: { 
    label: "Reconocimiento de Marca", 
    icon: <Megaphone className="h-4 w-4" />, 
    color: "text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    bg: "bg-blue-50 dark:bg-blue-950/30"
  },
  ENGAGEMENT: { 
    label: "Interacción / Comunidad", 
    icon: <Flame className="h-4 w-4" />, 
    color: "text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800",
    bg: "bg-orange-50 dark:bg-orange-950/30"
  },
  TRAFFIC: { 
    label: "Tráfico / Visitas", 
    icon: <TrendingUp className="h-4 w-4" />, 
    color: "text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    bg: "bg-emerald-50 dark:bg-emerald-950/30"
  },
  LEADS: { 
    label: "Generación de Leads", 
    icon: <Target className="h-4 w-4" />, 
    color: "text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800",
    bg: "bg-purple-50 dark:bg-purple-950/30"
  },
  SALES: { 
    label: "Ventas / Conversión", 
    icon: <DollarSign className="h-4 w-4" />, 
    color: "text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-800",
    bg: "bg-pink-50 dark:bg-pink-950/30"
  },
  RETENTION: { 
    label: "Fidelización / Retención", 
    icon: <Zap className="h-4 w-4" />, 
    color: "text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    bg: "bg-amber-50 dark:bg-amber-950/30"
  },
};

const loadingStates = [
  "Accediendo a la base de datos de tu negocio...",
  "Recuperando informes y métricas de tus redes sociales...",
  "Extrayendo tácticas, fortalezas y debilidades de tus competidores...",
  "Modelando audiencias demográficas y nichos locales de mercado...",
  "Gemini 2.0 está estructurando ganchos comerciales y estrategias de conversión...",
  "Cerrando detalles de presupuesto y asignación inteligente de canales...",
];

export default function CampaignSuggestionsModal({ businessId }: CampaignSuggestionsModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  const [suggestions, setSuggestions] = useState<CampaignSuggestion[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Estado local para edición
  const [editForm, setEditForm] = useState<{
    name: string;
    description: string;
    objective: string;
    budget: number;
    durationDays: number;
    startDate: string;
    channels: Array<{ platform: string; isActive: boolean; budget: number }>;
    interests: string[];
    locations: string[];
  }>({
    name: "",
    description: "",
    objective: "ENGAGEMENT",
    budget: 0,
    durationDays: 30,
    startDate: format(new Date(), "yyyy-MM-dd"),
    channels: [],
    interests: [],
    locations: [],
  });

  // Rotador de frases en la pantalla de carga
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingTextIndex((prev) => (prev + 1) % loadingStates.length);
      }, 3500);
    } else {
      setLoadingTextIndex(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  // Ejecutar sugerencia IA
  const handleGenerateSuggestions = async () => {
    setIsLoading(true);
    setSuggestions([]);
    try {
      const res = await suggestCampaignsAction(businessId);
      if (res.success && res.campaigns) {
        setSuggestions(res.campaigns);
        setSelectedIdx(0);
        toast.success("¡Sugerencias generadas con éxito!");
      } else {
        toast.error(res.error || "No se pudieron obtener sugerencias.");
      }
    } catch (e) {
      toast.error("Error de conexión al generar sugerencias.");
    } finally {
      setIsLoading(false);
    }
  };

  // Sincronizar formulario local al seleccionar sugerencia
  useEffect(() => {
    if (suggestions.length > 0 && suggestions[selectedIdx]) {
      const camp = suggestions[selectedIdx];
      setEditForm({
        name: camp.name,
        description: camp.description,
        objective: camp.objective,
        budget: camp.budget,
        durationDays: camp.durationDays || 30,
        startDate: format(new Date(), "yyyy-MM-dd"),
        channels: camp.channels.map(c => ({
          platform: c.platform,
          isActive: c.isActive,
          budget: c.budget || Math.round(camp.budget / camp.channels.length)
        })),
        interests: camp.targeting?.interests || [],
        locations: camp.targeting?.locations || [],
      });
      setIsEditing(false);
    }
  }, [suggestions, selectedIdx]);

  // Manejo de guardado definitivo
  const handleSaveCampaign = async () => {
    setIsSaving(true);
    try {
      const startD = new Date(editForm.startDate + "T00:00:00");
      const endD = addDays(startD, editForm.durationDays);

      // Formatear targeting en base al schema esperado
      const targetingObj = {
        locations: editForm.locations,
        interests: editForm.interests,
        ageRange: suggestions[selectedIdx]?.targeting?.ageRange || [18, 55],
      };

      // Formatear canales
      const channelsObj = editForm.channels.map(c => ({
        platform: c.platform,
        isActive: c.isActive,
        budget: Number(c.budget),
      }));

      const res = await createCampaignAction(businessId, {
        name: editForm.name,
        description: editForm.description,
        objective: editForm.objective as any,
        startDate: startD,
        endDate: endD,
        budget: Number(editForm.budget),
        channels: channelsObj,
        targeting: targetingObj,
        status: "DRAFT",
      });

      if (res.success) {
        toast.success("¡Campaña guardada con éxito en tu panel!");
        setIsOpen(false);
        router.refresh();
      } else {
        toast.error(res.error || "Ocurrió un error al guardar la campaña.");
      }
    } catch (e) {
      toast.error("Error al procesar los datos de la campaña.");
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditChannelBudget = (idx: number, newBudget: number) => {
    const updated = [...editForm.channels];
    updated[idx].budget = newBudget;
    
    // Recalcular presupuesto total para que coincida con la suma
    const sum = updated.reduce((acc, c) => acc + (c.isActive ? Number(c.budget) : 0), 0);
    
    setEditForm(prev => ({
      ...prev,
      channels: updated,
      budget: sum
    }));
  };

  const toggleChannelActive = (idx: number) => {
    const updated = [...editForm.channels];
    updated[idx].isActive = !updated[idx].isActive;
    
    // Recalcular presupuesto total
    const sum = updated.reduce((acc, c) => acc + (c.isActive ? Number(c.budget) : 0), 0);
    
    setEditForm(prev => ({
      ...prev,
      channels: updated,
      budget: sum
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (open && suggestions.length === 0) {
        handleGenerateSuggestions();
      }
    }}>
      <DialogTrigger asChild>
        <Button className="gradient-primary relative overflow-hidden transition-all duration-300 hover:scale-[1.02] shadow-md border-0 group px-4 py-2 font-semibold">
          <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <Sparkles className="mr-2 h-4 w-4 text-amber-300 animate-pulse shrink-0" />
          <span>Sugerencias IA</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0 border border-muted/50 rounded-2xl shadow-2xl bg-background flex flex-col">
        {/* PANTALLA DE CARGA */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center p-12 min-h-[450px] text-center space-y-6">
            <DialogTitle className="sr-only">Generando Sugerencias de Campañas con IA</DialogTitle>
            <DialogDescription className="sr-only">Cargando análisis inteligente de tu negocio y competidores</DialogDescription>
            <div className="relative flex items-center justify-center">
              <div className="absolute h-16 w-16 rounded-full border-4 border-primary/20 animate-ping" />
              <div className="relative h-14 w-14 rounded-full bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center shadow-lg animate-spin">
                <Loader2 className="h-6 w-6 text-white animate-spin duration-1000" />
              </div>
            </div>
            <div className="space-y-2 max-w-md">
              <h3 className="text-lg font-bold text-foreground flex items-center justify-center gap-1.5">
                <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
                Diseñando Campañas Personalizadas
              </h3>
              <p className="text-xs text-muted-foreground/90 font-medium h-8 animate-fade-in transition-all">
                {loadingStates[loadingTextIndex]}
              </p>
              <div className="w-full bg-muted/60 h-1 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-primary to-purple-600 h-full transition-all duration-500" 
                  style={{ width: `${((loadingTextIndex + 1) / loadingStates.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* VISUALIZACIÓN DE RESULTADOS */}
        {!isLoading && suggestions.length > 0 && (
          <div className="flex flex-col h-full">
            <DialogHeader className="p-6 border-b border-muted/20 bg-muted/5">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-[10px] font-bold tracking-widest uppercase border-primary/30 bg-primary/5 text-primary">
                  Poder de Inteligencia Artificial
                </Badge>
                <Badge variant="outline" className="text-[10px] font-bold border-green-500/20 bg-green-500/5 text-green-600">
                  Listo para persistir
                </Badge>
              </div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary shrink-0 animate-pulse" />
                Campañas Estratégicas Recomendadas
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Basadas en tus informes de presencia digital e histórico de la competencia en el mercado.
              </DialogDescription>
            </DialogHeader>

            {/* TABLA DE TABS PREMIUM */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-muted/20 bg-background/50 sticky top-0 z-10">
              <div className="flex gap-1.5">
                {suggestions.map((s, idx) => {
                  const objType = objectiveTranslations[s.objective] || { label: "Campaña", color: "", bg: "" };
                  const isSelected = selectedIdx === idx;
                  return (
                    <Button
                      key={idx}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      className={`text-xs gap-1.5 py-1.5 h-auto transition-all ${
                        isSelected 
                          ? "bg-primary text-primary-foreground shadow-sm scale-105" 
                          : "hover:bg-muted/80 text-muted-foreground"
                      }`}
                      onClick={() => {
                        setSelectedIdx(idx);
                        setIsEditing(false);
                      }}
                    >
                      <span>Propuesta {idx + 1}</span>
                      <span className="opacity-70 text-[10px] shrink-0 font-medium">
                        ({objType.label.split(" ")[0]})
                      </span>
                    </Button>
                  );
                })}
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="text-[11px] h-8 gap-1.5 text-primary border-primary/30 hover:bg-primary/5"
                onClick={handleGenerateSuggestions}
              >
                <Loader2 className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
                Regenerar ideas
              </Button>
            </div>

            {/* DETALLES DE LA PROPUESTA */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 flex-1 overflow-hidden">
              
              {/* VISTA GENERAL E INFORMACIÓN (COL 7) */}
              <div className="lg:col-span-7 p-6 space-y-5 overflow-y-auto max-h-[50vh] lg:max-h-[58vh]">
                
                {/* CABECERA DE CAMPAÑA */}
                {!isEditing ? (
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={`text-xs font-semibold border ${objectiveTranslations[suggestions[selectedIdx]?.objective]?.color} ${objectiveTranslations[suggestions[selectedIdx]?.objective]?.bg}`}>
                        <span className="mr-1 shrink-0">
                          {objectiveTranslations[suggestions[selectedIdx]?.objective]?.icon}
                        </span>
                        {objectiveTranslations[suggestions[selectedIdx]?.objective]?.label}
                      </Badge>
                      <Badge variant="outline" className="text-xs font-semibold gap-1 text-muted-foreground">
                        <CalendarIcon className="h-3 w-3" />
                        {editForm.durationDays} días recomendados
                      </Badge>
                    </div>
                    <h3 className="text-2xl font-black tracking-tight text-foreground leading-tight">
                      {suggestions[selectedIdx]?.name}
                    </h3>
                    <p className="text-xs text-muted-foreground/90 leading-relaxed text-justify bg-muted/10 p-3.5 rounded-xl border border-muted/20">
                      {suggestions[selectedIdx]?.description}
                    </p>
                  </div>
                ) : (
                  // FORMULARIO EDICIÓN EN VIVO
                  <div className="space-y-4 bg-primary/5 p-4 rounded-2xl border border-primary/10">
                    <div className="flex items-center justify-between border-b border-primary/10 pb-2">
                      <span className="text-xs font-bold text-primary flex items-center gap-1">
                        <Edit2 className="h-3.5 w-3.5" /> EDITANDO CAMPAÑA SUGERIDA
                      </span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 text-[10px] text-muted-foreground hover:text-foreground"
                        onClick={() => setIsEditing(false)}
                      >
                        Cancelar
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Nombre de la Campaña</label>
                        <Input 
                          value={editForm.name} 
                          onChange={(e) => setEditForm(p => ({ ...p, name: e.target.value }))}
                          className="text-xs h-9 bg-background focus-visible:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Descripción y Mensaje Clave</label>
                        <Textarea 
                          value={editForm.description} 
                          onChange={(e) => setEditForm(p => ({ ...p, description: e.target.value }))}
                          className="text-xs min-h-[80px] bg-background focus-visible:ring-primary leading-normal"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Objetivo General</label>
                          <Select 
                            value={editForm.objective} 
                            onValueChange={(val) => setEditForm(p => ({ ...p, objective: val }))}
                          >
                            <SelectTrigger className="text-xs h-9 bg-background">
                              <SelectValue placeholder="Objetivo" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(objectiveTranslations).map(([k, v]) => (
                                <SelectItem key={k} value={k} className="text-xs">
                                  {v.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Duración (Días)</label>
                          <Input 
                            type="number"
                            value={editForm.durationDays} 
                            onChange={(e) => setEditForm(p => ({ ...p, durationDays: Number(e.target.value) }))}
                            className="text-xs h-9 bg-background focus-visible:ring-primary"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Presupuesto USD ($)</label>
                          <Input 
                            type="number"
                            value={editForm.budget} 
                            onChange={(e) => setEditForm(p => ({ ...p, budget: Number(e.target.value) }))}
                            className="text-xs h-9 bg-background font-bold focus-visible:ring-primary"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Fecha de Inicio</label>
                          <Input 
                            type="date"
                            value={editForm.startDate} 
                            onChange={(e) => setEditForm(p => ({ ...p, startDate: e.target.value }))}
                            className="text-xs h-9 bg-background focus-visible:ring-primary"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SEGMENTACIÓN DETALLADA */}
                <div className="space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-primary flex items-center gap-1.5 border-b border-muted/20 pb-1">
                    <Users className="h-4 w-4 shrink-0 text-primary" /> Segmentación Sugerida (Target)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-muted/5 p-4 rounded-xl border border-muted/20">
                    <div>
                      <span className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground block mb-1">Ubicaciones</span>
                      <div className="flex flex-wrap gap-1">
                        {editForm.locations.length > 0 ? (
                          editForm.locations.map((loc, i) => (
                            <Badge key={i} variant="secondary" className="text-[10px] font-medium">
                              {loc}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Cualquier ubicación</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground block mb-1">Rango de Edad</span>
                      <Badge variant="outline" className="text-[10px] font-bold border-primary/20 text-primary">
                        {suggestions[selectedIdx]?.targeting?.ageRange ? `${suggestions[selectedIdx].targeting!.ageRange![0]} a ${suggestions[selectedIdx].targeting!.ageRange![1]} años` : "20 a 45 años"}
                      </Badge>
                    </div>
                    <div className="md:col-span-2 pt-2 border-t border-muted/20">
                      <span className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground block mb-1">Intereses sugeridos por IA</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {editForm.interests.map((int, i) => (
                          <Badge key={i} variant="outline" className="text-[10px] border-primary/20 text-primary bg-primary/5 font-semibold">
                            {int}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* CANALES E INVERSIÓN (COL 5) */}
              <div className="lg:col-span-5 p-6 border-t lg:border-t-0 lg:border-l border-muted/20 bg-muted/5 overflow-y-auto max-h-[45vh] lg:max-h-[58vh] flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-primary flex items-center gap-1.5 border-b border-muted/20 pb-1">
                    <Briefcase className="h-4 w-4 shrink-0 text-primary" /> Distribución de Canales
                  </h4>
                  
                  <div className="space-y-3">
                    {editForm.channels.map((ch, idx) => {
                      const pct = editForm.budget > 0 ? Math.round((ch.budget / editForm.budget) * 100) : 0;
                      return (
                        <Card key={idx} className={`p-3 rounded-xl border ${ch.isActive ? "border-primary/20 bg-background" : "border-muted/30 opacity-50 bg-background/50"} transition-all`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <input 
                                type="checkbox"
                                checked={ch.isActive}
                                onChange={() => toggleChannelActive(idx)}
                                className="h-3.5 w-3.5 rounded border-muted/30 text-primary focus:ring-primary cursor-pointer"
                              />
                              <span className="text-xs font-bold uppercase tracking-wider">{ch.platform}</span>
                            </div>
                            {ch.isActive && (
                              <Badge className="text-[9px] font-black tracking-tight" variant="secondary">
                                {pct}% del total
                              </Badge>
                            )}
                          </div>
                          {ch.isActive ? (
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                              <Input
                                type="number"
                                value={ch.budget}
                                onChange={(e) => handleEditChannelBudget(idx, Number(e.target.value))}
                                className="text-xs h-7 w-24 bg-background px-2"
                              />
                              <span className="text-[10px] text-muted-foreground">USD presupuestados</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-muted-foreground italic">Canal inactivo para esta campaña</span>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                </div>

                {/* RESUMEN FINANCIERO Y CONTROLADOR */}
                <div className="space-y-4 pt-4 border-t border-muted/20">
                  <div className="flex items-center justify-between text-xs bg-background p-3 rounded-xl border border-muted/20 shadow-sm">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-muted-foreground block mb-0.5">Inversión Recomendada</span>
                      <span className="text-2xl font-black text-primary">${editForm.budget} <span className="text-[10px] font-medium text-muted-foreground">USD</span></span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] uppercase font-bold text-muted-foreground block mb-0.5">Fecha de Fin Estimada</span>
                      <span className="text-[11px] font-bold text-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                        {format(addDays(new Date(editForm.startDate + "T00:00:00"), editForm.durationDays), "d 'de' MMMM, yyyy", { locale: es })}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {!isEditing ? (
                      <Button 
                        variant="outline" 
                        className="text-xs h-10 border-primary/20 text-primary hover:bg-primary/5"
                        onClick={() => setIsEditing(true)}
                      >
                        <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                        Editar Propuesta
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        className="text-xs h-10 border-green-500/20 text-green-600 hover:bg-green-500/5 bg-green-500/5"
                        onClick={() => setIsEditing(false)}
                      >
                        <Check className="h-3.5 w-3.5 mr-1.5" />
                        Aceptar Cambios
                      </Button>
                    )}
                    
                    <Button 
                      onClick={handleSaveCampaign}
                      disabled={isSaving || Number(editForm.budget) <= 0}
                      className="gradient-primary text-xs h-10 shadow-sm font-semibold border-0 relative overflow-hidden group"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                          Creando...
                        </>
                      ) : (
                        <>
                          <Save className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                          Guardar Campaña
                        </>
                      )}
                    </Button>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* COMPORTAMIENTO SI HAY ERROR EN GENERAR */}
        {!isLoading && suggestions.length === 0 && (
          <div className="flex flex-col items-center justify-center p-12 text-center min-h-[350px] space-y-4">
            <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold">Error en la Generación de Sugerencias</h3>
              <p className="text-xs text-muted-foreground max-w-sm leading-normal">
                No hemos podido establecer conexión con OpenRouter o los datos de tu negocio aún son insuficientes para modelar campañas.
              </p>
            </div>
            <Button variant="default" size="sm" onClick={handleGenerateSuggestions} className="text-xs">
              Reintentar sugerencias
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
