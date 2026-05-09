"use server"

import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import {
  AverageTicket,
  BrandLanguageLevel,
  BrandTone,
  CoverageArea,
  PurchaseFrequency,
  TargetGender,
  VisualStyle,
} from "@prisma/client"

const baseConfigSchema = z.object({
  years_in_market: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  coverage_area: z.enum(["local", "nacional", "internacional"]).nullable().optional(),
  brand_tone: z
    .enum([
      "formal",
      "juvenil",
      "profesional",
      "premium",
      "divertido",
      "cercano",
      "motivador",
      "serio",
      "emocional",
      "informal",
    ])
    .nullable()
    .optional(),
  brand_personality: z.string().nullable().optional(),
  brand_language_level: z.enum(["simple", "medio", "avanzado"]).nullable().optional(),
  allowed_emojis: z.union([z.literal("on"), z.literal("off"), z.string()]).optional(),
  forbidden_words: z.string().nullable().optional(),
  target_audience_all_ages: z.union([z.literal("on"), z.literal("off"), z.boolean()]).optional(),
  target_audience_age_ranges: z.string().nullable().optional(),
  target_gender: z.enum(["hombre", "mujer", "mixto"]).nullable().optional(),
  main_pain_point: z.string().nullable().optional(),
  main_desire: z.string().nullable().optional(),
  main_objection: z.string().nullable().optional(),
  buying_motivation: z.string().nullable().optional(),
  main_products: z.string().nullable().optional(),
  average_ticket: z.enum(["bajo", "medio", "alto"]).nullable().optional(),
  purchase_frequency: z.enum(["ocasional", "recurrente"]).nullable().optional(),
  active_channels: z.string().nullable().optional(),
  visual_style: z.enum(["minimalista", "moderno", "elegante", "colorido", "oscuro"]).nullable().optional(),
  brand_colors: z.string().nullable().optional(),
  competitors: z.string().nullable().optional(),
})

function mapCoverageArea(value: string | undefined | null): CoverageArea {
  if (!value) return CoverageArea.LOCAL
  switch (value) {
    case "local":
      return CoverageArea.LOCAL
    case "nacional":
      return CoverageArea.NACIONAL
    case "internacional":
      return CoverageArea.INTERNACIONAL
    default:
      return CoverageArea.LOCAL
  }
}

function mapBrandTone(value: string | undefined | null): BrandTone {
  const upper = (value || "profesional").toUpperCase()
  return (BrandTone as any)[upper] ?? BrandTone.PROFESIONAL
}

function mapBrandLanguageLevel(value: string | undefined | null): BrandLanguageLevel {
  const upper = (value || "medio").toUpperCase()
  return (BrandLanguageLevel as any)[upper] ?? BrandLanguageLevel.MEDIO
}

function mapTargetGender(value: string | undefined | null): TargetGender {
  const upper = (value || "mixto").toUpperCase()
  return (TargetGender as any)[upper] ?? TargetGender.MIXTO
}

function mapAverageTicket(value: string | undefined | null): AverageTicket {
  const upper = (value || "medio").toUpperCase()
  return (AverageTicket as any)[upper] ?? AverageTicket.MEDIO
}

function mapPurchaseFrequency(value: string | undefined | null): PurchaseFrequency {
  const upper = (value || "recurrente").toUpperCase()
  return (PurchaseFrequency as any)[upper] ?? PurchaseFrequency.RECURRENTE
}

function mapVisualStyle(value: string | undefined | null): VisualStyle {
  const upper = (value || "moderno").toUpperCase()
  return (VisualStyle as any)[upper] ?? VisualStyle.MODERNO
}

