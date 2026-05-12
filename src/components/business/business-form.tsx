"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { businessSchema, BusinessFormValues } from "@/lib/schemas/business";
import { createBusiness, updateBusiness, createBusinessWithAI } from "@/actions/business";
import { toast } from "sonner";
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
import { DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { HelpCircle, Sparkles } from "lucide-react";

interface BusinessFormProps {
  defaultValues?: BusinessFormValues & { id?: string };
  onSuccess?: () => void;
}

export function BusinessForm({ defaultValues, onSuccess }: BusinessFormProps) {
  const [loading, setLoading] = useState(false);
  const [useAI, setUseAI] = useState(!defaultValues?.id);
  const isEditing = !!defaultValues?.id;

  const form = useForm<BusinessFormValues>({
    resolver: zodResolver(businessSchema) as any,
    defaultValues: defaultValues || {
      name: "",
      description: "",
      industry: "",
      website: "",
      brandVoice: {
        tone: [],
        personality: [],
        values: [],
      },
      targetAudience: {
        demographics: "",
        psychographics: "",
      }
    },
  });

  async function onSubmit(data: BusinessFormValues) {
    setLoading(true);
    try {
      let result;
      if (isEditing && defaultValues?.id) {
        result = await updateBusiness(defaultValues.id, data);
      } else if (useAI) {
        result = await createBusinessWithAI({
          name: data.name,
          description: data.description,
          website: data.website || "",
        });
      } else {
        result = await createBusiness(data);
      }

      if (result.success) {
        toast.success(result.message);
        onSuccess?.();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Ocurrió un error inesperado");
    } finally {
      setLoading(false);
    }
  }

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
    <TooltipProvider>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {!isEditing && (
          <div className="flex items-center justify-between mb-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex flex-col">
              <span className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Creación con IA
              </span>
              <span className="text-xs text-muted-foreground">
                Generaremos industria, voz y audiencia automáticamente.
              </span>
            </div>
            <Button 
              type="button" 
              variant={useAI ? "default" : "outline"} 
              size="sm"
              onClick={() => setUseAI(!useAI)}
            >
              {useAI ? "Activado" : "Usar IA"}
            </Button>
          </div>
        )}

        <Tabs defaultValue="basic" className="w-full">
          {!useAI && (
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Básico</TabsTrigger>
              <TabsTrigger value="brand">Voz de Marca</TabsTrigger>
              <TabsTrigger value="audience">Audiencia</TabsTrigger>
            </TabsList>
          )}

          <TabsContent value="basic" className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <LabelHelp label="Nombre del Negocio" help="El nombre comercial oficial de tu marca o empresa." />
                  <FormControl>
                    <Input placeholder="Ej. Acme Inc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {!useAI && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <LabelHelp label="Industria" help="El sector al que pertenece tu negocio (ej. Retail, SaaS, Salud)." />
                      <FormControl>
                        <Input placeholder="Ej. Tecnología, Retail..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <LabelHelp label="Sitio Web" help="La dirección URL principal de tu negocio." />
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {useAI && (
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <LabelHelp label="Sitio Web (Opcional)" help="La IA extraerá información de aquí si la proporcionas." />
                    <FormControl>
                      <Input placeholder="https://mi-negocio.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <LabelHelp label="Descripción" help="Un resumen de qué hace tu negocio, sus productos y su misión principal." />
                  <FormControl>
                    <Textarea 
                      placeholder="Describe brevemente a qué se dedica el negocio..." 
                      className="resize-none h-24" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          {!useAI && (
            <>
              <TabsContent value="brand" className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="brandVoice.tone"
                  render={({ field }) => (
                    <FormItem>
                      <LabelHelp label="Tono de Marca" help="Cómo se 'escucha' tu marca (ej. Alegre, Formal, Informativo)." />
                      <FormControl>
                        <Input 
                          placeholder="Ej. Profesional, Cercano, Disruptivo (separado por comas)" 
                          value={Array.isArray(field.value) ? field.value.join(", ") : ""}
                          onChange={(e) => field.onChange(e.target.value.split(",").map(s => s.trim()))}
                        />
                      </FormControl>
                      <FormDescription>Define cómo suena el negocio.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="brandVoice.personality"
                  render={({ field }) => (
                    <FormItem>
                      <LabelHelp label="Personalidad" help="Rasgos humanos de tu marca (ej. Innovadora, Confiable, Rebelde)." />
                      <FormControl>
                        <Input 
                          placeholder="Ej. Experto, Amigable, Innovador" 
                          value={Array.isArray(field.value) ? field.value.join(", ") : ""}
                          onChange={(e) => field.onChange(e.target.value.split(",").map(s => s.trim()))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="brandVoice.values"
                  render={({ field }) => (
                    <FormItem>
                      <LabelHelp label="Valores Principales" help="Los principios éticos o filosofías que guían a tu negocio." />
                      <FormControl>
                        <Input 
                          placeholder="Ej. Integridad, Calidad, Sostenibilidad" 
                          value={Array.isArray(field.value) ? field.value.join(", ") : ""}
                          onChange={(e) => field.onChange(e.target.value.split(",").map(s => s.trim()))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="audience" className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="targetAudience.demographics"
                  render={({ field }) => (
                    <FormItem>
                      <LabelHelp label="Demografía General" help="Datos objetivos: Edad, ubicación, género, nivel de ingresos." />
                      <FormControl>
                        <Textarea 
                          placeholder="Edad, ubicación, nivel socioeconómico..." 
                          className="resize-none h-24"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="targetAudience.psychographics"
                  render={({ field }) => (
                    <FormItem>
                      <LabelHelp label="Psicografía y Comportamiento" help="Intereses, valores, estilos de vida y hábitos de compra." />
                      <FormControl>
                        <Textarea 
                          placeholder="Intereses, miedos, motivaciones, canales favoritos..." 
                          className="resize-none h-24"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </>
          )}
        </Tabs>

        <DialogFooter>
          <Button type="submit" disabled={loading} className={useAI ? "w-full" : ""}>
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                {useAI ? "Analizando y creando..." : "Guardando..."}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                {useAI && !isEditing && <Sparkles className="h-4 w-4" />}
                {isEditing ? "Actualizar" : useAI ? "Generar con IA y Crear" : "Crear Negocio"}
              </span>
            )}
          </Button>
        </DialogFooter>
        </form>
      </Form>
    </TooltipProvider>
  );
}
