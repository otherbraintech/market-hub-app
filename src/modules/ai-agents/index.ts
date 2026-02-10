/**
 * Módulo AI Agents - Contratos y Esquemas para Agentes IA
 */

import { z } from 'zod'

// ===================================
// Schemas de Validación con Zod
// ===================================

// Schema para una idea de contenido
export const ContentIdeaSchema = z.object({
  id: z.string(),
  title: z.string().min(5),
  type: z.enum(['POST', 'CAROUSEL', 'REEL', 'STORY', 'VIDEO', 'ARTICLE', 'EMAIL', 'AD', 'TWEET', 'THREAD']),
  channel: z.string(),
  funnelStage: z.string(),
  contentPillar: z.string(),
  persona: z.string(),
  hook: z.string().min(5),
  outline: z.array(z.string()).min(1),
  suggestedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  hashtags: z.array(z.string()).optional(),
  reasoning: z.string().min(10),
})

// Schema para respuesta de generación de ideas
export const GenerateIdeasResponseSchema = z.object({
  ideas: z.array(ContentIdeaSchema).min(1),
  metadata: z.object({
    model: z.string().optional(),
    tokensUsed: z.number().optional(),
    generatedAt: z.string().optional(),
  }).optional(),
})

// Schema para copy
export const CopySchema = z.object({
  mainCaption: z.string().min(10),
  slides: z.array(z.object({
    number: z.number(),
    text: z.string(),
  })).optional(),
  cta: z.string().optional(),
  hashtags: z.array(z.string()).optional(),
})

// Schema para respuesta de generación de copy
export const GenerateCopyResponseSchema = z.object({
  copy: CopySchema,
  variations: z.array(z.object({
    type: z.string(),
    text: z.string(),
  })).optional(),
  metadata: z.object({
    model: z.string().optional(),
    tokensUsed: z.number().optional(),
    language: z.string().optional(),
  }).optional(),
})

// Schema para media generado
export const MediaSchema = z.object({
  url: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  mimeType: z.string().optional(),
  size: z.number().optional(),
})

// Schema para respuesta de generación de media
export const GenerateMediaResponseSchema = z.object({
  media: MediaSchema,
  prompt: z.string().optional(),
  metadata: z.object({
    model: z.string().optional(),
    generatedAt: z.string().optional(),
  }).optional(),
})

// Schema para respuesta de publicación
export const PublishResponseSchema = z.object({
  externalId: z.string(),
  externalUrl: z.string().url().optional(),
  publishedAt: z.string(),
})

// Schema para métricas
export const MetricsSchema = z.object({
  impressions: z.number().optional(),
  reach: z.number().optional(),
  engagement: z.number().optional(),
  engagementRate: z.number().optional(),
  likes: z.number().optional(),
  comments: z.number().optional(),
  shares: z.number().optional(),
  saves: z.number().optional(),
  clicks: z.number().optional(),
})

// Schema para respuesta de métricas
export const FetchMetricsResponseSchema = z.object({
  metrics: MetricsSchema,
  fetchedAt: z.string(),
})

// ===================================
// Tipos derivados de los schemas
// ===================================

export type ContentIdea = z.infer<typeof ContentIdeaSchema>
export type GenerateIdeasResponse = z.infer<typeof GenerateIdeasResponseSchema>
export type Copy = z.infer<typeof CopySchema>
export type GenerateCopyResponse = z.infer<typeof GenerateCopyResponseSchema>
export type Media = z.infer<typeof MediaSchema>
export type GenerateMediaResponse = z.infer<typeof GenerateMediaResponseSchema>
export type PublishResponse = z.infer<typeof PublishResponseSchema>
export type ContentMetrics = z.infer<typeof MetricsSchema>
export type FetchMetricsResponse = z.infer<typeof FetchMetricsResponseSchema>

// ===================================
// Funciones de Validación
// ===================================

export function validateIdeasResponse(data: unknown) {
  return GenerateIdeasResponseSchema.safeParse(data)
}

export function validateCopyResponse(data: unknown) {
  return GenerateCopyResponseSchema.safeParse(data)
}

export function validateMediaResponse(data: unknown) {
  return GenerateMediaResponseSchema.safeParse(data)
}

export function validatePublishResponse(data: unknown) {
  return PublishResponseSchema.safeParse(data)
}

export function validateMetricsResponse(data: unknown) {
  return FetchMetricsResponseSchema.safeParse(data)
}

// ===================================
// Error Codes
// ===================================

export const AI_AGENT_ERROR_CODES = {
  INVALID_PAYLOAD: 'INVALID_PAYLOAD',
  UNAUTHORIZED: 'UNAUTHORIZED',
  INSUFFICIENT_CONTEXT: 'INSUFFICIENT_CONTEXT',
  GENERATION_FAILED: 'GENERATION_FAILED',
  RATE_LIMITED: 'RATE_LIMITED',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  TIMEOUT: 'TIMEOUT',
  PUBLISH_FAILED: 'PUBLISH_FAILED',
  ACCOUNT_DISCONNECTED: 'ACCOUNT_DISCONNECTED',
} as const

export type AIAgentErrorCode = typeof AI_AGENT_ERROR_CODES[keyof typeof AI_AGENT_ERROR_CODES]

// ===================================
// Tipos de Callback
// ===================================

export interface AIAgentCallback<T> {
  jobId: string
  success: boolean
  data?: T
  error?: {
    code: AIAgentErrorCode
    message: string
    details?: string
    recoverable: boolean
  }
}

export type IdeasCallback = AIAgentCallback<GenerateIdeasResponse>
export type CopyCallback = AIAgentCallback<GenerateCopyResponse>
export type MediaCallback = AIAgentCallback<GenerateMediaResponse>
export type PublishCallback = AIAgentCallback<PublishResponse>
export type MetricsCallback = AIAgentCallback<FetchMetricsResponse>
