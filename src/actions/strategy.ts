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

      // Comprobar y disparar la generación en cascada en background tras actualizar
      const [campaignsCount, strategiesCount] = await Promise.all([
        prisma.campaign.count({ where: { businessId } }),
        prisma.marketingStrategy.count({ where: { businessId } })
      ]);
      if (campaignsCount < 8 || strategiesCount < 8) {
        import('@/lib/cascade').then(({ triggerCascadeGeneration }) => {
          triggerCascadeGeneration(businessId).catch(err => {
            console.error('[CASCADE] Error en triggerCascadeGeneration desde actualización de estrategia:', err);
          });
        });
      }

      revalidatePath(`/business/${businessId}`);
      revalidatePath(`/strategies`);
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
      // Comprobar y disparar la generación en cascada en background tras guardar/actualizar
      const [campaignsCount, strategiesCount] = await Promise.all([
        prisma.campaign.count({ where: { businessId } }),
        prisma.marketingStrategy.count({ where: { businessId } })
      ]);
      if (campaignsCount < 8 || strategiesCount < 8) {
        import('@/lib/cascade').then(({ triggerCascadeGeneration }) => {
          triggerCascadeGeneration(businessId).catch(err => {
            console.error('[CASCADE] Error en triggerCascadeGeneration desde upsert de estrategia:', err);
          });
        });
      }

      revalidatePath(`/business/${businessId}`);
      revalidatePath(`/strategies`);
      return { success: true, message: "Estrategia guardada con éxito" };
    }
  } catch (error) {
    console.error(error);
    return { success: false, error: "Error al guardar la estrategia" };
  }
}

export async function createStrategyAction(businessId: string, data: any) {
  try {
    // Si la nueva estrategia va a ser la activa, desactivar las otras de este negocio
    if (data.isActive) {
      await prisma.marketingStrategy.updateMany({
        where: { businessId, isActive: true },
        data: { isActive: false }
      });
    }

    const strategy = await prisma.marketingStrategy.create({
      data: {
        businessId,
        name: data.name,
        description: data.description || "",
        isActive: data.isActive ?? true,
        objectives: data.objectives || [],
        personas: data.personas || [],
        funnelStages: data.funnelStages || [],
        channels: data.channels || [],
      }
    });

    revalidatePath(`/business/${businessId}`);
    revalidatePath(`/strategies`);

    // Comprobar y disparar la generación en cascada en background
    const [campaignsCount, strategiesCount] = await Promise.all([
      prisma.campaign.count({ where: { businessId } }),
      prisma.marketingStrategy.count({ where: { businessId } })
    ]);
    if (campaignsCount < 8 || strategiesCount < 8) {
      import('@/lib/cascade').then(({ triggerCascadeGeneration }) => {
        triggerCascadeGeneration(businessId).catch(err => {
          console.error('[CASCADE] Error en triggerCascadeGeneration desde creación de estrategia:', err);
        });
      });
    }

    return { success: true, strategy, message: "Estrategia creada exitosamente" };
  } catch (error) {
    console.error("Error creating strategy:", error);
    return { success: false, error: "Error al crear la estrategia" };
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

export async function getActiveStrategyAction(businessId: string) {
  try {
    const strategy = await prisma.marketingStrategy.findFirst({
      where: { businessId, isActive: true },
      select: { id: true, name: true }
    });
    return { success: true, strategy };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Error al obtener la estrategia activa" };
  }
}

export async function listStrategiesAction(businessId: string) {
  try {
    const strategies = await prisma.marketingStrategy.findMany({
      where: { businessId },
      select: { id: true, name: true, isActive: true },
      orderBy: { updatedAt: "desc" }
    });
    return { success: true, strategies };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Error al listar las estrategias del negocio" };
  }
}
