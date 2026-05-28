"use server";

import { prisma } from "@/lib/prisma";
import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { CampaignObjective } from "@prisma/client";

// Configuración de OpenRouter para la SDK de IA
const openrouter = createOpenAI({
  apiKey: process.env.OPEN_ROUTER_KEY?.replace(/"/g, "").trim(),
  baseURL: "https://openrouter.ai/api/v1",
});

import { campaignSuggestionsListSchema } from "@/lib/schemas/campaign-suggestions";

/**
 * Server Action para generar sugerencias inteligentes de campañas usando IA
 * basada en informes propios y de competidores.
 */
export async function suggestCampaignsAction(businessId: string) {
  try {
    if (!businessId) {
      return { success: false, error: "ID de negocio no proporcionado" };
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId }
    }) as any;

    if (!business) {
      return { success: false, error: "Negocio no encontrado en el sistema" };
    }

    // Obtener la estrategia de marketing activa del negocio
    const activeStrategy = await prisma.marketingStrategy.findFirst({
      where: { businessId, isActive: true }
    });

    const strategyContext = activeStrategy 
      ? `
ESTRATEGIA DE MARKETING ACTIVA DEL NEGOCIO (Las campañas recomendadas DEBEN estar alineadas directamente con este marco estratégico):
- Nombre de la Estrategia: ${activeStrategy.name}
- Descripción: ${activeStrategy.description || "No especificada"}
- Objetivos SMART definidos: ${JSON.stringify(activeStrategy.objectives)}
- Públicos objetivo (Buyer Personas): ${JSON.stringify(activeStrategy.personas)}
- Pilares de Contenido clave: ${JSON.stringify(activeStrategy.contentPillars)}
- Canales autorizados: ${JSON.stringify(activeStrategy.channels)}
`
      : "No se ha definido una estrategia de marketing activa aún.";

    // 2. Obtener informes propios completados
    const businessReports = await prisma.analysisReport.findMany({
      where: {
        entityId: businessId,
        type: "MY_BUSINESS",
        status: "COMPLETED",
      },
      select: {
        channel: true,
        data: true,
      },
      orderBy: { completedAt: "desc" },
      take: 5
    });

    // 3. Obtener competidores y sus informes completados
    const competitors = await prisma.competitor.findMany({
      where: { businessId },
      select: {
        id: true,
        name: true,
      }
    });

    const competitorIds = competitors.map((c) => c.id);

    const competitorReports = competitorIds.length > 0 
      ? await prisma.analysisReport.findMany({
          where: {
            entityId: { in: competitorIds },
            type: "COMPETITOR",
            status: "COMPLETED"
          },
          select: {
            channel: true,
            data: true,
          },
          orderBy: { completedAt: "desc" },
          take: 5
        })
      : [];

    // 4. Preparar el contexto de la IA
    const brandVoiceStr = business.brandVoice ? JSON.stringify(business.brandVoice) : "No especificado";
    const targetAudienceStr = business.targetAudience ? JSON.stringify(business.targetAudience) : "No especificado";
    
    // Simplificar reportes para no saturar tokens
    const reportsSummary = businessReports.map(r => {
      const dataObj = typeof r.data === "string" ? JSON.parse(r.data) : r.data;
      return {
        canal: r.channel,
        resumen: dataObj?.brand_summary || dataObj?.executiveSummary || "Informe de presencia"
      };
    });

    const competitorSummary = competitorReports.map(r => {
      const dataObj = typeof r.data === "string" ? JSON.parse(r.data) : r.data;
      return {
        canal: r.channel,
        observaciones: dataObj?.competitive_observations || dataObj?.executiveSummary || "Informe competitivo"
      };
    });

    const competitorGeneralReportSummary = business.competitorGeneralReport
      ? typeof business.competitorGeneralReport === "string"
        ? JSON.parse(business.competitorGeneralReport).executiveSummary
        : (business.competitorGeneralReport as any).executiveSummary
      : "No disponible";

    // 5. Construir prompt enriquecido
    const systemPrompt = `Eres un estratega de marketing digital y director creativo experto en análisis de mercado.
Tu tarea es sugerir exactamente 3 propuestas de campañas de marketing de alto valor y rendimiento para el negocio proporcionado.
Debes basarte estrictamente en su identidad de marca, ubicación, análisis digital actual de sus redes sociales/sitio web, y los informes de sus competidores para encontrar "gaps" u oportunidades no explotadas en el mercado.
Responde estrictamente en formato JSON que cumpla con el esquema definido.`;

    const userPrompt = `
Genera 3 sugerencias de campañas de marketing personalizadas para el siguiente negocio:

DATOS GENERALES:
- Nombre: ${business.name}
- Industria: ${business.industry || "Servicios"}
- Descripción: ${business.description || "No especificada"}
- Ubicación: ${business.location || "No especificada"}
- Identidad de marca (Voz/Valores): ${brandVoiceStr}
- Audiencia Objetivo base: ${targetAudienceStr}

ESTRATEGIA DE MARKETING DEL NEGOCIO:
${strategyContext}

INFORMES DE RENDIMIENTO DE NUESTRO NEGOCIO:
${JSON.stringify(reportsSummary, null, 2)}

INFORMES Y RESUMEN GENERAL DE NUESTROS COMPETIDORES:
- Informe de competencia consolidado: ${competitorGeneralReportSummary}
- Observaciones detalladas de canales de competidores:
${JSON.stringify(competitorSummary, null, 2)}

IMPORTANTE: Si el negocio tiene una estrategia de marketing activa definida arriba, las campañas sugeridas DEBEN estar alineadas directamente con ella:
1. Deben estar enfocadas en lograr alguno de los Objetivos SMART definidos (indica cómo ayuda a lograrlo).
2. Deben dirigirse a alguna de las Buyer Personas definidas.
3. Deben utilizar preferiblemente los canales y pilares de contenido definidos en la estrategia.

ESTRATEGIA DE CADA PROPUESTA DE CAMPAÑA:
1. "name": Un nombre creativo y comercial de la campaña (ej. "Dulce Tradición Navideña", "Revolución Fit en Santa Cruz").
2. "description": Explicación muy detallada (2-3 oraciones) de la campaña: el gancho comercial, el mensaje central y cómo se diferencia de los competidores.
3. "objective": El objetivo técnico de campaña (debe ser estrictamente uno de: AWARENESS, ENGAGEMENT, TRAFFIC, LEADS, SALES o RETENTION).
4. "durationDays": Días sugeridos para la campaña (por ejemplo, 15, 30, 45, 60 días).
5. "budget": Presupuesto total recomendado en USD. Debe ser realista para una pyme (entre $100 y $1500 USD).
6. "channels": Lista de canales de distribución de contenido recomendados. Cada canal debe tener:
   - "platform": FACEBOOK, INSTAGRAM, TIKTOK o WEBSITE.
   - "isActive": true.
   - "budget": Presupuesto parcial del canal (la suma de presupuestos debe coincidir con el total).
   - "targeting": Objeto con sugerencias técnicas breves.
7. "targeting": Configuración de segmentación general recomendada:
   - "locations": Lugares geográficos recomendados (ej. ["Santa Cruz, Bolivia"]).
   - "ageRange": Rango de edad sugerido (ej. [20, 45]).
   - "interests": Intereses clave de segmentación que diferencien al negocio de su competencia (ej. ["Pastelería Artesanal", "Celebraciones", "Regalos Gourmet"]).

Por favor, genera exactamente 3 propuestas bien diferenciadas (ej. una orientada a engagement/comunidad, otra a ventas de producto/conversión y otra a branding/reconocimiento local).`;

    // 6. Ejecutar la llamada a Gemini
    const { object } = await generateObject({
      model: openrouter("google/gemini-2.0-flash-001"),
      schema: campaignSuggestionsListSchema,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.75,
      maxOutputTokens: 3000,
    });

    return {
      success: true,
      campaigns: object.campaigns,
      activeStrategyId: activeStrategy?.id
    };
  } catch (error) {
    console.error("Error generating campaign suggestions:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido al generar las sugerencias con IA"
    };
  }
}
