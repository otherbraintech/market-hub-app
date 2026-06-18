import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createOpenAI } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

const openrouter = createOpenAI({
  apiKey: process.env.OPEN_ROUTER_KEY?.replace(/"/g, '').trim(),
  baseURL: 'https://openrouter.ai/api/v1',
});

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
    const autoSave = url.searchParams.get('autoSave') === 'true';

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

    // Auto-guardar en la base de datos si se requiere
    if (autoSave && strategies.length > 0) {
      for (let i = 0; i < strategies.length; i++) {
        const strat = strategies[i];
        await prisma.marketingStrategy.create({
          data: {
            businessId: id,
            name: strat.name,
            description: strat.description,
            isActive: i === 0, // Solo la primera es activa por defecto
            objectives: strat.objectives || [],
            personas: strat.personas || [],
            funnelStages: strat.funnelStages || [],
            channels: strat.channels || [],
            contentPillars: strat.contentPillars || [],
          }
        });
      }
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
            title: z.string(),
            metric: z.string(),
            target: z.string(),
            timeframe: z.string()
          })),
          personas: z.array(z.object({
            name: z.string(),
            avatar: z.string().optional(),
            role: z.string(),
            demographics: z.string(),
            painPoints: z.array(z.string()),
            goals: z.array(z.string()),
            channels: z.array(z.string()),
            contentTheme: z.string().optional(),
            hooks: z.array(z.string()).optional()
          })),
          funnelStages: z.array(z.object({
            stage: z.enum(['awareness', 'consideration', 'decision', 'retention']),
            strategy: z.string(),
            contentIdeas: z.array(z.string())
          })),
          channels: z.array(z.object({
            name: z.string(),
            frequency: z.string(),
            priority: z.enum(['high', 'medium', 'low']),
            bestTime: z.string()
          })),
          contentPillars: z.array(z.string())
        }))
      }),
      system: 'Eres un Director de Growth Marketing y Estratega Digital de élite. Generas exactamente 3 propuestas estratégicas de marketing extremadamente personalizadas para el negocio basándote en su perfil, productos y un análisis profundo de la competencia (debilidades que podemos explotar, brechas de canales, etc.). Las estrategias deben ser viables, creativas e innovadoras.',
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
  prompt += `- "name": Nombre comercialmente atractivo de la estrategia (ej. "Autoridad Artesanal Local", "Embudo de Antojos Express").\n`;
  prompt += `- "description": Resumen ejecutivo de la estrategia (2 frases).\n`;
  prompt += `- "objectives": Array de 3 objetivos SMART. Cada objetivo debe contener "title" (ej. "Aumento de Conversión en Reels"), "metric" (ej. "Mensajes por Directo"), "target" (ej. "+30%"), "timeframe" (ej. "90 días").\n`;
  prompt += `- "personas": Array de 2 Buyer Personas específicos. Cada persona debe tener "name" (ej. "Sofía, La Compradora Impulsiva"), "role" (ej. "Profesional Ocupada"), "demographics" (ej. "25-35 años, ingresos medios-altos"), "painPoints" (lista de dolores), "goals" (lista de motivadores), "channels" (restringidos a: 'INSTAGRAM', 'FACEBOOK', 'TIKTOK'), "contentTheme" (ej. "Antojos rápidos y estética premium"), "hooks" (3 ganchos o líneas de entrada sugeridos).\n`;
  prompt += `- "funnelStages": Array con las 4 etapas del embudo ('awareness', 'consideration', 'decision', 'retention'). Cada etapa debe detallar una "strategy" y una lista de "contentIdeas" específicas para el negocio.\n`;
  prompt += `- "channels": Array de 2-3 canales ('INSTAGRAM', 'FACEBOOK', 'TIKTOK'). Cada canal debe tener "frequency" (ej. "3 posts por semana"), "priority" ('high', 'medium', 'low') y "bestTime" (ej. "19:00 - 21:00").\n`;
  prompt += `- "contentPillars": Array de 3-4 pilares de contenido (ej. "Proceso y Calidad", "Especiales de Temporada").\n\n`;
  
  prompt += `Responde únicamente con el JSON estructurado de acuerdo a la especificación, sin marcas extras o explicaciones de texto adicionales.`;

  return prompt;
}

