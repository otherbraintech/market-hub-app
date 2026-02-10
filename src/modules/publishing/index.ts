/**
 * Módulo Publishing - Gestión de cuentas sociales y publicación
 */

import { prisma } from '@/lib/prisma'
import { emitPublishContent } from '@/services/event-emitter'
import { SocialAccount, SocialChannel, Prisma } from '@prisma/client'
import { updateContent } from '@/modules/content-planning'
import { ContentStatus } from '@prisma/client'

// Tipos
export interface CreateSocialAccountInput {
  businessId: string
  channel: SocialChannel
  accountId: string
  accountName: string
  accountUrl?: string
  avatar?: string
  accessToken?: string
  refreshToken?: string
  tokenExpiry?: Date
}

export interface UpdateSocialAccountInput {
  accountName?: string
  accountUrl?: string
  avatar?: string
  accessToken?: string
  refreshToken?: string
  tokenExpiry?: Date
  isActive?: boolean
  followers?: number
  metrics?: object
  lastSyncAt?: Date
}

// Servicios de Cuentas
export async function createSocialAccount(input: CreateSocialAccountInput): Promise<SocialAccount> {
  return prisma.socialAccount.create({
    data: {
      businessId: input.businessId,
      channel: input.channel,
      accountId: input.accountId,
      accountName: input.accountName,
      accountUrl: input.accountUrl,
      avatar: input.avatar,
      accessToken: input.accessToken,
      refreshToken: input.refreshToken,
      tokenExpiry: input.tokenExpiry,
    },
  })
}

export async function getSocialAccountById(id: string): Promise<SocialAccount | null> {
  return prisma.socialAccount.findUnique({ where: { id } })
}

export async function listSocialAccounts(
  businessId: string,
  options?: { channel?: SocialChannel; activeOnly?: boolean }
): Promise<SocialAccount[]> {
  const { channel, activeOnly = true } = options ?? {}

  return prisma.socialAccount.findMany({
    where: {
      businessId,
      ...(channel && { channel }),
      ...(activeOnly && { isActive: true }),
    },
    orderBy: { channel: 'asc' },
  })
}

export async function updateSocialAccount(
  id: string,
  input: UpdateSocialAccountInput
): Promise<SocialAccount> {
  return prisma.socialAccount.update({
    where: { id },
    data: {
      ...(input.accountName !== undefined && { accountName: input.accountName }),
      ...(input.accountUrl !== undefined && { accountUrl: input.accountUrl }),
      ...(input.avatar !== undefined && { avatar: input.avatar }),
      ...(input.accessToken !== undefined && { accessToken: input.accessToken }),
      ...(input.refreshToken !== undefined && { refreshToken: input.refreshToken }),
      ...(input.tokenExpiry !== undefined && { tokenExpiry: input.tokenExpiry }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
      ...(input.followers !== undefined && { followers: input.followers }),
      ...(input.metrics !== undefined && { metrics: input.metrics as Prisma.JsonObject }),
      ...(input.lastSyncAt !== undefined && { lastSyncAt: input.lastSyncAt }),
    },
  })
}

export async function deleteSocialAccount(id: string): Promise<void> {
  await prisma.socialAccount.delete({ where: { id } })
}

export async function disconnectSocialAccount(id: string): Promise<SocialAccount> {
  return prisma.socialAccount.update({
    where: { id },
    data: {
      isActive: false,
      accessToken: null,
      refreshToken: null,
      tokenExpiry: null,
    },
  })
}

// Servicios de Publicación
export async function publishContent(
  contentId: string,
  socialAccountId: string
): Promise<{ jobId: string }> {
  const content = await prisma.content.findUnique({
    where: { id: contentId },
    include: { mediaAsset: true },
  })

  if (!content) {
    throw new Error(`Contenido no encontrado: ${contentId}`)
  }

  if (!content.channel) {
    throw new Error('El contenido no tiene canal asignado')
  }

  const socialAccount = await getSocialAccountById(socialAccountId)
  if (!socialAccount) {
    throw new Error(`Cuenta social no encontrada: ${socialAccountId}`)
  }

  if (!socialAccount.isActive) {
    throw new Error('La cuenta social está desconectada')
  }

  // Marcar como publicando
  await updateContent(contentId, { status: ContentStatus.PUBLISHING })

  // Emitir evento de publicación
  const result = await emitPublishContent(
    contentId,
    content.channel,
    socialAccountId
  )

  return { jobId: result.jobId! }
}

export async function scheduleContent(
  contentId: string,
  socialAccountId: string,
  scheduledAt: Date
): Promise<void> {
  await updateContent(contentId, {
    socialAccountId,
    scheduledAt,
    status: ContentStatus.SCHEDULED,
  })
}

export async function cancelScheduledContent(contentId: string): Promise<void> {
  await updateContent(contentId, {
    scheduledAt: undefined,
    status: ContentStatus.APPROVED,
  })
}

// Obtener contenido listo para publicar
export async function getContentReadyToPublish(): Promise<{
  contentId: string
  socialAccountId: string
}[]> {
  const contents = await prisma.content.findMany({
    where: {
      status: ContentStatus.SCHEDULED,
      scheduledAt: { lte: new Date() },
      socialAccountId: { not: null },
    },
    select: {
      id: true,
      socialAccountId: true,
    },
  })

  return contents
    .filter(c => c.socialAccountId !== null)
    .map(c => ({
      contentId: c.id,
      socialAccountId: c.socialAccountId!,
    }))
}

// Verificar estado de tokens
export async function getAccountsNeedingRefresh(businessId: string): Promise<SocialAccount[]> {
  const soon = new Date()
  soon.setHours(soon.getHours() + 24) // Tokens que expiran en 24h

  return prisma.socialAccount.findMany({
    where: {
      businessId,
      isActive: true,
      tokenExpiry: { lte: soon },
    },
  })
}
