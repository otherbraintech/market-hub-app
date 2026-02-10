/**
 * Procesador de Jobs
 * 
 * Maneja el ciclo de vida de los Jobs:
 * - Actualización de estados
 * - Manejo de resultados
 * - Reintentos
 * - Auditoría
 */

import { prisma } from '@/lib/prisma'
import { JobStatus, EventType, Prisma } from '@prisma/client'
import { emitEvent } from './event-emitter'

export interface JobResult {
  success: boolean
  data?: unknown
  error?: string
}

export interface JobUpdateData {
  status?: JobStatus
  result?: unknown
  error?: string
}

/**
 * Obtiene un Job por ID con sus eventos
 */
export async function getJob(jobId: string) {
  return prisma.job.findUnique({
    where: { id: jobId },
    include: {
      events: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  })
}

/**
 * Obtiene Jobs pendientes o en cola
 */
export async function getPendingJobs(limit = 10) {
  return prisma.job.findMany({
    where: {
      status: {
        in: [JobStatus.PENDING, JobStatus.QUEUED],
      },
      OR: [
        { scheduledAt: null },
        { scheduledAt: { lte: new Date() } },
      ],
    },
    orderBy: [
      { priority: 'desc' },
      { createdAt: 'asc' },
    ],
    take: limit,
  })
}

/**
 * Marca un Job como iniciado
 */
export async function startJob(jobId: string) {
  const job = await prisma.job.update({
    where: { id: jobId },
    data: {
      status: JobStatus.PROCESSING,
      startedAt: new Date(),
    },
  })

  // Emitir evento de inicio
  await emitEvent(EventType.JOB_STARTED, {
    jobId,
    type: job.type,
    startedAt: job.startedAt,
  })

  return job
}

/**
 * Marca un Job como completado exitosamente
 */
export async function completeJob(jobId: string, result: unknown) {
  const job = await prisma.job.update({
    where: { id: jobId },
    data: {
      status: JobStatus.SUCCESS,
      result: result as Prisma.JsonObject,
      completedAt: new Date(),
    },
  })

  // Emitir evento de completado
  await emitEvent(EventType.JOB_COMPLETED, {
    jobId,
    type: job.type,
    completedAt: job.completedAt,
    hasResult: result !== null,
  })

  // Registrar en auditoría
  await prisma.auditLog.create({
    data: {
      entityType: 'Job',
      entityId: jobId,
      action: 'COMPLETED',
      changes: { status: JobStatus.SUCCESS },
      jobId,
    },
  })

  return job
}

/**
 * Marca un Job como fallido
 */
export async function failJob(jobId: string, error: string) {
  const currentJob = await prisma.job.findUnique({
    where: { id: jobId },
  })

  if (!currentJob) {
    throw new Error(`Job ${jobId} not found`)
  }

  const shouldRetry = currentJob.retries < currentJob.maxRetries

  const job = await prisma.job.update({
    where: { id: jobId },
    data: {
      status: shouldRetry ? JobStatus.PENDING : JobStatus.FAILED,
      error,
      retries: { increment: 1 },
      completedAt: shouldRetry ? null : new Date(),
    },
  })

  // Emitir evento de fallo
  await emitEvent(EventType.JOB_FAILED, {
    jobId,
    type: job.type,
    error,
    retries: job.retries,
    willRetry: shouldRetry,
  })

  // Registrar en auditoría
  await prisma.auditLog.create({
    data: {
      entityType: 'Job',
      entityId: jobId,
      action: shouldRetry ? 'RETRY_SCHEDULED' : 'FAILED',
      changes: { error, retries: job.retries },
      jobId,
    },
  })

  return job
}

/**
 * Cancela un Job
 */
export async function cancelJob(jobId: string, reason?: string) {
  const job = await prisma.job.update({
    where: { id: jobId },
    data: {
      status: JobStatus.CANCELLED,
      error: reason ?? 'Cancelled by user',
      completedAt: new Date(),
    },
  })

  await prisma.auditLog.create({
    data: {
      entityType: 'Job',
      entityId: jobId,
      action: 'CANCELLED',
      changes: { reason },
      jobId,
    },
  })

  return job
}

/**
 * Procesa el callback de un webhook externo
 */
export async function processWebhookCallback(
  jobId: string,
  result: JobResult
): Promise<void> {
  if (result.success) {
    await completeJob(jobId, result.data)
  } else {
    await failJob(jobId, result.error ?? 'Unknown error from webhook')
  }
}

/**
 * Obtiene estadísticas de Jobs
 */
export async function getJobStats() {
  const [pending, processing, success, failed] = await Promise.all([
    prisma.job.count({ where: { status: JobStatus.PENDING } }),
    prisma.job.count({ where: { status: JobStatus.PROCESSING } }),
    prisma.job.count({ where: { status: JobStatus.SUCCESS } }),
    prisma.job.count({ where: { status: JobStatus.FAILED } }),
  ])

  return {
    pending,
    processing,
    success,
    failed,
    total: pending + processing + success + failed,
  }
}

/**
 * Limpia Jobs antiguos completados
 */
export async function cleanupOldJobs(olderThanDays = 30) {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

  const result = await prisma.job.deleteMany({
    where: {
      status: { in: [JobStatus.SUCCESS, JobStatus.CANCELLED] },
      completedAt: { lt: cutoffDate },
    },
  })

  return result.count
}
