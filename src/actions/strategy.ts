"use server";

import { revalidatePath } from "next/cache";
import { strategySchema } from "@/lib/schemas/strategy";
import { createStrategy, updateStrategy, getActiveStrategyForBusiness, CreateStrategyInput } from "@/modules/marketing-strategy";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export async function upsertStrategyAction(businessId: string, data: z.infer<typeof strategySchema>) {
  try {
    const validated = strategySchema.parse(data);
    
    // Verificar si ya existe una estrategia activa
    const existing = await getActiveStrategyForBusiness(businessId);

    if (existing) {
      // Actualizar
      await updateStrategy(existing.id, {
        name: validated.name,
        description: validated.description,
        isActive: validated.isActive,
        objectives: validated.objectives as any,
        personas: validated.personas as any,
        funnelStages: validated.funnelStages as any,
        channels: validated.channels as any,
      });
      revalidatePath(`/business/${businessId}`);
      return { success: true, message: "Estrategia actualizada" };
    } else {
      // Crear nueva
      const input: CreateStrategyInput = {
        businessId,
        name: validated.name,
        description: validated.description,
        objectives: (validated.objectives as any) || [],
        personas: (validated.personas as any) || [],
        funnelStages: (validated.funnelStages as any) || [],
        channels: (validated.channels as any) || [],
        isActive: true
      };
      
      await createStrategy(input);
      revalidatePath(`/business/${businessId}`);
      return { success: true, message: "Estrategia creada" };
    }
  } catch (error) {
    console.error(error);
    return { success: false, error: "Error al guardar la estrategia" };
  }
}

export async function getPersonasForBusinessAction(businessId: string) {
  try {
    const strategies = await prisma.marketingStrategy.findMany({
      where: { businessId },
      select: { personas: true }
    });

    const personas = strategies.flatMap(s => (s.personas as any[]) || []);
    
    // De-duplicate by name
    const uniquePersonas = Array.from(new Map(personas.map(p => [p.name, p])).values());

    return { success: true, personas: uniquePersonas };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Error al obtener personas" };
  }
}
