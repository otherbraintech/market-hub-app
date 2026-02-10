/**
 * Módulo Marketing Strategy - Tipos
 * 
 * Tipos para estrategias de marketing, personas y funnels
 */

import { MarketingStrategy, Prisma } from '@prisma/client'

// Objetivo SMART
export interface SmartObjective {
  id: string
  name: string
  specific: string       // ¿Qué queremos lograr?
  measurable: string     // ¿Cómo mediremos el éxito?
  achievable: string     // ¿Es realista?
  relevant: string       // ¿Por qué es importante?
  timeBound: string      // ¿Cuándo lo lograremos?
  targetValue: number    // Valor objetivo
  currentValue: number   // Valor actual
  unit: string           // ej: "seguidores", "leads", "ventas"
  deadline: string       // fecha límite
}

// Buyer Persona
export interface BuyerPersona {
  id: string
  name: string            // "María Emprendedora"
  avatar?: string         // URL de imagen
  
  // Demografía
  demographics: {
    age: number | [number, number]
    gender: string
    location: string
    occupation: string
    income: string
    education: string
    familyStatus: string
  }
  
  // Psicografía
  psychographics: {
    personality: string[]       // rasgos de personalidad
    values: string[]            // qué valora
    interests: string[]         // hobbies, intereses
    lifestyle: string           // descripción de su día a día
  }
  
  // Comportamiento
  behavior: {
    platforms: string[]         // redes sociales que usa
    contentPreferences: string[] // qué tipo de contenido consume
    peakHours: string[]         // horarios de mayor actividad
    devices: string[]           // móvil, desktop, tablet
    purchaseBehavior: string    // cómo toma decisiones de compra
  }
  
  // Pain points y goals
  painPoints: string[]          // problemas que tiene
  goals: string[]               // qué quiere lograr
  objections: string[]          // objeciones a la compra
  
  // Cómo hablarle
  communication: {
    tone: string[]              // tono preferido
    topics: string[]            // temas de interés
    triggers: string[]          // qué le motiva a actuar
    turnOffs: string[]          // qué le aleja
  }
  
  // Quote representativo
  quote: string                 // "Necesito soluciones que me ahorren tiempo"
}

// Etapa del funnel
export interface FunnelStage {
  id: string
  name: string                  // awareness, consideration, decision, retention
  description: string
  
  // Contenido para esta etapa
  contentTypes: string[]        // tipos de contenido efectivos
  channels: string[]            // canales a usar
  
  // Objetivos
  goals: string[]               // qué queremos lograr en esta etapa
  kpis: string[]                // métricas a medir
  
  // Llamados a la acción
  ctas: string[]                // CTAs efectivos para esta etapa
}

// Canal de marketing
export interface MarketingChannel {
  id: string
  platform: string              // instagram, facebook, linkedin, etc.
  isActive: boolean
  
  // Configuración
  config: {
    username?: string
    accountId?: string
    postingFrequency: string    // diario, semanal, etc.
    bestTimes: string[]         // mejores horarios
    contentMix: {               // porcentaje por tipo
      [contentType: string]: number
    }
  }
  
  // Objetivos específicos del canal
  goals: {
    followers?: number
    engagement?: number
    reach?: number
    conversions?: number
  }
}

// Pilar de contenido
export interface ContentPillar {
  id: string
  name: string                  // "Educativo", "Inspiracional", etc.
  description: string
  percentage: number            // % del contenido total
  topics: string[]              // temas específicos
  formats: string[]             // formatos preferidos
  hashtags: string[]            // hashtags asociados
}

// Calendario de publicación
export interface PostingSchedule {
  [channel: string]: {
    days: string[]              // ["monday", "wednesday", "friday"]
    times: string[]             // ["09:00", "18:00"]
    frequency: string           // "3 posts/week"
  }
}

// DTOs
export interface CreateStrategyInput {
  businessId: string
  name: string
  description?: string
  objectives: SmartObjective[]
  personas: BuyerPersona[]
  funnelStages: FunnelStage[]
  channels: MarketingChannel[]
  contentPillars?: ContentPillar[]
  postingSchedule?: PostingSchedule
  isActive?: boolean
}

export interface UpdateStrategyInput extends Partial<Omit<CreateStrategyInput, 'businessId'>> {}

// Strategy con tipos fuertes
export interface StrategyWithTypes extends Omit<MarketingStrategy, 'objectives' | 'personas' | 'funnelStages' | 'channels' | 'contentPillars' | 'postingSchedule'> {
  objectives: SmartObjective[]
  personas: BuyerPersona[]
  funnelStages: FunnelStage[]
  channels: MarketingChannel[]
  contentPillars: ContentPillar[] | null
  postingSchedule: PostingSchedule | null
}

// Con relaciones
export type StrategyWithRelations = Prisma.MarketingStrategyGetPayload<{
  include: {
    business: true
    campaigns: true
  }
}>