export async function saveBusinessBaseConfig(formData: FormData): Promise<{ success?: boolean; error?: string }> {
  const cookieStore = await cookies()
  const businessId = cookieStore.get("activeBusinessId")?.value
  if (!businessId) {
    return { error: "No active business selected" }
  }

  const getNullableString = (key: string) => {
    const raw = formData.get(key)
    if (raw === null || raw === undefined) return undefined
    const value = String(raw).trim()
    return value === "" ? null : value
  }

  const getNullableEnumValue = (key: string) => {
    const raw = formData.get(key)
    if (raw === null || raw === undefined) return undefined
    const value = String(raw).trim()
    return value === "" ? null : value
  }

  const preferHidden = (hiddenKey: string, key: string) => {
    const hidden = getNullableString(hiddenKey)
    if (hidden !== undefined) return hidden
    return getNullableString(key)
  }

  const data = {
    years_in_market: getNullableString("years_in_market"),
    country: getNullableString("country"),
    city: getNullableString("city"),
    coverage_area: getNullableEnumValue("coverage_area"),
    brand_tone: getNullableEnumValue("brand_tone"),
    brand_personality: preferHidden("brand_personality_hidden", "brand_personality"),
    brand_language_level: getNullableEnumValue("brand_language_level"),
    allowed_emojis: formData.get("allowed_emojis") ? "on" : "off",
    forbidden_words: preferHidden("forbidden_words_hidden", "forbidden_words"),
    target_audience_all_ages: formData.get("target_audience_all_ages") ? "on" : "off",
    target_audience_age_ranges: getNullableString("target_audience_age_ranges"),
    target_gender: getNullableEnumValue("target_gender"),
    main_pain_point: getNullableString("main_pain_point"),
    main_desire: getNullableString("main_desire"),
    main_objection: getNullableString("main_objection"),
    buying_motivation: getNullableString("buying_motivation"),
    main_products: getNullableString("main_products"),
    average_ticket: getNullableEnumValue("average_ticket"),
    purchase_frequency: getNullableEnumValue("purchase_frequency"),
    active_channels: preferHidden("active_channels_hidden", "active_channels"),
    visual_style: getNullableEnumValue("visual_style"),
    brand_colors: preferHidden("brand_colors_hidden", "brand_colors"),
    competitors: getNullableString("competitors_hidden"),
  }

  const parsed = baseConfigSchema.safeParse(data)
  if (!parsed.success) {
    console.error("Invalid base config data", parsed.error.flatten())
    return { error: "Invalid data" }
  }

  const years = parsed.data.years_in_market ? parseInt(parsed.data.years_in_market, 10) : null
  const yearsFinal = Number.isFinite(years) ? years : null

  const dbNullableString = (value: string | null | undefined) => {
    if (value === null) return null
    if (!value) return undefined
    return value
  }

  const dbStringArray = (value: string | null | undefined): string[] => {
    if (!value) return []
    return value.split(",").map(v => v.trim()).filter(Boolean)
  }

  const dbNullableEnum = <T>(
    value: string | null | undefined,
    mapper: (v: string) => T
  ): T | null | undefined => {
    if (value === null) return null
    if (!value) return undefined
    return mapper(value)
  }

  await prisma.businessBaseConfig.upsert({
    where: { businessId },
    create: {
      business: { connect: { id: businessId } },
      yearsInMarket: yearsFinal,
      country: dbNullableString(parsed.data.country),
      city: dbNullableString(parsed.data.city),
      coverageArea: dbNullableEnum(parsed.data.coverage_area, mapCoverageArea),
      brandTone: dbNullableEnum(parsed.data.brand_tone, mapBrandTone),
      brandPersonality: dbNullableString(parsed.data.brand_personality),
      brandLanguageLevel: dbNullableEnum(parsed.data.brand_language_level, mapBrandLanguageLevel),
      allowedEmojis: parsed.data.allowed_emojis === "on",
      forbiddenWords: dbNullableString(parsed.data.forbidden_words),
      targetAudienceAllAges: parsed.data.target_audience_all_ages === "on",
      targetAudienceAgeRanges: dbStringArray(parsed.data.target_audience_age_ranges),
      targetGender: dbNullableEnum(parsed.data.target_gender, mapTargetGender),
      mainPainPoint: dbNullableString(parsed.data.main_pain_point),
      mainDesire: dbNullableString(parsed.data.main_desire),
      mainObjection: dbNullableString(parsed.data.main_objection),
      buyingMotivation: dbNullableString(parsed.data.buying_motivation),
      mainProducts: dbNullableString(parsed.data.main_products),
      averageTicket: dbNullableEnum(parsed.data.average_ticket, mapAverageTicket),
      purchaseFrequency: dbNullableEnum(parsed.data.purchase_frequency, mapPurchaseFrequency),
      activeChannels: dbNullableString(parsed.data.active_channels),
      visualStyle: dbNullableEnum(parsed.data.visual_style, mapVisualStyle),
      brandColors: dbNullableString(parsed.data.brand_colors),
      competitors: parsed.data.competitors ? JSON.parse(parsed.data.competitors) : [],
    },
    update: {
      yearsInMarket: yearsFinal,
      country: dbNullableString(parsed.data.country),
      city: dbNullableString(parsed.data.city),
      coverageArea: dbNullableEnum(parsed.data.coverage_area, mapCoverageArea),
      brandTone: dbNullableEnum(parsed.data.brand_tone, mapBrandTone),
      brandPersonality: dbNullableString(parsed.data.brand_personality),
      brandLanguageLevel: dbNullableEnum(parsed.data.brand_language_level, mapBrandLanguageLevel),
      allowedEmojis: parsed.data.allowed_emojis === "on",
      forbiddenWords: dbNullableString(parsed.data.forbidden_words),
      targetAudienceAllAges: parsed.data.target_audience_all_ages === "on",
      targetAudienceAgeRanges: dbStringArray(parsed.data.target_audience_age_ranges),
      targetGender: dbNullableEnum(parsed.data.target_gender, mapTargetGender),
      mainPainPoint: dbNullableString(parsed.data.main_pain_point),
      mainDesire: dbNullableString(parsed.data.main_desire),
      mainObjection: dbNullableString(parsed.data.main_objection),
      buyingMotivation: dbNullableString(parsed.data.buying_motivation),
      mainProducts: dbNullableString(parsed.data.main_products),
      averageTicket: dbNullableEnum(parsed.data.average_ticket, mapAverageTicket),
      purchaseFrequency: dbNullableEnum(parsed.data.purchase_frequency, mapPurchaseFrequency),
      activeChannels: dbNullableString(parsed.data.active_channels),
      visualStyle: dbNullableEnum(parsed.data.visual_style, mapVisualStyle),
      brandColors: dbNullableString(parsed.data.brand_colors),
      competitors: parsed.data.competitors ? JSON.parse(parsed.data.competitors) : [],
    },
  })

  revalidatePath("/configuracion/base")
  return { success: true }
}
