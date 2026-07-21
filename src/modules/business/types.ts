/**
 * Módulo Business - Tipos
 * 
 * Tipos TypeScript para el módulo de gestión de negocios
 */

import { Business, Prisma } from '@prisma/client'

// Tipos para Brand Voice
export interface BrandVoice {
  tone: string[]           // ["profesional", "cercano", "innovador"]
  personality: string[]    // ["confiable", "experto", "amigable"]
  values: string[]         // ["calidad", "innovación", "servicio"]
  doNotUse: string[]       // palabras/frases a evitar
  examples: {
    good: string[]         // ejemplos de buen copy
    bad: string[]          // ejemplos de mal copy
  }
}

// Tipos para Brand Colors
export interface BrandColors {
  primary: string          // #RRGGBB
  secondary: string
  accent: string
  background: string
  text: string
  success: string
  warning: string
  error: string
}

// Tipos para tipografía
export interface BrandFonts {
  heading: string
  body: string
  accent?: string
}

// Tipos para audiencia objetivo
export interface TargetAudience {
  demographics: {
    ageRange: [number, number]
    gender: 'all' | 'male' | 'female' | 'other'
    location: string[]
    language: string[]
    income?: string
    education?: string
  }
  psychographics: {
    interests: string[]
    values: string[]
    lifestyle: string[]
    painPoints: string[]
    goals: string[]
  }
  behavior: {
    platforms: string[]
    contentPreferences: string[]
    purchaseBehavior: string[]
    activeHours?: string[]
  }
}

// Redes Sociales
export interface SocialLinks {
  facebook?: string
  instagram?: string
  tiktok?: string
}

// Configuración del negocio
export interface BusinessSettings {
  timezone: string
  currency: string
  defaultLanguage: string
  notifications: {
    email: boolean
    webhook: boolean
  }
  publishing: {
    requireApproval: boolean
    autoSchedule: boolean
  }
}



// DTOs para crear/actualizar
export interface CreateBusinessInput {
  name: string
  slug?: string
  description?: string
  industry?: string
  website?: string
  logo?: string
  brandVoice?: BrandVoice
  brandColors?: BrandColors
  brandFonts?: BrandFonts
  targetAudience?: TargetAudience
  settings?: BusinessSettings
  phoneNumbers?: string
  location?: string
  socialLinks?: SocialLinks
  onboardingStrategy?: Record<string, string | undefined>
  userId?: string
}

export interface UpdateBusinessInput extends Partial<CreateBusinessInput> {}

// Business con tipos fuertes para JSON
export interface BusinessWithTypes extends Omit<Business, 'brandVoice' | 'brandColors' | 'brandFonts' | 'targetAudience' | 'settings' | 'socialLinks'> {
  brandVoice: BrandVoice | null
  brandColors: BrandColors | null
  brandFonts: BrandFonts | null
  targetAudience: TargetAudience | null
  settings: BusinessSettings | null
  socialLinks: SocialLinks | null
}

// Para queries con relaciones
export type BusinessWithRelations = Prisma.BusinessGetPayload<{
  include: {
    strategies: true
    products: true
    campaigns: true
    socialAccounts: true
  }
}>
