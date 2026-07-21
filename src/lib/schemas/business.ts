import { z } from "zod";

import { sanitizeSocialUrl } from "../url";

const normalizeUrl = (val: unknown) => {
  if (typeof val !== "string" || val.trim() === "") return "";
  return sanitizeSocialUrl(val);
};

const normalizeSocialLink = (platform: "facebook" | "instagram" | "tiktok") => (val: unknown) => {
  if (typeof val !== "string" || val.trim() === "") return "";
  const v = val.trim();
  if (!/^https?:\/\//i.test(v)) {
    if (v.includes(".") || v.includes("/")) {
      return sanitizeSocialUrl(v);
    }
    // Convert handles/usernames to urls
    if (platform === "tiktok") {
      return `https://tiktok.com/@${v.replace(/^@/, "")}`;
    }
    return `https://${platform}.com/${v.replace(/^@/, "")}`;
  }
  return sanitizeSocialUrl(v);
};

export const businessSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  description: z.string().default(""),
  industry: z.string().default(""),
  website: z.preprocess(normalizeUrl, z.string().url("Debe ser una URL válida").optional().or(z.literal(""))),
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
    facebook: z.preprocess(normalizeSocialLink("facebook"), z.string().url("URL de Facebook inválida").optional().or(z.literal(""))),
    instagram: z.preprocess(normalizeSocialLink("instagram"), z.string().url("URL de Instagram inválida").optional().or(z.literal(""))),
    tiktok: z.preprocess(normalizeSocialLink("tiktok"), z.string().url("URL de TikTok inválida").optional().or(z.literal(""))),
  }).default({
    facebook: "",
    instagram: "",
    tiktok: "",
  }),
  onboardingStrategy: z.object({
    locationAge: z.string().default(""),
    lifeEvent: z.string().default(""),
    archetype: z.string().default(""),
    conversionChannel: z.string().default(""),
    informationGaps: z.string().default(""),
    socialProof: z.string().default(""),
    differentialAdvantage: z.string().default(""),
  }).default({
    locationAge: "",
    lifeEvent: "",
    archetype: "",
    conversionChannel: "",
    informationGaps: "",
    socialProof: "",
    differentialAdvantage: "",
  }).optional(),
});

export type BusinessFormValues = z.infer<typeof businessSchema>;
