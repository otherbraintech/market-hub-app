import { z } from "zod";

// Esqueleto de tipado de campaña sugerida
export const campaignSuggestionSchema = z.object({
  name: z.string().min(2, "El nombre de la campaña debe ser descriptivo"),
  description: z.string().min(10, "La descripción estratégica debe ser detallada"),
  objective: z.enum(["AWARENESS", "ENGAGEMENT", "TRAFFIC", "LEADS", "SALES", "RETENTION"]),
  durationDays: z.number().describe("Duración sugerida de la campaña en días"),
  budget: z.number().describe("Presupuesto estimado total en USD"),
  channels: z.array(
    z.object({
      platform: z.string().describe("Plataforma: FACEBOOK, INSTAGRAM, TIKTOK o WEBSITE"),
      isActive: z.boolean(),
      budget: z.number().optional().describe("Presupuesto asignado a esta plataforma"),
      targeting: z.any().optional().describe("Segmentación técnica recomendada para la plataforma")
    })
  ).min(1, "Debe recomendarse al menos un canal activo"),
  targeting: z.object({
    locations: z.array(z.string()).optional().describe("Ubicaciones geográficas"),
    ageRange: z.tuple([z.number(), z.number()]).optional().describe("Rango de edad sugerido [mínimo, máximo]"),
    interests: z.array(z.string()).optional().describe("Intereses de segmentación recomendados"),
    customAudiences: z.array(z.string()).optional().describe("Públicos personalizados sugeridos")
  }).optional()
});

export const campaignSuggestionsListSchema = z.object({
  campaigns: z.array(campaignSuggestionSchema).length(3, "Debe generar exactamente 3 propuestas estratégicas de campañas")
});

export type CampaignSuggestion = z.infer<typeof campaignSuggestionSchema>;
