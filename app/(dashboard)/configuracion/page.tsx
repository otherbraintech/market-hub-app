// forcing recompile
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { BaseConfigFormWrapper } from "./BaseConfigFormWrapper"
import { type BaseConfigFormState } from "./BaseConfigForm"

export default async function ConfiguracionBasePage() {
  const cookieStore = await cookies()
  const businessId = cookieStore.get("activeBusinessId")?.value


  if (!businessId) {
    const empty: BaseConfigFormState = {
      years_in_market: "",
      country: "",
      city: "",
      coverage_area: "",
      brand_tone: "",
      brand_personality: "",
      brand_language_level: "",
      allowed_emojis: true,
      forbidden_words: "",
      target_audience_all_ages: false,
      target_audience_age_ranges: "",
      target_gender: "",

      main_pain_point: "",
      main_desire: "",
      main_objection: "",
      buying_motivation: "",
      main_products: "",
      average_ticket: "",
      purchase_frequency: "",
      active_channels: "",
      visual_style: "",
      brand_colors: "",
      competitors: [],
    }
    return <BaseConfigFormWrapper key="empty" initialForm={empty} />
  }

  const config = await prisma.businessBaseConfig.findUnique({
    where: { businessId },
  })

  const initial: BaseConfigFormState = {
    years_in_market: config?.yearsInMarket?.toString() ?? "",
    country: config?.country ?? "",
    city: config?.city ?? "",
    coverage_area: (config?.coverageArea?.toLowerCase() as BaseConfigFormState["coverage_area"]) ?? "",
    brand_tone: (config?.brandTone?.toLowerCase() as BaseConfigFormState["brand_tone"]) ?? "",
    brand_personality: config?.brandPersonality ?? "",
    brand_language_level:
      (config?.brandLanguageLevel?.toLowerCase() as BaseConfigFormState["brand_language_level"]) ?? "",
    allowed_emojis: config?.allowedEmojis ?? true,
    forbidden_words: config?.forbiddenWords ?? "",
    target_audience_all_ages: config?.targetAudienceAllAges ?? false,
    target_audience_age_ranges: config?.targetAudienceAgeRanges?.join(", ") ?? "",
    target_gender: (config?.targetGender?.toLowerCase() as BaseConfigFormState["target_gender"]) ?? "",

    main_pain_point: config?.mainPainPoint ?? "",
    main_desire: config?.mainDesire ?? "",
    main_objection: config?.mainObjection ?? "",
    buying_motivation: config?.buyingMotivation ?? "",
    main_products: config?.mainProducts ?? "",
    average_ticket: (config?.averageTicket?.toLowerCase() as BaseConfigFormState["average_ticket"]) ?? "",
    purchase_frequency:
      (config?.purchaseFrequency?.toLowerCase() as BaseConfigFormState["purchase_frequency"]) ?? "",
    active_channels: config?.activeChannels ?? "",
    visual_style: (config?.visualStyle?.toLowerCase() as BaseConfigFormState["visual_style"]) ?? "",
    brand_colors: config?.brandColors ?? "",
    competitors: config?.competitors ?? [],
  }

  return <BaseConfigFormWrapper key={businessId} initialForm={initial} />
}