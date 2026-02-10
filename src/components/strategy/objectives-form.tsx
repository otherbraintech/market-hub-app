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
