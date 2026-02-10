"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
  HelpCircle
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

interface StrategyFormProps {
  businessId: string;
  defaultValues?: Partial<StrategyFormValues>;
  onSuccess?: () => void;
}

export function StrategyForm({ businessId, defaultValues, onSuccess }: StrategyFormProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [openPersonaDialog, setOpenPersonaDialog] = useState(false);
  const [openFunnelDialog, setOpenFunnelDialog] = useState(false);
  const [openChannelDialog, setOpenChannelDialog] = useState(false);
  const [openObjectiveDialog, setOpenObjectiveDialog] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const form = useForm<StrategyFormValues>({
    resolver: zodResolver(strategySchema) as any,
    defaultValues: {
      name: defaultValues?.name || "Estrategia General",
      description: defaultValues?.description || "",
      isActive: true,
      objectives: defaultValues?.objectives || [],
      personas: defaultValues?.personas || [], 
      funnelStages: defaultValues?.funnelStages || [],
      channels: defaultValues?.channels || []
    },
  });

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
           <Button type="submit" disabled={loading}>
             {loading ? "Guardando..." : "Guardar Cambios"}
           </Button>
        </div>

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
                            <div className="flex gap-2">
                                <Button variant="ghost" size="icon" onClick={() => { setEditingIndex(index); setOpenFunnelDialog(true); }}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeFunnel(index)}>
                                    <Trash className="h-4 w-4" />
                                </Button>
                            </div>
                            </div>
                        ))}
                        </div>
                    ) : (
                        <div className="text-center p-4 text-muted-foreground">No hay etapas definidas</div>
                    )}
                    <Button onClick={() => { setEditingIndex(null); setOpenFunnelDialog(true); }} type="button" variant="outline" className="w-full mt-4">
                        <Plus className="mr-2 h-4 w-4" /> Añadir Etapa de Funnel
                    </Button>
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
                       <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                         <Button variant="ghost" size="icon" onClick={() => { setEditingIndex(index); setOpenObjectiveDialog(true); }}>
                           <Edit className="h-4 w-4" />
                         </Button>
                         <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeObjective(index)}>
                           <Trash className="h-4 w-4" />
                         </Button>
                       </div>
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

             <Button onClick={() => { setEditingIndex(null); setOpenObjectiveDialog(true); }} type="button" className="w-full">
               <Plus className="mr-2 h-4 w-4" /> Añadir Objetivo SMART
             </Button>
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
                       <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                         <Button variant="ghost" size="icon" onClick={() => { setEditingIndex(index); setOpenPersonaDialog(true); }}>
                           <Edit className="h-4 w-4" />
                         </Button>
                         <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removePersona(index)}>
                           <Trash className="h-4 w-4" />
                         </Button>
                       </div>
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

             <Button onClick={() => { setEditingIndex(null); setOpenPersonaDialog(true); }} type="button" className="w-full">
               <Plus className="mr-2 h-4 w-4" /> Añadir Buyer Persona
             </Button>
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
                       <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                         <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingIndex(index); setOpenChannelDialog(true); }}>
                           <Edit className="h-4 w-4" />
                         </Button>
                         <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeChannel(index)}>
                           <Trash className="h-4 w-4" />
                         </Button>
                       </div>
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

             <Button onClick={() => { setEditingIndex(null); setOpenChannelDialog(true); }} type="button" className="w-full">
               <Plus className="mr-2 h-4 w-4" /> Añadir Canal
             </Button>
          </TabsContent>
        </Tabs>
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
