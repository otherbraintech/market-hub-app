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
