import { z } from "zod";

export const businessSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  description: z.string().default(""),
  industry: z.string().default(""),
  website: z.string().url("Debe ser una URL válida").optional().or(z.literal("")),
  brandVoice: z.object({
    tone: z.array(z.string()).default([]),
    personality: z.array(z.string()).default([]),
    values: z.array(z.string()).default([]),
  }).default({
    tone: [],
    personality: [],
    values: [],
  }),
  targetAudience: z.object({
    demographics: z.string().default(""),
    psychographics: z.string().default(""),
  }).default({
    demographics: "",
    psychographics: "",
  }),
  phoneNumbers: z.string().optional().default(""),
  location: z.string().optional().default(""),
  socialLinks: z.object({
    facebook: z.string().url("URL inválida").optional().or(z.literal("")),
    instagram: z.string().url("URL inválida").optional().or(z.literal("")),
    tiktok: z.string().url("URL inválida").optional().or(z.literal("")),
  }).default({
    facebook: "",
    instagram: "",
    tiktok: "",
  }),
});

export type BusinessFormValues = z.infer<typeof businessSchema>;
