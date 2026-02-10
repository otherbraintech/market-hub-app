/**
 * Servicio de Emisión de Eventos
 * 
 * Este servicio es el corazón del sistema event-driven.
 * Toda acción importante pasa por aquí para:
 * 1. Registrar el evento en la base de datos
 * 2. Crear un Job si es necesario
 * 3. Disparar webhooks configurados
 */

import { prisma } from '@/lib/prisma'
import { EventType, JobType, JobStatus, Prisma } from '@prisma/client'
import { dispatchWebhook, WebhookPayload } from './webhook-client'

// Tipos para el sistema de eventos
export interface EventPayload {
  [key: string]: unknown
}

export interface EmitEventOptions {
  /** Crear un Job asociado al evento */
  createJob?: boolean
  /** Tipo de Job a crear */
  jobType?: JobType
  /** Prioridad del Job (mayor = más prioritario) */
  priority?: number
  /** URL del webhook a llamar */
  webhookUrl?: string
  /** Programar para después */
  scheduledAt?: Date
  /** Metadatos adicionales */
  metadata?: Record<string, unknown>
}

export interface EmitEventResult {
  eventId: string
  jobId: string | null
  webhookDispatched: boolean
}

/**
 * Emite un evento en el sistema
 * 
 * @param type - Tipo de evento (ej: GENERATE_CONTENT_IDEAS)
 * @param payload - Datos del evento
 * @param options - Opciones adicionales
 * @returns Resultado con IDs creados
 */
export async function emitEvent(
  type: EventType,
  payload: EventPayload,
  options: EmitEventOptions = {}
): Promise<EmitEventResult> {
  const {
    createJob = false,
    jobType,
    priority = 0,
    webhookUrl,
    scheduledAt,
    metadata,
  } = options

  let jobId: string | null = null
  let webhookDispatched = false

  // Usar transacción para garantizar consistencia
  const result = await prisma.$transaction(async (tx) => {
    // 1. Crear Job si es necesario
    if (createJob && jobType) {
      const job = await tx.job.create({
        data: {
          type: jobType,
          status: scheduledAt ? JobStatus.PENDING : JobStatus.QUEUED,
          priority,
          payload: payload as Prisma.JsonObject,
          webhookUrl,
          scheduledAt,
        },
      })
      jobId = job.id
    }

    // 2. Registrar el evento
    const event = await tx.event.create({
      data: {
        type,
        payload: payload as Prisma.JsonObject,
        metadata: metadata as Prisma.JsonObject | undefined,
        jobId,
      },
    })

    return { eventId: event.id, jobId }
  })

  // 3. Disparar webhook si hay URL configurada
  if (webhookUrl && jobId) {
    try {
      const webhookPayload: WebhookPayload = {
        eventType: type,
        jobId,
        payload,
        timestamp: new Date().toISOString(),
      }
      
      await dispatchWebhook(webhookUrl, webhookPayload)
      webhookDispatched = true

      // Actualizar estado del job a PROCESSING
      await prisma.job.update({
        where: { id: jobId },
        data: { 
          status: JobStatus.PROCESSING,
          startedAt: new Date(),
        },
      })
    } catch (error) {
      console.error('Error dispatching webhook:', error)
      // No fallar el evento, solo marcar que no se envió
    }
  }

  return {
    eventId: result.eventId,
    jobId: result.jobId,
    webhookDispatched,
  }
}

/**
 * Mapeo de EventType a JobType
 */
export function eventTypeToJobType(eventType: EventType): JobType | null {
  const mapping: Partial<Record<EventType, JobType>> = {
    [EventType.GENERATE_CONTENT_IDEAS]: JobType.GENERATE_CONTENT_IDEAS,
    [EventType.GENERATE_COPY]: JobType.GENERATE_COPY,
    [EventType.GENERATE_MEDIA]: JobType.GENERATE_MEDIA,
    [EventType.REGENERATE_MEDIA]: JobType.REGENERATE_MEDIA,
    [EventType.PUBLISH_CONTENT]: JobType.PUBLISH_CONTENT,
    [EventType.FETCH_METRICS]: JobType.FETCH_METRICS,
  }
  
  return mapping[eventType] ?? null
}

