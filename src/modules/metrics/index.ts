/**
 * Módulo Metrics - Análisis y métricas de contenido
 */

import { prisma } from '@/lib/prisma'
import { emitEvent } from '@/services/event-emitter'
import { EventType, JobType, ContentStatus, CampaignStatus, Prisma } from '@prisma/client'

// Tipos
export interface ContentMetrics {
  impressions: number
  reach: number
  engagement: number
  engagementRate: number
  likes: number
  comments: number
  shares: number
  saves: number
  clicks: number
}

export interface CampaignMetrics {
  totalContents: number
  publishedContents: number
  totalImpressions: number
  totalReach: number
  totalEngagement: number
  avgEngagementRate: number
  totalClicks: number
  topPerformingContent: {
    id: string
    title: string
    engagementRate: number
  } | null
}

export interface BusinessMetrics {
  totalCampaigns: number
  activeCampaigns: number
  totalContents: number
  publishedContents: number
  totalFollowers: number
  accountsConnected: number
  contentsByStatus: Record<ContentStatus, number>
  contentsByChannel: Record<string, number>
}

// Servicios
export async function requestMetricsUpdate(
  contentId: string
): Promise<{ jobId: string }> {
  const content = await prisma.content.findUnique({
    where: { id: contentId },
    include: { socialAccount: true },
  })

  if (!content || !content.externalId) {
    throw new Error('Contenido no publicado o sin ID externo')
  }

  if (!content.socialAccountId) {
    throw new Error('Contenido sin cuenta social asociada')
  }

  const result = await emitEvent(
    EventType.FETCH_METRICS,
    {
      contentId,
      externalId: content.externalId,
      channel: content.channel,
      socialAccountId: content.socialAccountId,
      callbackUrl: `${process.env.WEBHOOK_CALLBACK_BASE_URL}/metrics`,
    },
    {
      createJob: true,
      jobType: JobType.FETCH_METRICS,
      webhookUrl: process.env.WEBHOOK_FETCH_METRICS_URL,
    }
  )

  return { jobId: result.jobId! }
}

export async function getCampaignMetrics(campaignId: string): Promise<CampaignMetrics> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      contents: {
        where: { status: ContentStatus.PUBLISHED },
      },
    },
  })

  if (!campaign) {
    throw new Error(`Campaña no encontrada: ${campaignId}`)
  }

  const contents = campaign.contents
  const publishedContents = contents.length
  const totalContents = await prisma.content.count({ where: { campaignId } })

  // Agregar métricas
  let totalImpressions = 0
  let totalReach = 0
  let totalEngagement = 0
  let totalClicks = 0
  let topContent: { id: string; title: string; engagementRate: number } | null = null

  for (const content of contents) {
    const metrics = content.metrics as ContentMetrics | null
    if (metrics) {
      totalImpressions += metrics.impressions || 0
      totalReach += metrics.reach || 0
      totalEngagement += metrics.engagement || 0
      totalClicks += metrics.clicks || 0

      if (!topContent || (metrics.engagementRate || 0) > topContent.engagementRate) {
        topContent = {
          id: content.id,
          title: content.title,
          engagementRate: metrics.engagementRate || 0,
        }
      }
    }
  }

  const avgEngagementRate = totalReach > 0 
    ? (totalEngagement / totalReach) * 100 
    : 0

  return {
    totalContents,
    publishedContents,
    totalImpressions,
    totalReach,
    totalEngagement,
    avgEngagementRate: Math.round(avgEngagementRate * 100) / 100,
    totalClicks,
    topPerformingContent: topContent,
  }
}

export async function getBusinessMetrics(businessId: string): Promise<BusinessMetrics> {
  const [
    totalCampaigns,
    activeCampaigns,
    totalContents,
    publishedContents,
    socialAccounts,
    contentsByStatusRaw,
    contentsByChannelRaw,
  ] = await Promise.all([
    prisma.campaign.count({ where: { businessId } }),
    prisma.campaign.count({ where: { businessId, status: CampaignStatus.ACTIVE } }),
    prisma.content.count({ where: { campaign: { businessId } } }),
    prisma.content.count({ where: { campaign: { businessId }, status: ContentStatus.PUBLISHED } }),
    prisma.socialAccount.findMany({
      where: { businessId, isActive: true },
      select: { followers: true },
    }),
    prisma.content.groupBy({
      by: ['status'],
      where: { campaign: { businessId } },
      _count: true,
    }),
    prisma.content.groupBy({
      by: ['channel'],
      where: { campaign: { businessId }, channel: { not: null } },
      _count: true,
    }),
  ])

  const totalFollowers = socialAccounts.reduce((sum, acc) => sum + (acc.followers || 0), 0)

  const contentsByStatus = contentsByStatusRaw.reduce((acc, item) => {
    acc[item.status] = item._count
    return acc
  }, {} as Record<ContentStatus, number>)

  const contentsByChannel = contentsByChannelRaw.reduce((acc, item) => {
    if (item.channel) {
      acc[item.channel] = item._count
    }
    return acc
  }, {} as Record<string, number>)

  return {
    totalCampaigns,
    activeCampaigns,
    totalContents,
    publishedContents,
    totalFollowers,
    accountsConnected: socialAccounts.length,
    contentsByStatus,
    contentsByChannel,
  }
}

export async function getTopPerformingContents(
  businessId: string,
  limit = 10
): Promise<Array<{
  id: string
  title: string
  channel: string | null
  metrics: ContentMetrics | null
}>> {
  const contents = await prisma.content.findMany({
    where: {
      campaign: { businessId },
      status: ContentStatus.PUBLISHED,
      metrics: { not: Prisma.DbNull },
    },
    select: {
      id: true,
      title: true,
      channel: true,
      metrics: true,
    },
    take: 100, // Traemos más y ordenamos en memoria
  })

  // Ordenar por engagement rate
  return contents
    .map(c => ({
      ...c,
      metrics: c.metrics as ContentMetrics | null,
    }))
    .sort((a, b) => {
      const rateA = a.metrics?.engagementRate || 0
      const rateB = b.metrics?.engagementRate || 0
      return rateB - rateA
    })
    .slice(0, limit)
}

// Dashboard resumen
export async function getDashboardSummary(businessId: string) {
  const [metrics, upcoming, pendingReview, recentJobs] = await Promise.all([
    getBusinessMetrics(businessId),
    prisma.content.findMany({
      where: {
        campaign: { businessId },
        status: ContentStatus.SCHEDULED,
        scheduledAt: { gte: new Date() },
      },
      orderBy: { scheduledAt: 'asc' },
      take: 5,
    }),
    prisma.content.count({
      where: {
        campaign: { businessId },
        status: ContentStatus.REVIEW,
      },
    }),
    prisma.job.findMany({
      where: {
        events: { some: { payload: { path: ['businessId'], equals: businessId } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ])

  return {
    metrics,
    upcomingContent: upcoming,
    pendingReviewCount: pendingReview,
    recentJobs,
  }
}
