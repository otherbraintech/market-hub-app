import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createOpenAI } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

const openrouter = createOpenAI({
  apiKey: process.env.OPEN_ROUTER_KEY?.replace(/"/g, '').trim(),
  baseURL: 'https://openrouter.ai/api/v1',
});

const strategyGenerationSchema = z.object({
  name: z.string(),
  description: z.string(),
  isActive: z.boolean().default(true),
  
  // 1. Resumen Ejecutivo e Identidad P2P (People-to-People / PLM)
  executiveSummaryP2P: z.object({
    philosophy: z.string().describe("Filosofía de marca People-Led Marketing (PLM)"),
    valueProposition: z.string().describe("Propuesta de Valor centrada en momentos auténticos facilitados por personas reales")
  }).optional(),

  // 2. Auditoría de Activos y Benchmarking 2026
  assetAuditBenchmarking2026: z.object({
    profileHealth: z.string().describe("Evaluación de consistencia visual, bios y enlaces inteligentes SmartLinks"),
    benchmarks2026: z.object({
      facebook: z.string().default("0.15%"),
      instagram: z.string().default("0.48%"),
      tiktok: z.string().default("2.60% - 3.73%")
    })
  }).optional(),

  // 3. Inteligencia Competitiva y Análisis de Sentimiento
  competitiveIntelligence: z.object({
    shareOfVoiceMatrix: z.string().describe("Matriz comparativa de métricas frente a 3 competidores principales"),
    socialListeningGap: z.string().describe("Análisis cualitativo del gap de percepción y fallos de la competencia")
  }).optional(),

  // 4. Buyer Personas y Oportunidad de Mercado (6 Perfiles Descriptivos)
  marketSizeOpportunity: z.string().optional().describe("Cálculo numérico del % de mercado local desatendido"),

  // 5. Diagnóstico de Gaps de Mercado (FODA Estratégico)
  strategicSwotGaps: z.object({
    ugcSocialProofGap: z.string().describe("Capitalización del gap de contenido generado por usuarios (UGC)"),
    educationalEntertainmentGap: z.string().describe("Estrategia educativa/entretenimiento en video vertical (79.6% busca entretenimiento)"),
    strengths: z.array(z.string()).default([]),
    weaknesses: z.array(z.string()).default([]),
    opportunities: z.array(z.string()).default([]),
    threats: z.array(z.string()).default([])
  }).optional(),

  // 6. Estrategia de Visibilidad de Nueva Generación (SEO + AEO)
  nextGenVisibilitySeoAeo: z.object({
    instagramFormats: z.object({
      carouselsTarget: z.string().default("Carousels para interacción (meta 10.15%)"),
      reelsTarget: z.string().default("Reels para alcance (meta 37.8%)")
    }),
    aeoOptimization: z.string().describe("Estrategia de Answer Engine Optimization para citaciones directas en ChatGPT, Gemini y Perplexity")
  }).optional(),

  // 7. Conversión y Social Customer Care (WhatsApp-Centric)
  conversionSocialCare: z.object({
    conversionEcosystem: z.string().describe("Flujo desde redes hacia catálogo digital y WhatsApp"),
    whatsappFunnel: z.string().describe("Estrategia de embudo WhatsApp-Centric"),
    agenticAiCustomerCare: z.string().describe("Implementación de IA Agéntica para resolver 50% de dudas preventa")
  }).optional(),

  // 8. Stack Tecnológico y Eficiencia Operativa
  techStackProductivity: z.object({
    weeklyTimeSavings: z.string().default("Ahorro estimado de hasta 12 horas semanales"),
    suggestedStack: z.object({
      management: z.string().default("Metricool / Agorapulse"),
      agileCreation: z.string().default("CapCut / InVideo AI"),
      listening: z.string().default("Brandwatch / Keyhole")
    })
  }).optional(),

  objectives: z.array(z.object({
    name: z.string(),
    specific: z.string(),
    measurable: z.string(),
    achievable: z.string(),
    relevant: z.string(),
    timeBound: z.string(),
    targetValue: z.number(),
    currentValue: z.number().default(0),
    unit: z.string(),
    deadline: z.string(),
    status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).default('PENDING')
  })),
  personas: z.array(z.object({
    name: z.string(),
    demographics: z.string(),
    painPoints: z.string(),
    goals: z.string(),
    communication: z.object({
      tone: z.string(),
      topics: z.string(),
      triggers: z.string()
    }).default({
      tone: "",
      topics: "",
      triggers: "",
    })
  })),
  funnelStages: z.array(z.object({
    name: z.string(),
    description: z.string(),
    contentTypes: z.array(z.string()),
    channels: z.array(z.string()),
    goals: z.array(z.string()),
    kpis: z.array(z.string()),
    ctas: z.array(z.string())
  })),
  channels: z.array(z.object({
    name: z.string(),
    type: z.enum(["SOCIAL", "EMAIL", "BLOG", "ADS", "OTHER"]),
    isActive: z.boolean().default(true),
    frequency: z.string(),
    audienceSize: z.number().default(0)
  }))
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Obtener información completa del negocio y sus competidores (Banco de Datos)
    const business = await prisma.business.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        industry: true,
        website: true,
        phoneNumbers: true,
        socialLinks: true,
        targetAudience: true,
        brandVoice: true,
        location: true,
        onboardingStrategy: true,
        competitorGeneralReport: true,
        competitors: {
          select: {
            id: true,
            name: true,
            website: true,
            facebook: true,
            instagram: true,
            tiktok: true,
          }
        }
      }
    });

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // 2. Obtener todos los reportes de análisis auditados de Mi Negocio (incluyendo CONSOLIDATED)
    const businessReports = await prisma.analysisReport.findMany({
      where: {
        type: 'MY_BUSINESS',
        entityId: business.id,
        status: 'COMPLETED'
      },
      orderBy: { completedAt: 'desc' }
    });

    // Agrupar y normalizar reportes del negocio por canal
    const businessReportsMap = new Map<string, any>();
    businessReports.forEach((report: any) => {
      const existing = businessReportsMap.get(report.channel);
      if (!existing || (report.completedAt && existing.completedAt && existing.completedAt < report.completedAt)) {
        businessReportsMap.set(report.channel, report);
      }
    });

    const consolidatedReport = businessReportsMap.get('CONSOLIDATED');
    let consolidatedDataObj = null;
    if (consolidatedReport && consolidatedReport.data) {
      try {
        consolidatedDataObj = typeof consolidatedReport.data === 'string' ? JSON.parse(consolidatedReport.data) : consolidatedReport.data;
      } catch (e) {
        console.error('Error parsing consolidated report data:', e);
      }
    }

    const body = await request.json().catch(() => ({}));
    const { selectedChannels, selectedPillars, selectedTone, name, description } = body;

    // 3. Construir el contexto unificado con el BANCO DE DATOS COMPLETO
    const context = {
      business: {
        name: business.name,
        description: business.description,
        industry: business.industry,
        website: business.website,
        phoneNumbers: business.phoneNumbers,
        location: business.location,
        targetAudience: business.targetAudience,
        brandVoice: business.brandVoice,
        socialLinks: business.socialLinks,
        onboardingStrategy: business.onboardingStrategy,
        competitors: business.competitors || [],
      },
      consolidatedAudit: consolidatedDataObj,
      myScrapedChannels: Array.from(businessReportsMap.entries())
        .filter(([channel]) => channel !== 'CONSOLIDATED')
        .map(([channel, report]) => {
          let dataObj = report.data;
          if (typeof report.data === 'string') {
            try {
              dataObj = JSON.parse(report.data);
            } catch (e) {
              console.error('Error parsing report data:', e);
            }
          }
          return { channel, data: dataObj };
        }),
      competitorAnalysis: business.competitorGeneralReport,
      selectedFocusName: name || '',
      selectedFocusDescription: description || '',
      selectedChannels: selectedChannels || [],
      selectedPillars: selectedPillars || [],
      selectedTone: selectedTone || '',
    };

    // 4. Obtener tendencias del sector desde OB-Tendencias API Engine (con fallback seguro)
    try {
      const { getUnifiedTrendsContext } = await import("@/lib/services/ob-tendencias");
      (context as any).trendsContext = await getUnifiedTrendsContext(business.industry || "general", "tiktok", "BO");
    } catch (e) {
      console.error("Error fetching OB-Tendencias for strategy:", e);
    }

    // 5. Generar estrategia con IA usando el Banco de Datos completo y tendencias
    const strategy = await generateMarketingStrategyWithAI(context);

    return NextResponse.json(strategy);
  } catch (error) {
    console.error('Error generating strategy:', error);
    return NextResponse.json({ error: 'Failed to generate strategy' }, { status: 500 });
  }
}

