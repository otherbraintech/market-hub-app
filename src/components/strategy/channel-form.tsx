"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { marketingChannelSchema } from "@/lib/schemas/strategy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

type ChannelFormValues = z.infer<typeof marketingChannelSchema>;

interface ChannelFormProps {
  defaultValues?: ChannelFormValues;
  onSave: (channel: ChannelFormValues) => void;
  onCancel: () => void;
}

export function ChannelForm({ defaultValues, onSave, onCancel }: ChannelFormProps) {
  const form = useForm<ChannelFormValues>({
    resolver: zodResolver(marketingChannelSchema) as any,
    defaultValues: defaultValues || {
      name: "",
      type: "SOCIAL",
      isActive: true,
      audienceSize: 0,
      frequency: "DAILY",
    },
  });

  function onSubmit(data: ChannelFormValues) {
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
              <FormLabel>Nombre del Canal</FormLabel>
              <FormControl>
                <Input placeholder="Ej. Instagram Oficial" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Tipo de canal" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="SOCIAL">Red Social</SelectItem>
                      <SelectItem value="EMAIL">Email Marketing</SelectItem>
                      <SelectItem value="BLOG">Blog / SEO</SelectItem>
                      <SelectItem value="ADS">Publicidad Pagada</SelectItem>
                      <SelectItem value="OTHER">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frecuencia Ideal</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Frecuencia" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="DAILY">Diaria</SelectItem>
                      <SelectItem value="WEEKLY">Semanal</SelectItem>
                      <SelectItem value="MONTHLY">Mensual</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>

        <FormField
          control={form.control}
          name="audienceSize"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tamaño de Audiencia (aprox)</FormLabel>
              <FormControl>
                <Input 
                    type="number" 
                    placeholder="0" 
                    {...field} 
                    onChange={e => field.onChange(Number(e.target.value))}
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
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Canal Activo
                </FormLabel>
                <p className="text-sm text-muted-foreground">
                  Desmarca si no quieres generar contenido para este canal temporalmente.
                </p>
              </div>
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button variant="outline" type="button" onClick={onCancel}>Cancelar</Button>
          <Button type="submit">Guardar Canal</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
