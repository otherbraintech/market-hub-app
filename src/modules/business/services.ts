/**
 * Módulo Business - Servicios
 * 
 * Operaciones CRUD y lógica de negocio para empresas
 */

import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'
import { emitEvent } from '@/services/event-emitter'
import { EventType, Prisma } from '@prisma/client'
import { 
  CreateBusinessInput, 
  UpdateBusinessInput,
  BusinessWithTypes,
  BusinessWithRelations 
} from './types'

/**
 * Crea un nuevo negocio
 */
export async function createBusiness(
  input: CreateBusinessInput
): Promise<BusinessWithTypes> {
  const slug = input.slug || slugify(input.name)
  
  // Verificar que el slug sea único
  const existing = await prisma.business.findUnique({
    where: { slug },
  })
  
  if (existing) {
    throw new Error(`Ya existe un negocio con el slug: ${slug}`)
  }

  const business = await prisma.business.create({
    data: {
      name: input.name,
      slug,
      description: input.description,
      industry: input.industry,
      website: input.website,
      logo: input.logo,
      brandVoice: input.brandVoice as Prisma.JsonObject | undefined,
      brandColors: input.brandColors as Prisma.JsonObject | undefined,
      brandFonts: input.brandFonts as Prisma.JsonObject | undefined,
      targetAudience: input.targetAudience as Prisma.JsonObject | undefined,
      settings: input.settings as Prisma.JsonObject | undefined,
    },
  })

  // Emitir evento de creación
  await emitEvent(EventType.BUSINESS_CREATED, {
    businessId: business.id,
    name: business.name,
    slug: business.slug,
  })

  // Registrar en auditoría
  await prisma.auditLog.create({
    data: {
      entityType: 'Business',
      entityId: business.id,
      action: 'CREATE',
      changes: input as Prisma.JsonObject,
    },
  })

  return business as BusinessWithTypes
}

/**
 * Obtiene un negocio por ID
 */
export async function getBusinessById(
  id: string
): Promise<BusinessWithTypes | null> {
  const business = await prisma.business.findUnique({
    where: { id },
  })
  
  return business as BusinessWithTypes | null
}

/**
 * Obtiene un negocio por slug
 */
export async function getBusinessBySlug(
  slug: string
): Promise<BusinessWithTypes | null> {
  const business = await prisma.business.findUnique({
    where: { slug },
  })
  
  return business as BusinessWithTypes | null
}

/**
 * Obtiene un negocio con todas sus relaciones
 */
export async function getBusinessWithRelations(
  id: string
): Promise<BusinessWithRelations | null> {
  return prisma.business.findUnique({
    where: { id },
    include: {
      strategies: true,
      products: true,
      campaigns: {
        orderBy: { createdAt: 'desc' },
      },
      socialAccounts: true,
    },
  })
}

/**
 * Lista todos los negocios
 */
export async function listBusinesses(options?: {
  skip?: number
  take?: number
  orderBy?: 'name' | 'createdAt'
  order?: 'asc' | 'desc'
}): Promise<{ businesses: BusinessWithTypes[]; total: number }> {
  const { skip = 0, take = 20, orderBy = 'createdAt', order = 'desc' } = options ?? {}

  const [businesses, total] = await Promise.all([
    prisma.business.findMany({
      skip,
      take,
      orderBy: { [orderBy]: order },
    }),
    prisma.business.count(),
  ])

  return {
    businesses: businesses as BusinessWithTypes[],
    total,
  }
}

/**
 * Actualiza un negocio
 */
export async function updateBusiness(
  id: string,
  input: UpdateBusinessInput
): Promise<BusinessWithTypes> {
  // Si se cambia el slug, verificar unicidad
  if (input.slug) {
    const existing = await prisma.business.findFirst({
      where: { 
        slug: input.slug,
        NOT: { id },
      },
    })
    
    if (existing) {
      throw new Error(`Ya existe un negocio con el slug: ${input.slug}`)
    }
  }

  const business = await prisma.business.update({
    where: { id },
    data: {
      ...input,
      brandVoice: input.brandVoice as Prisma.JsonObject | undefined,
      brandColors: input.brandColors as Prisma.JsonObject | undefined,
      brandFonts: input.brandFonts as Prisma.JsonObject | undefined,
      targetAudience: input.targetAudience as Prisma.JsonObject | undefined,
      settings: input.settings as Prisma.JsonObject | undefined,
    },
  })

  // Emitir evento de actualización
  await emitEvent(EventType.BUSINESS_UPDATED, {
    businessId: business.id,
    changes: Object.keys(input),
  })

  // Registrar en auditoría
  await prisma.auditLog.create({
    data: {
      entityType: 'Business',
      entityId: business.id,
      action: 'UPDATE',
      changes: input as Prisma.JsonObject,
    },
  })

  return business as BusinessWithTypes
}

/**
 * Elimina un negocio
 */
export async function deleteBusiness(id: string): Promise<void> {
  // Primero registrar en auditoría
  await prisma.auditLog.create({
    data: {
      entityType: 'Business',
      entityId: id,
      action: 'DELETE',
      changes: {},
    },
  })

  // Luego eliminar (cascade eliminará relaciones)
  await prisma.business.delete({
    where: { id },
  })
}

/**
 * Prepara el contexto de negocio para enviar al agente IA
 */
export async function getBusinessContextForAI(businessId: string) {
  const business = await getBusinessWithRelations(businessId)
  
  if (!business) {
    throw new Error(`Negocio no encontrado: ${businessId}`)
  }

  return {
    business: {
      name: business.name,
      description: business.description,
      industry: business.industry,
      brandVoice: business.brandVoice,
      targetAudience: business.targetAudience,
    },
    strategies: business.strategies.filter(s => s.isActive).map(s => ({
      name: s.name,
      objectives: s.objectives,
      personas: s.personas,
      channels: s.channels,
      contentPillars: s.contentPillars,
    })),
    products: business.products.filter(p => p.isActive).map(p => ({
      name: p.name,
      description: p.description,
      features: p.features,
      benefits: p.benefits,
      keywords: p.keywords,
    })),
  }
}
