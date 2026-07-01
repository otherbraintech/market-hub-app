import { prisma } from './prisma';
import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';

const openrouter = createOpenAI({
  apiKey: process.env.OPEN_ROUTER_KEY?.replace(/"/g, '').trim(),
  baseURL: 'https://openrouter.ai/api/v1',
});

async function addAgentNotification(businessId: string, title: string, message: string, step: string, status: string) {
  try {
    await prisma.agentNotification.create({
      data: {
        businessId,
        title,
        message,
        step,
        status
      }
    });
  } catch (e) {
    console.error("Error creating agent notification:", e);
  }
}

// Función principal para disparar la generación en cascada en segundo plano
export async function triggerCascadeGeneration(businessId: string) {
  console.log(`[CASCADE] Iniciando generación en cascada para el negocio: ${businessId}`);
  try {
    // Registrar el inicio del proceso de consolidación de agentes
    await addAgentNotification(
      businessId, 
      "Agente de Análisis y Consolidación", 
      "Iniciando consolidación de análisis web y de competencia para formular el diagnóstico.", 
      "SCRAPING", 
      "PROCESSING"
    );

    // 1. Obtener contexto del negocio
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        products: { where: { isActive: true } }
      }
    });

    if (!business) {
      console.error('[CASCADE] Negocio no encontrado');
      await addAgentNotification(
        businessId, 
        "Agente de Análisis", 
        "Fallo al consolidar: Negocio no encontrado.", 
        "SCRAPING", 
        "FAILED"
      );
      return;
    }

    // Check if autoGenerateCampaigns is enabled in settings
    const settings = (business.settings as Record<string, any>) || {};
    if (settings.autoGenerateCampaigns === false) {
      console.log(`[CASCADE] Autogeneración de campañas/estrategias desactivada para el negocio: ${businessId}`);
      return;
    }

    // Evitar múltiples ejecuciones paralelas buscando si hay alguna notificación activa en estado PROCESSING
    const activeProcessing = await prisma.agentNotification.findFirst({
      where: {
        businessId,
        status: 'PROCESSING'
      }
    });
    if (activeProcessing) {
      console.log(`[CASCADE] Ya existe un agente procesando el diagnóstico para el negocio: ${businessId}. Cancelando ejecución paralela.`);
      return;
    }

    // Cooldown de 24 horas (1 generación al día)
    if (settings.lastCascadeGeneratedAt) {
      const lastRun = new Date(settings.lastCascadeGeneratedAt);
      const oneDayMs = 24 * 60 * 60 * 1000;
      if (Date.now() - lastRun.getTime() < oneDayMs) {
        console.log(`[CASCADE] Cooldown de 24 horas activo para el negocio: ${businessId}.`);
        return;
      }
    }

    // Comprobar reportes consolidados
    const reports = await prisma.analysisReport.findMany({
      where: {
        entityId: businessId,
        channel: 'CONSOLIDATED',
        status: 'COMPLETED'
      },
      orderBy: { completedAt: 'desc' }
    });

    if (reports.length === 0) {
      console.log('[CASCADE] No hay informes consolidados aún. Esperando...');
      await addAgentNotification(
        businessId, 
        "Agente de Análisis", 
        "Esperando que se complete el informe consolidado general para arrancar estrategias.", 
        "SCRAPING", 
        "PROCESSING"
      );
      return;
    }

    // Registrar la completitud del scraping
    await addAgentNotification(
      businessId, 
      "Agente de Análisis y Consolidación", 
      "Consolidación de análisis web y de competencia finalizada con éxito.", 
      "SCRAPING", 
      "COMPLETED"
    );

    // 2. Generar y guardar Estrategias de Marketing para alcanzar un mínimo de 3 sin borrar las existentes
    const existingStrategies = await prisma.marketingStrategy.findMany({
      where: { businessId }
    });
    const existingCount = existingStrategies.length;
    const savedStrategies = [...existingStrategies];

    if (existingCount < 3) {
      const needed = 3 - existingCount;
      console.log(`[CASCADE] Detectadas ${existingCount} estrategias. Generando ${needed} estrategias adicionales...`);
      await addAgentNotification(
        businessId, 
        "Agente de Diagnóstico y Estrategia", 
        `Detectadas ${existingCount} estrategias. Iniciando generación de ${needed} estrategias adicionales para alcanzar el mínimo de 3.`, 
        "DIAGNOSTIC", 
        "PROCESSING"
      );
      
      // Obtener los reportes individuales y detalles de competidores
      const businessReports = await prisma.analysisReport.findMany({
        where: { type: 'MY_BUSINESS', entityId: businessId, status: 'COMPLETED', NOT: { channel: 'CONSOLIDATED' } }
      });
      const businessReportsMap = new Map<string, typeof businessReports[number]>();
      businessReports.forEach((report: typeof businessReports[number]) => {
        const existing = businessReportsMap.get(report.channel);
        if (!existing || (report.completedAt && existing.completedAt && existing.completedAt < report.completedAt)) {
          businessReportsMap.set(report.channel, report);
        }
      });

      const competitors = await prisma.competitor.findMany({
        where: { businessId },
        select: { id: true, name: true },
        take: 3
      });

      const competitorReportsList: { competitorName: string; channel: string; data: unknown }[] = [];
      for (const comp of competitors) {
        const compReports = await prisma.analysisReport.findMany({
          where: { type: 'COMPETITOR', entityId: comp.id, status: 'COMPLETED' }
        });
        compReports.forEach((rep: typeof compReports[number]) => {
          let parsedData = rep.data;
          if (typeof rep.data === 'string') {
            try { parsedData = JSON.parse(rep.data); } catch(e) {}
          }
          competitorReportsList.push({ competitorName: comp.name || '', channel: rep.channel, data: parsedData });
        });
      }

      const context = {
        business: {
          name: business.name,
          description: business.description,
          industry: business.industry,
          website: business.website,
        },
        products: business.products,
        myScrapedChannels: Array.from(businessReportsMap.entries()).map(([channel, report]) => {
          let dataObj = report.data;
          if (typeof report.data === 'string') {
            try {
              dataObj = JSON.parse(report.data);
            } catch (e) {
              console.error('Error parsing report data:', e);
            }
          }
          return {
            channel,
            data: dataObj
          };
        }),
        competitorAnalysis: business.competitorGeneralReport,
        competitorScrapedDetails: competitorReportsList.slice(0, 3),
        isRefresh: true
      };

      // Llamada a IA para crear las estrategias adicionales detalladas
      const newStrategiesData = await generateStrategiesCascade(context, needed);
      
      // Registrar completitud del diagnóstico
      await addAgentNotification(
        businessId, 
        "Agente de Diagnóstico y Estrategia", 
        "Diagnóstico estratégico y redacción finalizada.", 
        "DIAGNOSTIC", 
        "COMPLETED"
      );

      // Guardar las nuevas estrategias adicionales en BBDD sin borrar nada
      for (let i = 0; i < newStrategiesData.length; i++) {
        const strat = newStrategiesData[i];
        const savedStrat = await prisma.marketingStrategy.create({
          data: {
            businessId,
            name: strat.name,
            description: strat.description,
            isActive: false, // Las adicionales inician inactivas
            objectives: strat.objectives || [],
            personas: strat.personas || [],
            funnelStages: strat.funnelStages || [],
            channels: strat.channels || [],
            contentPillars: strat.contentPillars || [],
          }
        });
        savedStrategies.push(savedStrat);
      }
      console.log(`[CASCADE] ${newStrategiesData.length} nuevas estrategias añadidas a la BBDD.`);
      
      await addAgentNotification(
        businessId, 
        "Agente de Growth & Estrategia", 
        `¡${newStrategiesData.length} nuevas estrategias maestras generadas y añadidas al panel!`, 
        "STRATEGY", 
        "COMPLETED"
      );
    } else {
      console.log(`[CASCADE] Ya existen ${existingCount} estrategias de marketing.`);
      await addAgentNotification(
        businessId, 
        "Agente de Growth & Estrategia", 
        `Ya tienes ${existingCount} estrategias en tu panel (mínimo de 3 cubierto).`, 
        "STRATEGY", 
        "COMPLETED"
      );
    }

    // 3. Generar Campañas de Marketing para alcanzar un mínimo de 3 sin borrar nada
    const existingCampaigns = await prisma.campaign.findMany({
      where: { businessId }
    });
    const campaignsCount = existingCampaigns.length;

    if (campaignsCount < 3) {
      const neededCampaigns = 3 - campaignsCount;
      console.log(`[CASCADE] Detectadas ${campaignsCount} campañas. Generando ${neededCampaigns} campañas adicionales...`);
      
      await addAgentNotification(
        businessId, 
        "Agente de Campañas de Marketing", 
        `Detectadas ${campaignsCount} campañas. Generando ${neededCampaigns} campañas automatizadas adicionales con IA...`, 
        "CAMPAIGN", 
        "PROCESSING"
      );

      // Generar campañas adicionales mapeadas a las estrategias disponibles
      const campaignsData = await generateCampaignsCascade(business, savedStrategies, neededCampaigns);

      for (const camp of campaignsData) {
        // Mapear a cuál estrategia pertenece
        const matchedStrategy = savedStrategies.find(s => s.name.toLowerCase().includes((camp.strategyKeyword || '').toLowerCase()));
        const strategyId = matchedStrategy ? matchedStrategy.id : savedStrategies[0]?.id;

        const createdCampaign = await prisma.campaign.create({
          data: {
            businessId,
            strategyId,
            name: camp.name,
            slug: camp.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
            description: camp.description,
            objective: (camp.objective as any) || "AWARENESS",
            startDate: new Date(camp.startDate),
            endDate: new Date(camp.endDate),
            status: "ACTIVE",
            channels: (camp.channels || ['FACEBOOK', 'INSTAGRAM', 'TIKTOK']).map((chan: any) => {
              if (typeof chan === 'object' && chan !== null) return chan;
              return {
                platform: chan,
                isActive: true,
                budget: Math.round((camp.budget || 100) / (camp.channels?.length || 3))
              };
            }),
            budget: camp.budget || 100,
            targeting: camp.targeting || {},
          }
        });

        // Crear planificación de publicaciones (Content) para todos los canales de la campaña
        if (camp.contents && Array.isArray(camp.contents)) {
          const campaignChannels = Array.isArray(createdCampaign.channels) 
            ? (createdCampaign.channels as any[]).map(c => c.platform || String(c))
            : ['INSTAGRAM'];

          for (const post of camp.contents) {
            for (const chan of campaignChannels) {
              const normalizedChannel = String(chan).toUpperCase();
              await prisma.content.create({
                data: {
                  campaignId: createdCampaign.id,
                  type: (post.type as any) || "POST",
                  title: post.title,
                  body: post.body || '',
                  caption: post.caption || '',
                  channel: (normalizedChannel as any) || "INSTAGRAM",
                  status: "SCHEDULED",
                  scheduledAt: new Date(post.scheduledAt),
                }
              });
            }
          }
        }
      }
      console.log(`[CASCADE] ${neededCampaigns} nuevas campañas guardadas exitosamente.`);
      
      await addAgentNotification(
        businessId, 
        "Agente de Campañas de Marketing", 
        `¡${neededCampaigns} nuevas campañas diseñadas y vinculadas correctamente a las estrategias!`, 
        "CAMPAIGN", 
        "COMPLETED"
      );
    } else {
      console.log(`[CASCADE] Ya existen ${campaignsCount} campañas.`);
      await addAgentNotification(
        businessId, 
        "Agente de Campañas de Marketing", 
        `Ya tienes ${campaignsCount} campañas activas y programadas en tu panel (mínimo de 3 cubierto).`, 
        "CAMPAIGN", 
        "COMPLETED"
      );
    }

    await addAgentNotification(
      businessId, 
      "Agente Editorial de Contenido", 
      "Publicaciones calendarizadas y distribuidas por día y red social en el Calendario Editorial.", 
      "CALENDAR", 
      "COMPLETED"
    );

    // Guardar fecha de última generación exitosa en settings
    await prisma.business.update({
      where: { id: businessId },
      data: {
        settings: {
          ...settings,
          lastCascadeGeneratedAt: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('[CASCADE] Error en el flujo de cascada:', error);
    await addAgentNotification(
      businessId, 
      "Agente de Automatización", 
      `Ocurrió un error inesperado al formular la estrategia: ${error instanceof Error ? error.message : String(error)}`, 
      "CALENDAR", 
      "FAILED"
    );
  }
}

interface CascadeContext {
  business: {
    name: string;
    description: string | null;
    industry: string | null;
    website: string | null;
  };
  products: unknown[];
  competitorScrapedDetails: unknown[];
}

interface Strategy {
  id: string;
  name: string;
  description: string | null;
}

// Generar estrategias adicionales usando IA o placeholders
async function generateStrategiesCascade(context: CascadeContext, count: number) {
  const openRouterKey = process.env.OPEN_ROUTER_KEY?.replace(/"/g, '').trim();
  if (!openRouterKey) return getFallbackStrategies(context, count);

  const hasWebsite = context.business.website && context.business.website.trim() !== "";

  try {
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
      system: `Eres un estratega digital de élite. Genera exactamente ${count} estrategias de marketing innovadoras, personalizadas y diferenciadas para el negocio en base al contexto dado.
Reglas clave:
1. El negocio tiene como objetivo primordial una de estas metas: Conversión (ventas / WhatsApp), Posicionamiento de marca (reconocimiento local) o Crecimiento en redes sociales.
2. ${hasWebsite ? 'El negocio tiene sitio web.' : 'El negocio NO tiene sitio web. Queda estrictamente PROHIBIDO sugerir canales de sitio web, blogs o landing pages. Prioriza WhatsApp y canales de redes sociales (Facebook, Instagram, TikTok, LinkedIn, YouTube).'}
3. Limita el análisis comparativo a máximo 3 competidores locales si los hay en el contexto.
4. Cumple exactamente con el esquema de base de datos para evitar campos vacíos o 'PENDIENTE':
   - Cada objetivo SMART debe estar completamente redactado. Todos los campos (specific, measurable, achievable, relevant, timeBound) son obligatorios y deben ser descripciones detalladas de al menos 5 caracteres.
   - En personas, demographics, painPoints y goals son cadenas de texto simples (para painPoints y goals, ponlas separadas por comas en una única cadena).
   - En funnelStages, crea etapas de embudo estándar (ej. awareness, consideration, decision, retention).`,
      prompt: `Genera ${count} estrategias para el negocio: ${context.business.name}.
Descripción: ${context.business.description}.
Industria: ${context.business.industry}.
Productos: ${JSON.stringify(context.products)}.
Detalles de Competidores analizados (máximo 3): ${JSON.stringify(context.competitorScrapedDetails)}.
Responde estrictamente con JSON en el formato especificado.`,
    });
    return object.strategies.slice(0, count);
  } catch (e) {
    console.error('[CASCADE] Error llamando a IA para estrategias, usando fallback:', e);
    return getFallbackStrategies(context, count);
  }
}

// Generar campañas adicionales basadas en las estrategias
export async function generateCampaignsCascade(business: { name: string }, strategies: Strategy[], count: number) {
  const openRouterKey = process.env.OPEN_ROUTER_KEY?.replace(/"/g, '').trim();
  if (!openRouterKey) return getFallbackCampaigns(business, strategies, count);

  try {
    const { object } = await generateObject({
      model: openrouter('google/gemini-2.5-flash'),
      schema: z.object({
        campaigns: z.array(z.object({
          name: z.string(),
          description: z.string(),
          strategyKeyword: z.string(), // para asociarla a cuál estrategia pertenece
          objective: z.enum(['AWARENESS', 'ENGAGEMENT', 'TRAFFIC', 'LEADS', 'SALES', 'RETENTION']),
          startDate: z.string(),
          endDate: z.string(),
          channels: z.array(z.string()),
          budget: z.number(),
          targeting: z.object({
            locations: z.array(z.string()),
            ageRange: z.array(z.number()),
            interests: z.array(z.string())
          }),
          contents: z.array(z.object({
            type: z.enum(['POST', 'STORY', 'REEL', 'VIDEO', 'CAROUSEL', 'EMAIL', 'AD']),
            title: z.string(),
            body: z.string(),
            caption: z.string(),
            channel: z.enum(['FACEBOOK', 'INSTAGRAM', 'TIKTOK', 'LINKEDIN']),
            scheduledAt: z.string() // fecha en ISOString
          }))
        }))
      }),
      system: `Eres un Director de Campañas Digitales. Basado en las estrategias maestras de marketing de este negocio, genera exactamente ${count} campañas de marketing detalladas asociadas a estas estrategias. Cada campaña debe contener entre 3 y 5 publicaciones sugeridas de contenido planificado con fechas distribuidas durante el próximo mes. Regla clave: Cada campaña generada debe tener activados exactamente los tres canales principales de difusión: 'FACEBOOK', 'INSTAGRAM' y 'TIKTOK' (es decir, el array 'channels' debe ser siempre exactamente ['FACEBOOK', 'INSTAGRAM', 'TIKTOK'] para todas las campañas sugeridas).`,
      prompt: `Crea ${count} campañas para ${business.name}. Estrategias disponibles:\n` + 
        strategies.map(s => `- Estrategia: "${s.name}". Desc: ${s.description}`).join('\n') +
        `\nGenera fechas coherentes de planificación en formato ISO que inicien desde hoy en adelante.`,
    });
    return object.campaigns.slice(0, count);
  } catch (e) {
    console.error('[CASCADE] Error llamando a IA para campañas, usando fallback:', e);
    return getFallbackCampaigns(business, strategies, count);
  }
}

function getFallbackStrategies(context: CascadeContext, count: number) {
  const name = context.business.name;
  const list = [
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
    },
    {
      name: "Campaña Viral de Growth & Contenido Corto",
      description: `Enfocada en capturar la atención de audiencias dinámicas mediante tendencias visuales en Reels y TikTok.`,
      objectives: [
        {
          name: "Aumento de visibilidad en Reels",
          specific: "Lograr mayor alcance de público local en video corto mediante tendencias del sector gastronómico",
          measurable: "Obtener un incremento acumulado de 30 mil reproducciones",
          achievable: "Publicando al menos 3 Reels a la semana usando audios y dinámicas virales",
          relevant: "Mejora el reconocimiento de marca local y atrae nuevos seguidores",
          timeBound: "Alcanzar el objetivo en 30 días",
          targetValue: 30000,
          currentValue: 0,
          unit: "reproducciones",
          deadline: "30 días",
          status: "PENDING"
        }
      ],
      personas: [
        {
          name: "Daniela la Trendy",
          demographics: "Mujer, 18-25 años, estudiante universitaria, activa en redes",
          painPoints: "Aburrimiento de marcas tradicionales, busca experiencias visuales llamativas",
          goals: "Descubrir lugares instagrameables y productos con excelente estética visual",
          communication: {
            tone: "Fresco, divertido y juvenil",
            topics: "Tendencias, antojos, humor gastronómico",
            triggers: "Videos altamente estéticos con música de moda"
          }
        }
      ],
      funnelStages: [
        {
          name: "Interés",
          description: "Generar engagement masivo compartiendo dinámicas de antojo y recetas secretas",
          contentTypes: ["Reels", "TikToks"],
          channels: ["TikTok", "Instagram"],
          goals: ["Crear interacción y conseguir compartidos"],
          kpis: ["Compartidos", "Guardados"],
          ctas: ["¡Comenta tu favorito!", "Guarda este video"]
        }
      ],
      channels: [
        {
          name: "TikTok",
          type: "SOCIAL" as const,
          isActive: true,
          frequency: "4 videos por semana",
          audienceSize: 0
        }
      ],
      contentPillars: ["Antojo Visual", "Humor en cocina"]
    },
    {
      name: "Fidelización de Clientes y Suscripción VIP",
      description: `Orientado a clientes recurrentes para generar compras programadas y dinámicas exclusivas.`,
      objectives: [
        {
          name: "Fidelización de clientes recurrentes",
          specific: "Establecer un programa de suscripción o club dulce para compras mensuales corporativas",
          measurable: "Incrementar la tasa de recompra mensual en un 15%",
          achievable: "Enviando ofertas exclusivas directas y opciones de pedidos recurrentes en WhatsApp",
          relevant: "Estabiliza el flujo de caja mediante ingresos predecibles",
          timeBound: "Lograr el objetivo en 90 días",
          targetValue: 15,
          currentValue: 0,
          unit: "%",
          deadline: "90 días",
          status: "PENDING"
        }
      ],
      personas: [
        {
          name: "Lorena la Organizadora",
          demographics: "Mujer, 28-40 años, Office Manager en mediana empresa",
          painPoints: "Estrés cotizando catering a última hora, falta de proveedores confiables",
          goals: "Tener un sistema de suscripción automatizado o menú simplificado para cumpleaños y eventos",
          communication: {
            tone: "Atento, corporativo y servicial",
            topics: "Catering corporativo, planificación de eventos, promociones grupales",
            triggers: "Facilidad de cotización por WhatsApp y facturación rápida"
          }
        }
      ],
      funnelStages: [
        {
          name: "Retención",
          description: "Mantener una relación constante con clientes recurrentes ofreciendo beneficios exclusivos",
          contentTypes: ["WhatsApp newsletters", "Mensajería directa"],
          channels: ["WhatsApp"],
          goals: ["Fidelizar a la base de datos de compradores activos"],
          kpis: ["Tasa de recompra"],
          ctas: ["Agendar pedido del mes", "Hablar con asesor"]
        }
      ],
      channels: [
        {
          name: "WhatsApp",
          type: "OTHER" as const,
          isActive: true,
          frequency: "Mensajería bajo demanda",
          audienceSize: 0
        }
      ],
      contentPillars: ["Fidelidad VIP", "Eventos y catering"]
    }
  ];
  return list.slice(0, count);
}

function getFallbackCampaigns(business: { name: string }, strategies: { name: string }[], count: number) {
  const baseDate = new Date();
  const getOffsetDate = (days: number) => {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + days);
    return d.toISOString();
  };

  const campaigns = [];
  const objectives = ["AWARENESS", "ENGAGEMENT", "SALES", "RETENTION", "TRAFFIC", "LEADS"];

  for (let i = 0; i < count; i++) {
    const stratIdx = i % strategies.length;
    const strat = strategies[stratIdx];
    const objective = objectives[i % objectives.length];

    campaigns.push({
      name: `Campaña ${objective.toLowerCase()} - ${strat.name.substring(0, 25)}`,
      description: `Campaña enfocada en impulsar el objetivo de ${objective.toLowerCase()} mediante la estrategia de ${strat.name}.`,
      strategyKeyword: strat.name,
      objective: objective,
      startDate: getOffsetDate(i * 5),
      endDate: getOffsetDate((i * 5) + 15),
      channels: ['INSTAGRAM', 'FACEBOOK'],
      budget: 150,
      contents: [
        {
          type: 'POST',
          title: `Publicación de lanzamiento - ${objective}`,
          body: `Lanzamiento oficial de la campaña orientada a ${objective.toLowerCase()}.`,
          caption: `¿Listos para una experiencia única? Síguenos y descubre la magia ✨ #marketing #${business.name.toLowerCase()}`,
          channel: 'INSTAGRAM',
          scheduledAt: getOffsetDate((i * 5) + 2)
        },
        {
          type: 'REEL',
          title: `Video detrás de cámaras - ${objective}`,
          body: `Muestra dinámica de cómo preparamos todo para ti.`,
          caption: `Así de fácil y con mucho amor preparamos todo lo que te gusta ❤️ #detrasdecamaras #${business.name.toLowerCase()}`,
          channel: 'INSTAGRAM',
          scheduledAt: getOffsetDate((i * 5) + 5)
        },
        {
          type: 'STORY',
          title: `Preguntas y Respuestas - ${objective}`,
          body: `Interacción directa para resolver dudas de la audiencia.`,
          caption: `¡Pregúntanos lo que quieras en este día especial!`,
          channel: 'FACEBOOK',
          scheduledAt: getOffsetDate((i * 5) + 8)
        }
      ]
    });
  }

  return campaigns;
}