/**
 * Obtiene la URL del webhook configurada para un tipo de evento
 */
export function getWebhookUrlForEvent(eventType: EventType): string | null {
  const envMapping: Partial<Record<EventType, string>> = {
    [EventType.GENERATE_CONTENT_IDEAS]: process.env.WEBHOOK_GENERATE_IDEAS_URL,
    [EventType.GENERATE_COPY]: process.env.WEBHOOK_GENERATE_COPY_URL,
    [EventType.GENERATE_MEDIA]: process.env.WEBHOOK_GENERATE_MEDIA_URL,
    [EventType.PUBLISH_CONTENT]: process.env.WEBHOOK_PUBLISH_CONTENT_URL,
    [EventType.FETCH_METRICS]: process.env.WEBHOOK_FETCH_METRICS_URL,
  }
  
  // Si hay URL específica, usarla; sino usar la URL genérica del agente IA
  return envMapping[eventType] || process.env.AI_AGENT_WEBHOOK_URL || null
}

/**
 * Helper para emitir eventos de generación de contenido
 */
export async function emitGenerateContentIdeas(
  businessId: string,
  strategyId: string | null,
  parameters: {
    quantity: number
    contentTypes: string[]
    channels: string[]
    tone?: string
  }
): Promise<EmitEventResult> {
  const webhookUrl = getWebhookUrlForEvent(EventType.GENERATE_CONTENT_IDEAS)
  
  return emitEvent(
    EventType.GENERATE_CONTENT_IDEAS,
    {
      businessId,
      strategyId,
      parameters,
      callbackUrl: `${process.env.WEBHOOK_CALLBACK_BASE_URL}/content-ideas`,
    },
    {
      createJob: true,
      jobType: JobType.GENERATE_CONTENT_IDEAS,
      webhookUrl: webhookUrl ?? undefined,
    }
  )
}

/**
 * Helper para emitir eventos de generación de copy
 */
export async function emitGenerateCopy(
  contentId: string,
  parameters: {
    type: string
    tone: string
    length?: string
    keywords?: string[]
  }
): Promise<EmitEventResult> {
  const webhookUrl = getWebhookUrlForEvent(EventType.GENERATE_COPY)
  
  return emitEvent(
    EventType.GENERATE_COPY,
    {
      contentId,
      parameters,
      callbackUrl: `${process.env.WEBHOOK_CALLBACK_BASE_URL}/copy`,
    },
    {
      createJob: true,
      jobType: JobType.GENERATE_COPY,
      webhookUrl: webhookUrl ?? undefined,
    }
  )
}

/**
 * Helper para emitir eventos de generación de media
 */
export async function emitGenerateMedia(
  contentId: string,
  parameters: {
    type: 'image' | 'video'
    style?: string
    dimensions?: { width: number; height: number }
    prompt?: string
  }
): Promise<EmitEventResult> {
  const webhookUrl = getWebhookUrlForEvent(EventType.GENERATE_MEDIA)
  
  return emitEvent(
    EventType.GENERATE_MEDIA,
    {
      contentId,
      parameters,
      callbackUrl: `${process.env.WEBHOOK_CALLBACK_BASE_URL}/media`,
    },
    {
      createJob: true,
      jobType: JobType.GENERATE_MEDIA,
      webhookUrl: webhookUrl ?? undefined,
    }
  )
}

/**
 * Helper para emitir eventos de publicación
 */
export async function emitPublishContent(
  contentId: string,
  channel: string,
  socialAccountId: string
): Promise<EmitEventResult> {
  const webhookUrl = getWebhookUrlForEvent(EventType.PUBLISH_CONTENT)
  
  return emitEvent(
    EventType.PUBLISH_CONTENT,
    {
      contentId,
      channel,
      socialAccountId,
      callbackUrl: `${process.env.WEBHOOK_CALLBACK_BASE_URL}/publish`,
    },
    {
      createJob: true,
      jobType: JobType.PUBLISH_CONTENT,
      webhookUrl: webhookUrl ?? undefined,
    }
  )
}
