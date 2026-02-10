/**
 * Módulo Webhooks - Handlers para callbacks de agentes externos
 */

import { prisma } from '@/lib/prisma'
import { processWebhookCallback } from '@/services/job-processor'
import { verifyWebhookSignature, extractWebhookHeaders } from '@/services/webhook-client'
import { 
  validateIdeasResponse, 
  validateCopyResponse, 
  validateMediaResponse,
  validatePublishResponse,
  validateMetricsResponse,
  type IdeasCallback,
  type CopyCallback,
  type MediaCallback,
  type PublishCallback,
  type MetricsCallback,
} from '@/modules/ai-agents'
import { createContentsFromIdeas, updateContent } from '@/modules/content-planning'
import { ContentStatus, ContentType, SocialChannel } from '@prisma/client'

// Tipos
export interface WebhookHandlerResult {
  success: boolean
  message: string
  data?: unknown
}

// ===================================
// Handler: Content Ideas
// ===================================

export async function handleIdeasCallback(
  jobId: string,
  callback: IdeasCallback
): Promise<WebhookHandlerResult> {
  if (!callback.success) {
    await processWebhookCallback(jobId, {
      success: false,
      error: callback.error?.message,
    })
    return { success: false, message: callback.error?.message ?? 'Unknown error' }
  }

  // Validar respuesta
  const validation = validateIdeasResponse(callback.data)
  if (!validation.success) {
    await processWebhookCallback(jobId, {
      success: false,
      error: `Respuesta inválida: ${validation.error.message}`,
    })
    return { success: false, message: 'Respuesta inválida del agente' }
  }

  // Obtener el job para saber el campaignId
  const job = await prisma.job.findUnique({ where: { id: jobId } })
  if (!job) {
    return { success: false, message: 'Job no encontrado' }
  }

  const payload = job.payload as { campaignId?: string }
  
  // Crear contenidos desde las ideas si hay campaignId
  if (payload.campaignId && validation.data.ideas.length > 0) {
    const ideas = validation.data.ideas.map(idea => ({
      title: idea.title,
      type: idea.type as ContentType,
      channel: idea.channel as SocialChannel,
      suggestedDate: idea.suggestedDate,
      outline: idea.outline,
      hashtags: idea.hashtags,
    }))

    await createContentsFromIdeas(payload.campaignId, ideas)
  }

  // Marcar job como completado
  await processWebhookCallback(jobId, {
    success: true,
    data: validation.data,
  })

  return { 
    success: true, 
    message: `${validation.data.ideas.length} ideas procesadas`,
    data: { count: validation.data.ideas.length }
  }
}

// ===================================
// Handler: Copy Generation
// ===================================

export async function handleCopyCallback(
  jobId: string,
  callback: CopyCallback
): Promise<WebhookHandlerResult> {
  if (!callback.success) {
    await processWebhookCallback(jobId, {
      success: false,
      error: callback.error?.message,
    })
    return { success: false, message: callback.error?.message ?? 'Unknown error' }
  }

  const validation = validateCopyResponse(callback.data)
  if (!validation.success) {
    await processWebhookCallback(jobId, {
      success: false,
      error: `Respuesta inválida: ${validation.error.message}`,
    })
    return { success: false, message: 'Respuesta inválida del agente' }
  }

  // Obtener el job para saber el contentId
  const job = await prisma.job.findUnique({ where: { id: jobId } })
  if (!job) {
    return { success: false, message: 'Job no encontrado' }
  }

  const payload = job.payload as { contentId?: string }
  
  // Actualizar contenido con el copy generado
  if (payload.contentId) {
    const copy = validation.data.copy
    await updateContent(payload.contentId, {
      caption: copy.mainCaption,
      body: copy.slides?.map(s => s.text).join('\n\n'),
      hashtags: copy.hashtags,
      status: ContentStatus.DRAFT,
    })
  }

  await processWebhookCallback(jobId, {
    success: true,
    data: validation.data,
  })

  return { success: true, message: 'Copy generado y guardado' }
}

// ===================================
// Handler: Media Generation
// ===================================

