"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Plus, ArrowRight, Sparkles, Edit, Trash, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AiStrategiesPanel } from "@/components/strategy/ai-strategies-panel";
import { ViewStrategyDialog } from "@/components/strategy/view-strategy-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StrategyForm } from "@/components/strategy/strategy-form";
import { useEffect } from "react";
import { deleteStrategyAction, deleteStrategiesAction } from "@/actions/strategy";
import { updateBusinessSettings } from "@/actions/business";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface StrategiesClientPageProps {
  initialStrategies: any[];
  selectedBusinessId: string;
  businessName: string;
  initialAutoGenerateEnabled: boolean;
  lastCascadeGeneratedAt: string | null;
}

export function StrategiesClientPage({
  initialStrategies,
  selectedBusinessId,
  businessName,
  initialAutoGenerateEnabled,
  lastCascadeGeneratedAt,
}: StrategiesClientPageProps) {
  const [strategies, setStrategies] = useState(initialStrategies);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<any | null>(null);
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [selectedStrategyIds, setSelectedStrategyIds] = useState<string[]>([]);
  const [isBulkDeleteAlertOpen, setIsBulkDeleteAlertOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isAutoGenerateEnabled, setIsAutoGenerateEnabled] = useState(initialAutoGenerateEnabled);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleToggleAutoGenerate = async (checked: boolean) => {
    setIsAutoGenerateEnabled(checked);
    toast.success(checked ? "Auto-generación de IA activada para onboarding" : "Auto-generación de IA desactivada");
    try {
      const res = await updateBusinessSettings(selectedBusinessId, { autoGenerateCampaigns: checked });
      if (!res.success) {
        toast.error("No se pudo guardar la preferencia en la base de datos.");
      }
    } catch (err) {
      console.error("Error updating auto-generate settings:", err);
    }
  };

  // Helper to format last cascade run
  const getCooldownStatus = () => {
    if (!lastCascadeGeneratedAt) return null;
    const lastRun = new Date(lastCascadeGeneratedAt);
    const timeSince = Date.now() - lastRun.getTime();
    const oneDayMs = 24 * 60 * 60 * 1000;
    
    if (timeSince < oneDayMs) {
      const remainingMs = oneDayMs - timeSince;
      const hours = Math.floor(remainingMs / (1000 * 60 * 60));
      const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
      return {
        label: `Auto-generación en cooldown. Siguiente en ${hours}h ${minutes}m.`,
        isCooldown: true
      };
    }
    
    const hoursSince = Math.floor(timeSince / (1000 * 60 * 60));
    if (hoursSince < 24) {
      return {
        label: `Última generación: Hace ${hoursSince} horas`,
        isCooldown: false
      };
    }
    
    const daysSince = Math.floor(hoursSince / 24);
    return {
      label: `Última generación: Hace ${daysSince} días`,
      isCooldown: false
    };
  };

  const cooldownStatus = getCooldownStatus();

  const handleCreateNew = () => {
    setEditingStrategy(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (strategy: any) => {
    setEditingStrategy(strategy);
    setIsDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    const res = await deleteStrategyAction(deleteTargetId, selectedBusinessId);
    if (res.success) {
      toast.success(res.message);
      setDeleteTargetId(null);
      window.location.reload();
    } else {
      toast.error(res.error);
    }
  };

  const handleBulkDeleteConfirm = async () => {
    if (selectedStrategyIds.length === 0) return;
    const res = await deleteStrategiesAction(selectedStrategyIds, selectedBusinessId);
    if (res.success) {
      toast.success(res.message);
      setSelectedStrategyIds([]);
      setIsBulkDeleteAlertOpen(false);
      window.location.reload();
    } else {
      toast.error(res.error);
    }
  };

  const handleFormSuccess = () => {
    setIsDialogOpen(false);
    // Recargar la página/datos para obtener la lista actualizada de estrategias
    window.location.reload();
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Estrategias de Marketing: {businessName}</h1>
          <p className="text-muted-foreground">Gestiona las estrategias maestras de tus negocios y genera planes asistidos por IA.</p>
          {cooldownStatus && (
            <div className="mt-2">
              <span className={`text-[10px] font-semibold px-2 py-1 rounded-md border ${cooldownStatus.isCooldown ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50' : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800'}`}>
                {cooldownStatus.label}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {strategies.length > 0 && (
            <Button
              variant="outline"
              onClick={() => {
                if (selectedStrategyIds.length === strategies.length) {
                  setSelectedStrategyIds([]);
                } else {
                  setSelectedStrategyIds(strategies.map(s => s.id));
                }
              }}
              className="h-10 text-xs font-semibold border-slate-200 hover:bg-slate-50 text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              {selectedStrategyIds.length === strategies.length ? "Deseleccionar todo" : "Seleccionar todo"}
            </Button>
          )}
          {selectedStrategyIds.length > 0 && (
            <Button
              variant="destructive"
              onClick={() => setIsBulkDeleteAlertOpen(true)}
              className="h-10 text-xs font-semibold shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <Trash className="mr-2 h-4 w-4" /> Eliminar ({selectedStrategyIds.length})
            </Button>
          )}

          <div className="flex items-center gap-2 border bg-muted/10 rounded-xl p-2 px-3 h-10">
            {isMounted ? (
              <Switch
                id="auto-generate"
                checked={isAutoGenerateEnabled}
                onCheckedChange={handleToggleAutoGenerate}
              />
            ) : (
              <div className="w-9 h-5 bg-slate-200 dark:bg-slate-800 rounded-full shrink-0" />
            )}
            <Label htmlFor="auto-generate" className="text-xs font-bold text-slate-700 dark:text-slate-350 cursor-pointer">
              Auto-generar (Onboarding)
            </Label>
          </div>

          <Button 
            onClick={handleCreateNew}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-md active:scale-95 transition-all cursor-pointer h-10"
          >
            <Plus className="mr-2 h-4 w-4" /> Nueva Estrategia
          </Button>
        </div>
      </div>

      {isAutoGenerating ? (
        <Card className="border border-violet-100 dark:border-violet-950 bg-gradient-to-br from-violet-50/40 via-white to-white shadow-sm flex flex-col items-center justify-center py-32 text-center space-y-6 animate-in fade-in zoom-in duration-500">
          <div className="relative">
            <div className="absolute inset-0 bg-violet-200/40 rounded-full blur-2xl animate-pulse" />
            <div className="relative h-20 w-20 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30 animate-spin duration-3000">
              <Sparkles className="h-10 w-10 text-white" />
            </div>
          </div>
          <div className="space-y-3 max-w-md">
            <CardTitle className="text-2xl font-bold text-slate-800">
              Generando tus estrategias base con IA...
            </CardTitle>
            <CardDescription className="text-sm text-slate-500">
              Estamos analizando el perfil de <strong>{businessName}</strong> y a tu competencia directa para formular 3 planes de marketing altamente personalizados listos para usar. Esto tomará unos segundos.
            </CardDescription>
          </div>
        </Card>
      ) : (
        <Tabs defaultValue="list" className="w-full space-y-6">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2">
          <TabsTrigger value="list" className="font-semibold">Mis Estrategias</TabsTrigger>
          <TabsTrigger value="ai-suggestions" className="font-semibold flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-violet-500" />
            Propuestas de IA
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          {strategies.length === 0 ? (
            <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Lightbulb className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">No hay estrategias aún</h2>
              <p className="text-muted-foreground max-w-sm mt-2">
                Crea una estrategia para un negocio para empezar a generar contenido inteligente.
              </p>
              <Button onClick={handleCreateNew} variant="outline" className="mt-6">
                Crea tu primera estrategia ahora
              </Button>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {strategies.map((strategy) => {
                const isAi = strategy.name.includes("✨") || strategy.name.includes("[IA]");
                const cleanName = strategy.name.replace(/✨/g, "").replace(/\[IA\]/g, "").trim();
                return (
                  <Card key={strategy.id} className="group hover:shadow-lg transition-all duration-300 flex flex-col">
                    <CardHeader className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={selectedStrategyIds.includes(strategy.id)}
                            onCheckedChange={(checked) => {
                              setSelectedStrategyIds((prev) =>
                                checked
                                  ? [...prev, strategy.id]
                                  : prev.filter((id) => id !== strategy.id)
                              );
                            }}
                            className="shadow-sm border-slate-300 dark:border-slate-700"
                          />
                          <Badge variant={strategy.isActive ? "default" : "secondary"}>
                            {strategy.isActive ? "Activa" : "Inactiva"}
                          </Badge>
                          {isAi && (
                            <Badge className="bg-violet-100 text-violet-750 border-none font-bold text-[9px] uppercase gap-0.5 px-1.5 py-0.5">
                              <Sparkles className="h-2.5 w-2.5 text-amber-500 animate-pulse" />
                              IA
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleEdit(strategy)}
                            className="h-8 w-8 text-muted-foreground hover:text-primary cursor-pointer"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setDeleteTargetId(strategy.id)}
                            className="h-8 w-8 text-muted-foreground hover:text-red-600 cursor-pointer"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <CardTitle className="text-xl group-hover:text-primary transition-colors flex items-center gap-1">
                        {cleanName}
                      </CardTitle>
                    <CardDescription className="line-clamp-3 mt-2">
                      {strategy.description || "Sin descripción disponible."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="text-xs text-muted-foreground font-medium">
                        {strategy.business.name}
                      </div>
                      <div className="flex items-center gap-2">
                        <ViewStrategyDialog 
                          strategy={{
                            id: strategy.id,
                            name: strategy.name,
                            description: strategy.description,
                            isActive: strategy.isActive,
                            objectives: strategy.objectives,
                            personas: strategy.personas,
                            funnelStages: strategy.funnelStages,
                            channels: strategy.channels,
                            business: {
                              name: strategy.business.name
                            }
                          }} 
                        />
                        <Link href={`/business/${strategy.businessId}`}>
                          <Button variant="ghost" size="sm" className="group/btn h-8 px-2 text-xs">
                            Ver Negocio <ArrowRight className="ml-1 h-3 w-3 group-hover/btn:translate-x-1 transition-transform" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          )}
        </TabsContent>

        <TabsContent value="ai-suggestions" className="space-y-6">
          <AiStrategiesPanel businessId={selectedBusinessId} existingStrategies={strategies} />
        </TabsContent>
      </Tabs>
      )}

      {/* Dialog para Crear y Editar Estrategias */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingStrategy ? "Editar Estrategia" : "Nueva Estrategia de Marketing"}
            </DialogTitle>
            <DialogDescription>
              {editingStrategy 
                ? "Modifica los pilares de marketing y objetivos de tu estrategia activa." 
                : "Configura el plan de marketing de tu marca, ya sea de forma manual o asistido por IA."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <StrategyForm 
              businessId={selectedBusinessId} 
              defaultValues={editingStrategy || undefined} 
              onSuccess={handleFormSuccess}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialogo de Confirmacion para Eliminar Estrategia */}
      <AlertDialog open={!!deleteTargetId} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
        <AlertDialogContent className="border border-muted/20 rounded-2xl shadow-2xl bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
              ¿Estás completamente seguro?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Esta acción no se puede deshacer. Se eliminará permanentemente esta estrategia de marketing del negocio y de la base de datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="text-xs font-semibold rounded-lg h-9">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg h-9 shadow-sm"
            >
              Eliminar estrategia
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialogo de Confirmacion para Eliminar Varias Estrategias */}
      <AlertDialog open={isBulkDeleteAlertOpen} onOpenChange={setIsBulkDeleteAlertOpen}>
        <AlertDialogContent className="border border-muted/20 rounded-2xl shadow-2xl bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
              ¿Estás seguro de eliminar estas estrategias?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Esta acción no se puede deshacer. Se eliminarán permanentemente las {selectedStrategyIds.length} estrategias seleccionadas del negocio y de la base de datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="text-xs font-semibold rounded-lg h-9">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg h-9 shadow-sm"
            >
              Eliminar seleccionadas
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
