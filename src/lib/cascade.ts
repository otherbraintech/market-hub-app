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
    if (status === "COMPLETED" || status === "FAILED") {
      await prisma.agentNotification.updateMany({
        where: { businessId, step, status: "PROCESSING" },
        data: { status }
      }).catch(() => {});
    }
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

    const shouldGenerateStrategy = onlyStage === 'STRATEGY';
    const needed = 1;

    if (shouldGenerateStrategy && needed > 0) {
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

    // 3. Generar Campaña de Marketing (Regla Estricta: 1 sola campaña por negocio)
    const existingCampaigns = await prisma.campaign.findMany({
      where: { businessId }
    });

    if (force || onlyStage === 'CAMPAIGN' || existingCampaigns.length === 0) {
      console.log(`[CASCADE] Reemplazando campañas previas para mantener exactamente 1 sola campaña activa en el negocio ${businessId}...`);
      await prisma.content.deleteMany({
        where: { campaign: { businessId } }
      });
      await prisma.campaign.deleteMany({
        where: { businessId }
      });

      console.log(`[CASCADE] Generando 1 campaña principal con IA...`);
      
      await addAgentNotification(
        businessId, 
        "Agente de Campañas de Marketing", 
        "Iniciando generación de 1 campaña principal automatizada con IA...", 
        "CAMPAIGN", 
        "PROCESSING"
      );

      // Generar exactamente 1 campaña (sin publicaciones automáticas de calendario)
      const campaignsData = await generateCampaignsCascade(business, savedStrategies, 1, requestedStartDate);

      for (const camp of campaignsData) {
        const matchedStrategy = savedStrategies.find(s => s.name.toLowerCase().includes((camp.strategyKeyword || '').toLowerCase()));
        const strategyId = matchedStrategy ? matchedStrategy.id : savedStrategies[0]?.id;

        let finalStartDate: Date;
        if (requestedStartDate) {
          const [year, month, day] = requestedStartDate.split('-').map(Number);
          finalStartDate = new Date(year, month - 1, day, 12, 0, 0);
        } else {
          finalStartDate = new Date(camp.startDate);
        }
        const finalEndDate = new Date(finalStartDate.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 días

        await prisma.campaign.create({
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
      }

      console.log(`[CASCADE] 1 campaña principal guardada exitosamente.`);
      
      await addAgentNotification(
        businessId, 
        "Agente de Campañas de Marketing", 
        "¡1 campaña principal diseñada y vinculada correctamente a la estrategia!", 
        "CAMPAIGN", 
        "COMPLETED"
      );
    } else {
      console.log(`[CASCADE] Ya existe 1 campaña activa para el negocio ${businessId}.`);
      await addAgentNotification(
        businessId, 
        "Agente de Campañas de Marketing", 
        "Ya tienes 1 campaña principal activa y programada en tu panel.", 
        "CAMPAIGN", 
        "COMPLETED"
      );
    }

    // Actualizar settings del negocio sin autoejecutar el calendario
    await prisma.business.update({
      where: { id: businessId },
      data: {
        settings: {
          ...settings,
          lastCascadeGeneratedAt: new Date().toISOString()
        }
      }
    });

    console.log(`[CASCADE] Etapa de campaña completada. El calendario permanece inactivo hasta que el usuario lo solicite de forma manual.`);

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

  let trendsContext = "";
  try {
    const { getUnifiedTrendsContext } = await import("@/lib/services/ob-tendencias");
    trendsContext = await getUnifiedTrendsContext(context.business.industry || "general", "tiktok", "BO");
  } catch (e) {
    console.warn("[CASCADE] No se pudo obtener tendencias dinámicas para la estrategia:", e);
  }

  try {
    const prompt = `Genera ${count} estrategias para el negocio: ${context.business.name}.
${trendsContext ? `${trendsContext}\n` : ""}
Detalles del Negocio:
- Descripción: ${context.business.description || "No detallada"}.
- Industria: ${context.business.industry || "No especificada"}.
- Propuesta de Valor Real: ${context.business.valueProposition || "No definida"}.
- Público Objetivo Configurado (Demografía y Psicografía a usar obligatoriamente): ${JSON.stringify(context.business.targetAudience || "No definido")}.
${(context.business as any).onboardingStrategy ? `- ESTRATEGIA DIRECTA DEL CLIENTE (PRIORIDAD ALTA): Utiliza estos datos como los pilares base para los objetivos y personas generadas: ${JSON.stringify((context.business as any).onboardingStrategy)}.` : ""}
- Buyer Personas Pre-generados en Banco de Datos (Reutilizar OBLIGATORIAMENTE si existen): ${JSON.stringify((context as any).buyerPersonas || [])}.
- Catálogo de Productos Reales: ${JSON.stringify(context.products)}.
- Datos e informes de competidores (Scraping): ${JSON.stringify(context.competitorScrapedDetails)}.

Analiza detalladamente los puntos anteriores. Genera las estrategias y los buyer personas basándote fielmente en la ESTRATEGIA DIRECTA DEL CLIENTE si existe. Si hay 'Buyer Personas Pre-generados', copia sus campos al pie de la letra para mantener consistencia absoluta entre la etapa de base de datos y la estrategia. Responde estrictamente con JSON en el formato especificado.`;

    const { object } = await generateObject({
      model: openrouter('google/gemini-2.5-flash:free'),
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
   - Los dolores ('painPoints') y metas ('goals') del buyer persona me deben estar estrechamente conectados con los productos reales del negocio y su propuesta de valor.
   - No generes nombres de fantasía absurdos o no profesionales. Crea arquetipos creíbles e hiper-alineados con la geografía e industria del negocio.`,
      prompt: prompt,
    });
    return object.strategies.slice(0, count);
  } catch (e) {
    console.error('[CASCADE] Error llamando a IA para estrategias, usando fallback:', e);
    return getFallbackStrategies(context, count);
  }
}

// Obtener límites y desglose de publicaciones basados en el plan de suscripción activo del usuario
export async function getUserPlanPublicationLimits(businessIdOrUserId?: string, userIdExplicit?: string) {
  try {
    let userId = userIdExplicit;

    if (!userId && businessIdOrUserId) {
      const business = await prisma.business.findUnique({
        where: { id: businessIdOrUserId },
        select: { userId: true }
      });
      if (business?.userId) {
        userId = business.userId;
      } else {
        userId = businessIdOrUserId;
      }
    }

    let userPlanSlug = "free";
    let userPlanName = "Plan Inicial";

    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { plan: true }
      });
      if (user?.plan) {
        userPlanSlug = user.plan.toLowerCase();
        userPlanName = user.plan;
      }
    }

    // Consultar tabla SubscriptionPlan en Prisma
    const dbPlan = await prisma.subscriptionPlan.findFirst({
      where: {
        OR: [
          { slug: userPlanSlug },
          { name: { equals: userPlanSlug, mode: 'insensitive' } }
        ]
      }
    });

    let postsPerMonth = 8;
    let postsPerWeek = "2 publicaciones/semana";

    if (dbPlan) {
      postsPerMonth = dbPlan.postsPerMonth || 8;
      postsPerWeek = dbPlan.postsPerWeek || `${Math.round(postsPerMonth / 4)} publicaciones/semana`;
      userPlanName = dbPlan.name;
    } else {
      if (userPlanSlug.includes("premium")) {
        postsPerMonth = 22;
        postsPerWeek = "5-6 publicaciones/semana";
        userPlanName = "Premium";
      } else if (userPlanSlug.includes("agencia") || userPlanSlug.includes("enterprise")) {
        postsPerMonth = 30;
        postsPerWeek = "7+ publicaciones/semana";
        userPlanName = "Agencia";
      } else if (userPlanSlug.includes("profesional") || userPlanSlug.includes("growth") || userPlanSlug.includes("starter")) {
        postsPerMonth = 16;
        postsPerWeek = "4 publicaciones/semana";
        userPlanName = "Profesional";
      } else {
        postsPerMonth = 8;
        postsPerWeek = "2 publicaciones/semana";
        userPlanName = "Free (Inicial)";
      }
    }

    const reelsCount = Math.max(1, Math.round(postsPerMonth * 0.60));
    const carouselsCount = Math.max(1, Math.round(postsPerMonth * 0.25));
    const staticPostsCount = Math.max(1, postsPerMonth - reelsCount - carouselsCount);

    return {
      planName: userPlanName,
      postsPerMonth,
      postsPerWeek,
      reelsCount,
      carouselsCount,
      staticPostsCount
    };
  } catch (e) {
    console.error('[CASCADE] Error en getUserPlanPublicationLimits:', e);
    return {
      planName: "Estándar",
      postsPerMonth: 8,
      postsPerWeek: "2 publicaciones/semana",
      reelsCount: 5,
      carouselsCount: 2,
      staticPostsCount: 1
    };
  }
}

// Generar campañas adicionales basadas en las estrategias
export async function generateCampaignsCascade(
  business: { id?: string; name: string; onboardingStrategy?: any; userId?: string | null }, 
  strategies: Strategy[], 
  count: number,
  startDateRequested?: string
) {
  const openRouterKey = process.env.OPEN_ROUTER_KEY?.replace(/"/g, '').trim();
  if (!openRouterKey) return getFallbackCampaigns(business, strategies, count);

  const baseDateStr = startDateRequested || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const planLimits = await getUserPlanPublicationLimits(business.id, business.userId || undefined);
  console.log(`[CASCADE] Generando campaña acorde al Plan de Suscripción: "${planLimits.planName}" (${planLimits.postsPerMonth} publicaciones/mes, ${planLimits.postsPerWeek})`);

  try {
    const { object } = await generateObject({
      model: openrouter('google/gemini-2.5-flash:free'),
      schema: z.object({
        campaigns: z.array(z.object({
          name: z.string(),
          description: z.string(),
          strategyKeyword: z.string(),
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
            body: z.string().describe("Guion estructurado paso a paso del contenido, desglose por slides o storyboard visual"),
            caption: z.string().describe("Copy completo e íntegro para redes sociales en español con gancho inicial, viñetas con emojis, CTA claro y hashtags"),
            promptUsed: z.string().describe("AI image generator prompt en INGLÉS hiper-detallado de al menos 25 palabras para Midjourney o Flux"),
            channel: z.enum(['FACEBOOK', 'INSTAGRAM', 'TIKTOK']),
            scheduledAt: z.string()
          }))
        }))
      }),
      system: `Eres un Director Editorial y de Contenidos Digitales de élite. Basado en las estrategias maestras de marketing de este negocio y en su PLAN DE SUSCRIPCIÓN ACTIVO, genera exactamente ${count} campañas de marketing altamente efectivas y detalladas.

PLAN DE SUSCRIPCIÓN ACTIVO DEL USUARIO:
- Plan Contratado: ${planLimits.planName}
- Cuota de Publicaciones del Plan: Exactamente ${planLimits.postsPerMonth} publicaciones en los próximos 30 días (${planLimits.postsPerWeek}).
- Distribución Estratégica Obligatoria por Formato:
  * ${planLimits.reelsCount} publicaciones de tipo 'REEL' o 'VIDEO' (60%)
  * ${planLimits.carouselsCount} publicaciones de tipo 'CAROUSEL' (25%)
  * ${planLimits.staticPostsCount} publicaciones de tipo 'POST' (15%)

REGLAS DE CALIDAD OBLIGATORIAS PARA CADA PUBLICACIÓN:
1. CANALES PERMITIDOS: Los únicos tres canales de difusión permitidos son 'FACEBOOK', 'INSTAGRAM' y 'TIKTOK'. Asigna única y exclusivamente estos tres valores en el campo 'channel'.
2. COPY COMPLETO Y PROFESIONAL ('caption'):
   - Cada 'caption' debe ser un copy 100% completo, redactado en español persuasivo y profesional.
   - Debe iniciar obligatoriamente con un GANCHO IMPACTANTE en la primera línea para capturar la atención en los primeros 3 segundos.
   - Debe incluir un cuerpo explicativo estructurado con viñetas y emojis contextuales.
   - Debe finalizar con un Llamado a la Acción (CTA) directo (ej: "Envíanos un mensaje por WhatsApp", "Comenta la palabra X para más información").
   - Debe concluir con un bloque de 5 a 8 hashtags de tendencia altamente relevantes.
3. ESTRUCTURA Y GUION DEL CONTENIDO ('body'):
   - Para REEL o VIDEO: Escribe el guion detallado dividiendo tiempos (0-3s Hook, 3-15s Valor/Demostración, 15-30s Cierre) y sugiriendo estilo de audio.
   - Para CAROUSEL: Escribe el desglose diapositiva por diapositiva (Slide 1: Título e imagen principal, Slide 2 a 5: Contenido clave).
   - Para POST: Describe la intención de marketing y composición gráfica recomendada.
4. PROMPT VISUAL EN INGLÉS ('promptUsed'):
   - Debe ser un prompt en INGLÉS extremadamente detallado (mínimo 25 palabras) optimizado para Midjourney v6, Flux o DALL-E 3.
   - Describe el sujeto principal, estilo fotográfico realista (ej: 8k resolution, cinematic lighting, shallow depth of field, commercial product design, vibrant colors).
5. REGLA ESTRICTA DE NO INVENTAR PRODUCTOS: Queda terminantemente prohibido inventar o sugerir productos que no estén explícitamente declarados en la información del negocio. Promociona única y exclusivamente los productos reales dados.
6. FRECUENCIA SEGÚN PLAN EN 30 DÍAS: Genera exactamente ${planLimits.postsPerMonth} publicaciones por campaña distribuidas uniformemente en los 30 días siguientes a "${baseDateStr}":
   - ${planLimits.reelsCount} publicaciones de tipo 'REEL' o 'VIDEO'
   - ${planLimits.carouselsCount} publicaciones de tipo 'CAROUSEL'
   - ${planLimits.staticPostsCount} publicaciones de tipo 'POST'`,
      prompt: `Crea ${count} campañas para ${business.name} acorde a su plan contratado "${planLimits.planName}" (${planLimits.postsPerMonth} publicaciones/mes). Estrategias disponibles:\n` + 
        strategies.map(s => `- Estrategia: "${s.name}". Desc: ${s.description}`).join('\n') +
        (business.onboardingStrategy ? `\nESTRATEGIA DIRECTA DEL CLIENTE (PRIORIDAD ALTA - usar como base para targeting, canales de conversión y tono de copies):\n${JSON.stringify(business.onboardingStrategy)}` : '') +
        `\nGenera exactamente ${planLimits.postsPerMonth} publicaciones completas (${planLimits.reelsCount} reels, ${planLimits.carouselsCount} carruseles y ${planLimits.staticPostsCount} posts) distribuida de forma constante iniciando exactamente desde "${baseDateStr}" en adelante en el año ${new Date().getFullYear()}.`,
    });
    return object.campaigns.slice(0, count);
  } catch (e) {
    console.error('[CASCADE] Error llamando a IA para campañas, usando fallback:', e);
    return getFallbackCampaigns(business, strategies, count);
  }
}

// Regenera SOLO los contenidos/publicaciones para una campaña existente (sin tocar la campaña)
export async function generateCalendarContentsCascade(
  business: { id?: string; name: string; onboardingStrategy?: any; userId?: string | null },
  strategies: Strategy[],
  campaign: { id: string; name: string; description: string | null; channels: any; objective: string }
) {
  const openRouterKey = process.env.OPEN_ROUTER_KEY?.replace(/"/g, '').trim();
  
  const campaignChannels = Array.isArray(campaign.channels)
    ? (campaign.channels as any[]).map((c: any) => c.platform || String(c))
    : ['INSTAGRAM'];

  if (!openRouterKey) {
    return getFallbackCalendarContents(business, campaign, campaignChannels);
  }

  const planLimits = await getUserPlanPublicationLimits(business.id, business.userId || undefined);
  console.log(`[CASCADE] Regenerando calendario acorde al Plan de Suscripción: "${planLimits.planName}" (${planLimits.postsPerMonth} publicaciones/mes)`);

  try {
    const { object } = await generateObject({
      model: openrouter('google/gemini-2.5-flash:free'),
      schema: z.object({
        contents: z.array(z.object({
          type: z.enum(['POST', 'STORY', 'REEL', 'VIDEO', 'CAROUSEL', 'EMAIL', 'AD']),
          title: z.string(),
          body: z.string().describe("Guion estructurado paso a paso del contenido, desglose por slides o storyboard visual"),
          caption: z.string().describe("Copy completo e íntegro para redes sociales en español con gancho inicial, viñetas con emojis, CTA claro a WhatsApp y hashtags"),
          promptUsed: z.string().describe("AI image generator prompt en INGLÉS hiper-detallado de al menos 25 palabras para Midjourney o Flux"),
          scheduledAt: z.string()
        }))
      }),
      system: `Eres un Director Editorial y de Contenidos Digitales de alto rendimiento. Tu función es generar publicaciones completas, persuasivas y detalladas para la campaña de marketing del negocio, ajustadas rigurosamente a su PLAN DE SUSCRIPCIÓN ACTIVO.

PLAN DE SUSCRIPCIÓN ACTIVO DEL USUARIO:
- Plan Contratado: ${planLimits.planName}
- Total de Publicaciones permitidas: Exactamente ${planLimits.postsPerMonth} publicaciones en los próximos 30 días (${planLimits.postsPerWeek}).
- Desglose recomendado por formato:
  * ${planLimits.reelsCount} publicaciones de tipo 'REEL' o 'VIDEO' (60%)
  * ${planLimits.carouselsCount} publicaciones de tipo 'CAROUSEL' (25%)
  * ${planLimits.staticPostsCount} publicaciones de tipo 'POST' (15%)

REGLAS DE CALIDAD OBLIGATORIAS:
1. COPY COMPLETO Y LISTO PARA PUBLICAR ('caption'):
   - Redacta un copy 100% completo e íntegro en español para redes sociales.
   - Debe iniciar obligatoriamente con un GANCHO PERSUASIVO en la primera línea.
   - Debe incluir un cuerpo con viñetas explicativas y emojis contextuales.
   - Debe tener un Llamado a la Acción (CTA) directo (ej. escribir por WhatsApp o comentar).
   - Debe incluir de 5 a 8 hashtags de tendencia relevantes.
2. GUION O ESTRUCTURA TÉCNICA ('body'):
   - Para REELS/VIDEOS: Desarrolla el guion detallado (0-3s Hook, 3-15s Demostración, 15-30s Cierre) + sugerencia de estilo de audio.
   - Para CARROUSEL: Detalla el concepto visual diapositiva por diapositiva (Slide 1 a 5).
   - Para POST/STORY: Describe la composición y el mensaje clave.
3. PROMPT DE IMAGEN/VIDEO EN INGLÉS ('promptUsed'):
   - Redacta un prompt en INGLÉS detallado (mínimo 25 palabras) optimizado para Midjourney v6, Flux o DALL-E 3.
   - Especifica sujeto principal, iluminación (ej. cinematic natural lighting), encuadre, texturas y paleta de colores.
4. NO INVENTES PRODUCTOS que no existan en la información del negocio.
5. FRECUENCIA AJUSTADA AL PLAN:
   - Genera exactamente ${planLimits.postsPerMonth} publicaciones distribuidas en los próximos 30 días (${planLimits.reelsCount} reels, ${planLimits.carouselsCount} carruseles, ${planLimits.staticPostsCount} posts estáticos).`,
      prompt: `Genera las publicaciones completas del calendario para:
Negocio: ${business.name}
Plan Activo del Usuario: ${planLimits.planName} (${planLimits.postsPerMonth} publicaciones en 30 días)
Campaña: "${campaign.name}" - ${campaign.description || 'Sin descripción'}
Objetivo de la campaña: ${campaign.objective}
Canales activos: ${campaignChannels.join(', ')}
${strategies.length > 0 ? `Estrategia base: "${strategies[0].name}" - ${strategies[0].description}` : ''}
${business.onboardingStrategy ? `ESTRATEGIA DIRECTA DEL CLIENTE:\n${JSON.stringify(business.onboardingStrategy)}` : ''}
Genera exactamente ${planLimits.postsPerMonth} publicaciones totalmente desarrolladas (${planLimits.reelsCount} reels/videos, ${planLimits.carouselsCount} carruseles y ${planLimits.staticPostsCount} posts) espaciadas en los próximos 30 días.`,
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
  const industry = context.business.industry || "general";
  
  const default6Personas = [
    {
      name: "Consumidor Frecuente B2C",
      demographics: "Hombres y Mujeres, 25-50 años, enfocado en productos de alta calidad y servicio garantizado",
      painPoints: "Falta de velocidad en la respuesta de ventas, inconsistencia en la atención o empaques inadecuados",
      goals: "Obtener productos premium con la mejor relación calidad-precio y entrega confiable",
      communication: {
        tone: "Profesional, claro y transparente",
        topics: "Calidad de procesos, atención personalizada y valor diferencial",
        triggers: "Imágenes de alta calidad visual, testimonios reales y contacto directo vía WhatsApp"
      }
    },
    {
      name: "Comprador de Conveniencia y Canal Directo",
      demographics: "Adultos de 20-45 años, usuarios digitales intensivos en Santa Cruz y principales ciudades",
      painPoints: "Poco tiempo libre en rutina diaria, vacíos de información en precios o disponibilidad",
      goals: "Comprar directamente por WhatsApp con respuesta inmediata y métodos de pago ágiles",
      communication: {
        tone: "Directo, dinámico y servicial",
        topics: "Facilidad de pedido, respuestas en 1 clic y catálogo actualizado",
        triggers: "Promociones exclusivas por WhatsApp, enlace directo a chat y delivery garantizado"
      }
    },
    {
      name: "Joven Tendencia y Experiencia Visual",
      demographics: "Jóvenes de 18-28 años, activos en TikTok e Instagram Reels",
      painPoints: "Aburrimiento de marcas tradicionales, busca contenido dinámico y estético",
      goals: "Descubrir marcas recomendadas por creadores locales con excelente presentación",
      communication: {
        tone: "Fresco, cercano y juvenil",
        topics: "Detrás de escena, tendencias virales y calidad estética",
        triggers: "Videos en alta definición, audios en tendencia y UGC (contenido de usuarios)"
      }
    },
    {
      name: "Cliente Familiar de Fines de Semana",
      demographics: "Familias de 30-55 años con compras grupales o eventos familiares",
      painPoints: "Temor a fallas de calidad o productos sin garantía en momentos importantes",
      goals: "Asegurar frescura, origen certificado y porciones ideales para compartir",
      communication: {
        tone: "Cálido, familiar y de confianza",
        topics: "Paquetes familiares, tradiciones locales y frescura garantizada",
        triggers: "Historias de origen, combos especiales y recomendaciones de otros clientes"
      }
    },
    {
      name: "Cliente Corporativo y Eventos B2B",
      demographics: "Administradores, chefs y encargados de compras de 30-55 años",
      painPoints: "Exigencia de puntualidad extrema, facturación inmediata y especificaciones exactas",
      goals: "Abastecimiento constante, atención personalizada y precios por volumen",
      communication: {
        tone: "Ejecutivo, seguro y directo",
        topics: "Catálogo mayorista, certificaciones de calidad y entrega programada",
        triggers: "Cotizaciones rápidas, atención ejecutiva directa y facturación transparente"
      }
    },
    {
      name: "Comprador Leal y Recomendador de Marca",
      demographics: "Clientes recurrentes de 28-60 años con hábito de consumo establecido",
      painPoints: "Temor a cambios bruscos en la calidad habitual o atención despersonalizada",
      goals: "Acceso preferencial, trato VIP y recompensas por recomendación boca a boca",
      communication: {
        tone: "Cordial, atento y de exclusividad",
        topics: "Novedades de la marca, club de clientes VIP y preventas especiales",
        triggers: "Mensajes personalizados, atención prioritaria y beneficios de fidelidad"
      }
    }
  ];

  const full4FunnelStages = [
    {
      name: "Atracción",
      description: "Dar a conocer la propuesta de valor única y los diferenciales del negocio ante público nuevo",
      contentTypes: ["Reels", "Stories", "TikToks"],
      channels: ["Instagram", "Facebook", "TikTok"],
      goals: ["Generar curiosidad, alcance local y credibilidad inicial"],
      kpis: ["Impresiones", "Alcance", "Reproducciones de Video"],
      ctas: ["Conocer propuesta", "Seguir cuenta", "Ver catálogo"]
    },
    {
      name: "Consideración",
      description: "Educar a los prospectos sobre la calidad superior, certificaciones y origen garantizado del negocio",
      contentTypes: ["Carruseles", "Videos Demostrativos", "Detrás de Escena"],
      channels: ["Instagram", "Facebook"],
      goals: ["Resolver dudas frecuentes y demostrar la diferencia frente a la competencia"],
      kpis: ["Guardados", "Comentarios", "Consultas recibidas"],
      ctas: ["Preguntar por WhatsApp", "Ver lista de cortes/productos"]
    },
    {
      name: "Decisión (Conversión)",
      description: "Facilitar el contacto directo y cerrar pedidos inmediatos a través del canal principal de ventas",
      contentTypes: ["Publicaciones de Oferta", "Historias con Enlace Directo", "Prueba Social"],
      channels: ["Instagram", "Facebook", "TikTok"],
      goals: ["Convertir el interés en ventas efectivas y pedidos por WhatsApp"],
      kpis: ["Clicks en enlace WhatsApp", "Tasa de conversión"],
      ctas: ["Pedir ahora por WhatsApp", "Contactar a ventas"]
    },
    {
      name: "Retención y Fidelización",
      description: "Mantener una relación constante con compradores activos fomentando la recompra periódica",
      contentTypes: ["Mensajes Directos", "Novedades VIP", "Testimonios de Clientes"],
      channels: ["Instagram", "Facebook"],
      goals: ["Aumentar el valor de vida del cliente (LTV) y la frecuencia de compra"],
      kpis: ["Tasa de recompra", "Calificaciones positivas"],
      ctas: ["Reordenar tu pedido", "Unirte al club VIP"]
    }
  ];

  const list = [
    {
      name: "Estrategia de Diferenciación por Autoridad y Calidad de Origen",
      description: `Destacar la infraestructura, certificaciones y estándares superiores de ${name} para capturar la preferencia del mercado local.`,
      objectives: [
        {
          name: "Conversión Directa de Leads por WhatsApp",
          specific: `Generar mayor volumen de prospectos interesados para ${name} mediante llamadas a la acción directas a WhatsApp en redes sociales`,
          measurable: "Aumentar en un 25% el flujo de consultas de venta diarias",
          achievable: "Publicando 4 contenidos de alta conversión por semana con botón directo a chat",
          relevant: "Incrementa el volumen de ventas al eliminar intermediarios en el proceso de compra",
          timeBound: "Lograr la meta en un periodo de 60 días",
          targetValue: 25,
          currentValue: 0,
          unit: "%",
          deadline: "60 días",
          status: "PENDING" as const
        },
        {
          name: "Posicionamiento de Marca y Alcance Local",
          specific: `Consolidar a ${name} como la referente principal en calidad y servicio en el entorno metropolitano`,
          measurable: "Alcanzar más de 50,000 impresiones mensuales acumuladas en Facebook e Instagram",
          achievable: "Distribuyendo videos cortos de valor educativo y detrás de escena de la operación",
          relevant: "Fortalece la autoridad de marca ante competidores tradicionales",
          timeBound: "Alcanzar en los primeros 45 días",
          targetValue: 50000,
          currentValue: 0,
          unit: "impresiones",
          deadline: "45 días",
          status: "PENDING" as const
        },
        {
          name: "Fidelización y Recompra Periódica",
          specific: "Establecer una rutina de seguimiento a clientes compradores para impulsar la segunda compra",
          measurable: "Incrementar la tasa de recompra mensual en un 20%",
          achievable: "Enviando ofertas exclusivas directas y catálogo actualizado cada quincena",
          relevant: "Estabiliza el flujo de caja mediante compras recurrentes",
          timeBound: "Cumplir la meta en 90 días",
          targetValue: 20,
          currentValue: 0,
          unit: "%",
          deadline: "90 días",
          status: "PENDING" as const
        }
      ],
      personas: default6Personas,
      funnelStages: full4FunnelStages,
      channels: [
        { name: "INSTAGRAM", type: "SOCIAL" as const, isActive: true, frequency: "4 posts por semana", audienceSize: 0 },
        { name: "FACEBOOK", type: "SOCIAL" as const, isActive: true, frequency: "4 posts por semana", audienceSize: 0 },
        { name: "TIKTOK", type: "SOCIAL" as const, isActive: true, frequency: "3 videos por semana", audienceSize: 0 }
      ],
      contentPillars: [
        `Garantía de Calidad y Procesos de ${name}`,
        "Atención Personalizada y Experiencia de Compra",
        "Demostración de Producto y Casos Reales",
        "Ofertas Especiales y Beneficios Exclusivos"
      ]
    },
    {
      name: "Campaña Viral de Growth & Contenido Audiovisual",
      description: `Enfocada en capturar la atención masiva de audiencias locales mediante tendencias visuales en Reels y TikTok.`,
      objectives: [
        {
          name: "Alcance Masivo en Video Corto",
          specific: "Incrementar la visibilidad de la marca mediante videos dinámicos mostrando la experiencia real del producto",
          measurable: "Obtener un acumulado de 40,000 reproducciones en TikTok e Instagram Reels",
          achievable: "Publicando 3 contenidos semanales adaptados a audios y formatos de tendencia",
          relevant: "Atrae prospectos de forma orgánica sin dependencia de pauta publicitaria",
          timeBound: "Lograr en 30 días",
          targetValue: 40000,
          currentValue: 0,
          unit: "reproducciones",
          deadline: "30 días",
          status: "PENDING" as const
        }
      ],
      personas: default6Personas,
      funnelStages: full4FunnelStages,
      channels: [
        { name: "TIKTOK", type: "SOCIAL" as const, isActive: true, frequency: "4 videos por semana", audienceSize: 0 },
        { name: "INSTAGRAM", type: "SOCIAL" as const, isActive: true, frequency: "4 reels por semana", audienceSize: 0 },
        { name: "FACEBOOK", type: "SOCIAL" as const, isActive: true, frequency: "3 publicaciones por semana", audienceSize: 0 }
      ],
      contentPillars: ["Antojo Visual & Demostración", "Detrás de Cámara & Transparencia", "Educación del Sector"]
    },
    {
      name: "Estrategia de Fidelización y Captura de Mercado Corporativo",
      description: `Orientada a construir relaciones sólidas con clientes institucionales y compradores de alto volumen.`,
      objectives: [
        {
          name: "Captación de Cuentas B2B / Compradores Frecuentes",
          specific: `Posicionar el canal institucional de ${name} para atención a empresas y compradores mayoristas`,
          measurable: "Generar al menos 15 cotizaciones corporativas mensuales vía WhatsApp",
          achievable: "Lanzando pauta digital segmentada y catálogo especializado en PDF",
          relevant: "Incrementa el ticket promedio por transacción",
          timeBound: "Alcanzar en 60 días",
          targetValue: 15,
          currentValue: 0,
          unit: "cotizaciones",
          deadline: "60 días",
          status: "PENDING" as const
        }
      ],
      personas: default6Personas,
      funnelStages: full4FunnelStages,
      channels: [
        { name: "FACEBOOK", type: "SOCIAL" as const, isActive: true, frequency: "3 posts por semana", audienceSize: 0 },
        { name: "INSTAGRAM", type: "SOCIAL" as const, isActive: true, frequency: "3 posts por semana", audienceSize: 0 },
        { name: "TIKTOK", type: "SOCIAL" as const, isActive: true, frequency: "2 videos por semana", audienceSize: 0 }
      ],
      contentPillars: ["Atención Institucional & B2B", "Certificaciones & Estándares", "Soluciones a Medida"]
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
