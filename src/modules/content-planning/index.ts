/**
 * Módulo Content Planning - Tipos y Servicios
 * 
 * Gestión de contenido y calendario editorial
 */

import { prisma } from '@/lib/prisma'
import { emitEvent, emitGenerateContentIdeas, emitGenerateCopy, emitGenerateMedia } from '@/services/event-emitter'
import { Content, ContentStatus, ContentType, ContentFormat, SocialChannel, EventType, Prisma } from '@prisma/client'

// Tipos
export interface ContentMetadata {
  source?: string         // 'manual' | 'ai_generated'
  version?: number
  approvedBy?: string
  rejectionReason?: string
}

export interface ContentMetrics {
  impressions?: number
  reach?: number
  engagement?: number
  engagementRate?: number
  likes?: number
  comments?: number
  shares?: number
  saves?: number
  clicks?: number
}

export interface CreateContentInput {
  campaignId?: string
  productId?: string
  type: ContentType
  format?: ContentFormat
  title: string
  body?: string
  caption?: string
  hashtags?: string[]
  mediaAssetId?: string
  mediaUrl?: string
  thumbnailUrl?: string
  metadata?: ContentMetadata
  scheduledAt?: Date
  channel?: SocialChannel
  socialAccountId?: string
}

export interface UpdateContentInput extends Partial<CreateContentInput> {
  status?: ContentStatus
  publishedAt?: Date
  metrics?: ContentMetrics
  externalId?: string
  externalUrl?: string
}

export interface ContentWithRelations extends Content {
  campaign?: { id: string; name: string } | null
  product?: { id: string; name: string } | null
  mediaAsset?: { id: string; url: string; thumbnailUrl: string | null } | null
}

// Servicios
export async function createContent(input: CreateContentInput): Promise<Content> {
  const content = await prisma.content.create({
    data: {
      campaignId: input.campaignId,
      productId: input.productId,
      type: input.type,
      format: input.format,
      title: input.title,
      body: input.body,
      caption: input.caption,
      hashtags: input.hashtags as Prisma.JsonArray | undefined,
      mediaAssetId: input.mediaAssetId,
      mediaUrl: input.mediaUrl,
      thumbnailUrl: input.thumbnailUrl,
      metadata: input.metadata as Prisma.JsonObject | undefined,
      scheduledAt: input.scheduledAt,
      channel: input.channel,
      socialAccountId: input.socialAccountId,
      status: ContentStatus.IDEA,
    },
  })

  await emitEvent(EventType.CONTENT_CREATED, {
    contentId: content.id,
    campaignId: input.campaignId,
    type: input.type,
    title: input.title,
  })

  return content
}

export async function getContentById(id: string): Promise<Content | null> {
  return prisma.content.findUnique({ where: { id } })
}

export async function getContentWithRelations(id: string): Promise<ContentWithRelations | null> {
  return prisma.content.findUnique({
    where: { id },
    include: {
      campaign: { select: { id: true, name: true } },
      product: { select: { id: true, name: true } },
      mediaAsset: { select: { id: true, url: true, thumbnailUrl: true } },
    },
  })
}

export async function listContentByCampaign(
  campaignId: string,
  options?: { status?: ContentStatus[]; skip?: number; take?: number }
): Promise<{ contents: Content[]; total: number }> {
  const { status, skip = 0, take = 50 } = options ?? {}
  
  const where: Prisma.ContentWhereInput = {
    campaignId,
    ...(status?.length && { status: { in: status } }),
  }

  const [contents, total] = await Promise.all([
    prisma.content.findMany({ where, skip, take, orderBy: { scheduledAt: 'asc' } }),
    prisma.content.count({ where }),
  ])

  return { contents, total }
}

export async function updateContent(id: string, input: UpdateContentInput): Promise<Content> {
  const content = await prisma.content.update({
    where: { id },
    data: {
      ...(input.campaignId !== undefined && { campaignId: input.campaignId }),
      ...(input.productId !== undefined && { productId: input.productId }),
      ...(input.type !== undefined && { type: input.type }),
      ...(input.format !== undefined && { format: input.format }),
      ...(input.title !== undefined && { title: input.title }),
      ...(input.body !== undefined && { body: input.body }),
      ...(input.caption !== undefined && { caption: input.caption }),
      ...(input.hashtags !== undefined && { hashtags: input.hashtags as Prisma.JsonArray | null }),
      ...(input.mediaAssetId !== undefined && { mediaAssetId: input.mediaAssetId }),
      ...(input.mediaUrl !== undefined && { mediaUrl: input.mediaUrl }),
      ...(input.thumbnailUrl !== undefined && { thumbnailUrl: input.thumbnailUrl }),
      ...(input.metadata !== undefined && { metadata: input.metadata as Prisma.JsonObject | null }),
      ...(input.scheduledAt !== undefined && { scheduledAt: input.scheduledAt }),
      ...(input.channel !== undefined && { channel: input.channel }),
      ...(input.socialAccountId !== undefined && { socialAccountId: input.socialAccountId }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.publishedAt !== undefined && { publishedAt: input.publishedAt }),
      ...(input.metrics !== undefined && { metrics: input.metrics as Prisma.JsonObject | null }),
      ...(input.externalId !== undefined && { externalId: input.externalId }),
      ...(input.externalUrl !== undefined && { externalUrl: input.externalUrl }),
    } as any,
  })

  if (input.status) {
    await emitEvent(EventType.CONTENT_UPDATED, {
      contentId: id,
      status: input.status,
    })
  }

  return content
}

