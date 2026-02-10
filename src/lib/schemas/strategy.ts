import { z } from "zod";

// --- Sub-schemas ---

export const smartObjectiveSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "El nombre es requerido"),
  specific: z.string().min(5, "Debe ser específico (qué)"),
  measurable: z.string().min(5, "Debe ser medible (cuánto)"),
  achievable: z.string().min(5, "Debe ser alcanzable (cómo)"),
  relevant: z.string().min(5, "Debe ser relevante (por qué)"),
  timeBound: z.string().min(5, "Debe tener un tiempo definido (cuándo)"),
  targetValue: z.coerce.number().min(0).default(0),
  currentValue: z.coerce.number().min(0).default(0),
  unit: z.string().min(1, "La unidad es requerida"),
  deadline: z.string().min(1, "La fecha límite es requerida"),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).default('PENDING'),
});

export const buyerPersonaSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "El nombre es requerido"),
  avatar: z.string().optional(),
  demographics: z.object({
    age: z.union([z.number(), z.tuple([z.number(), z.number()])]),
    gender: z.string(),
    location: z.string(),
    occupation: z.string(),
    income: z.string(),
    education: z.string(),
    familyStatus: z.string(),
  }),
  psychographics: z.object({
    personality: z.array(z.string()),
    values: z.array(z.string()),
    interests: z.array(z.string()),
    lifestyle: z.string(),
  }),
  behavior: z.object({
    platforms: z.array(z.string()),
    contentPreferences: z.array(z.string()),
    peakHours: z.array(z.string()),
    devices: z.array(z.string()),
    purchaseBehavior: z.string(),
  }),
  painPoints: z.array(z.string()),
  goals: z.array(z.string()),
  objections: z.array(z.string()),
  communication: z.object({
    tone: z.array(z.string()),
    topics: z.array(z.string()),
    triggers: z.array(z.string()),
    turnOffs: z.array(z.string()),
  }),
  quote: z.string(),
});

// Simplificaremos el esquema de persona para la creación inicial rápida
export const simplePersonaSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Nombre requerido"),
  demographics: z.string().describe("Resumen demográfico"),
  painPoints: z.string().describe("Separados por comas"),
  goals: z.string().describe("Separados por comas"),
  communication: z.object({
    tone: z.string().describe("Ej. Formal, Amistoso, Directo..."),
    topics: z.string().describe("Temas que le interesan"),
    triggers: z.string().describe("Qué le motiva a actuar"),
  }).default({
    tone: "",
    topics: "",
    triggers: "",
  }),
});


export const funnelStageSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string(),
  contentTypes: z.array(z.string()),
  channels: z.array(z.string()),
  goals: z.array(z.string()),
  kpis: z.array(z.string()),
  ctas: z.array(z.string()),
});

export const marketingChannelSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Nombre requerido"),
  type: z.enum(["SOCIAL", "EMAIL", "BLOG", "ADS", "OTHER"]),
  isActive: z.boolean().default(true),
  frequency: z.string().min(1, "Frecuencia requerida"),
  audienceSize: z.number().default(0),
});

// --- Main Schema ---

export const strategySchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  // Arrays vacíos por defecto para permitir creación incremental
  objectives: z.array(smartObjectiveSchema).default([]),
  personas: z.array(simplePersonaSchema).default([]),
  funnelStages: z.array(funnelStageSchema).default([]),
  channels: z.array(marketingChannelSchema).default([]),
});

export type StrategyFormValues = z.infer<typeof strategySchema>;
