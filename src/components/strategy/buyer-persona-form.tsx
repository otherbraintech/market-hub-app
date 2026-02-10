"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { simplePersonaSchema } from "@/lib/schemas/strategy";
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

type PersonaFormValues = z.infer<typeof simplePersonaSchema>;

interface BuyerPersonaFormProps {
  defaultValues?: PersonaFormValues;
  onSave: (persona: PersonaFormValues) => void;
  onCancel: () => void;
}

export function BuyerPersonaForm({ defaultValues, onSave, onCancel }: BuyerPersonaFormProps) {
  const form = useForm<PersonaFormValues>({
    resolver: zodResolver(simplePersonaSchema) as any,
    defaultValues: defaultValues || {
      name: "",
      demographics: "",
      painPoints: "",
      goals: "",
      communication: {
        tone: "",
        topics: "",
        triggers: "",
      },
    },
  });

  function onSubmit(data: PersonaFormValues) {
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
              <FormLabel>Nombre del Perfil</FormLabel>
              <FormControl>
                <Input placeholder="Ej. Emprendedor Digital" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="demographics"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Demografía</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Edad, género, ubicación, ocupación..." 
                  className="resize-none h-20"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="painPoints"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Puntos de Dolor (Pain Points)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="¿Qué problemas le quitan el sueño?" 
                  className="resize-none h-20"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="goals"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Objetivos y Deseos</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="¿Qué quiere lograr?" 
                  className="resize-none h-20"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="communication.tone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tono de Comunicación</FormLabel>
                <FormControl>
                  <Input placeholder="Ej. Directo, Educativo..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="communication.triggers"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Disparadores (Triggers)</FormLabel>
                <FormControl>
                  <Input placeholder="Ej. Escasez, Exclusividad..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="communication.topics"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Temas de Interés</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="¿Sobre qué temas le gusta leer/aprender?" 
                  className="resize-none h-20"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button variant="outline" type="button" onClick={onCancel}>Cancelar</Button>
          <Button type="submit">Guardar Persona</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
