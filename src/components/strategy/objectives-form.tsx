"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { smartObjectiveSchema } from "@/lib/schemas/strategy";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ObjectiveFormValues = z.infer<typeof smartObjectiveSchema>;

interface ObjectivesFormProps {
  defaultValues?: Partial<ObjectiveFormValues>;
  onSave: (objective: ObjectiveFormValues) => void;
  onCancel: () => void;
}

export function ObjectivesForm({ defaultValues, onSave, onCancel }: ObjectivesFormProps) {
  const form = useForm<ObjectiveFormValues>({
    resolver: zodResolver(smartObjectiveSchema) as any,
    defaultValues: {
      name: defaultValues?.name || "",
      specific: defaultValues?.specific || "",
      measurable: defaultValues?.measurable || "",
      achievable: defaultValues?.achievable || "",
      relevant: defaultValues?.relevant || "",
      timeBound: defaultValues?.timeBound || "",
      targetValue: defaultValues?.targetValue || 0,
      currentValue: defaultValues?.currentValue || 0,
      unit: defaultValues?.unit || "",
      deadline: defaultValues?.deadline || "",
      status: defaultValues?.status || 'PENDING',
    },
  });

  function onSubmit(data: ObjectiveFormValues) {
    onSave(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5 pb-2 border-b">
          <label className="text-xs font-bold text-violet-800">Cargar Plantilla Rápida</label>
          <Select onValueChange={(val) => {
            const templates: Record<string, Partial<ObjectiveFormValues>> = {
              instagram: {
                name: "Crecer comunidad en Instagram",
                targetValue: 1000,
                unit: "seguidores",
                deadline: "2026-08-31",
                status: "PENDING",
                specific: "Incrementar la base de seguidores calificados en la cuenta oficial de Instagram.",
                measurable: "Contador de seguidores públicos en el perfil de Instagram.",
                timeBound: "Lograr la meta antes del fin de trimestre."
              },
              leads: {
                name: "Generar Leads en Sitio Web",
                targetValue: 150,
                unit: "leads",
                deadline: "2026-07-31",
                status: "PENDING",
                specific: "Capturar leads calificados interesados en nuestros servicios a través del formulario de contacto.",
                measurable: "Registros únicos en la base de datos de leads.",
                timeBound: "Conseguir la meta en un plazo de 60 días."
              },
              sales: {
                name: "Incrementar Ventas Comerciales",
                targetValue: 30,
                unit: "ventas",
                deadline: "2026-09-30",
                status: "PENDING",
                specific: "Cerrar nuevos contratos de venta de productos directos de catálogo.",
                measurable: "Número de facturas emitidas pagadas.",
                timeBound: "Meta a ser alcanzada en un plazo máximo de 90 días."
              },
              tiktok: {
                name: "Aumentar alcance en TikTok",
                targetValue: 5000,
                unit: "visualizaciones promedio",
                deadline: "2026-08-31",
                status: "PENDING",
                specific: "Mejorar la retención y alcance viral de los Reels y Videos publicados en TikTok.",
                measurable: "Métrica de reproducciones promedio según analytics de TikTok.",
                timeBound: "Lograrlo en un periodo de 3 meses."
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
              <SelectValue placeholder="Selecciona una meta SMART sugerida..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="instagram">Crecer seguidores en Instagram</SelectItem>
              <SelectItem value="leads">Generar Leads en Sitio Web</SelectItem>
              <SelectItem value="sales">Incrementar Ventas Comerciales</SelectItem>
              <SelectItem value="tiktok">Aumentar alcance en TikTok</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título del Objetivo</FormLabel>
              <FormControl>
                <Input placeholder="Ej. Aumentar ventas orgánicas" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="targetValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor Meta</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unidad (Ej. %, USD, Leads)</FormLabel>
                <FormControl>
                  <Input placeholder="Ej. Leads" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="deadline"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha Límite</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona estado" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="PENDING">Pendiente</SelectItem>
                    <SelectItem value="IN_PROGRESS">En Progreso</SelectItem>
                    <SelectItem value="COMPLETED">Completado</SelectItem>
                    <SelectItem value="CANCELLED">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="specific"
          render={({ field }) => (
            <FormItem>
              <FormLabel>S - Específico</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="¿Qué quieres lograr exactamente?" 
                  className="resize-none h-16"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="measurable"
          render={({ field }) => (
            <FormItem>
              <FormLabel>M - Medible</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="¿Cómo sabrás que lo lograste?" 
                  className="resize-none h-16"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="timeBound"
          render={({ field }) => (
            <FormItem>
              <FormLabel>T - Tiempo</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="¿En qué plazo temporal?" 
                  className="resize-none h-16"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button variant="outline" type="button" onClick={onCancel}>Cancelar</Button>
          <Button type="submit">Guardar Objetivo</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
