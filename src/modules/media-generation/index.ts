/**
 * Módulo Media Generation - Gestión de assets de media
 */

import { prisma } from '@/lib/prisma'
import { MediaAsset, MediaType, Prisma } from '@prisma/client'

// Tipos
export interface CreateMediaAssetInput {
  businessId: string
  type: MediaType
  filename: string
  url: string
  thumbnailUrl?: string
  mimeType: string
  size: number
  width?: number
  height?: number
  duration?: number
  alt?: string
  caption?: string
  metadata?: object
  generatedByJobId?: string
  promptUsed?: string
  folder?: string
  tags?: string[]
}

export interface UpdateMediaAssetInput {
  alt?: string
  caption?: string
  folder?: string
  tags?: string[]
  metadata?: object
}

// Servicios
export async function createMediaAsset(input: CreateMediaAssetInput): Promise<MediaAsset> {
  return prisma.mediaAsset.create({
    data: {
      businessId: input.businessId,
      type: input.type,
      filename: input.filename,
      url: input.url,
      thumbnailUrl: input.thumbnailUrl,
      mimeType: input.mimeType,
      size: input.size,
      width: input.width,
      height: input.height,
      duration: input.duration,
      alt: input.alt,
      caption: input.caption,
      metadata: input.metadata as Prisma.JsonObject | undefined,
      generatedByJobId: input.generatedByJobId,
      promptUsed: input.promptUsed,
      folder: input.folder,
      tags: input.tags as Prisma.JsonArray | undefined,
    },
  })
}

export async function getMediaAssetById(id: string): Promise<MediaAsset | null> {
  return prisma.mediaAsset.findUnique({ where: { id } })
}

export async function listMediaAssets(
  businessId: string,
  options?: {
    type?: MediaType
    folder?: string
    tags?: string[]
    skip?: number
    take?: number
  }
): Promise<{ assets: MediaAsset[]; total: number }> {
  const { type, folder, skip = 0, take = 50 } = options ?? {}

  const where: Prisma.MediaAssetWhereInput = {
    businessId,
    ...(type && { type }),
    ...(folder && { folder }),
  }

  const [assets, total] = await Promise.all([
    prisma.mediaAsset.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.mediaAsset.count({ where }),
  ])

  return { assets, total }
}

export async function updateMediaAsset(
  id: string,
  input: UpdateMediaAssetInput
): Promise<MediaAsset> {
  return prisma.mediaAsset.update({
    where: { id },
    data: {
      ...(input.alt !== undefined && { alt: input.alt }),
      ...(input.caption !== undefined && { caption: input.caption }),
      ...(input.folder !== undefined && { folder: input.folder }),
      ...(input.tags !== undefined && { tags: input.tags as Prisma.JsonArray }),
      ...(input.metadata !== undefined && { metadata: input.metadata as Prisma.JsonObject }),
    },
  })
}

export async function deleteMediaAsset(id: string): Promise<void> {
  await prisma.mediaAsset.delete({ where: { id } })
}

export async function getMediaFolders(businessId: string): Promise<string[]> {
  const results = await prisma.mediaAsset.findMany({
    where: { businessId, folder: { not: null } },
    select: { folder: true },
    distinct: ['folder'],
  })
  
  return results.map(r => r.folder!).filter(Boolean)
}

// Dimensiones por plataforma
export const PLATFORM_DIMENSIONS = {
  instagram: {
    post: { width: 1080, height: 1080 },
    story: { width: 1080, height: 1920 },
    reel: { width: 1080, height: 1920 },
    landscape: { width: 1080, height: 566 },
  },
  facebook: {
    post: { width: 1200, height: 630 },
    story: { width: 1080, height: 1920 },
    cover: { width: 820, height: 312 },
  },
  twitter: {
    post: { width: 1200, height: 675 },
    header: { width: 1500, height: 500 },
  },
  linkedin: {
    post: { width: 1200, height: 627 },
    story: { width: 1080, height: 1920 },
  },
  tiktok: {
    video: { width: 1080, height: 1920 },
  },
  youtube: {
    thumbnail: { width: 1280, height: 720 },
    banner: { width: 2560, height: 1440 },
  },
} as const

export function getDimensionsForPlatform(
  platform: keyof typeof PLATFORM_DIMENSIONS,
  format: string
): { width: number; height: number } | null {
  const platformDims = PLATFORM_DIMENSIONS[platform]
  if (!platformDims) return null
  
  return (platformDims as Record<string, { width: number; height: number }>)[format] ?? null
}
