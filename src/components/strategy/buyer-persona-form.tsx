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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
        <div className="space-y-1.5 pb-2 border-b">
          <label className="text-xs font-bold text-indigo-800">Cargar Plantilla Rápida</label>
          <Select onValueChange={(val) => {
            const templates: Record<string, Partial<PersonaFormValues>> = {
              sofia: {
                name: "Sofía la Organizadora Familiar",
                demographics: "Mujer de 30-45 años, casada con hijos, residente en zona urbana de nivel socioeconómico medio-alto, profesional ocupada.",
                painPoints: "Falta de tiempo para planificar eventos, busca opciones de calidad garantizada de forma rápida y confiable.",
                goals: "Asegurar que las celebraciones familiares salgan perfectas, buscando comodidad, variedad y rapidez en el proceso de compra.",
                communication: {
                  tone: "Cálido, Familiar, Confiable",
                  topics: "Organización de eventos familiares, recetas rápidas, tips de celebración.",
                  triggers: "Ahorro de tiempo, recomendación social, calidad garantizada."
                }
              },
              alejandro: {
                name: "Alejandro el Joven Tecnológico",
                demographics: "Hombre de 22-30 años, soltero, profesional en tecnología, usuario móvil intensivo de redes sociales, busca conveniencia.",
                painPoints: "Odio por las llamadas telefónicas o los procesos lentos de consulta de catálogo, prefiere respuestas inmediatas.",
                goals: "Comprar antojos o regalos de forma rápida en menos de 3 clics y recibir confirmación al instante por chat.",
                communication: {
                  tone: "Directo, Dinámico, Casual",
                  topics: "Novedades tecnológicas, gadgets, tendencias de consumo rápido, memes.",
                  triggers: "Facilidad de compra, inmediatez, ofertas exclusivas."
                }
              },
              carlos: {
                name: "Carlos el Cazador de Ofertas",
                demographics: "Hombre o Mujer de 18-35 años, estudiante o joven profesional, sensible a los precios pero busca productos de buen aspecto.",
                painPoints: "Presupuesto mensual ajustado, miedo a gastar de más en productos que no cumplan sus expectativas visuales.",
                goals: "Conseguir la mejor relación calidad-precio y promociones especiales para compartir en reuniones sociales.",
                communication: {
                  tone: "Promocional, Alegre, Cercano",
                  topics: "Descuentos, combos especiales, sorteos, contenido detrás de cámara del negocio.",
                  triggers: "Promociones 2x1, envíos gratis, cupones de descuento."
                }
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
              <SelectValue placeholder="Selecciona un perfil de Buyer Persona..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sofia">Sofía la Organizadora Familiar (Familiar/Calidad)</SelectItem>
              <SelectItem value="alejandro">Alejandro el Joven Tecnológico (Casual/Inmediato)</SelectItem>
              <SelectItem value="carlos">Carlos el Cazador de Ofertas (Promocional/Precio)</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
