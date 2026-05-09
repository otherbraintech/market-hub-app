import { z } from "zod"

// ENUMS ESTRATÉGICOS NUEVOS
export const ContentStrategy = {
  PROBLEM_SOLUTION: "PROBLEM_SOLUTION",
  SOCIAL_PROOF: "SOCIAL_PROOF", 
  EDUCATIONAL: "EDUCATIONAL",
  BEHIND_SCENES: "BEHIND_SCENES",
  ENTERTAINMENT: "ENTERTAINMENT",
  URGENCY_SCARCITY: "URGENCY_SCARCITY",
} as const

export type ContentStrategy = keyof typeof ContentStrategy

export const EmotionalTone = {
  INSPIRATIONAL: "INSPIRATIONAL",
  URGENT: "URGENT",
  EDUCATIONAL: "EDUCATIONAL",
  PLAYFUL: "PLAYFUL",
  AUTHORITATIVE: "AUTHORITATIVE",
  EMPATHETIC: "EMPATHETIC",
} as const

export type EmotionalTone = keyof typeof EmotionalTone

export const ContentPillar = {
  QUALITY: "QUALITY",
  INNOVATION: "INNOVATION", 
  SUSTAINABILITY: "SUSTAINABILITY",
  COMMUNITY: "COMMUNITY",
  EDUCATION: "EDUCATION",
  PROMOTION: "PROMOTION",
  STORYTELLING: "STORYTELLING",
} as const

export type ContentPillar = keyof typeof ContentPillar

// ENUMS EXISTENTES (mantenidos)
export const PlanningObjective = {
  AUMENTAR_VENTAS: "AUMENTAR_VENTAS",
  GENERAR_AWARENESS: "GENERAR_AWARENESS",
  LANZAMIENTO_PRODUCTO: "LANZAMIENTO_PRODUCTO",
  FIDELIZACION_COMUNIDAD: "FIDELIZACION_COMUNIDAD",
  TRAFICO_WEB: "TRAFICO_WEB",
  EDUCACION_TUTORIALES: "EDUCACION_TUTORIALES",
  OTRO: "OTRO",
} as const

export type PlanningObjective = keyof typeof PlanningObjective

export const AssetSource = {
  CLIENT_PROVIDED: "CLIENT_PROVIDED",
  AI_GENERATED: "AI_GENERATED",
  MIXED: "MIXED",
} as const

export type AssetSource = keyof typeof AssetSource

export const ChannelFormat = {
  VIDEO: "VIDEO",
  STATIC: "STATIC",
  CAROUSEL: "CAROUSEL",
  STORY: "STORY",
} as const

export type ChannelFormat = keyof typeof ChannelFormat

// SCHEMAS
export const channelRuleSchema = z.object({
  formats: z.array(z.nativeEnum(ChannelFormat)).default([]),
})

export type ChannelRule = z.infer<typeof channelRuleSchema>

// SCHEMA PRINCIPAL MEJORADO (manteniendo compatibilidad)
export const planningOrderSchema = z.object({
  // Campos existentes (mantenidos para compatibilidad)
  name: z.string().min(1, "El nombre de la orden es obligatorio"),
  dateRange: z.object({
    from: z.date(),
    to: z.date(),
  }).optional(),
  excludedDates: z.array(z.date()).default([]),
  objective: z.nativeEnum(PlanningObjective),
  priorityProductIds: z.array(z.string()).default([]),
  additionalFocus: z.string().optional(),
  references: z.string().optional(),
  frequencyBase: z.number().min(0),
  channelRules: z.record(z.string(), channelRuleSchema),
  assetSource: z.nativeEnum(AssetSource),
  productionNotes: z.string().optional(),
  
  // Campos nuevos estratégicos (con valores por defecto)
  contentStrategy: z.nativeEnum(ContentStrategy).default(ContentStrategy.PROBLEM_SOLUTION),
  contentPillars: z.array(z.nativeEnum(ContentPillar)).default([ContentPillar.QUALITY]),
  emotionalTone: z.nativeEnum(EmotionalTone).default(EmotionalTone.INSPIRATIONAL),
  customObjective: z.string().optional(),
  campaignAudience: z.string().optional(),
  callToAction: z.string().optional(),
  keywords: z.array(z.string()).default([]),
  visualStyleOverride: z.string().optional(),
  offerDetail: z.string().optional(),
  primaryChannel: z.string().optional(),
  focusOnBuyerPains: z.boolean().default(true),
  
  // Nota: channelRules se mantiene pero puede estar vacío (la IA decide)
})

export type PlanningOrderInput = z.infer<typeof planningOrderSchema>

// SCHEMA PARA EL INPUT ENRICHED QUE VA A LA IA
export const enrichedPlanningSchema = planningOrderSchema.extend({
  // Campos que se añaden automáticamente desde el sistema
  businessConfig: z.object({
    id: z.string(),
    name: z.string(),
    tone: z.string(),
    channels: z.array(z.string()),
    buyerPersona: z.object({
      ageRange: z.string(),
      pains: z.array(z.string()),
      desires: z.array(z.string()),
      objections: z.array(z.string()).optional(),
    }),
    visualStyle: z.string().optional(),
    brandColors: z.array(z.string()).optional(),
    prohibitedWords: z.array(z.string()).optional(),
    competitors: z.string().optional(),
  }).optional(),
})

export type EnrichedPlanningInput = z.infer<typeof enrichedPlanningSchema>