async function generateMarketingStrategyWithAI(context: any) {
  const openRouterKey = process.env.OPEN_ROUTER_KEY?.replace(/"/g, '').trim();
  
  if (!openRouterKey) {
    return generatePlaceholderStrategy(context);
  }

  try {
    const prompt = buildStrategyPrompt(context);
    
    const { object } = await generateObject({
      model: openrouter('google/gemini-2.5-flash'),
      schema: strategyGenerationSchema,
      system: 'Eres el Director de Estrategia de Marketing Digital y Growth Hacker de nivel internacional. Generas planes de crecimiento estratégico basados rigurosamente en el BANCO DE DATOS COMPLETO del negocio (auditoría consolidada, FODA, métricas de scraping, datos de competidores y respuestas del onboarding) estructurados en 8 pilares ejecutivos (Resumen P2P/PLM, Benchmarking 2026 con metas de engagement de 0.15% FB / 0.48% IG / 2.6-3.73% TikTok, Inteligencia Competitiva y Sentiment, 6 Buyer Personas Descriptivas, FODA de Gaps con UGC, Visibilidad SEO+AEO, Conversión WhatsApp+IA Agéntica y Stack de Eficiencia Operativa para ahorrar 12h semanales). Responde únicamente con un JSON estructurado y válido.',
      prompt: prompt,
    });

    return object;
  } catch (error) {
    console.error('Error in AI strategy execution:', error);
    return generatePlaceholderStrategy(context);
  }
}

function buildStrategyPrompt(context: any) {
  const { business, consolidatedAudit, myScrapedChannels, competitorAnalysis, trendsContext } = context;
  
  let prompt = `Genera un Plan Estratégico de Crecimiento integral estructurado formalmente en los 8 PILARES EJECUTIVOS DE MARKETING Y GROWTH 2026 para el negocio "${business.name}" usando su BANCO DE DATOS COMPLETO.\n\n`;
  if (trendsContext) {
    prompt += `${trendsContext}\n\n`;
  }
  prompt += `=========================================\n`;
  prompt += `1. BANCO DE DATOS COMPLETO DEL NEGOCIO:\n`;
  prompt += `=========================================\n`;
  prompt += `- Nombre comercial: ${business.name}\n`;
  prompt += `- Descripción del negocio: ${business.description || 'No especificada'}\n`;
  prompt += `- Industria / Rubro: ${business.industry || 'No especificada'}\n`;
  prompt += `- Ubicación / Cobertura: ${business.location || 'No especificada'}\n`;
  prompt += `- Sitio Web: ${business.website || 'No registrado'}\n`;
  prompt += `- Teléfono / WhatsApp de Ventas: ${business.phoneNumbers || 'No registrado'}\n`;
  if (business.brandVoice) prompt += `- Identidad y Tono de Marca: ${JSON.stringify(business.brandVoice)}\n`;
  if (business.socialLinks) prompt += `- Redes Sociales Vinculadas: ${JSON.stringify(business.socialLinks)}\n`;
  
  if (business.onboardingStrategy && typeof business.onboardingStrategy === 'object') {
    const st = business.onboardingStrategy as any;
    prompt += `\nRESPUESTAS ESTRATÉGICAS DEL NEGOCIO (FORMULARIO BASE - ALTA PRIORIDAD):\n`;
    if (st.locationAge) prompt += `- Segmentación Demográfica/Ubicación: ${st.locationAge}\n`;
    if (st.lifeEvent) prompt += `- Momento de Compra / Evento de Vida: ${st.lifeEvent}\n`;
    if (st.archetype) prompt += `- Arquetipo de Marca: ${st.archetype}\n`;
    if (st.conversionChannel) {
      prompt += `- Canales de Conversión (Pregunta 4): ${st.conversionChannel}\n`;
    }
    if (st.informationGaps) prompt += `- Dudas/Objeciones comunes antes de comprar: ${st.informationGaps}\n`;
    if (st.socialProof) prompt += `- Prueba Social Destacada (UGC): ${st.socialProof}\n`;
    if (st.differentialAdvantage) prompt += `- Ventaja Diferencial Única: ${st.differentialAdvantage}\n`;
  }
  prompt += `\n`;

  if (consolidatedAudit) {
    prompt += `AUDITORÍA CONSOLIDADA DE MI NEGOCIO (DATOS AUDITADOS POR IA):\n`;
    if (consolidatedAudit.executiveSummary) prompt += `- Resumen Ejecutivo Auditado: ${consolidatedAudit.executiveSummary}\n`;
    if (consolidatedAudit.marketPosition) {
      prompt += `- Propuesta de Valor Auditada: ${consolidatedAudit.marketPosition.value_proposition || consolidatedAudit.marketPosition.competitiveAdvantage || 'N/D'}\n`;
      prompt += `- Brecha de Mercado Identificada: ${consolidatedAudit.marketPosition.marketGap || 'N/D'}\n`;
    }
    if (Array.isArray(consolidatedAudit.strengths)) prompt += `- Fortalezas Clave: ${consolidatedAudit.strengths.join(', ')}\n`;
    if (Array.isArray(consolidatedAudit.weaknesses)) prompt += `- Debilidades a Corregir: ${consolidatedAudit.weaknesses.join(', ')}\n`;
    if (Array.isArray(consolidatedAudit.opportunities)) prompt += `- Oportunidades de Mercado: ${consolidatedAudit.opportunities.join(', ')}\n`;
    if (Array.isArray(consolidatedAudit.threats)) prompt += `- Amenazas del Entorno: ${consolidatedAudit.threats.join(', ')}\n`;
    prompt += `\n`;
  }

  if (business.competitors && business.competitors.length > 0) {
    prompt += `COMPETIDORES DIRECTOS REGISTRADOS:\n`;
    business.competitors.forEach((c: any, idx: number) => {
      prompt += `- Competidor ${idx + 1}: ${c.name} | Web: ${c.website || 'N/D'} | FB: ${c.facebook || 'N/D'} | IG: ${c.instagram || 'N/D'} | TikTok: ${c.tiktok || 'N/D'}\n`;
    });
    prompt += `\n`;
  }

  prompt += `REGLAS Y PARÁMETROS OBLIGATORIOS PARA CADA UNO DE LOS 8 PILARES:\n`;
  prompt += `1. Resumen Ejecutivo P2P (People-to-People / PLM): Define el paso de marketing corporativo frío a People-Led Marketing (PLM) centrado en generar confianza con caras y personas reales.\n`;
  prompt += `2. Auditoría y Benchmarks 2026: Incluye explícitamente las metas de engagement 2026 -> Facebook: 0.15%, Instagram: 0.48%, TikTok: 2.60% a 3.73%.\n`;
  prompt += `3. Inteligencia Competitiva: Matriz Share of Voice y Gap de Percepción (Social Listening).\n`;
  prompt += `4. Buyer Personas: Genera exactamente 6 BUYER PERSONAS DESCRIPTIVAS usando roles/demografía en sus nombres (ej: "Mujer de 35 años casada", "Joven ejecutivo de 28 años", "Madre emprendedora") SIN usar nombres propios individuales ficticios. Calcula también el % de mercado desatendido.\n`;
  prompt += `5. Gaps de Mercado (FODA Estratégico): Enfócate en el Gap de Validación Social (UGC) y el Gap Educativo/Entretenimiento (recordando que el 79.6% de usuarios busca entretenimiento en video).\n`;
  prompt += `6. Visibilidad SEO + AEO: Define objetivos de Instagram (Carousels para interacción meta 10.15% y Reels para alcance meta 37.8%) y estrategia de Answer Engine Optimization (AEO) para ser citados por ChatGPT, Gemini y Perplexity.\n`;
  prompt += `7. Conversión WhatsApp-Centric: Embudo hacia catálogo digital y respuesta automatizada del 50% de dudas preventa mediante IA Agéntica.\n`;
  prompt += `8. Stack Tecnológico: Demuestra el ahorro de hasta 12 horas semanales y recomienda Metricool/Agorapulse, CapCut/InVideo AI y Brandwatch/Keyhole.\n\n`;

  if (context.selectedFocusName) {
    prompt += `ENFOQUE ESTRATÉGICO SELECCIONADO POR EL USUARIO (la estrategia y objetivos deben alinearse en torno a esta visión):\n`;
    prompt += `- Nombre: ${context.selectedFocusName}\n`;
    prompt += `- Visión: ${context.selectedFocusDescription}\n\n`;
  }

  if (context.selectedChannels && context.selectedChannels.length > 0) {
    prompt += `CANALES SELECCIONADOS POR EL USUARIO PARA ACTIVAR (debes enfocar la estrategia y los objetivos en estos canales):\n`;
    prompt += `- ${context.selectedChannels.join(', ')}\n\n`;
  }

  if (context.selectedPillars && context.selectedPillars.length > 0) {
    prompt += `PILARES TEMÁTICOS DE CONTENIDO SELECCIONADOS (estos deben influir en las temáticas de las buyer personas y los objetivos):\n`;
    context.selectedPillars.forEach((pillar: string) => {
      prompt += `- ${pillar}\n`;
    });
    prompt += `\n`;
  }

  if (context.selectedTone) {
    prompt += `TONO DE COMUNICACIÓN SELECCIONADO POR EL USUARIO:\n`;
    prompt += `- ${context.selectedTone}\n\n`;
  }

  if (myScrapedChannels.length > 0) {
    prompt += `ANÁLISIS DE NUESTROS CANALES (datos reales extraídos):\n`;
    myScrapedChannels.forEach((chan: any) => {
      prompt += `- Canal: ${chan.channel}\n`;
      if (chan.data) {
        if (chan.data.instagram_presence) {
          prompt += `  * Instagram: ${chan.data.instagram_presence.audience_size?.followers || 'N/D'} seguidores, username: ${chan.data.instagram_presence.username || 'N/D'}\n`;
        }
        if (chan.data.social_intelligence) {
          prompt += `  * Métricas: ${chan.data.social_intelligence.audience_size || 'N/D'} likes/seguidores, Engagement: ${chan.data.social_intelligence.engagement_level || 'N/D'}\n`;
        }
        if (chan.data.strategic_diagnostics) {
          prompt += `  * Fortalezas: ${(chan.data.strategic_diagnostics.strengths || []).join(', ')}\n`;
          prompt += `  * Debilidades: ${(chan.data.strategic_diagnostics.weaknesses || []).join(', ')}\n`;
        }
      }
    });
    prompt += `\n`;
  }

  if (competitorAnalysis) {
    prompt += `ANÁLISIS DE LA COMPETENCIA (oportunidades y debilidades identificadas):\n`;
    if (typeof competitorAnalysis === 'string') {
      prompt += `${competitorAnalysis}\n`;
    } else {
      prompt += `${JSON.stringify(competitorAnalysis)}\n`;
    }
    prompt += `\n`;
  }

  prompt += `Genera la respuesta como un objeto JSON estructurado exactamente según el siguiente esquema (asegúrate de que los campos específicos de cada sección se cumplan y sean ricos en detalles en español):\n\n`;
  prompt += `{\n`;
  prompt += `  "name": "${(context.selectedFocusName || 'Estrategia de Crecimiento para ' + business.name).replace(/"/g, '\\"')}",\n`;
  prompt += `  "description": "${(context.selectedFocusDescription || 'Breve resumen estratégico').replace(/"/g, '\\"')}",\n`;
  prompt += `  "isActive": true,\n`;
  prompt += `  "objectives": [\n`;
  prompt += `    {\n`;
  prompt += `      "name": "Nombre corto del objetivo (Ej. Aumentar Seguidores Instagram)",\n`;
  prompt += `      "specific": "Qué se logrará específicamente (mínimo 5 palabras)",\n`;
  prompt += `      "measurable": "Cómo se medirá cuantitativamente (mínimo 5 palabras)",\n`;
  prompt += `      "achievable": "Cómo se logrará de forma realista (mínimo 5 palabras)",\n`;
  prompt += `      "relevant": "Por qué es relevante para el negocio ahora (mínimo 5 palabras)",\n`;
  prompt += `      "timeBound": "Plazo definido (mínimo 5 palabras)",\n`;
  prompt += `      "targetValue": 1000,\n`;
  prompt += `      "currentValue": 100,\n`;
  prompt += `      "unit": "Unidad de medida (ej: seguidores, leads, ventas, visitas)",\n`;
  prompt += `      "deadline": "2026-08-31",\n`;
  prompt += `      "status": "PENDING"\n`;
  prompt += `    }\n`;
  prompt += `  ],\n`;
  prompt += `  "personas": [\n`;
  prompt += `    {\n`;
  prompt += `      "name": "Título profesional del perfil de cliente enfocado en la industria del negocio (Ej. Consumidor Habitual B2C / Comprador Corporativo / Cliente Frecuente). PROHIBIDO usar nombres propios como María, Carlos, etc.",\n`;
  prompt += `      "demographics": "Resumen demográfico (edad, ubicación, ocupación, estado familiar, ej: Mujer, 25-35 años, profesional independiente, interesada en pastelería fina, Santa Cruz)",\n`;
  prompt += `      "painPoints": "Puntos de dolor y retos del cliente (Frase concisa, ej: Falta de tiempo para cocinar, busca opciones listas para eventos, desconfía de la calidad de ingredientes)",\n`;
  prompt += `      "goals": "Objetivos y motivaciones (ej: Celebrar fechas especiales con postres de alta calidad, sorprender a invitados, encontrar postres sin gluten)",\n`;
  prompt += `      "communication": {\n`;
  prompt += `        "tone": "Tono de comunicación sugerido (ej: Amistoso, dulce, inspiracional)",\n`;
  prompt += `        "topics": "Temas de interés para crear contenido (ej: Recetas rápidas, decoración de tortas, detrás de escenas de repostería)",\n`;
  prompt += `        "triggers": "Motivadores clave de compra (ej: Promociones exclusivas de último minuto, fotos de alta calidad que despierten antojo)"\n`;
  prompt += `      }\n`;
  prompt += `    }\n`;
  prompt += `  ],\n`;
  prompt += `  "funnelStages": [\n`;
  prompt += `    {\n`;
  prompt += `      "name": "Nombre de la etapa (ej: Conciencia, Consideración, Decisión)",\n`;
  prompt += `      "description": "Objetivo de esta etapa del embudo para el cliente",\n`;
  prompt += `      "contentTypes": ["Tipos de contenido recomendados (ej. Reels, Carruseles, Stories)"],\n`;
  prompt += `      "channels": ["Canales recomendados (ej. INSTAGRAM, FACEBOOK, WEBSITE)"],\n`;
  prompt += `      "goals": ["Objetivos específicos de la etapa (ej. Aumentar alcance, generar confianza)"],\n`;
  prompt += `      "kpis": ["Indicadores clave (ej. Impresiones, Clics, Mensajes privados)"],\n`;
  prompt += `      "ctas": ["Llamados a la acción sugeridos (ej. 'Escríbenos al WhatsApp', 'Visita nuestra tienda')"]\n`;
  prompt += `    }\n`;
  prompt += `  ],\n`;
  prompt += `  "channels": [\n`;
  prompt += `    {\n`;
  prompt += `      "name": "Nombre del canal (ej: INSTAGRAM o FACEBOOK o WEBSITE o BLOG o EMAIL o GOOGLE ADS)",\n`;
  prompt += `      "type": "SOCIAL" o "EMAIL" o "BLOG" o "ADS" o "OTHER" (debe ser uno de estos 5 valores exactos en mayúsculas),\n`;
  prompt += `      "isActive": true,\n`;
  prompt += `      "frequency": "Frecuencia de publicación (ej: 3 veces por semana o Diario o Semanal)",\n`;
  prompt += `      "audienceSize": 1000\n`;
  prompt += `    }\n`;
  prompt += `  ]\n`;
  prompt += `}\n\n`;
  prompt += `Responde únicamente con el JSON estructurado, sin introducción ni comentarios explicativos. Asegúrate de generar al menos 2 objetivos SMART bien definidos, exactamente 6 buyer personas hiper-específicas con nombres profesionales sin nombres ficticios, 3 etapas del embudo de conversión y todos los canales configurados activos.`;

  return prompt;
}

function generatePlaceholderStrategy(context: any) {
  const { business } = context;
  return {
    name: `Estrategia de Crecimiento para ${business.name}`,
    description: `Estrategia digital recomendada para consolidar el posicionamiento de ${business.name} en su sector local, optimizando canales sociales mediante contenido de alto engagement y captación de clientes.`,
    isActive: true,
    objectives: [
      {
        name: "Crecer comunidad en Instagram",
        specific: "Incrementar la base de seguidores calificados en la cuenta oficial de Instagram",
        measurable: "Lograr un aumento neto de 1,500 nuevos seguidores interactivos",
        achievable: "Mediante publicación de Reels diarios y concursos de fechas especiales",
        relevant: "Permitirá mayor visibilidad orgánica y potenciales clientes recurrentes",
        timeBound: "Plazo límite de 90 días a partir de la fecha de inicio",
        targetValue: 1500,
        currentValue: 0,
        unit: "seguidores",
        deadline: "2026-08-31",
        status: "PENDING"
      },
      {
        name: "Optimizar conversión en WhatsApp",
        specific: "Reducir la fricción y tiempo de respuesta en solicitudes de compra por WhatsApp",
        measurable: "Lograr una tasa de conversión de conversación a pedido del 25%",
        achievable: "Mediante respuestas rápidas pre-guardadas y menús claros de productos",
        relevant: "Es el canal directo de ventas y atención preferido por los clientes",
        timeBound: "Plazo límite de 60 días para la implementación inicial",
        targetValue: 25,
        currentValue: 10,
        unit: "porcentaje",
        deadline: "2026-07-31",
        status: "PENDING"
      }
    ],
    personas: [
      {
        "name": "Consumidor Habitual de Conveniencia (B2C)",
        "demographics": "Adultos de 25-45 años, trabajadores activos, usuarios intensivos de WhatsApp y compras locales",
        "goals": "Obtener rapidez en la atención, facilidad de pedido directo y entregas puntuales y confiables.",
        "painPoints": "Poco tiempo libre en rutina diaria, busca simplicidad de compra vía WhatsApp y atención fluida.",
        "communication": {
          "tone": "Directo, accesible y servicial",
          "triggers": "Antojos de media tarde, promociones del día y pedidos rápidos por WhatsApp",
          "topics": "Combos rápidos, facilidad de pago y pedidos en un solo clic"
        }
      },
      {
        "name": "Joven Buscador de Experiencias y Tendencias (B2C)",
        "demographics": "Jóvenes de 18-28 años, estudiantes y jóvenes profesionales, muy activos en TikTok e Instagram",
        "goals": "Probar sabores y productos estéticamente atractivos para compartir en sus plataformas sociales.",
        "painPoints": "Aburrimiento de ofertas tradicionales, busca experiencias visuales instagrameables y novedades.",
        "communication": {
          "tone": "Fresco, dinámico y alegre",
          "triggers": "Tendencias en redes, lanzamientos exclusivos y contenido visual de alto impacto",
          "topics": "Detrás de escena (UGC), ediciones limitadas y dinámicas de interacción"
        }
      },
      {
        "name": "Comprador Corporativo y Eventos (B2B)",
        "demographics": "Administradores, gestores de talento y dueños de empresas de 30-55 años",
        "goals": "Abastecer reuniones corporativas, eventos de equipo y festejos con productos de alta presentación.",
        "painPoints": "Exigencia de puntualidad extrema, requiere facturación inmediata y cotizaciones sin demoras.",
        "communication": {
          "tone": "Profesional, ejecutivo y seguro",
          "triggers": "Reuniones de oficina, catering corporativo y festejos de fin de año",
          "topics": "Descuentos por volumen, facturación rápida y catálogo corporativo VIP"
        }
      },
      {
        "name": "Cliente Familiar de Fines de Semana",
        "demographics": "Familias de 30-50 años con hijos, residentes locales de nivel socioeconómico medio a medio-alto",
        "goals": "Disfrutar momentos de unión familiar y celebraciones memorables sin complicaciones de preparación.",
        "painPoints": "Falta de tiempo para cocina compleja, temor a fallas de calidad o presentación en reuniones familiares.",
        "communication": {
          "tone": "Cálido, familiar y confiable",
          "triggers": "Reuniones de fin de semana, festividades locales y compras anticipadas",
          "topics": "Paquetes familiares, tradiciones locales y calidad garantizada"
        }
      },
      {
        "name": "Profesional Exigente y de Alto Rendimiento",
        "demographics": "Ejecutivos y profesionales independientes de 28-48 años con ritmo de vida acelerado",
        "goals": "Consumir productos de la más alta calidad, ingredientes seleccionados y presentación impecable.",
        "painPoints": "Sensible a la mala atención o productos de baja calidad, busca practicidad sin comprometer la excelencia.",
        "communication": {
          "tone": "Refinado, conciso y de alto valor",
          "triggers": "Línea gourmet/premium, sellos de calidad e historias de origen",
          "topics": "Ingredientes seleccionados, atención preferencial y beneficios exclusivos"
        }
      },
      {
        "name": "Cliente Leal Tradicional de la Marca",
        "demographics": "Clientes frecuentes de 35-60 años que valoran la consistencia y la relación directa con el negocio",
        "goals": "Mantener su hábito de compra regular disfrutando de un trato personalizado y reconocimiento VIP.",
        "painPoints": "Temor a cambios bruscos en la calidad o atención despersonalizada.",
        "communication": {
          "tone": "Atento, cordial y cercano",
          "triggers": "Club de fidelidad, atención directa por WhatsApp y regalos por aniversario de cliente",
          "topics": "Beneficios de lealtad, preventas exclusivas y novedades de la marca"
        }
      }
    ],
    funnelStages: [
      {
        name: "Descubrimiento",
        description: "Llamar la atención de audiencias locales que aún no conocen el negocio",
        contentTypes: ["Reels dinámicos", "Publicaciones pagadas de alcance", "Sorteos locales"],
        channels: ["INSTAGRAM", "FACEBOOK"],
        goals: ["Aumentar impresiones locales", "Crecer seguidores"],
        kpis: ["Impresiones", "Alcance", "Nuevos Seguidores"],
        ctas: ["¡Síguenos para endulzar tu día!", "Ver catálogo"]
      },
      {
        name: "Consideración",
        description: "Demostrar la calidad, frescura y sabor para generar antojo y confianza",
        contentTypes: ["Testimonios de clientes", "Detrás de cámaras de la cocina", "Carruseles de ingredientes"],
        channels: ["INSTAGRAM", "FACEBOOK"],
        goals: ["Incrementar interacciones y preguntas directas", "Generar guardados de posts"],
        kpis: ["Comentarios", "Mensajes recibidos", "Guardados"],
        ctas: ["¿Cuál es tu sabor favorito? Coméntanos", "Preguntar precios por inbox"]
      },
      {
        name: "Conversión",
        description: "Facilitar el cierre rápido de la compra y asegurar el pedido",
        contentTypes: ["Stories con links directos", "Catálogo digital actualizado", "Promociones con límite de tiempo"],
        channels: ["INSTAGRAM", "FACEBOOK", "WEBSITE"],
        goals: ["Cerrar pedidos directos", "Reducir fricción de conversión"],
        kpis: ["Pedidos completados", "Clics en link de compra"],
        ctas: ["¡Haz tu pedido hoy mismo por WhatsApp!", "Comprar ahora"]
      }
    ],
    channels: [
      {
        name: "INSTAGRAM",
        type: "SOCIAL",
        isActive: true,
        frequency: "3 veces por semana (Reels y Stories diarios)",
        audienceSize: 0
      },
      {
        name: "FACEBOOK",
        type: "SOCIAL",
        isActive: true,
        frequency: "2 publicaciones por semana",
        audienceSize: 0
      }
    ]
  };
}
