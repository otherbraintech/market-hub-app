"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { funnelStageSchema } from "@/lib/schemas/strategy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type FunnelFormValues = z.infer<typeof funnelStageSchema>;

interface FunnelStageFormProps {
  defaultValues?: FunnelFormValues;
  onSave: (stage: FunnelFormValues) => void;
  onCancel: () => void;
}

export function FunnelStageForm({ defaultValues, onSave, onCancel }: FunnelStageFormProps) {
  const form = useForm<FunnelFormValues>({
    resolver: zodResolver(funnelStageSchema) as any,
    defaultValues: defaultValues || {
      name: "",
      description: "",
      contentTypes: [],
      channels: [],
      goals: [],
      kpis: [],
      ctas: [],
    },
  });

  // Helper para manejar arrays de strings como texto separado por comas
  const getArrayAsString = (arr: string[]) => arr.join(", ");
  const setStringAsArray = (str: string) => str.split(",").map(s => s.trim()).filter(Boolean);

  function onSubmit(data: any) {
    // Transformamos los inputs de texto a arrays si es necesario en una implementación más compleja
    // Por ahora asumimos que el usuario rellena campos simples o usamos un tag input
    // Para simplificar, vamos a usar textareas y convertir manualmente en el submit
    
    // Como el schema espera arrays, pero para simplicidad de UI usaremos inputs de texto,
    // necesitamos adaptar esto.
    // Sin embargo, para no complicar el form, usaremos inputs normales y dejaremos que se guarden como arrays de 1 elemento o lógica separada
    // Mejor aún, hackeamos el form para que use inputs de texto y convierta
    
    // Actually, let's keep it simple: just text inputs for name/desc and maybe textarea for "content types" separated by commas
    onSave(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5 pb-2 border-b">
          <label className="text-xs font-bold text-violet-800">Cargar Plantilla Rápida</label>
          <Select onValueChange={(val) => {
            const templates: Record<string, Partial<FunnelFormValues>> = {
              tofu: {
                name: "1. Descubrimiento (TOFU)",
                description: "Llamar la atención de audiencias locales que aún no conocen el negocio y generar conciencia de marca.",
                contentTypes: ["Reels", "Stories", "Posts educativos"],
                channels: ["Instagram", "Facebook", "TikTok"],
                goals: ["Alcance", "Impresiones"],
                kpis: ["Reach", "Reproducciones de video"],
                ctas: ["Ver catálogo", "Síguenos para más"]
              },
              mofu: {
                name: "2. Consideración (MOFU)",
                description: "Demostrar la calidad, frescura e ingredientes de los productos para generar antojo, confianza e interacción con los prospectos.",
                contentTypes: ["Detrás de cámaras", "Testimonios", "Carruseles de beneficios"],
                channels: ["Instagram", "Facebook"],
                goals: ["Interacción", "Consultas recibidas"],
                kpis: ["Engagement rate", "Comentarios", "Mensajes directos"],
                ctas: ["Preguntar por WhatsApp", "Comentar para info"]
              },
              bofu: {
                name: "3. Conversión (BOFU)",
                description: "Facilitar el cierre rápido de la compra, resolver objeciones y asegurar pedidos directos.",
                contentTypes: ["Ofertas por tiempo limitado", "Combos especiales", "Proceso de pedido"],
                channels: ["Instagram DM", "Facebook Messenger", "WhatsApp"],
                goals: ["Ventas", "Pedidos cerrados"],
                kpis: ["Conversion rate", "Número de pedidos"],
                ctas: ["Hacer pedido ahora", "Comprar en 1 clic"]
              },
              fidelizacion: {
                name: "4. Fidelización (Post-venta)",
                description: "Fomentar la recompra, recopilar testimonios positivos y premiar la lealtad de los clientes existentes.",
                contentTypes: ["Promociones exclusivas clientes", "Agradecimientos", "Programas de puntos"],
                channels: ["Email", "WhatsApp", "Instagram Stories"],
                goals: ["Recompra", "Recomendaciones"],
                kpis: ["Tasa de recompra", "NPS / Reseñas positivas"],
                ctas: ["Unirse al club", "Dejar una reseña"]
              }
            };
            const selected = templates[val];
            if (selected) {
              Object.entries(selected).forEach(([key, value]) => {
                form.setValue(key as any, value);
              });
            }
          }}>
            <SelectTrigger className="w-full text-xs">
              <SelectValue placeholder="Selecciona una fase del funnel..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tofu">1. Descubrimiento (TOFU)</SelectItem>
              <SelectItem value="mofu">2. Consideración (MOFU)</SelectItem>
              <SelectItem value="bofu">3. Conversión (BOFU)</SelectItem>
              <SelectItem value="fidelizacion">4. Fidelización (Post-venta)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Etapa del Embudo</FormLabel>
              <FormControl>
                <Input placeholder="Ej. TOFU - Conciencia" {...field} />
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
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="El usuario descubre que tiene un problema..." 
                  className="resize-none h-20"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Simplificación: Solo gestionamos Nombre y Descripción en esta versión MVP */}
        <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
            <p>En esta versión, los tipos de contenido y canales se gestionarán automáticamente por la IA basándose en la etapa seleccionada.</p>
        </div>

        <DialogFooter>
          <Button variant="outline" type="button" onClick={onCancel}>Cancelar</Button>
          <Button type="submit">Guardar Etapa</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
