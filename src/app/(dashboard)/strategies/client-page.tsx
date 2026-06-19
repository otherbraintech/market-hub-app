"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Plus, ArrowRight, Sparkles, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AiStrategiesPanel } from "@/components/strategy/ai-strategies-panel";
import { ViewStrategyDialog } from "@/components/strategy/view-strategy-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StrategyForm } from "@/components/strategy/strategy-form";
import { useEffect } from "react";

interface StrategiesClientPageProps {
  initialStrategies: any[];
  selectedBusinessId: string;
  businessName: string;
}

export function StrategiesClientPage({
  initialStrategies,
  selectedBusinessId,
  businessName,
}: StrategiesClientPageProps) {
  const [strategies, setStrategies] = useState(initialStrategies);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<any | null>(null);
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);

  // Auto-generación de estrategias si es el primer ingreso del usuario (0 estrategias)
  useEffect(() => {
    if (initialStrategies.length === 0 && !isAutoGenerating) {
      const autoGenerate = async () => {
        try {
          setIsAutoGenerating(true);
          const res = await fetch(`/api/business/${selectedBusinessId}/suggest-complete-strategies?autoSave=true`, {
            method: 'POST'
          });
          if (res.ok) {
            // Recargar la página para obtener las estrategias recién creadas desde el servidor
            window.location.reload();
          } else {
            setIsAutoGenerating(false); // Si falla, que le muestre el estado vacío normal
          }
        } catch (error) {
          console.error("Error auto-generating strategies:", error);
          setIsAutoGenerating(false);
        }
      };
      autoGenerate();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateNew = () => {
    setEditingStrategy(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (strategy: any) => {
    setEditingStrategy(strategy);
    setIsDialogOpen(true);
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
        </div>
        <Button 
          onClick={handleCreateNew}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-md active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="mr-2 h-4 w-4" /> Nueva Estrategia
        </Button>
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
              {strategies.map((strategy) => (
                <Card key={strategy.id} className="group hover:shadow-lg transition-all duration-300 flex flex-col">
                  <CardHeader className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant={strategy.isActive ? "default" : "secondary"}>
                        {strategy.isActive ? "Activa" : "Inactiva"}
                      </Badge>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleEdit(strategy)}
                          className="h-8 w-8 text-muted-foreground hover:text-primary cursor-pointer"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">
                      {strategy.name}
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
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="ai-suggestions" className="space-y-6">
          <AiStrategiesPanel businessId={selectedBusinessId} existingStrategiesCount={strategies.length} />
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
    </div>
  );
}
