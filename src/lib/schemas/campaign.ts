import { z } from "zod";

export const campaignChannelSchema = z.object({
  platform: z.string(),
  isActive: z.boolean(),
  budget: z.coerce.number().optional(),
  targeting: z.any().optional() // JSON libre por ahora
});

export const campaignTargetingSchema = z.object({
  locations: z.array(z.string()).optional(),
  ageRange: z.tuple([z.number(), z.number()]).optional(),
  interests: z.array(z.string()).optional(),
  customAudiences: z.array(z.string()).optional(),
});

export const campaignSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  strategyId: z.string().optional(),
  description: z.string().optional(),
  objective: z.enum(["AWARENESS", "ENGAGEMENT", "TRAFFIC", "LEADS", "SALES", "RETENTION"]),
  startDate: z.date({
    required_error: "La fecha de inicio es requerida",
  }),
  endDate: z.date().optional(),
  budget: z.coerce.number().min(0).optional(),
  channels: z.array(campaignChannelSchema).default([]),
  targeting: campaignTargetingSchema.optional(),
  status: z.enum(["DRAFT", "SCHEDULED", "ACTIVE", "PAUSED", "COMPLETED", "CANCELLED"]).default("DRAFT")
});

export type CampaignFormValues = z.infer<typeof campaignSchema>;
