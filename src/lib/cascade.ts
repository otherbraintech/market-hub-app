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

export async function triggerCascadeGeneration(
  businessId: string, 
  force = false, 
  onlyStage?: 'STRATEGY' | 'CAMPAIGN' | 'CALENDAR',
  requestedStartDate?: string
) {
  console.log(`[CASCADE] Iniciando generación en cascada para el negocio: ${businessId} (force: ${force}, onlyStage: ${onlyStage}, requestedStartDate: ${requestedStartDate})`);
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
    if (!force && activeProcessing) {
      console.log(`[CASCADE] Ya existe un agente procesando el diagnóstico para el negocio: ${businessId}. Cancelando ejecución paralela.`);
      return;
    }

    // Cooldown de 24 horas (1 generación al día)
    if (!force && settings.lastCascadeGeneratedAt) {
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

    if (!force && reports.length === 0) {
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

    // 2. Generar Estrategia de Marketing (limpieza aislada por etapa)
    if (force && onlyStage === 'STRATEGY') {
      console.log(`[CASCADE] Limpiando SOLO estrategias previas para el negocio ${businessId}...`);
      await prisma.marketingStrategy.deleteMany({
        where: { businessId }
      });
    }

    const existingStrategies = await prisma.marketingStrategy.findMany({
      where: { businessId }
    });
    const existingCount = existingStrategies.length;
    const savedStrategies = [...existingStrategies];

    const needed = force ? 1 : (existingCount < 1 ? 1 - existingCount : 0);

    if (onlyStage !== 'CAMPAIGN' && onlyStage !== 'CALENDAR' && needed > 0) {
      console.log(`[CASCADE] Generando ${needed} estrategias...`);
      await addAgentNotification(
        businessId, 
        "Agente de Diagnóstico y Estrategia", 
        `Iniciando generación de ${needed} estrategias con IA.`, 
        "DIAGNOSTIC", 
        "PROCESSING"
      );
      
      // Obtener el reporte consolidado propio para extraer la propuesta de valor real
      const consolidatedReport = await prisma.analysisReport.findFirst({
        where: { type: 'MY_BUSINESS', entityId: businessId, channel: 'CONSOLIDATED', status: 'COMPLETED' }
      });
      let valueProp = "";
      let generatedBuyerPersonas: any[] = [];
      if (consolidatedReport && consolidatedReport.data) {
        try {
          const parsed = typeof consolidatedReport.data === 'string' 
            ? JSON.parse(consolidatedReport.data) 
            : consolidatedReport.data;
          valueProp = parsed.marketPosition?.value_proposition || parsed.valueProposition || parsed.executiveSummary || "";
          generatedBuyerPersonas = parsed.buyerPersonas || [];
        } catch (e) {
          console.error("Error parsing consolidated report for value proposition:", e);
        }
      }

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
          valueProposition: valueProp,
          targetAudience: business.targetAudience,
          onboardingStrategy: business.onboardingStrategy,
        },
        buyerPersonas: generatedBuyerPersonas,
        products: business.products,
        myScrapedChannels: Array.from(businessReportsMap.entries()).map(([channel, report]) => {
          let dataObj = report.data;
          if (typeof report.data === 'string') {
            try { dataObj = JSON.parse(report.data); } catch (e) {}
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
      const hasActive = existingStrategies.some(s => s.isActive);
      for (let i = 0; i < newStrategiesData.length; i++) {
        const strat = newStrategiesData[i];
        const savedStrat = await prisma.marketingStrategy.create({
          data: {
            businessId,
            name: strat.name,
            description: strat.description,
            isActive: !hasActive && i === 0, // La primera se activa si no hay ninguna previa activa
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
    
    if (onlyStage === 'STRATEGY') {
      console.log(`[CASCADE] Finalizando etapa de estrategia de forma aislada para el negocio: ${businessId}`);
      return;
    }

    // Si solo regeneramos CALENDARIO: saltar campaña y estrategia, solo limpiar y regenerar contenidos
    if (onlyStage === 'CALENDAR') {
      console.log(`[CASCADE] Regenerando SOLO el calendario de contenidos para el negocio: ${businessId}`);
      
      // Borrar solo los contenidos existentes
      await prisma.content.deleteMany({
        where: { campaign: { businessId } }
      });

      // Tomar campañas existentes
      const existingCampaignsForCal = await prisma.campaign.findMany({
        where: { businessId }
      });

      if (existingCampaignsForCal.length === 0) {
        console.log(`[CASCADE] No hay campañas existentes para regenerar el calendario.`);
        await addAgentNotification(businessId, "Agente Editorial", "No se encontraron campañas para generar el calendario. Genera una campaña primero.", "CALENDAR", "FAILED");
        return;
      }

      await addAgentNotification(businessId, "Agente Editorial de Contenido", "Regenerando distribución de contenidos y publicaciones en el calendario multicanal...", "CALENDAR", "PROCESSING");

      // Regenerar contenidos para cada campaña existente
      for (const campaign of existingCampaignsForCal) {
        const campaignChannels = Array.isArray(campaign.channels)
          ? (campaign.channels as any[]).map((c: any) => c.platform || String(c))
          : ['INSTAGRAM'];
        
        // Re-generar los contenidos de la campaña usando IA
        const contentsData = await generateCalendarContentsCascade(business, savedStrategies, campaign);
        
        for (const post of contentsData) {
          for (const chan of campaignChannels) {
            const normalizedChannel = String(chan).toUpperCase();
            await prisma.content.create({
              data: {
                campaignId: campaign.id,
                type: (post.type as any) || "POST",
                title: post.title,
                body: post.body || '',
                caption: post.caption || '',
                promptUsed: post.promptUsed || '',
                channel: (normalizedChannel as any) || "INSTAGRAM",
                status: "SCHEDULED",
                scheduledAt: new Date(post.scheduledAt),
              }
            });
          }
        }
      }

      await addAgentNotification(businessId, "Agente Editorial de Contenido", "Calendario editorial regenerado con éxito.", "CALENDAR", "COMPLETED");
      return;
    }

    // 3. Generar Campañas de Marketing (limpieza aislada por etapa)
    if (force && onlyStage === 'CAMPAIGN') {
      console.log(`[CASCADE] Limpiando SOLO campañas y contenidos previos para el negocio ${businessId}...`);
      await prisma.content.deleteMany({
        where: { campaign: { businessId } }
      });
      await prisma.campaign.deleteMany({
        where: { businessId }
      });
    }

    const existingCampaigns = await prisma.campaign.findMany({
      where: { businessId }
    });
    const campaignsCount = existingCampaigns.length;

    const neededCampaigns = force ? 1 : (campaignsCount < 1 ? 1 - campaignsCount : 0);

    if (neededCampaigns > 0) {
      console.log(`[CASCADE] Generando ${neededCampaigns} campañas...`);
      
      await addAgentNotification(
        businessId, 
        "Agente de Campañas de Marketing", 
        `Iniciando generación de ${neededCampaigns} campañas automatizadas con IA...`, 
        "CAMPAIGN", 
        "PROCESSING"
      );

      // Generar campañas adicionales mapeadas a las estrategias disponibles
      const campaignsData = await generateCampaignsCascade(business, savedStrategies, neededCampaigns, requestedStartDate);

      for (const camp of campaignsData) {
        // Mapear a cuál estrategia pertenece
        const matchedStrategy = savedStrategies.find(s => s.name.toLowerCase().includes((camp.strategyKeyword || '').toLowerCase()));
        const strategyId = matchedStrategy ? matchedStrategy.id : savedStrategies[0]?.id;

        // Calcular fechas en base a la fecha de inicio solicitada por el usuario de forma segura contra desfasajes de zona horaria (UTC vs Local)
        let finalStartDate: Date;
        if (requestedStartDate) {
          const [year, month, day] = requestedStartDate.split('-').map(Number);
          finalStartDate = new Date(year, month - 1, day, 12, 0, 0);
        } else {
          finalStartDate = new Date(camp.startDate);
        }
        const finalEndDate = new Date(finalStartDate.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 días

        const createdCampaign = await prisma.campaign.create({
          data: {
            businessId,
            strategyId,
            name: camp.name,
            slug: camp.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
            description: camp.description,
            objective: (camp.objective as any) || "AWARENESS",
            startDate: finalStartDate,
            endDate: finalEndDate,
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
                  promptUsed: post.promptUsed || '',
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
    valueProposition?: string | null;
    targetAudience?: any;
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
2. REGLA ESTRICTA DE CANALES PERMITIDOS: Queda terminantemente prohibido sugerir o incluir canales de distribución como 'Sitio Web', 'Blog', 'Email Marketing', 'Google Ads' o similares en el array 'channels'. Cada estrategia generada DEBE proponer única y exclusivamente tres canales en el array 'channels': 'FACEBOOK', 'INSTAGRAM' y 'TIKTOK' (es decir, el array de canales propuestos debe tener exactamente y únicamente estos 3 elementos, mapeándolos en minúsculas o mayúsculas de forma uniforme como FACEBOOK, INSTAGRAM y TIKTOK).
3. Todas las recomendaciones deben estar dirigidas a pautas y contenidos orgánicos dentro de Facebook, Instagram y TikTok.
4. Limita el análisis comparativo a máximo 3 competidores locales si los hay en el contexto.
5. Cumple exactamente con el esquema de base de datos para evitar campos vacíos o 'PENDIENTE':
   - Cada objetivo SMART debe estar completamente redactado. Todos los campos (specific, measurable, achievable, relevant, timeBound) son obligatorios y deben ser descripciones detalladas de al menos 5 caracteres.
   - En personas, demographics, painPoints y goals son cadenas de texto simples (para painPoints y goals, ponlas separadas por comas en una única cadena).
   - En funnelStages, crea etapas de embudo estándar (ej. awareness, consideration, decision, retention).
6. REGLA ESTRICTA DE NO INVENTAR/ALUCINAR PRODUCTOS: Bajo ninguna circunstancia inventes, agregues, combines, asumas o sugieras productos, servicios o variaciones de los mismos que no estén expresamente mencionados en la descripción del negocio o en su lista de productos. Limítate única y exclusivamente a los productos reales proporcionados.
7. REQUISITO OBLIGATORIO DE 6 BUYER PERSONAS: Cada estrategia generada DEBE contener exactamente 6 perfiles de Buyer Personas detallados en el array 'personas' (ampliando o desglosando el público objetivo en 6 arquetipos locales hiper-específicos). Reutiliza y expande los buyer personas pre-generados del Banco de Datos si existen hasta completar exactamente 6 perfiles únicos (manteniendo su nombre, demographics, goals, painPoints y communication tone/topics/triggers).
   - Los dolores ('painPoints') y metas ('goals') del buyer persona deben estar estrechamente conectados con los productos reales del negocio y su propuesta de valor.
   - No generes nombres de fantasía absurdos o no profesionales. Crea arquetipos creíbles e hiper-alineados con la geografía e industria del negocio.`,
      prompt: `Genera ${count} estrategias para el negocio: ${context.business.name}.
Detalles del Negocio:
- Descripción: ${context.business.description || "No detallada"}.
- Industria: ${context.business.industry || "No especificada"}.
- Propuesta de Valor Real: ${context.business.valueProposition || "No definida"}.
- Público Objetivo Configurado (Demografía y Psicografía a usar obligatoriamente): ${JSON.stringify(context.business.targetAudience || "No definido")}.
${(context.business as any).onboardingStrategy ? `- ESTRATEGIA DIRECTA DEL CLIENTE (PRIORIDAD ALTA): Utiliza estos datos como los pilares base para los objetivos y personas generadas: ${JSON.stringify((context.business as any).onboardingStrategy)}.` : ""}
- Buyer Personas Pre-generados en Banco de Datos (Reutilizar OBLIGATORIAMENTE si existen): ${JSON.stringify((context as any).buyerPersonas || [])}.
- Catálogo de Productos Reales: ${JSON.stringify(context.products)}.
- Datos e informes de competidores: ${JSON.stringify(context.competitorScrapedDetails)}.

Analiza detalladamente los puntos anteriores. Genera las estrategias y los buyer personas basándote fielmente en la ESTRATEGIA DIRECTA DEL CLIENTE si existe. Si hay 'Buyer Personas Pre-generados', copia sus campos al pie de la letra para mantener consistencia absoluta entre la etapa de base de datos y la estrategia. Responde estrictamente con JSON en el formato especificado.`,
    });
    return object.strategies.slice(0, count);
  } catch (e) {
    console.error('[CASCADE] Error llamando a IA para estrategias, usando fallback:', e);
    return getFallbackStrategies(context, count);
  }
}

// Generar campañas adicionales basadas en las estrategias
export async function generateCampaignsCascade(
  business: { name: string; onboardingStrategy?: any }, 
  strategies: Strategy[], 
  count: number,
  startDateRequested?: string
) {
  const openRouterKey = process.env.OPEN_ROUTER_KEY?.replace(/"/g, '').trim();
  if (!openRouterKey) return getFallbackCampaigns(business, strategies, count);

  const baseDateStr = startDateRequested || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Mañana por defecto

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
            promptUsed: z.string().describe("AI image generator prompt in English describing the visual design, style and composition"),
            channel: z.enum(['FACEBOOK', 'INSTAGRAM', 'TIKTOK', 'LINKEDIN']),
            scheduledAt: z.string() // fecha en ISOString
          }))
        }))
      }),
      system: `Eres un Director de Campañas Digitales. Basado en las estrategias maestras de marketing de este negocio, genera exactamente ${count} campañas de marketing detalladas asociadas a estas estrategias. Cada campaña debe contener exactamente 8 publicaciones sugeridas de contenido planificado distribuidas a lo largo del próximo mes.
Reglas clave:
1. Cada campaña generada debe durar exactamente 30 días (1 mes completo). Establece la fecha de inicio ('startDate') en "${baseDateStr}" y la fecha de finalización ('endDate') exactamente 30 días después.
2. Cada campaña debe tener activados exactamente los tres canales principales de difusión: 'FACEBOOK', 'INSTAGRAM' y 'TIKTOK' (es decir, el array 'channels' debe ser siempre exactamente ['FACEBOOK', 'INSTAGRAM', 'TIKTOK'] para todas las campañas sugeridas). Las fechas generadas deben estar situadas en el año ${new Date().getFullYear()}.
3. Para cumplir con la Regla 60-25-15 en la frecuencia baja (8 publicaciones mensuales totales), debes generar exactamente 8 publicaciones de contenidos en el array 'contents'. Estas 8 publicaciones deben estar distribuidas equitativamente y espaciadas uniformemente a lo largo de los 30 días de duración de la campaña (por ejemplo, con una separación de 3 o 4 días entre cada publicación, comenzando desde "${baseDateStr}"):
   - 5 publicaciones de tipo 'REEL' o 'VIDEO' (equivalente al 60% de videos cortos)
   - 2 publicaciones de tipo 'CAROUSEL' (equivalente al 25% de carruseles)
   - 1 publicación de tipo 'POST' (equivalente al 15% de imágenes estáticas)
4. Para cada publicación en 'contents', debes redactar un 'promptUsed' detallado en inglés de al menos 15 palabras para generadores de imágenes por IA como Midjourney o DALL-E, que describa la composición visual, estilo fotográfico premium y colores correspondientes.
5. REGLA ESTRICTA DE NO INVENTAR/ALUCINAR PRODUCTOS: Queda terminantemente prohibido inventar, agregar, deducir o sugerir productos, servicios o variantes de productos que no estén explícitamente declarados en la información del negocio. No combines ingredientes ni inventes recetas nuevas (ej. no inventes 'panqueque de chuño'). Promociona única y exclusivamente los productos descritos.
6. REGLA DE PRESUPUESTO REALISTA (BOLIVIA/LATAM): El presupuesto sugerido de publicidad ('budget') para cada campaña debe ser moderado y adaptado a pymes en Bolivia. Debe situarse estrictamente en un rango de entre $15 y $75 USD para toda la campaña (por ejemplo, $30, $45 o $60 USD), distribuyéndose proporcionalmente entre Facebook, Instagram y TikTok Ads. Evita presupuestos altos e irreales de $200, $300 o $500 USD.`,
      prompt: `Crea ${count} campañas para ${business.name}. Estrategias disponibles:\n` + 
        strategies.map(s => `- Estrategia: "${s.name}". Desc: ${s.description}`).join('\n') +
        (business.onboardingStrategy ? `\nESTRATEGIA DIRECTA DEL CLIENTE (PRIORIDAD ALTA - usar como base para targeting, canales de conversión y tono de copies):\n${JSON.stringify(business.onboardingStrategy)}` : '') +
        `\nGenera exactamente 8 publicaciones (5 videos/reels, 2 carruseles y 1 post) con fechas coherentes de planificación en formato ISO que inicien exactamente desde "${baseDateStr}" en adelante, distribuidas a lo largo de 30 días en el año ${new Date().getFullYear()}.`,
    });
    return object.campaigns.slice(0, count);
  } catch (e) {
    console.error('[CASCADE] Error llamando a IA para campañas, usando fallback:', e);
    return getFallbackCampaigns(business, strategies, count);
  }
}

// Regenera SOLO los contenidos/publicaciones para una campaña existente (sin tocar la campaña)
export async function generateCalendarContentsCascade(
  business: { name: string; onboardingStrategy?: any },
  strategies: Strategy[],
  campaign: { id: string; name: string; description: string | null; channels: any; objective: string }
) {
  const openRouterKey = process.env.OPEN_ROUTER_KEY?.replace(/"/g, '').trim();
  
  const campaignChannels = Array.isArray(campaign.channels)
    ? (campaign.channels as any[]).map((c: any) => c.platform || String(c))
    : ['INSTAGRAM'];

  if (!openRouterKey) {
    // Fallback: generar contenidos básicos
    return getFallbackCalendarContents(business, campaign, campaignChannels);
  }

  try {
    const { object } = await generateObject({
      model: openrouter('google/gemini-2.5-flash'),
      schema: z.object({
        contents: z.array(z.object({
          type: z.enum(['POST', 'STORY', 'REEL', 'VIDEO', 'CAROUSEL', 'EMAIL', 'AD']),
          title: z.string(),
          body: z.string(),
          caption: z.string(),
          promptUsed: z.string().describe("AI image generator prompt in English describing the visual design, style and composition"),
          scheduledAt: z.string()
        }))
      }),
      system: `Eres un Director Editorial y de Contenidos. Tu tarea es regenerar SOLO las publicaciones del calendario editorial para una campaña existente.
Genera exactamente 8 publicaciones variadas distribuidas equitativamente a lo largo del próximo mes (30 días).
Reglas clave:
1. Para cumplir con la Regla 60-25-15 en la frecuencia baja (8 publicaciones mensuales totales), debes generar exactamente 8 publicaciones de contenidos. Las fechas de estas publicaciones deben distribuirse equitativamente a lo largo de los 30 días de la campaña (con una separación de aproximadamente 3 o 4 días entre posts):
   - 5 publicaciones de tipo 'REEL' o 'VIDEO' (60% de videos cortos)
   - 2 publicaciones de tipo 'CAROUSEL' (25% de carruseles)
   - 1 publicación de tipo 'POST' (15% de imágenes estáticas)
2. Para cada publicación, redacta un 'promptUsed' detallado en inglés de al menos 15 palabras para Midjourney/DALL-E describiendo composición visual y estilo.
3. NO inventes productos que no estén en la información del negocio.
4. Las fechas deben empezar desde hoy (${new Date().toISOString().split('T')[0]}) en adelante, distribuidas en los próximos 30 días, año ${new Date().getFullYear()}.`,
      prompt: `Regenera las publicaciones del calendario para:
Negocio: ${business.name}
Campaña: "${campaign.name}" - ${campaign.description || 'Sin descripción'}
Objetivo de la campaña: ${campaign.objective}
Canales activos: ${campaignChannels.join(', ')}
${strategies.length > 0 ? `Estrategia base: "${strategies[0].name}" - ${strategies[0].description}` : ''}
${business.onboardingStrategy ? `ESTRATEGIA DIRECTA DEL CLIENTE (PRIORIDAD ALTA - alinear tono, targeting y copies con estos datos):\n${JSON.stringify(business.onboardingStrategy)}` : ''}
Genera exactamente 8 publicaciones (5 videos/reels, 2 carruseles y 1 post) distribuidas de forma espaciada durante los próximos 30 días para esta campaña.`,
    });
    return object.contents;
  } catch (e) {
    console.error('[CASCADE] Error llamando a IA para calendario, usando fallback:', e);
    return getFallbackCalendarContents(business, campaign, campaignChannels);
  }
}

function getFallbackCalendarContents(
  business: { name: string },
  campaign: { name: string; description: string | null },
  channels: string[]
) {
  const today = new Date();
  return [
    {
      type: 'POST' as const,
      title: `Conoce lo mejor de ${business.name}`,
      body: `Descubre nuestra selección especial en ${business.name}.`,
      caption: `✨ Lo mejor de ${business.name} te espera. ¡No te lo pierdas! #${business.name.replace(/\s/g, '')}`,
      promptUsed: `Professional product photography for ${business.name}, clean white background, premium lighting, commercial style`,
      scheduledAt: new Date(today.getTime() + 2 * 86400000).toISOString()
    },
    {
      type: 'STORY' as const,
      title: `Detrás de escena de ${business.name}`,
      body: `Un vistazo al proceso creativo.`,
      caption: `👀 Así trabajamos en ${business.name}. ¿Te gusta lo que ves? #BehindTheScenes`,
      promptUsed: `Behind the scenes candid shot of a small business workspace, warm ambient lighting, authentic feel, Instagram story format`,
      scheduledAt: new Date(today.getTime() + 5 * 86400000).toISOString()
    },
    {
      type: 'REEL' as const,
      title: `Tips rápidos con ${business.name}`,
      body: `Contenido dinámico y educativo.`,
      caption: `🎬 Tips que no te puedes perder de ${business.name}. ¡Guarda este reel! #Tips #${business.name.replace(/\s/g, '')}`,
      promptUsed: `Dynamic social media reel thumbnail, vibrant colors, bold text overlay, engaging visual for ${business.name}`,
      scheduledAt: new Date(today.getTime() + 10 * 86400000).toISOString()
    }
  ];
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
      targeting: {
        locations: ['Local'],
        ageRange: [18, 65],
        interests: ['Interés general']
      },
      contents: [
        {
          type: 'POST',
          title: `Publicación de lanzamiento - ${objective}`,
          body: `Lanzamiento oficial de la campaña orientada a ${objective.toLowerCase()}.`,
          caption: `¿Listos para una experiencia única? Síguenos y descubre la magia ✨ #marketing #${business.name.toLowerCase()}`,
          promptUsed: `A professional food photography shot of premium desserts, high-end kitchen, warm direct natural light, cinematic, photorealistic, 8k --ar 4:5`,
          channel: 'INSTAGRAM',
          scheduledAt: getOffsetDate((i * 5) + 2)
        },
        {
          type: 'REEL',
          title: `Video detrás de cámaras - ${objective}`,
          body: `Muestra dinámica de cómo preparamos todo para ti.`,
          caption: `Así de fácil y con mucho amor preparamos todo lo que te gusta ❤️ #detrasdecamaras #${business.name.toLowerCase()}`,
          promptUsed: `A behind-the-scenes premium bakery video frame showing a chef decorating a cake, soft focus background, warm cozy lighting, cinematic feel --ar 9:16`,
          channel: 'INSTAGRAM',
          scheduledAt: getOffsetDate((i * 5) + 5)
        },
        {
          type: 'STORY',
          title: `Preguntas y Respuestas - ${objective}`,
          body: `Interacción directa para resolver dudas de la audiencia.`,
          caption: `¡Pregúntanos lo que quieras en este día especial!`,
          promptUsed: `A minimalist Instagram story background for a Q&A session, elegant pastel colors, subtle bakery utensils outlines, clean aesthetic --ar 9:16`,
          channel: 'FACEBOOK',
          scheduledAt: getOffsetDate((i * 5) + 8)
        }
      ]
    });
  }

  return campaigns;
}
