/**
 * Módulo Marketing Strategy - Servicios
 * 
 * Operaciones CRUD y lógica para estrategias de marketing
 */

import { prisma } from '@/lib/prisma'
import { emitEvent } from '@/services/event-emitter'
import { EventType, Prisma } from '@prisma/client'
import { 
  CreateStrategyInput, 
  UpdateStrategyInput,
  StrategyWithTypes,
  StrategyWithRelations 
} from './types'

/**
 * Crea una nueva estrategia de marketing
 */
export async function createStrategy(
  input: CreateStrategyInput
): Promise<StrategyWithTypes> {
  const strategy = await prisma.marketingStrategy.create({
    data: {
      businessId: input.businessId,
      name: input.name,
      description: input.description,
      isActive: input.isActive ?? true,
      objectives: input.objectives as unknown as Prisma.JsonArray,
      personas: input.personas as unknown as Prisma.JsonArray,
      funnelStages: input.funnelStages as unknown as Prisma.JsonArray,
      channels: input.channels as unknown as Prisma.JsonArray,
      contentPillars: input.contentPillars as unknown as Prisma.JsonArray | undefined,
      postingSchedule: input.postingSchedule as Prisma.JsonObject | undefined,
    },
  })

  // Auditoría
  await prisma.auditLog.create({
    data: {
      entityType: 'MarketingStrategy',
      entityId: strategy.id,
      action: 'CREATE',
      changes: { name: input.name, businessId: input.businessId },
    },
  })

  return strategy as unknown as StrategyWithTypes
}

/**
 * Obtiene una estrategia por ID
 */
export async function getStrategyById(
  id: string
): Promise<StrategyWithTypes | null> {
  const strategy = await prisma.marketingStrategy.findUnique({
    where: { id },
  })
  
  return strategy as unknown as StrategyWithTypes | null
}

/**
 * Obtiene estrategia con relaciones
 */
export async function getStrategyWithRelations(
  id: string
): Promise<StrategyWithRelations | null> {
  return prisma.marketingStrategy.findUnique({
    where: { id },
    include: {
      business: true,
      campaigns: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })
}

/**
 * Lista estrategias de un negocio
 */
export async function listStrategiesByBusiness(
  businessId: string,
  options?: {
    activeOnly?: boolean
    skip?: number
    take?: number
  }
): Promise<{ strategies: StrategyWithTypes[]; total: number }> {
  const { activeOnly = false, skip = 0, take = 20 } = options ?? {}

  const where: Prisma.MarketingStrategyWhereInput = {
    businessId,
    ...(activeOnly && { isActive: true }),
  }

  const [strategies, total] = await Promise.all([
    prisma.marketingStrategy.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.marketingStrategy.count({ where }),
  ])

  return {
    strategies: strategies as unknown as StrategyWithTypes[],
    total,
  }
}

/**
 * Actualiza una estrategia
 */
export async function updateStrategy(
  id: string,
  input: UpdateStrategyInput
): Promise<StrategyWithTypes> {
  const strategy = await prisma.marketingStrategy.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
      ...(input.objectives && { objectives: input.objectives as unknown as Prisma.JsonArray }),
      ...(input.personas && { personas: input.personas as unknown as Prisma.JsonArray }),
      ...(input.funnelStages && { funnelStages: input.funnelStages as unknown as Prisma.JsonArray }),
      ...(input.channels && { channels: input.channels as unknown as Prisma.JsonArray }),
      ...(input.contentPillars && { contentPillars: input.contentPillars as unknown as Prisma.JsonArray }),
      ...(input.postingSchedule && { postingSchedule: input.postingSchedule as Prisma.JsonObject }),
    },
  })

  await prisma.auditLog.create({
    data: {
      entityType: 'MarketingStrategy',
      entityId: strategy.id,
      action: 'UPDATE',
      changes: Object.keys(input) as unknown as Prisma.JsonObject,
    },
  })

  return strategy as unknown as StrategyWithTypes
}

/**
 * Activa/desactiva una estrategia
 */
export async function toggleStrategyActive(
  id: string,
  isActive: boolean
): Promise<StrategyWithTypes> {
  return updateStrategy(id, { isActive })
}

/**
 * Elimina una estrategia
 */
export async function deleteStrategy(id: string): Promise<void> {
  await prisma.auditLog.create({
    data: {
      entityType: 'MarketingStrategy',
      entityId: id,
      action: 'DELETE',
      changes: {},
    },
  })

  await prisma.marketingStrategy.delete({
    where: { id },
  })
}

/**
 * Obtiene la estrategia principal (activa) de un negocio
 */
export async function getActiveStrategyForBusiness(
  businessId: string
): Promise<StrategyWithTypes | null> {
  const strategy = await prisma.marketingStrategy.findFirst({
    where: {
      businessId,
      isActive: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return strategy as unknown as StrategyWithTypes | null
}

/**
 * Prepara el contexto de estrategia para el agente IA
 */
export async function getStrategyContextForAI(strategyId: string) {
  const strategy = await getStrategyById(strategyId)
  
  if (!strategy) {
    throw new Error(`Estrategia no encontrada: ${strategyId}`)
  }

  return {
    name: strategy.name,
    description: strategy.description,
    
    // Objetivos resumidos
    objectives: strategy.objectives.map(obj => ({
      name: obj.name,
      specific: obj.specific,
      targetValue: obj.targetValue,
      unit: obj.unit,
    })),
    
    // Personas con información clave
    personas: strategy.personas.map(p => ({
      name: p.name,
      demographics: p.demographics,
      painPoints: p.painPoints,
      goals: p.goals,
      communication: p.communication,
    })),
    
    // Canales activos
    activeChannels: strategy.channels
      .filter(c => c.isActive)
      .map(c => c.platform),
    
    // Pilares de contenido
    contentPillars: strategy.contentPillars?.map(cp => ({
      name: cp.name,
      topics: cp.topics,
      formats: cp.formats,
    })),
    
    // Funnel
    funnelStages: strategy.funnelStages.map(s => ({
      name: s.name,
      contentTypes: s.contentTypes,
      ctas: s.ctas,
    })),
  }
}

/**
 * Duplica una estrategia
 */
export async function duplicateStrategy(
  strategyId: string,
  newName: string
): Promise<StrategyWithTypes> {
  const original = await getStrategyById(strategyId)
  
  if (!original) {
    throw new Error(`Estrategia no encontrada: ${strategyId}`)
  }

  return createStrategy({
    businessId: original.businessId,
    name: newName,
    description: original.description ?? undefined,
    objectives: original.objectives,
    personas: original.personas,
    funnelStages: original.funnelStages,
    channels: original.channels,
    contentPillars: original.contentPillars ?? undefined,
    postingSchedule: original.postingSchedule ?? undefined,
    isActive: false, // La copia empieza inactiva
  })
}
