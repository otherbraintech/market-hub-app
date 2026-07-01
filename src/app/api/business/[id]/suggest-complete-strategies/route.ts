import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createOpenAI } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

const openrouter = createOpenAI({
  apiKey: process.env.OPEN_ROUTER_KEY?.replace(/"/g, '').trim(),
  baseURL: 'https://openrouter.ai/api/v1',
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const business = await prisma.business.findUnique({
      where: { id },
      select: { settings: true }
    });
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }
    const settings = (business.settings as Record<string, any>) || {};
    const strategies = settings.aiProposals || [];
    return NextResponse.json({ strategies });
  } catch (error) {
    console.error('Error fetching saved strategies:', error);
    return NextResponse.json({ error: 'Failed to fetch strategies' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Obtener información del negocio
    const business = await prisma.business.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        industry: true,
        website: true,
        socialLinks: true,
        competitorGeneralReport: true,
        settings: true,
      }
    });

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Obtener productos
    const products = await prisma.product.findMany({
      where: { businessId: id, isActive: true },
      select: {
        name: true,
        description: true,
      }
    });

    // Obtener reportes del propio negocio
    const businessReports = await prisma.analysisReport.findMany({
      where: {
        type: 'MY_BUSINESS',
        entityId: id,
        status: 'COMPLETED',
        NOT: {
          channel: 'CONSOLIDATED'
        }
      },
      orderBy: { completedAt: 'desc' }
    });

    // Agrupar y normalizar reportes del negocio - consulta ya viene ordenada por completedAt DESC
    const businessReportsMap = new Map<string, any>();
    businessReports.forEach((report: typeof businessReports[number]) => {
      if (!businessReportsMap.has(report.channel)) {
        let dataObj = report.data;
        if (typeof report.data === 'string') {
          try {
            dataObj = JSON.parse(report.data);
          } catch (e) {
            console.error('Error parsing report data:', e);
          }
        }
        businessReportsMap.set(report.channel, dataObj);
      }
    });

    // Obtener competidores para añadir detalles del scraping de cada uno
    const competitors = await prisma.competitor.findMany({
      where: { businessId: id },
      select: {
        id: true,
        name: true,
        instagram: true,
        facebook: true,
        tiktok: true,
        website: true,
      }
    });

    const competitorReportsList: any[] = [];
    for (const comp of competitors) {
      const compReports = await prisma.analysisReport.findMany({
        where: {
          type: 'COMPETITOR',
          entityId: comp.id,
          status: 'COMPLETED'
        },
        select: {
          channel: true,
          data: true
        }
      });
      compReports.forEach((rep: typeof compReports[number]) => {
        let parsedData = rep.data;
        if (typeof rep.data === 'string') {
          try { parsedData = JSON.parse(rep.data); } catch(e) {}
        }
        competitorReportsList.push({
          competitorName: comp.name,
          channel: rep.channel,
          data: parsedData
        });
      });
    }

    const url = new URL(request.url);
    const isRefresh = url.searchParams.get('refresh') === 'true';

    // Construir contexto consolidado
    const context = {
      business: {
        name: business.name,
        description: business.description,
        industry: business.industry,
        website: business.website,
        socialLinks: business.socialLinks,
      },
      products: products,
      myScrapedChannels: Array.from(businessReportsMap.entries()).map(([channel, data]) => ({
        channel,
        data
      })),
      competitorAnalysis: business.competitorGeneralReport,
      competitorScrapedDetails: competitorReportsList.slice(0, 8), // Limitar para tokens
      isRefresh,
    };

    // Generar las 3 estrategias detalladas con IA
    const strategies = await generateCompleteStrategiesWithAI(context);

    // Pre-guardar en la base de datos (settings.aiProposals) para persistencia sin activar
    if (strategies.length > 0) {
      const currentSettings = (business.settings as Record<string, any>) || {};
      await prisma.business.update({
        where: { id },
        data: {
          settings: {
            ...currentSettings,
            aiProposals: strategies
          }
        }
      });
    }

    return NextResponse.json({ strategies });
  } catch (error) {
    console.error('Error generating complete strategy suggestions:', error);
    return NextResponse.json({ error: 'Failed to generate strategies' }, { status: 500 });
  }
}

