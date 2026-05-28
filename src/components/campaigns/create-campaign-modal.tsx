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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  AlertCircle, 
  Megaphone,
  Briefcase
} from "lucide-react";
import { toast } from "sonner";
import { suggestCampaignsAction } from "@/actions/campaign-suggestions";
import { CampaignSuggestion } from "@/lib/schemas/campaign-suggestions";
import { createCampaignAction } from "@/actions/campaign";
import { getActiveStrategyAction } from "@/actions/strategy";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { CampaignForm } from "./campaign-form";

interface CreateCampaignModalProps {
  businessId: string;
  trigger?: React.ReactNode;
  initialAiMode?: boolean;
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
  "Recuperando tu estrategia de marketing activa...",
  "Recuperando informes y métricas de tus redes sociales...",
  "Extrayendo tácticas, fortalezas y debilidades de tus competidores...",
  "Claude está estructurando propuestas de campaña personalizadas a tu estrategia...",
  "Afinando los detalles de presupuesto, segmentación y canales...",
];

export default function CreateCampaignModal({ businessId, trigger, initialAiMode }: CreateCampaignModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [aiMode, setAiMode] = useState(initialAiMode ?? true);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  const [suggestions, setSuggestions] = useState<CampaignSuggestion[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeStrategyId, setActiveStrategyId] = useState<string | undefined>(undefined);

  // Estado local para edición de sugerencias IA
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

  // Cargar estrategia activa en modo manual o cuando se requiera
  const loadActiveStrategy = async () => {
    try {
      const res = await getActiveStrategyAction(businessId);
      if (res.success && res.strategy) {
        setActiveStrategyId(res.strategy.id);
      }
    } catch (e) {
      console.error("Error loading active strategy:", e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadActiveStrategy();
      if (aiMode && suggestions.length === 0) {
        handleGenerateSuggestions();
      }
    }
  }, [isOpen, aiMode]);

  // Ejecutar sugerencia IA
  const handleGenerateSuggestions = async () => {
    setIsLoading(true);
    setSuggestions([]);
    try {
      const res = await suggestCampaignsAction(businessId);
      if (res.success && res.campaigns) {
        setSuggestions(res.campaigns);
        setSelectedIdx(0);
        if (res.activeStrategyId) {
          setActiveStrategyId(res.activeStrategyId);
        }
        toast.success("¡Sugerencias de campañas generadas con éxito!");
      } else {
        toast.error(res.error || "No se pudieron obtener sugerencias de la IA.");
      }
    } catch (e) {
      toast.error("Error al conectar con la IA de campañas.");
    } finally {
      setIsLoading(false);
    }
  };

  // Sincronizar formulario local al seleccionar sugerencia
  useEffect(() => {
    if (suggestions.length > 0 && suggestions[selectedIdx]) {
      const camp = suggestions[selectedIdx];
      const allPlatforms = ["INSTAGRAM", "FACEBOOK", "TIKTOK", "WEBSITE"];
      const mergedChannels = allPlatforms.map(platform => {
        const suggested = camp.channels.find(c => c.platform.toUpperCase() === platform);
        return {
          platform,
          isActive: suggested ? suggested.isActive : false,
          budget: suggested ? (suggested.budget || Math.round(camp.budget / (camp.channels.length || 1))) : 0
        };
      });

      setEditForm({
        name: camp.name,
        description: camp.description,
        objective: camp.objective,
        budget: camp.budget,
        durationDays: camp.durationDays || 30,
        startDate: format(new Date(), "yyyy-MM-dd"),
        channels: mergedChannels,
        interests: camp.targeting?.interests || [],
        locations: camp.targeting?.locations || [],
      });
      setIsEditing(false);
    }
  }, [suggestions, selectedIdx]);

  // Manejo de guardado definitivo (IA Mode)
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
        strategyId: activeStrategyId, // Link con la estrategia activa
      });

      if (res.success) {
        toast.success("¡Campaña guardada con éxito!");
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
    
    // Si se activa y el presupuesto de ese canal es 0, asignarle un valor base para evitar que quede en cero
    if (updated[idx].isActive && Number(updated[idx].budget) === 0) {
      updated[idx].budget = 100;
    }
    
    // Recalcular presupuesto total
    const sum = updated.reduce((acc, c) => acc + (c.isActive ? Number(c.budget) : 0), 0);
    
    setEditForm(prev => ({
      ...prev,
      channels: updated,
      budget: sum
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gradient-primary relative overflow-hidden transition-all duration-300 hover:scale-[1.02] shadow-md border-0 group px-4 py-2 font-semibold">
            <Plus className="mr-2 h-4 w-4 shrink-0" />
            <span>Nueva Campaña</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] p-0 border border-muted/20 rounded-2xl shadow-2xl bg-background flex flex-col overflow-hidden">
        {/* CABECERA UNIFICADA (Fija en la parte superior) */}
        <div className="p-5 border-b border-muted/20 bg-muted/5 space-y-3 shrink-0">
          <div className="flex items-center gap-2 mb-0.5">
            <Badge variant="outline" className="text-[9px] font-bold tracking-widest uppercase border-violet-300/30 bg-violet-50/5 text-violet-750 dark:text-violet-300">
              Creación de Campaña
            </Badge>
            {activeStrategyId && (
              <Badge variant="outline" className="text-[9px] font-bold border-green-500/20 bg-green-500/5 text-green-600">
                Estrategia Vinculada
              </Badge>
            )}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                <Target className="h-4.5 w-4.5 text-violet-600" />
                Diseñar Nueva Campaña
              </DialogTitle>
              <DialogDescription className="text-[11px] text-muted-foreground">
                Define una iniciativa de marketing enfocada en objetivos comerciales clave.
              </DialogDescription>
            </div>
            {/* Toggle de IA */}
            <div className="flex items-center gap-2.5 bg-card border px-3 py-1.5 rounded-xl self-start sm:self-auto shadow-sm">
              <Sparkles className={`h-3.5 w-3.5 ${aiMode ? "text-violet-650 animate-pulse" : "text-muted-foreground"}`} />
              <div className="space-y-0">
                <Label htmlFor="campaign-ai-mode" className="text-[11px] font-bold block cursor-pointer select-none leading-none">Asistente IA</Label>
                <span className="text-[9px] text-muted-foreground block leading-none mt-0.5">{aiMode ? "Recomendado" : "Manual"}</span>
              </div>
              <Switch 
                id="campaign-ai-mode" 
                checked={aiMode} 
                onCheckedChange={setAiMode} 
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        {/* TABS DE SELECCIÓN DE PROPUESTAS (Fijo, solo en modo IA y si ya cargaron) */}
        {aiMode && !isLoading && suggestions.length > 0 && (
          <div className="flex items-center justify-between px-6 py-2 border-b border-muted/20 bg-muted/5 shrink-0">
            <div className="flex gap-1.5 overflow-x-auto py-1">
              {suggestions.map((s, idx) => {
                const objType = objectiveTranslations[s.objective] || { label: "Campaña" };
                const isSelected = selectedIdx === idx;
                return (
                  <Button
                    key={idx}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    className={`text-[11px] gap-1 py-1 h-7 transition-all ${
                      isSelected 
                        ? "bg-violet-600 text-white shadow-sm scale-105 hover:bg-violet-750" 
                        : "hover:bg-muted/80 text-muted-foreground"
                    }`}
                    onClick={() => {
                      setSelectedIdx(idx);
                      setIsEditing(false);
                    }}
                  >
                    <span>Propuesta {idx + 1}</span>
                    <span className="opacity-70 text-[9px] shrink-0 font-medium">
                      ({objType.label.split(" ")[0]})
                    </span>
                  </Button>
                );
              })}
            </div>
            
            <Button 
              type="button"
              variant="outline" 
              size="sm" 
              className="text-[10px] h-7 px-2 gap-1 text-violet-650 border-violet-200 hover:bg-violet-50 shrink-0"
              onClick={handleGenerateSuggestions}
            >
              <Loader2 className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
              Regenerar
            </Button>
          </div>
        )}

        {/* CONTENIDO SCROLLABLE GENERAL (Filtra entre IA y Manual) */}
        <div className="flex-1 overflow-y-auto p-6">
          {aiMode ? (
            <div className="space-y-6">
              {/* Pantalla de Carga de IA */}
              {isLoading && (
                <div className="flex flex-col items-center justify-center p-12 min-h-[300px] text-center space-y-6">
                  <div className="relative flex items-center justify-center">
                    <div className="absolute h-16 w-16 rounded-full border-4 border-violet-500/20 animate-ping" />
                    <div className="relative h-14 w-14 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg">
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    </div>
                  </div>
                  <div className="space-y-2 max-w-md">
                    <h3 className="text-sm font-bold text-foreground flex items-center justify-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-violet-500 animate-pulse" />
                      Diseñando Campañas Personalizadas
                    </h3>
                    <p className="text-xs text-muted-foreground/90 font-medium h-8">
                      {loadingStates[loadingTextIndex]}
                    </p>
                    <div className="w-full bg-muted/65 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-violet-600 to-indigo-600 h-full transition-all duration-500" 
                        style={{ width: `${((loadingTextIndex + 1) / loadingStates.length) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Visualización de propuestas de campaña */}
              {!isLoading && suggestions.length > 0 && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  {/* Detalles de la propuesta / Formulario de edición */}
                  <div className="space-y-3">
                    {!isEditing ? (
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={`text-[9px] font-semibold border ${objectiveTranslations[suggestions[selectedIdx]?.objective]?.color} ${objectiveTranslations[suggestions[selectedIdx]?.objective]?.bg}`}>
                            <span className="mr-1 shrink-0">
                              {objectiveTranslations[suggestions[selectedIdx]?.objective]?.icon}
                            </span>
                            {objectiveTranslations[suggestions[selectedIdx]?.objective]?.label}
                          </Badge>
                          <Badge variant="outline" className="text-[9px] font-semibold gap-1 text-muted-foreground bg-muted/10">
                            <CalendarIcon className="h-3 w-3" />
                            {editForm.durationDays} días recomendados
                          </Badge>
                        </div>
                        <h3 className="text-sm font-bold tracking-tight text-foreground leading-snug">
                          {suggestions[selectedIdx]?.name}
                        </h3>
                        <p className="text-xs text-muted-foreground/90 leading-relaxed text-justify bg-muted/5 p-3.5 rounded-xl border border-muted/20">
                          {suggestions[selectedIdx]?.description}
                        </p>
                      </div>
                    ) : (
                      /* Formulario Edición */
                      <div className="space-y-4 bg-violet-50/10 dark:bg-violet-950/10 p-4 rounded-xl border border-violet-100 dark:border-violet-900">
                        <div className="flex items-center justify-between border-b border-violet-150 dark:border-violet-900 pb-2">
                          <span className="text-[11px] font-bold text-violet-750 dark:text-violet-300 flex items-center gap-1">
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
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Nombre</label>
                            <Input 
                              value={editForm.name} 
                              onChange={(e) => setEditForm(p => ({ ...p, name: e.target.value }))}
                              className="text-xs h-9 bg-background focus-visible:ring-violet-500"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Descripción</label>
                            <Textarea 
                              value={editForm.description} 
                              onChange={(e) => setEditForm(p => ({ ...p, description: e.target.value }))}
                              className="text-xs min-h-[80px] bg-background focus-visible:ring-violet-500"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Objetivo</label>
                              <Select value={editForm.objective} onValueChange={(val) => setEditForm(p => ({ ...p, objective: val }))}>
                                <SelectTrigger className="text-xs h-9 bg-background"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {Object.entries(objectiveTranslations).map(([k, v]) => (
                                    <SelectItem key={k} value={k} className="text-xs">{v.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Días</label>
                              <Input type="number" value={editForm.durationDays} onChange={(e) => setEditForm(p => ({ ...p, durationDays: Number(e.target.value) }))} className="text-xs h-9 bg-background" />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Presupuesto ($)</label>
                              <Input type="number" value={editForm.budget} onChange={(e) => setEditForm(p => ({ ...p, budget: Number(e.target.value) }))} className="text-xs h-9 bg-background" />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Fecha Inicio</label>
                              <Input type="date" value={editForm.startDate} onChange={(e) => setEditForm(p => ({ ...p, startDate: e.target.value }))} className="text-xs h-9 bg-background" />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Segmentación sugerida (Target) */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-violet-750 dark:text-violet-300 flex items-center gap-1.5 border-b border-muted/20 pb-1">
                      <Users className="h-4 w-4 shrink-0 text-violet-650" /> Segmentación Sugerida (Target)
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
                            <span className="text-xs text-muted-foreground italic">Local</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground block mb-1">Edad de Audiencia</span>
                        <Badge variant="outline" className="text-[10px] font-bold border-violet-200 text-violet-600 dark:border-violet-850 dark:text-violet-400">
                          {suggestions[selectedIdx]?.targeting?.ageRange ? `${suggestions[selectedIdx].targeting!.ageRange![0]} a ${suggestions[selectedIdx].targeting!.ageRange![1]} años` : "20 a 45 años"}
                        </Badge>
                      </div>
                      <div className="md:col-span-2 pt-2 border-t border-muted/20">
                        <span className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground block mb-1">Intereses Sugeridos</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {editForm.interests.map((int, i) => (
                            <Badge key={i} variant="outline" className="text-[10px] border-violet-200 text-violet-700 bg-violet-50/50 font-semibold dark:border-violet-900 dark:text-violet-300 dark:bg-violet-950/20">
                              {int}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Distribución de Canales */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-violet-750 dark:text-violet-300 flex items-center gap-1.5 border-b border-muted/20 pb-1">
                      <Briefcase className="h-4 w-4 shrink-0 text-violet-650" /> Distribución de Canales
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {editForm.channels.map((ch, idx) => {
                        const pct = editForm.budget > 0 ? Math.round((ch.budget / editForm.budget) * 100) : 0;
                        const displayPct = pct > 100 ? 100 : pct;
                        return (
                          <Card key={idx} className={`p-3 rounded-xl border ${ch.isActive ? "border-violet-200 dark:border-violet-900 bg-background shadow-sm" : "border-muted/30 opacity-50 bg-background/50"} transition-all`}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <input 
                                  type="checkbox"
                                  checked={ch.isActive}
                                  onChange={() => toggleChannelActive(idx)}
                                  className="h-3.5 w-3.5 rounded border-muted/30 text-violet-650 focus:ring-violet-500 cursor-pointer"
                                />
                                <span className="text-xs font-bold uppercase tracking-wider">{ch.platform}</span>
                              </div>
                              {ch.isActive && (
                                <Badge className="text-[9px] font-black tracking-tight bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300" variant="secondary">
                                  {displayPct}% del total
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
                                <span className="text-[10px] text-muted-foreground">USD</span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-muted-foreground italic">Inactivo</span>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  </div>

                  {/* Resumen e inversión final */}
                  <div className="pt-4 border-t border-muted/20 space-y-4">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-muted/10 p-3.5 rounded-xl border border-muted/20">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-muted-foreground block mb-0.5">Inversión Recomendada</span>
                        <span className="text-xl font-black text-violet-650">${editForm.budget} <span className="text-[10px] font-medium text-muted-foreground">USD</span></span>
                      </div>
                      <div className="sm:text-right">
                        <span className="text-[9px] uppercase font-bold text-muted-foreground block mb-0.5">Fecha de Fin Estimada</span>
                        <span className="text-[11px] font-bold text-foreground bg-muted/65 px-2 py-0.5 rounded-md">
                          {format(addDays(new Date(editForm.startDate + "T00:00:00"), editForm.durationDays), "d 'de' MMMM, yyyy", { locale: es })}
                        </span>
                      </div>
                    </div>

                    {/* Botones de Acción */}
                    <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
                      {!isEditing ? (
                        <Button 
                          type="button"
                          variant="outline" 
                          className="text-xs h-10 border-violet-200 text-violet-755 hover:bg-violet-50 w-full sm:w-auto"
                          onClick={() => setIsEditing(true)}
                        >
                          <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                          Editar Propuesta
                        </Button>
                      ) : (
                        <Button 
                          type="button"
                          variant="outline" 
                          className="text-xs h-10 border-green-500/20 text-green-600 hover:bg-green-50/50 bg-green-500/5 w-full sm:w-auto"
                          onClick={() => setIsEditing(false)}
                        >
                          <Check className="h-3.5 w-3.5 mr-1.5" />
                          Aceptar Cambios
                        </Button>
                      )}
                      
                      <Button 
                        type="button"
                        onClick={handleSaveCampaign}
                        disabled={isSaving || Number(editForm.budget) <= 0}
                        className="gradient-primary text-xs h-10 shadow-sm font-semibold border-0 relative overflow-hidden group w-full sm:w-auto"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                            Guardando...
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
              )}

              {/* Error state */}
              {!isLoading && suggestions.length === 0 && (
                <div className="flex flex-col items-center justify-center p-12 text-center min-h-[350px] space-y-4">
                  <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
                    <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold">Error al generar sugerencias</h3>
                    <p className="text-xs text-muted-foreground max-w-sm leading-normal">
                      Asegúrate de que el negocio tenga un análisis de competencia scraping completo y API keys válidas.
                    </p>
                  </div>
                  <Button type="button" variant="default" size="sm" onClick={handleGenerateSuggestions} className="text-xs">
                    Reintentar sugerencias
                  </Button>
                </div>
              )}
            </div>
          ) : (
            /* MODO MANUAL (FORMULARIO MANUAL) */
            <CampaignForm 
              businessId={businessId} 
              defaultValues={activeStrategyId ? { strategyId: activeStrategyId, name: "", objective: "AWARENESS", channels: [], status: "DRAFT" } as any : undefined}
              onSuccess={() => {
                setIsOpen(false);
                router.refresh();
              }} 
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
