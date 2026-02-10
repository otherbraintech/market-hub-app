/**
 * Módulo Campaigns - Tipos y Servicios
 */

import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'
import { emitEvent } from '@/services/event-emitter'
import { Campaign, CampaignStatus, CampaignObjective, EventType, Prisma } from '@prisma/client'

// Tipos
export interface CampaignChannel {
  platform: string
  isActive: boolean
  budget?: number
  targeting?: object
}

export interface CampaignTargeting {
  locations?: string[]
  ageRange?: [number, number]
  interests?: string[]
  customAudiences?: string[]
}

export interface CampaignMetrics {
  impressions: number
  reach: number
  engagement: number
  clicks: number
  conversions: number
  spend: number
  roas?: number
}

export interface CreateCampaignInput {
  businessId: string
  strategyId?: string
  name: string
  slug?: string
  description?: string
  objective: CampaignObjective
  objectiveDetails?: object
  startDate: Date
  endDate?: Date
  budget?: number
  channels: CampaignChannel[]
  targeting?: CampaignTargeting
}

export interface UpdateCampaignInput extends Partial<Omit<CreateCampaignInput, 'businessId'>> {
  status?: CampaignStatus
  metrics?: CampaignMetrics
}

export interface CampaignWithTypes extends Omit<Campaign, 'objectiveDetails' | 'channels' | 'targeting' | 'metrics'> {
  objectiveDetails: object | null
  channels: CampaignChannel[]
  targeting: CampaignTargeting | null
  metrics: CampaignMetrics | null
}

// Servicios
export async function createCampaign(input: CreateCampaignInput): Promise<CampaignWithTypes> {
  const slug = input.slug || slugify(input.name)

  const campaign = await prisma.campaign.create({
    data: {
      businessId: input.businessId,
      strategyId: input.strategyId,
      name: input.name,
      slug,
      description: input.description,
      objective: input.objective,
      objectiveDetails: input.objectiveDetails as Prisma.JsonObject | undefined,
      startDate: input.startDate,
      endDate: input.endDate,
      budget: input.budget,
      channels: input.channels as unknown as Prisma.JsonArray,
      targeting: input.targeting as Prisma.JsonObject | undefined,
      status: CampaignStatus.DRAFT,
    },
  })

  await emitEvent(EventType.CAMPAIGN_CREATED, {
    campaignId: campaign.id,
    businessId: input.businessId,
    name: campaign.name,
    objective: campaign.objective,
  })

  await prisma.auditLog.create({
    data: {
      entityType: 'Campaign',
      entityId: campaign.id,
      action: 'CREATE',
      changes: { name: input.name, objective: input.objective },
    },
  })

  return campaign as unknown as CampaignWithTypes
}

export async function getCampaignById(id: string): Promise<CampaignWithTypes | null> {
  const campaign = await prisma.campaign.findUnique({ where: { id } })
  return campaign as unknown as CampaignWithTypes | null
}

export async function getCampaignWithContents(id: string) {
  return prisma.campaign.findUnique({
    where: { id },
    include: {
      contents: {
        orderBy: { scheduledAt: 'asc' },
      },
      business: true,
      strategy: true,
    },
  })
}

export async function listCampaignsByBusiness(
  businessId: string,
  options?: { 
    status?: CampaignStatus[]
    skip?: number
    take?: number 
  }
): Promise<{ campaigns: CampaignWithTypes[]; total: number }> {
  const { status, skip = 0, take = 20 } = options ?? {}
  
  const where: Prisma.CampaignWhereInput = {
    businessId,
    ...(status?.length && { status: { in: status } }),
  }

  const [campaigns, total] = await Promise.all([
    prisma.campaign.findMany({ 
      where, 
      skip, 
      take, 
      orderBy: { startDate: 'desc' },
      include: { _count: { select: { contents: true } } }
    }),
    prisma.campaign.count({ where }),
  ])

  return { campaigns: campaigns as unknown as CampaignWithTypes[], total }
}

export async function updateCampaign(id: string, input: UpdateCampaignInput): Promise<CampaignWithTypes> {
  const campaign = await prisma.campaign.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.slug !== undefined && { slug: input.slug }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.objective !== undefined && { objective: input.objective }),
      ...(input.objectiveDetails !== undefined && { objectiveDetails: input.objectiveDetails as Prisma.JsonObject | null }),
      ...(input.startDate !== undefined && { startDate: input.startDate }),
      ...(input.endDate !== undefined && { endDate: input.endDate }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.budget !== undefined && { budget: input.budget }),
      ...(input.channels !== undefined && { channels: input.channels as unknown as Prisma.JsonArray }),
      ...(input.targeting !== undefined && { targeting: input.targeting as Prisma.JsonObject | null }),
      ...(input.metrics !== undefined && { metrics: input.metrics as Prisma.JsonObject | null }),
    },
  })

  if (input.status) {
    await emitEvent(EventType.CAMPAIGN_UPDATED, {
      campaignId: id,
      status: input.status,
    })
  }

  return campaign as unknown as CampaignWithTypes
}

export async function updateCampaignStatus(id: string, status: CampaignStatus): Promise<CampaignWithTypes> {
  return updateCampaign(id, { status })
}

export async function deleteCampaign(id: string): Promise<void> {
  await prisma.campaign.delete({ where: { id } })
}

export async function getActiveCampaigns(businessId: string) {
  return prisma.campaign.findMany({
    where: {
      businessId,
      status: CampaignStatus.ACTIVE,
      startDate: { lte: new Date() },
      OR: [
        { endDate: null },
        { endDate: { gte: new Date() } },
      ],
    },
    include: { contents: true },
  })
}