async function generateCompleteStrategiesWithAI(context: any) {
  const openRouterKey = process.env.OPEN_ROUTER_KEY?.replace(/"/g, '').trim();
  
  if (!openRouterKey) {
    return generatePlaceholderCompleteStrategies(context);
  }

  try {
    const prompt = buildStrategyPrompt(context);
    
    const { object } = await generateObject({
      model: openrouter('google/gemini-2.5-flash'),
      schema: z.object({
        strategies: z.array(z.object({
          name: z.string(),
          description: z.string(),
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
          })),
          contentPillars: z.array(z.string())
        }))
      }),
      system: `Eres un Director de Growth Marketing y Estratega Digital de élite. Generas exactamente 3 propuestas estratégicas de marketing extremadamente personalizadas para el negocio basándote en su perfil, productos y un análisis profundo de la competencia.
Reglas clave:
1. El negocio tiene como objetivo primordial una de estas metas: Conversión, Posicionamiento de marca o Crecimiento en redes sociales.
2. Queda estrictamente PROHIBIDO sugerir canales de sitio web, blogs, email marketing, landing pages o WhatsApp como canal o destino principal. Las propuestas estratégicas, tácticas y canales deben enfocarse al 100% en redes sociales: Facebook, Instagram y TikTok.
3. Limita el análisis comparativo a máximo 3 competidores locales si los hay en el contexto.
4. Cumple exactamente con el esquema de base de datos para evitar campos vacíos o 'PENDIENTE':
   - Cada objetivo SMART debe estar completamente redactado. Todos los campos (specific, measurable, achievable, relevant, timeBound) son obligatorios y deben ser descripciones detalladas de al menos 5 caracteres.
   - En personas, demographics, painPoints y goals son cadenas de texto simples (para painPoints y goals, ponlas separadas por comas en una única cadena).
   - En funnelStages, crea etapas de embudo estándar (ej. awareness, consideration, decision, retention).`,
      prompt: prompt,
      temperature: context.isRefresh ? 0.9 : 0.7,
    });

    if (object && Array.isArray(object.strategies) && object.strategies.length > 0) {
      return object.strategies;
    }

    return generatePlaceholderCompleteStrategies(context);
  } catch (error) {
    console.error('Error in AI complete strategies generation:', error);
    return generatePlaceholderCompleteStrategies(context);
  }
}

function buildStrategyPrompt(context: any) {
  const { business, products, myScrapedChannels, competitorAnalysis, competitorScrapedDetails } = context;
  
  let prompt = `Genera exactamente 3 propuestas estratégicas de marketing completas e integrales para el siguiente negocio, aprovechando las brechas competitivas reveladas en los reportes de la competencia.\n\n`;
  if (context.isRefresh) {
    prompt += `IMPORTANTE: El usuario ha solicitado regenerar opciones. Asegúrate de idear enfoques creativos, variados y disruptivos respecto a los convencionales.\n\n`;
  }
  prompt += `NEGOCIO:\n`;
  prompt += `- Nombre: ${business.name}\n`;
  prompt += `- Descripción: ${business.description || 'No especificada'}\n`;
  prompt += `- Industria: ${business.industry || 'No especificada'}\n\n`;
  
  if (products.length > 0) {
    prompt += `PRODUCTOS REGISTRADOS:\n`;
    products.forEach((p: any) => {
      prompt += `- ${p.name}: ${p.description}\n`;
    });
    prompt += `\n`;
  }

  if (myScrapedChannels.length > 0) {
    prompt += `NUESTROS CANALES SCRAPEADOS:\n`;
    myScrapedChannels.forEach((chan: any) => {
      prompt += `- Canal: ${chan.channel}\n`;
      if (chan.data?.strategic_diagnostics) {
        prompt += `  * Fortalezas: ${(chan.data.strategic_diagnostics.strengths || []).slice(0, 2).join(', ')}\n`;
        prompt += `  * Debilidades: ${(chan.data.strategic_diagnostics.weaknesses || []).slice(0, 2).join(', ')}\n`;
      }
    });
    prompt += `\n`;
  }

  if (competitorAnalysis) {
    prompt += `INFORME GENERAL DE LA COMPETENCIA (IA):\n`;
    const repStr = typeof competitorAnalysis === 'string' ? competitorAnalysis : JSON.stringify(competitorAnalysis);
    prompt += `${repStr.substring(0, 1500)}\n\n`;
  }

  if (competitorScrapedDetails && competitorScrapedDetails.length > 0) {
    prompt += `DETALLES DE CANALES DE COMPETIDORES:\n`;
    competitorScrapedDetails.forEach((cd: any) => {
      prompt += `- Competidor ${cd.competitorName} en ${cd.channel}:\n`;
      if (cd.data?.marketing_insights) {
        prompt += `  * Fortalezas: ${(cd.data.marketing_insights.strengths || []).slice(0, 2).join(', ')}\n`;
        prompt += `  * Debilidades: ${(cd.data.marketing_insights.weaknesses || []).slice(0, 2).join(', ')}\n`;
      } else if (cd.data?.strategic_diagnostics) {
        prompt += `  * Fortalezas: ${(cd.data.strategic_diagnostics.strengths || []).slice(0, 2).join(', ')}\n`;
        prompt += `  * Debilidades: ${(cd.data.strategic_diagnostics.weaknesses || []).slice(0, 2).join(', ')}\n`;
      }
    });
    prompt += `\n`;
  }

  prompt += `Genera exactamente 3 estrategias detalladas. La salida debe ser estrictamente en español y estructurarse de la siguiente manera:\n`;
  prompt += `- "name": Nombre de la estrategia.\n`;
  prompt += `- "description": Resumen de la estrategia.\n`;
  prompt += `- "objectives": Array de 3 objetivos SMART. Cada uno debe contener "name", "specific" (mínimo 5 caracteres), "measurable" (mínimo 5 caracteres), "achievable" (mínimo 5 caracteres), "relevant" (mínimo 5 caracteres), "timeBound" (mínimo 5 caracteres), "targetValue" (número), "unit" (ej. "%"), "deadline" (ej. "60 días"), "status" ("PENDING").\n`;
  prompt += `- "personas": Array de buyer personas. Cada uno debe contener "name", "demographics" (string), "painPoints" (string, separados por comas), "goals" (string, separados por comas), "communication" (objeto con tone, topics, triggers).\n`;
  prompt += `- "funnelStages": Array con 4 etapas. Cada uno debe contener "name" (ej. "Atracción", "Consideración", "Decisión", "Retención"), "description", "contentTypes", "channels", "goals", "kpis", "ctas".\n`;
  prompt += `- "channels": Array de canales. Cada uno debe tener "name", "type" ("SOCIAL", "EMAIL", "BLOG", "ADS" o "OTHER"), "isActive" (default true), "frequency" (frecuencia), "audienceSize" (default 0).\n`;
  prompt += `- "contentPillars": Array de pilares de contenido.\n\n`;
  
  prompt += `Responde únicamente con el JSON estructurado de acuerdo a la especificación, sin marcas extras o explicaciones de texto adicionales.`;

  return prompt;
}

