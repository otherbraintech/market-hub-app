"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema, ProductFormValues } from "@/lib/schemas/product";
import { createProductAction, updateProductAction, suggestProductDetailsAction } from "@/actions/product";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { Plus, Trash, GripVertical, Sparkles, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ProductFormProps {
  businessId: string;
  defaultValues?: ProductFormValues & { id?: string };
  onSuccess?: () => void;
}

export function ProductForm({ businessId, defaultValues, onSuccess }: ProductFormProps) {
  const [loading, setLoading] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const isEditing = !!defaultValues?.id;

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: defaultValues || {
      name: "",
      description: "",
      shortDesc: "",
      imageUrl: "",
      features: [],
      benefits: [],
      pricing: {
        currency: "USD",
        basePrice: 0,
        period: "one-time"
      },
      keywords: "",
      isActive: true,
    },
  });

  const handleAISuggest = async () => {
    const name = form.getValues("name");
    const description = form.getValues("description");
    if (!name || name.trim().length < 2) {
      toast.error("Por favor ingresa un nombre válido para el producto (mínimo 2 caracteres).");
      return;
    }
    if (!description || description.trim().length < 10) {
      toast.error("Por favor ingresa una descripción detallada (mínimo 10 caracteres) para que la IA tenga suficiente contexto.");
      return;
    }

    setIsSuggesting(true);
    try {
      const res = await suggestProductDetailsAction(name, description, businessId);
      if (res.success && res.details) {
        form.setValue("shortDesc", res.details.shortDesc);
        form.setValue("keywords", res.details.keywords);
        
        // Limpiar arrays existentes y llenarlos con los nuevos
        form.setValue("features", res.details.features.map(f => ({ name: f.name, description: f.description })));
        form.setValue("benefits", res.details.benefits.map(b => ({ title: b.title, description: b.description })));
        
        toast.success("¡Detalles, características y beneficios sugeridos con IA con éxito!");
      } else {
        toast.error(res.error || "No se pudieron sugerir los detalles.");
      }
    } catch (e) {
      toast.error("Ocurrió un error al conectar con el asistente de IA.");
    } finally {
      setIsSuggesting(false);
    }
  };

  const { fields: featureFields, append: appendFeature, remove: removeFeature } = useFieldArray({
    control: form.control,
    name: "features",
  });

  const { fields: benefitFields, append: appendBenefit, remove: removeBenefit } = useFieldArray({
    control: form.control,
    name: "benefits",
  });

  async function onSubmit(data: ProductFormValues) {
    setLoading(true);
    try {
      let result;
      if (isEditing && defaultValues?.id) {
        result = await updateProductAction(defaultValues.id, businessId, data);
      } else {
        result = await createProductAction(businessId, data);
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="details">Detalles</TabsTrigger>
            <TabsTrigger value="pricing">Precio</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
          </TabsList>
          
          <ScrollArea className="h-[400px] mt-4 p-1">
            <TabsContent value="general" className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Producto</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. Suscripción Premium" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                 <FormField
                  control={form.control}
                  name="pricing.basePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio Base</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="pricing.currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Moneda</FormLabel>
                      <FormControl>
                        <Input placeholder="USD, EUR..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="shortDesc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción Corta (Hook)</FormLabel>
                    <FormControl>
                      <Input placeholder="Para anuncios y tarjetas..." {...field} />
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
                    <FormLabel>Descripción Detallada</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Explica en detalle qué es el producto o servicio..." 
                        className="min-h-[100px] text-xs leading-relaxed"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end pt-0.5 pb-1">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={handleAISuggest}
                  disabled={isSuggesting}
                  className="bg-blue-500/5 hover:bg-blue-500/10 text-blue-650 border-blue-500/20 text-xs gap-1.5 font-bold transition-all duration-350 hover:scale-[1.01]"
                >
                  {isSuggesting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Analizando y Generando detalles...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                      Autocompletar Detalles con IA
                    </>
                  )}
                </Button>
              </div>

              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL de la Imagen del Producto</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. https://tuservidor.com/imagen.jpg" className="text-xs" {...field} />
                    </FormControl>
                    <FormDescription className="text-[10px]">
                      URL de la imagen del producto. Servirá para ilustrar los creativos visuales.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch("imageUrl") && form.watch("imageUrl")?.trim() !== "" && (
                <div className="mt-2 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Previsualización de Imagen</span>
                  <div className="h-24 w-40 rounded-xl overflow-hidden border border-muted bg-muted/20 shadow-sm flex items-center justify-center">
                    <img 
                      src={form.watch("imageUrl")} 
                      alt="Vista previa de producto" 
                      className="w-full h-full object-cover" 
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Producto Activo</FormLabel>
                      <FormDescription>
                        Visible para generar contenido
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </TabsContent>

            <TabsContent value="details" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Características (Features)</h4>
                  <Button type="button" variant="outline" size="sm" onClick={() => appendFeature({ name: "", description: "" })}>
                    <Plus className="h-4 w-4 mr-1" /> Agregar
                  </Button>
                </div>
                {featureFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 items-start border p-2 rounded-md">
                    <GripVertical className="h-4 w-4 text-muted-foreground mt-3" />
                    <div className="flex-1 space-y-2">
                      <Input 
                        placeholder="Nombre de la característica" 
                        {...form.register(`features.${index}.name`)} 
                      />
                      <Textarea 
                        placeholder="Descripción..." 
                        className="h-16 resize-none"
                        {...form.register(`features.${index}.description`)} 
                      />
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeFeature(index)}>
                      <Trash className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>

               <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Beneficios (Benefits)</h4>
                  <Button type="button" variant="outline" size="sm" onClick={() => appendBenefit({ title: "", description: "" })}>
                    <Plus className="h-4 w-4 mr-1" /> Agregar
                  </Button>
                </div>
                {benefitFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 items-start border p-2 rounded-md">
                    <GripVertical className="h-4 w-4 text-muted-foreground mt-3" />
                    <div className="flex-1 space-y-2">
                      <Input 
                        placeholder="Título del beneficio" 
                        {...form.register(`benefits.${index}.title`)} 
                      />
                      <Textarea 
                        placeholder="Descripción..." 
                        className="h-16 resize-none"
                        {...form.register(`benefits.${index}.description`)} 
                      />
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeBenefit(index)}>
                      <Trash className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="pricing" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                 <FormField
                  control={form.control}
                  name="pricing.basePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio Base</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="pricing.currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Moneda</FormLabel>
                      <FormControl>
                        <Input placeholder="USD, EUR..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </TabsContent>

            <TabsContent value="seo" className="space-y-4">
               <FormField
                  control={form.control}
                  name="keywords"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Palabras Clave</FormLabel>
                      <FormControl>
                        <Input placeholder="marketing, ia, automatización (separadas por comas)" {...field} />
                      </FormControl>
                      <FormDescription>Ayudan a la IA a enfocar el contenido.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter>
          <Button type="submit" disabled={loading}>
            {loading ? "Guardando..." : isEditing ? "Actualizar Producto" : "Crear Producto"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