export async function updateContentStatus(id: string, status: ContentStatus): Promise<Content> {
  return updateContent(id, { status })
}

export async function deleteContent(id: string): Promise<void> {
  await prisma.content.delete({ where: { id } })
}

// === Calendario ===

export async function getContentCalendar(
  businessId: string,
  startDate: Date,
  endDate: Date
): Promise<Content[]> {
  return prisma.content.findMany({
    where: {
      campaign: { businessId },
      scheduledAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      campaign: { select: { id: true, name: true } },
    },
    orderBy: { scheduledAt: 'asc' },
  })
}

export async function getUpcomingContent(businessId: string, limit = 10): Promise<Content[]> {
  return prisma.content.findMany({
    where: {
      campaign: { businessId },
      status: { in: [ContentStatus.APPROVED, ContentStatus.SCHEDULED] },
      scheduledAt: { gte: new Date() },
    },
    orderBy: { scheduledAt: 'asc' },
    take: limit,
  })
}

export async function getPendingReviewContent(businessId: string): Promise<Content[]> {
  return prisma.content.findMany({
    where: {
      campaign: { businessId },
      status: ContentStatus.REVIEW,
    },
    include: {
      campaign: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

// === Acciones de IA ===

/**
 * Solicita generación de ideas de contenido
 */
export async function requestContentIdeas(
  businessId: string,
  strategyId: string | null,
  parameters: {
    quantity: number
    contentTypes: string[]
    channels: string[]
    tone?: string
  }
) {
  return emitGenerateContentIdeas(businessId, strategyId, parameters)
}

/**
 * Solicita generación de copy para un contenido
 */
export async function requestCopyGeneration(
  contentId: string,
  parameters: {
    type: string
    tone: string
    length?: string
    keywords?: string[]
  }
) {
  // Marcar contenido como generando
  await updateContentStatus(contentId, ContentStatus.GENERATING)
  
  return emitGenerateCopy(contentId, parameters)
}

/**
 * Solicita generación de media para un contenido
 */
export async function requestMediaGeneration(
  contentId: string,
  parameters: {
    type: 'image' | 'video'
    style?: string
    dimensions?: { width: number; height: number }
    prompt?: string
  }
) {
  await updateContentStatus(contentId, ContentStatus.GENERATING)
  
  return emitGenerateMedia(contentId, parameters)
}

// === Bulk Operations ===

/**
 * Crea múltiples contenidos desde ideas generadas
 */
export async function createContentsFromIdeas(
  campaignId: string,
  ideas: Array<{
    title: string
    type: ContentType
    channel: SocialChannel
    suggestedDate?: string
    outline?: string[]
    hashtags?: string[]
  }>
): Promise<Content[]> {
  const contents = await prisma.$transaction(
    ideas.map(idea => 
      prisma.content.create({
        data: {
          campaignId,
          title: idea.title,
          type: idea.type,
          channel: idea.channel,
          scheduledAt: idea.suggestedDate ? new Date(idea.suggestedDate) : undefined,
          body: idea.outline?.join('\n'),
          hashtags: idea.hashtags as Prisma.JsonArray | undefined,
          status: ContentStatus.IDEA,
          metadata: { source: 'ai_generated' } as Prisma.JsonObject,
        },
      })
    )
  )

  return contents
}

/**
 * Aprueba múltiples contenidos
 */
export async function bulkApproveContent(contentIds: string[]): Promise<void> {
  await prisma.content.updateMany({
    where: { id: { in: contentIds } },
    data: { status: ContentStatus.APPROVED },
  })
}

/**
 * Programa múltiples contenidos
 */
export async function bulkScheduleContent(
  contents: Array<{ id: string; scheduledAt: Date }>
): Promise<void> {
  await prisma.$transaction(
    contents.map(c =>
      prisma.content.update({
        where: { id: c.id },
        data: { 
          scheduledAt: c.scheduledAt,
          status: ContentStatus.SCHEDULED,
        },
      })
    )
  )
}