function generatePlaceholderCompleteStrategies(context: any) {
  const name = context.business.name;
  return [
    {
      name: "Estrategia de Diferenciación por Autoridad y Calidad",
      description: `Destacar los procesos de alta calidad y marca de ${name} para capturar el mercado local premium.`,
      objectives: [
        {
          name: "Conversión de leads por WhatsApp",
          specific: "Generar mayor cantidad de prospectos interesados a través de un enlace directo de WhatsApp en Instagram",
          measurable: "Aumentar en un 20% el flujo de consultas diarias",
          achievable: "Publicando 3 historias interactivas semanales con llamadas a la acción claras",
          relevant: "Incrementa el volumen de ventas al tener contacto directo con el comprador",
          timeBound: "Lograr la meta en un periodo de 60 días",
          targetValue: 20,
          currentValue: 0,
          unit: "%",
          deadline: "60 días",
          status: "PENDING"
        }
      ],
      personas: [
        {
          name: "Carlos El Exigente",
          demographics: "Hombre, 30-45 años, profesional independiente, ingresos altos, local",
          painPoints: "Baja calidad en postres genéricos, falta de opciones gourmet personalizadas",
          goals: "Encontrar productos frescos, saludables y gourmet para ocasiones especiales",
          communication: {
            tone: "Formal y refinado",
            topics: "Pastelería artesanal, ingredientes de calidad, origen gourmet",
            triggers: "Imágenes de alta calidad visual y testimonios de otros profesionales"
          }
        }
      ],
      funnelStages: [
        {
          name: "Atracción",
          description: "Dar a conocer los ingredientes premium y procesos artesanales del negocio",
          contentTypes: ["Reels", "Stories"],
          channels: ["Instagram", "Facebook"],
          goals: ["Generar curiosidad y credibilidad inicial"],
          kpis: ["Impresiones", "Alcance"],
          ctas: ["Ver menú", "Saber más"]
        }
      ],
      channels: [
        {
          name: "Instagram",
          type: "SOCIAL" as const,
          isActive: true,
          frequency: "3 posts por semana",
          audienceSize: 0
        }
      ],
      contentPillars: ["Calidad de Ingredientes", "Proceso Artesanal"]
    }
  ];
}