function generatePlaceholderCompleteStrategies(context: any) {
  const name = context.business.name;
  return [
    {
      name: "Estrategia de Diferenciación por Autoridad y Calidad",
      description: `Estrategia orientada a destacar los procesos, la alta calidad de los ingredientes y la historia de la marca de ${name} para ganar clientes premium insatisfechos por la competencia genérica.`,
      objectives: [
        { title: "Incrementalidad de leads", metric: "Mensajes directos / WhatsApp", target: "+25%", timeframe: "60 días" },
        { title: "Posicionamiento de marca", metric: "Engagement promedio en posts", target: "5.5%", timeframe: "90 días" },
        { title: "Conversión de clientes", metric: "Tasa de cierre en chat", target: "+15%", timeframe: "60 días" }
      ],
      personas: [
        {
          name: "Carlos, El Buscador de Calidad",
          role: "Padre de familia / Profesional",
          demographics: "30-45 años, zona urbana, busca opciones premium para su familia",
          painPoints: [
            "Cansado de la repostería industrial o con sabor artificial.",
            "Dificultad para encontrar productos frescos y bien presentados a tiempo."
          ],
          goals: [
            "Sorprender a sus invitados con postres de alta pastelería.",
            "Recibir un servicio al cliente impecable y entregas puntuales."
          ],
          channels: ["INSTAGRAM", "FACEBOOK"],
          contentTheme: "Ingredientes premium, limpieza y procesos explicados en video.",
          hooks: [
            "¿Sabías que un postre puede cambiar el rumbo de tu reunión? Mira la diferencia.",
            "La textura y frescura que estabas buscando en cada bocado."
          ]
        }
      ],
      funnelStages: [
        {
          stage: "awareness",
          strategy: "Videos estilo Reels mostrando la preparación y los ingredientes selectos.",
          contentIdeas: ["El detrás de escena: cómo preparamos nuestro producto estrella.", "Historias de los productores locales de nuestra materia prima."]
        },
        {
          stage: "consideration",
          strategy: "Testimonios en video de clientes satisfechos y comparativas de sabor/textura.",
          contentIdeas: ["Unboxing detallado de nuestros empaques premium.", "Preguntas frecuentes: por qué nuestros productos duran frescos más tiempo."]
        },
        {
          stage: "decision",
          strategy: "Promociones exclusivas para pedidos directos de combos especiales por tiempo limitado.",
          contentIdeas: ["Cupón de bienvenida para tu primer pedido por WhatsApp.", "Kit de degustación exclusivo para el fin de semana."]
        },
        {
          stage: "retention",
          strategy: "Programa de fidelización y encuestas de satisfacción vía WhatsApp.",
          contentIdeas: ["Acceso anticipado a lanzamientos de temporada.", "Detalle de agradecimiento o descuento en su segunda compra."]
        }
      ],
      channels: [
        { name: "INSTAGRAM", frequency: "4 publicaciones y 7 stories semanales", priority: "high", bestTime: "18:00 - 20:00" },
        { name: "FACEBOOK", frequency: "3 publicaciones semanales", priority: "medium", bestTime: "12:00 - 14:00" }
      ],
      contentPillars: ["Calidad de Ingredientes", "Historias de Clientes", "Proceso de Elaboración Artesanal"]
    },
    {
      name: "Campaña Viral de Growth & Contenido Corto",
      description: `Enfocada en capturar la atención de audiencias jóvenes y dinámicas a través de tendencias rápidas de TikTok y Reels, priorizando el humor, la estética visual impactante y el antojo visual inmediato.`,
      objectives: [
        { title: "Alcance masivo", metric: "Visualizaciones en Reels/TikTok", target: "+50,000", timeframe: "30 días" },
        { title: "Crecimiento de comunidad", metric: "Nuevos seguidores", target: "+1,200", timeframe: "45 días" },
        { title: "Tráfico al perfil", metric: "Clicks en link de bio", target: "+40%", timeframe: "60 días" }
      ],
      personas: [
        {
          name: "Daniela, La Trendy Foodie",
          role: "Estudiante universitaria / Creadora de contenido",
          demographics: "18-28 años, activa en TikTok e Instagram, le encanta probar cosas visualmente atractivas",
          painPoints: [
            "Aburrida de las mismas marcas locales tradicionales de siempre.",
            "Valora mucho la estética y la experiencia de compartir fotos/videos de su comida."
          ],
          goals: [
            "Ser la primera en recomendar un lugar genial a sus amigos.",
            "Disfrutar de experiencias gastronómicas altamente instagrameables."
          ],
          channels: ["TIKTOK", "INSTAGRAM"],
          contentTheme: "Tendencias rápidas, sonidos virales, primeros planos extremos (foodporn) y retos.",
          hooks: [
            "Si no se te hace agua la boca en 3 segundos, te compramos uno.",
            "Probando el menú secreto de la pastelería de la que todos hablan."
          ]
        }
      ],
      funnelStages: [
        {
          stage: "awareness",
          strategy: "Videos ultra dinámicos con sonidos virales y tomas foodporn extremas.",
          contentIdeas: ["El sonido crujiente de nuestro pan recién horneado.", "Retos divertidos con nuestro equipo de cocina."]
        },
        {
          stage: "consideration",
          strategy: "Publicaciones interactivas como encuestas en stories y respuestas a comentarios virales en video.",
          contentIdeas: ["¿Cuál es el mejor combo? Vota en los comentarios.", "Respondiendo a un cliente que dijo que no podíamos hacerlo más grande."]
        },
        {
          stage: "decision",
          strategy: "Códigos de descuento efímeros (válidos por 24h) promocionados directamente en los videos más vistos.",
          contentIdeas: ["Muestra este video en caja para un postre gratis.", "Código secreto de TikTok para delivery gratis."]
        },
        {
          stage: "retention",
          strategy: "Mencionar a usuarios en stories e incentivarlos a compartir su experiencia usando un hashtag propio.",
          contentIdeas: ["Reposteando las fotos más estéticas de nuestros clientes.", "Sorteos exclusivos mensuales para quienes nos etiqueten."]
        }
      ],
      channels: [
        { name: "TIKTOK", frequency: "5 videos semanales", priority: "high", bestTime: "16:00 - 19:00" },
        { name: "INSTAGRAM", frequency: "3 Reels y 10 stories semanales", priority: "high", bestTime: "19:00 - 21:00" }
      ],
      contentPillars: ["Foodporn y Antojo", "Humor y Detrás de Escena", "Tendencias de Audio"]
    },
    {
      name: "Embudo de Retención y Suscripción Dulce",
      description: `Dirigida a establecer relaciones a largo plazo con clientes corporativos o recurrentes, fomentando compras programadas, suscripciones mensuales y dinámicas de fidelidad.`,
      objectives: [
        { title: "Fidelización de clientes", metric: "Tasa de recompra mensual", target: "40%", timeframe: "90 días" },
        { title: "Suscripciones activas", metric: "Miembros del club VIP", target: "100 miembros", timeframe: "120 días" },
        { title: "Valor del cliente en el tiempo", metric: "Ticket promedio", target: "+20%", timeframe: "90 días" }
      ],
      personas: [
        {
          name: "Lorena, La Planificadora de Eventos",
          role: "Asistente de Recursos Humanos / Event Planner",
          demographics: "28-50 años, organiza cumpleaños de oficina o eventos corporativos recurrentes",
          painPoints: [
            "Estrés por tener que cotizar y pedir a última hora para los cumpleaños.",
            "Poco presupuesto o falta de opciones personalizables para empresas."
          ],
          goals: [
            "Delegar y automatizar los pedidos recurrentes sin errores.",
            "Quedar bien con su equipo y jefes en cada celebración corporativa."
          ],
          channels: ["FACEBOOK", "INSTAGRAM"],
          contentTheme: "Combos de oficina, puntualidad, facturación fácil y testimonios corporativos.",
          hooks: [
            "Olvídate de planificar los cumpleaños del mes en la oficina. Nosotros lo hacemos por ti.",
            "La solución ideal para que tus eventos corporativos sean un éxito sin estrés."
          ]
        }
      ],
      funnelStages: [
        {
          stage: "awareness",
          strategy: "Anuncios locales y contenido enfocado a empresas y planners locales.",
          contentIdeas: ["Cómo simplificamos el catering de tu oficina.", "La guía definitiva para no fallar en el pastel del jefe."]
        },
        {
          stage: "consideration",
          strategy: "Casos de éxito de empresas que confían en nosotros mensualmente y brochure de planes.",
          contentIdeas: ["Presentación en PDF de nuestros planes corporativos.", "Testimonios de empresas aliadas y su feedback sobre nuestra puntualidad."]
        },
        {
          stage: "decision",
          strategy: "Descuento especial en el primer mes de suscripción o prueba gratuita de degustación para oficinas.",
          contentIdeas: ["Agenda una sesión de degustación gratis para tu equipo directivo.", "Contrato mensual con descuento y facturación flexible."]
        },
        {
          stage: "retention",
          strategy: "Boletín exclusivo de WhatsApp/Correo y regalos sorpresa en fechas especiales.",
          contentIdeas: ["Regalo de cumpleaños directo para el encargado de compras.", "Descuentos acumulativos por volumen de pedidos anual."]
        }
      ],
      channels: [
        { name: "FACEBOOK", frequency: "2 posts semanales", priority: "medium", bestTime: "09:00 - 11:00" },
        { name: "INSTAGRAM", frequency: "2 posts y 4 stories semanales", priority: "medium", bestTime: "11:00 - 13:00" }
      ],
      contentPillars: ["Soluciones para Empresas", "Fidelidad y Beneficios", "Testimonios de Confianza"]
    }
  ];
}