export async function handleMediaCallback(
  jobId: string,
  callback: MediaCallback
): Promise<WebhookHandlerResult> {
  if (!callback.success) {
    await processWebhookCallback(jobId, {
      success: false,
      error: callback.error?.message,
    })
    return { success: false, message: callback.error?.message ?? 'Unknown error' }
  }

  const validation = validateMediaResponse(callback.data)
  if (!validation.success) {
    await processWebhookCallback(jobId, {
      success: false,
      error: `Respuesta inválida: ${validation.error.message}`,
    })
    return { success: false, message: 'Respuesta inválida del agente' }
  }

  const job = await prisma.job.findUnique({ where: { id: jobId } })
  if (!job) {
    return { success: false, message: 'Job no encontrado' }
  }

  const payload = job.payload as { contentId?: string }
  
  // Actualizar contenido con la media generada
  if (payload.contentId) {
    await updateContent(payload.contentId, {
      mediaUrl: validation.data.media.url,
      thumbnailUrl: validation.data.media.thumbnailUrl,
      status: ContentStatus.DRAFT,
    })
  }

  await processWebhookCallback(jobId, {
    success: true,
    data: validation.data,
  })

  return { success: true, message: 'Media generado y guardado' }
}

// ===================================
// Handler: Publish Content
// ===================================

export async function handlePublishCallback(
  jobId: string,
  callback: PublishCallback
): Promise<WebhookHandlerResult> {
  if (!callback.success) {
    // Marcar contenido como fallido
    const job = await prisma.job.findUnique({ where: { id: jobId } })
    if (job) {
      const payload = job.payload as { contentId?: string }
      if (payload.contentId) {
        await updateContent(payload.contentId, {
          status: ContentStatus.FAILED,
        })
      }
    }

    await processWebhookCallback(jobId, {
      success: false,
      error: callback.error?.message,
    })
    return { success: false, message: callback.error?.message ?? 'Unknown error' }
  }

  const validation = validatePublishResponse(callback.data)
  if (!validation.success) {
    await processWebhookCallback(jobId, {
      success: false,
      error: `Respuesta inválida: ${validation.error.message}`,
    })
    return { success: false, message: 'Respuesta inválida del agente' }
  }

  const job = await prisma.job.findUnique({ where: { id: jobId } })
  if (!job) {
    return { success: false, message: 'Job no encontrado' }
  }

  const payload = job.payload as { contentId?: string }
  
  // Actualizar contenido como publicado
  if (payload.contentId) {
    await updateContent(payload.contentId, {
      status: ContentStatus.PUBLISHED,
      publishedAt: new Date(validation.data.publishedAt),
      externalId: validation.data.externalId,
      externalUrl: validation.data.externalUrl,
    })
  }

  await processWebhookCallback(jobId, {
    success: true,
    data: validation.data,
  })

  return { 
    success: true, 
    message: 'Contenido publicado',
    data: { externalUrl: validation.data.externalUrl }
  }
}

// ===================================
// Handler: Fetch Metrics
// ===================================

export async function handleMetricsCallback(
  jobId: string,
  callback: MetricsCallback
): Promise<WebhookHandlerResult> {
  if (!callback.success) {
    await processWebhookCallback(jobId, {
      success: false,
      error: callback.error?.message,
    })
    return { success: false, message: callback.error?.message ?? 'Unknown error' }
  }

  const validation = validateMetricsResponse(callback.data)
  if (!validation.success) {
    await processWebhookCallback(jobId, {
      success: false,
      error: `Respuesta inválida: ${validation.error.message}`,
    })
    return { success: false, message: 'Respuesta inválida del agente' }
  }

  const job = await prisma.job.findUnique({ where: { id: jobId } })
  if (!job) {
    return { success: false, message: 'Job no encontrado' }
  }

  const payload = job.payload as { contentId?: string }
  
  // Actualizar métricas del contenido
  if (payload.contentId) {
    await updateContent(payload.contentId, {
      metrics: validation.data.metrics,
    })
  }

  await processWebhookCallback(jobId, {
    success: true,
    data: validation.data,
  })

  return { 
    success: true, 
    message: 'Métricas actualizadas',
    data: validation.data.metrics
  }
}

// ===================================
// Utilidades
// ===================================

export async function verifyAndExtractWebhook(request: Request): Promise<{
  valid: boolean
  body: string
  headers: ReturnType<typeof extractWebhookHeaders>
  error?: string
}> {
  const body = await request.text()
  const headers = extractWebhookHeaders(request.headers)

  // Verificar firma si está presente
  if (headers.signature) {
    const isValid = verifyWebhookSignature(body, headers.signature)
    if (!isValid) {
      return { valid: false, body, headers, error: 'Firma inválida' }
    }
  }

  return { valid: true, body, headers }
}
