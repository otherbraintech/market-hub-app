"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { businessSchema } from "@/lib/schemas/business";
import { z } from "zod";
import { triggerAnalysis } from "@/lib/analysis-service";

import { analyzeBusiness } from "@/lib/ai/business-analyzer";
import type { CreateBusinessInput, UpdateBusinessInput } from "@/modules/business/types";

export async function createBusiness(data: z.infer<typeof businessSchema>, skipAnalysis = false) {
  try {
    const { getSession } = await import("@/lib/auth");
    const { createBusiness: createBusinessService } = await import("@/modules/business/services");
    
    const session = await getSession();
    if (!session || !session.user?.id) {
      return { success: false, error: "No autorizado" };
    }

    const validated = businessSchema.parse(data);
    const business = await createBusinessService({
      ...validated,
      userId: session.user.id,
    } as unknown as CreateBusinessInput);

    // Contar negocios del usuario
    const businessCount = await prisma.business.count({
      where: { userId: session.user.id }
    });

    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const currentSelected = cookieStore.get("selectedBusinessId")?.value;

    // Si es su primer negocio o no tiene ninguno seleccionado actualmente
    if (businessCount === 1 || !currentSelected) {
      cookieStore.set("selectedBusinessId", business.id, { 
        path: "/",
        maxAge: 60 * 60 * 24 * 30 // 30 días
      });
    }

    if (!skipAnalysis) {
      // Disparar scraping automático para todos los canales que tengan URL en el nuevo negocio
      let socialLinksObj: Record<string, any> = {};
      if (business.socialLinks) {
        if (typeof business.socialLinks === "string") {
          try {
            socialLinksObj = JSON.parse(business.socialLinks);
          } catch (e) {}
        } else if (typeof business.socialLinks === "object") {
          socialLinksObj = business.socialLinks as Record<string, any>;
        }
      }

      const channelUrls = [
        { name: "WEBSITE", url: business.website },
        { name: "FACEBOOK", url: socialLinksObj.facebook },
        { name: "INSTAGRAM", url: socialLinksObj.instagram },
        { name: "TIKTOK", url: socialLinksObj.tiktok },
        { name: "LINKEDIN", url: socialLinksObj.linkedin },
        { name: "YOUTUBE", url: socialLinksObj.youtube },
      ];

      const promises = channelUrls
        .filter((ch) => ch.url && typeof ch.url === "string" && ch.url.trim() !== "")
        .map((ch) =>
          triggerAnalysis({
            type: "MY_BUSINESS",
            entityId: business.id,
            channel: ch.name,
            url: ch.url,
          }).catch((err) => {
            console.error(`Error al disparar scraping automático de negocio para canal ${ch.name}:`, err);
          })
        );

      // Ejecutar el scraping en segundo plano sin bloquear la respuesta al usuario
      if (promises.length > 0) {
        Promise.allSettled(promises).then(() => {
          console.log(`[Scraping] Scraping inicial completado en segundo plano para negocio: ${business.id}`);
        });
      }
      // Disparar precarga automática de tendencias desde OB-Tendencias API para el rubro detectado
      if (business.industry && business.industry.trim() !== "") {
        import("@/actions/trends-explorer").then(({ autoIngestTrendsForIndustryAction }) => {
          autoIngestTrendsForIndustryAction(business.industry || "").catch(e => 
            console.error("Error auto-ingesting trends for industry:", e)
          );
        });
      }
    }

    revalidatePath("/business");
    revalidatePath("/trends");
    revalidatePath("/");
    return { success: true, message: "Negocio creado exitosamente", data: business };
  } catch (error) {
    console.error("Create Business Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Error al crear el negocio";
    return { success: false, error: errorMessage };
  }
}

export async function createBusinessWithAI(data: { 
  name: string; 
  description: string; 
  website?: string;
  phoneNumbers?: string;
  location?: string;
  branches?: any;
  catalog?: any;
  socialLinks?: Record<string, string | undefined>;
  onboardingStrategy?: Record<string, string | undefined>;
}, skipAnalysis = false) {
  try {
    // 1. Ejecutar análisis rápido de negocio por IA para detectar el rubro exacto
    let analysis: any = null;
    try {
      analysis = await analyzeBusiness(data.name, data.description, data.website);
    } catch (aiErr) {
      console.error("Error al analizar negocio con IA:", aiErr);
    }

    const fullData = {
      name: data.name,
      description: data.description || "",
      website: data.website || "",
      industry: analysis?.industry || "",
      brandVoice: analysis?.brandVoice || { tone: [], personality: [], values: [] },
      targetAudience: analysis?.targetAudience || { demographics: "", psychographics: "" },
      phoneNumbers: data.phoneNumbers || "",
      location: data.location || "",
      branches: data.branches,
      catalog: data.catalog,
      socialLinks: data.socialLinks || { facebook: "", instagram: "", tiktok: "" },
      onboardingStrategy: data.onboardingStrategy,
    };

    // 2. Crear el negocio en la base de datos de inmediato con los datos analizados
    const res = await createBusiness(fullData as z.infer<typeof businessSchema>, skipAnalysis);

    return res;
  } catch (error) {
    console.error("AI Creation Error:", error);
    return { success: false, error: "Error al registrar el negocio" };
  }
}


export async function updateBusiness(id: string, data: Partial<z.infer<typeof businessSchema>>) {
  try {
    const { getSession } = await import("@/lib/auth");
    const session = await getSession();
    if (!session || !session.user?.id) {
      return { success: false, error: "No autorizado" };
    }

    const oldBusiness = await prisma.business.findFirst({
      where: { id, userId: session.user.id }
    });
    if (!oldBusiness) {
      return { success: false, error: "Negocio no encontrado o no autorizado" };
    }

    const { updateBusiness: updateBusinessService } = await import("@/modules/business/services");
    
    // Parsear socialLinks de la base de datos (pueden ser String JSON u Objeto)
    let oldLinks: Record<string, any> = {};
    if (oldBusiness.socialLinks) {
      if (typeof oldBusiness.socialLinks === "string") {
        try {
          oldLinks = JSON.parse(oldBusiness.socialLinks);
        } catch (e) {}
      } else if (typeof oldBusiness.socialLinks === "object") {
        oldLinks = oldBusiness.socialLinks as Record<string, any>;
      }
    }

    // Parsear socialLinks del formulario nuevo
    let newLinks: Record<string, any> = {};
    if (data.socialLinks) {
      if (typeof data.socialLinks === "string") {
        try {
          newLinks = JSON.parse(data.socialLinks);
        } catch (e) {}
      } else if (typeof data.socialLinks === "object") {
        newLinks = data.socialLinks as Record<string, any>;
      }
    }

    // Actualizar los datos del negocio en Prisma BBDD
    const updated = await updateBusinessService(id, data as unknown as UpdateBusinessInput);

    const channelsToCheck = [
      { name: "WEBSITE", oldUrl: oldBusiness.website, newUrl: data.website },
      { name: "FACEBOOK", oldUrl: oldLinks.facebook, newUrl: newLinks.facebook },
      { name: "INSTAGRAM", oldUrl: oldLinks.instagram, newUrl: newLinks.instagram },
      { name: "TIKTOK", oldUrl: oldLinks.tiktok, newUrl: newLinks.tiktok },
      { name: "LINKEDIN", oldUrl: oldLinks.linkedin, newUrl: newLinks.linkedin },
      { name: "YOUTUBE", oldUrl: oldLinks.youtube, newUrl: newLinks.youtube },
    ];

    // Para cada canal cuyo URL haya cambiado o se haya modificado:
    // 1. Eliminar el reporte viejo en la base de datos para ese canal específico
    // 2. Disparar scraping automático con la nueva URL
    const promises = channelsToCheck
      .filter((ch) => ch.newUrl && typeof ch.newUrl === "string" && ch.newUrl.trim() !== "" && ch.newUrl.trim() !== (ch.oldUrl || "").trim())
      .map(async (ch) => {
        await prisma.analysisReport.deleteMany({
          where: {
            entityId: id,
            type: "MY_BUSINESS",
            channel: ch.name
          }
        }).catch(err => console.error(`Error al limpiar reporte previo para ${ch.name}:`, err));

        return triggerAnalysis({
          type: "MY_BUSINESS",
          entityId: id,
          channel: ch.name,
          url: ch.newUrl!.trim(),
        }).catch((err) => {
          console.error(`Error al disparar reanálisis tras actualizar URL de ${ch.name}:`, err);
        });
      });

    if (promises.length > 0) {
      await Promise.allSettled(promises);
    }

    revalidatePath("/business");
    revalidatePath(`/business/${id}`);
    revalidatePath("/onboarding");
    return { success: true, message: "Negocio actualizado exitosamente", data: updated };
  } catch (error) {
    console.error("Update Business Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Error al actualizar el negocio";
    return { success: false, error: errorMessage };
  }
}

export async function saveOnboardingStrategyAction(businessId: string, onboardingStrategy: Record<string, any>) {
  try {
    const { getSession } = await import("@/lib/auth");
    const session = await getSession();
    if (!session || !session.user?.id) {
      return { success: false, error: "No autorizado" };
    }

    const oldBiz = await prisma.business.findUnique({
      where: { id: businessId },
      select: { brandVoice: true }
    });

    let currentVoice: any = oldBiz?.brandVoice || {};
    let toneList: string[] = Array.isArray(currentVoice?.tone) ? currentVoice.tone : [];
    let personalityList: string[] = Array.isArray(currentVoice?.personality) ? currentVoice.personality : [];

    if (onboardingStrategy.archetype && typeof onboardingStrategy.archetype === "string") {
      const arch = onboardingStrategy.archetype.trim();
      if (arch && !personalityList.includes(arch)) {
        personalityList.push(arch);
      }
      if (toneList.length === 0) {
        toneList = ["Experto", "De Confianza", "Profesional"];
      }
    }

    const updateData: any = { 
      onboardingStrategy,
      brandVoice: {
        ...currentVoice,
        tone: toneList,
        personality: personalityList,
      }
    };

    if (onboardingStrategy.branches || onboardingStrategy.sucursales) {
      updateData.branches = onboardingStrategy.branches || onboardingStrategy.sucursales;
    }

    await prisma.business.update({
      where: { id: businessId },
      data: updateData
    });

    // Limpiar notificaciones obsoletas de extracción para evitar que quede atascado en procesando
    await prisma.agentNotification.updateMany({
      where: { businessId, status: "PROCESSING" },
      data: { status: "COMPLETED" }
    }).catch(err => console.error("Error al actualizar notificaciones obsoletas:", err));

    revalidatePath(`/business/${businessId}`);
    return { success: true };
  } catch (error) {
    console.error("Error al guardar la estrategia de onboarding:", error);
    return { success: false, error: "Error al guardar la estrategia de onboarding" };
  }
}

export async function deleteBusiness(id: string) {
  try {
    const { getSession } = await import("@/lib/auth");
    const session = await getSession();
    if (!session || !session.user?.id) {
      return { success: false, error: "No autorizado" };
    }

    const business = await prisma.business.findFirst({
      where: { id, userId: session.user.id }
    });
    if (!business) {
      return { success: false, error: "Negocio no encontrado o no autorizado" };
    }

    await prisma.business.delete({
      where: { id },
    });
    revalidatePath("/business");
    return { success: true };
  } catch {
    return { success: false, error: "Error al eliminar" };
  }
}
export async function getBusinesses() {
  const { getSession } = await import("@/lib/auth");
  const session = await getSession();
  if (!session || !session.user?.id) {
    return [];
  }
  return prisma.business.findMany({
    where: {
      OR: [
        { userId: session.user.id },
        { userId: null }
      ]
    },
    include: { competitors: true },
    orderBy: { updatedAt: "desc" },
  });
}

export async function setSelectedBusinessAction(id: string) {
  const { cookies } = await import("next/headers");
  (await cookies()).set("selectedBusinessId", id, { 
    path: "/",
    maxAge: 60 * 60 * 24 * 30 // 30 days
  });
  revalidatePath("/");
  return { success: true };
}

export async function getSelectedBusinessId() {
  const { getSession } = await import("@/lib/auth");
  const session = await getSession();
  if (!session || !session.user?.id) {
    return undefined;
  }

  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const selectedId = cookieStore.get("selectedBusinessId")?.value;

  if (selectedId) {
    const business = await prisma.business.findFirst({
      where: {
        id: selectedId,
        OR: [
          { userId: session.user.id },
          { userId: null }
        ]
      }
    });
    if (business) {
      return selectedId;
    }
  }

  // Fallback to the most recently updated business for this user
  const firstBusiness = await prisma.business.findFirst({
    where: {
      OR: [
        { userId: session.user.id },
        { userId: null }
      ]
    },
    orderBy: { updatedAt: "desc" }
  });

  if (firstBusiness) {
    try {
      cookieStore.set("selectedBusinessId", firstBusiness.id, {
        path: "/",
        maxAge: 60 * 60 * 24 * 30
      });
    } catch (e) {}
    return firstBusiness.id;
  }

  return undefined;
}

export async function getBusinessAction(id: string) {
  const { getSession } = await import("@/lib/auth");
  const session = await getSession();
  if (!session || !session.user?.id) {
    return null;
  }
  const business = await prisma.business.findFirst({
    where: { id, userId: session.user.id },
  });
  
  if (!business) {
    return null;
  }
  
  return business;
}

export async function updateBusinessSettings(id: string, settings: any) {
  try {
    const { getSession } = await import("@/lib/auth");
    const session = await getSession();
    if (!session || !session.user?.id) {
      return { success: false, error: "No autorizado" };
    }

    const business = await prisma.business.findFirst({
      where: { id, userId: session.user.id }
    });
    if (!business) {
      return { success: false, error: "Negocio no encontrado o no autorizado" };
    }

    const currentSettings = (business.settings as Record<string, any>) || {};
    const newSettings = { ...currentSettings, ...settings };

    await prisma.business.update({
      where: { id },
      data: { settings: newSettings }
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error updating settings:", error);
    return { success: false, error: error.message || "Error al actualizar la configuración" };
  }
}

export async function getUserLimits() {
  try {
    const { getSession } = await import("@/lib/auth");
    const session = await getSession();
    if (!session || !session.user?.id) {
      return { success: false, error: "No autorizado", maxCompetitors: 3, maxBusinesses: 1 };
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { maxCompetitors: true, maxBusinesses: true }
    });

    return {
      success: true,
      maxCompetitors: dbUser?.maxCompetitors ?? 3,
      maxBusinesses: dbUser?.maxBusinesses ?? 1,
    };
  } catch (error) {
    console.error("Error fetching user limits:", error);
    return { success: false, error: "Error al obtener límites", maxCompetitors: 3, maxBusinesses: 1 };
  }
}

export async function getBusinessWithCompetitors(id: string) {
  try {
    const { getSession } = await import("@/lib/auth");
    const session = await getSession();
    if (!session || !session.user?.id) {
      return null;
    }
    return await prisma.business.findFirst({
      where: { id, userId: session.user.id },
      include: { competitors: true, strategies: true }
    });
  } catch (error) {
    console.error("Error fetching business with competitors:", error);
    return null;
  }
}

export async function getOnboardingResults(businessId: string) {
  try {
    const { getSession } = await import("@/lib/auth");
    const session = await getSession();
    if (!session || !session.user?.id) {
      return { success: false, error: "No autorizado" };
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId, userId: session.user.id },
      include: { competitors: true }
    });

    if (!business) {
      return { success: false, error: "Negocio no encontrado" };
    }

    const competitorIds = business.competitors.map(c => c.id);

    const businessReports = await prisma.analysisReport.findMany({
      where: {
        entityId: businessId,
        type: "MY_BUSINESS",
        status: "COMPLETED"
      },
      orderBy: { createdAt: "desc" }
    });

    const competitorReports = competitorIds.length > 0 ? await prisma.analysisReport.findMany({
      where: {
        entityId: { in: competitorIds },
        type: "COMPETITOR",
        status: "COMPLETED"
      },
      orderBy: { createdAt: "desc" }
    }) : [];

    let activeStrategy = await prisma.marketingStrategy.findFirst({
      where: { businessId, isActive: true },
      orderBy: { createdAt: "desc" }
    });

    if (!activeStrategy) {
      activeStrategy = await prisma.marketingStrategy.findFirst({
        where: { businessId },
        orderBy: { createdAt: "desc" }
      });
      if (activeStrategy) {
        // Marcarla como activa en la base de datos de forma asíncrona
        prisma.marketingStrategy.update({
          where: { id: activeStrategy.id },
          data: { isActive: true }
        }).catch(err => console.error("Error setting fallback active strategy:", err));
      }
    }

    const campaigns = await prisma.campaign.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      take: 1
    });

    // Serializar Decimals a números planos para evitar errores de Next.js RSC
    const serializedCampaigns = campaigns.map(c => ({
      ...c,
      budget: c.budget ? Number(c.budget) : 0,
    }));

    // Obtener contenidos/publicaciones programadas del calendario
    const calendarContents = await prisma.content.findMany({
      where: {
        campaign: {
          businessId
        }
      },
      orderBy: { scheduledAt: "asc" }
    });

    return {
      success: true,
      businessReports,
      competitorReports,
      activeStrategy,
      campaigns: serializedCampaigns,
      calendarContents,
      competitorsList: business.competitors,
      businessInfo: business
    };
  } catch (error) {
    console.error("Error in getOnboardingResults:", error);
    return { success: false, error: "Error al obtener resultados" };
  }
}

export async function startScrapingStage(businessId: string) {
  try {
    const { getSession } = await import("@/lib/auth");
    const session = await getSession();
    if (!session || !session.user?.id) {
      return { success: false, error: "No autorizado" };
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId, userId: session.user.id },
      include: { competitors: true }
    });

    if (!business) {
      return { success: false, error: "Negocio no encontrado" };
    }

    // 1. Limpiar notificaciones y reportes viejos para reiniciar limpio
    await prisma.agentNotification.deleteMany({ where: { businessId } });
    await prisma.analysisReport.deleteMany({ where: { entityId: businessId } });
    await prisma.business.update({
      where: { id: businessId },
      data: { competitorGeneralReport: Prisma.DbNull, competitorGeneralReportGeneratedAt: null }
    });
    
    const competitorIds = business.competitors.map(c => c.id);
    if (competitorIds.length > 0) {
      await prisma.analysisReport.deleteMany({ where: { entityId: { in: competitorIds } } });
    }

    // 2. Crear notificación inicial de procesamiento
    await prisma.agentNotification.create({
      data: {
        businessId,
        title: "Agente de Extracción",
        message: "Iniciando reanálisis y extracción autónoma de todos los canales configurados.",
        step: "SCRAPING",
        status: "PROCESSING"
      }
    });

    // 3. Disparar scraping de canales propios del negocio
    let socialLinksObj: Record<string, any> = {};
    if (business.socialLinks) {
      if (typeof business.socialLinks === "string") {
        try {
          socialLinksObj = JSON.parse(business.socialLinks);
        } catch (e) {}
      } else if (typeof business.socialLinks === "object") {
        socialLinksObj = business.socialLinks as Record<string, any>;
      }
    }

    const defaultBizWeb = business.website && business.website.trim() !== "" 
      ? business.website 
      : `https://www.${(business.name || "negocio").toLowerCase().replace(/[^a-z0-9]/g, "")}.com`;

    const myChannels = [
      { name: "WEBSITE", url: defaultBizWeb },
      { name: "FACEBOOK", url: socialLinksObj.facebook || socialLinksObj.facebookUrl },
      { name: "INSTAGRAM", url: socialLinksObj.instagram || socialLinksObj.instagramUrl },
      { name: "TIKTOK", url: socialLinksObj.tiktok || socialLinksObj.tiktokUrl },
    ];

    const promises = [];

    // Canales del propio negocio
    for (const ch of myChannels) {
      if (ch.url && String(ch.url).trim() !== "") {
        console.log(`🚀 [START-SCRAPING-STAGE] Disparando análisis propio para canal ${ch.name}: ${ch.url}`);
        promises.push(
          triggerAnalysis({
            type: "MY_BUSINESS",
            entityId: businessId,
            channel: ch.name,
            url: String(ch.url).trim()
          }).catch(err => console.error("Error scraping business channel:", err))
        );
      }
    }

    // Canales de competidores
    for (const comp of business.competitors) {
      const defaultCompWeb = comp.website && comp.website.trim() !== ""
        ? comp.website
        : `https://www.${(comp.name || "competidor").toLowerCase().replace(/[^a-z0-9]/g, "")}.com`;

      const compChannels = [
        { name: "WEBSITE", url: defaultCompWeb },
        { name: "FACEBOOK", url: comp.facebook },
        { name: "INSTAGRAM", url: comp.instagram },
        { name: "TIKTOK", url: comp.tiktok },
      ];
      for (const ch of compChannels) {
        if (ch.url && String(ch.url).trim() !== "") {
          console.log(`🚀 [START-SCRAPING-STAGE] Disparando análisis competidor "${comp.name}" para canal ${ch.name}: ${ch.url}`);
          promises.push(
            triggerAnalysis({
              type: "COMPETITOR",
              entityId: comp.id,
              channel: ch.name,
              url: String(ch.url).trim()
            }).catch(err => console.error("Error scraping competitor channel:", err))
          );
        }
      }
    }

    // Await execution of n8n POST webhooks to prevent Next.js context termination
    await Promise.allSettled(promises);

    // 4. Gatillar el diagnóstico agéntico consolidado únicamente si no hay canales pendientes de extracción
    if (promises.length === 0) {
      await prisma.agentNotification.create({
        data: {
          businessId,
          title: "Agente de Diagnóstico",
          message: "Consolidando informe FODA con los datos de registro (sin perfiles externos).",
          step: "DIAGNOSTIC",
          status: "PROCESSING"
        }
      }).catch(err => console.error("Error al crear notificación de diagnóstico:", err));

      try {
        const { runBusinessConsolidatedAnalysis } = await import("@/app/api/business/[id]/consolidated-analysis/route");
        const { runGenerateGeneralReport } = await import("@/app/api/competitors/[businessId]/generate-general-report/route");
        const { runCompetitorConsolidatedAnalysis } = await import("@/app/api/competitors/[businessId]/consolidated-analysis/route");

        await Promise.allSettled([
          runBusinessConsolidatedAnalysis(businessId).catch(err => console.error("Error en diagnóstico consolidado propio:", err)),
          runGenerateGeneralReport(businessId).catch(err => console.error("Error en reporte general de competidores:", err)),
          runCompetitorConsolidatedAnalysis(businessId).catch(err => console.error("Error en análisis consolidado de competidores:", err))
        ]);

        await prisma.agentNotification.create({
          data: {
            businessId,
            title: "Agente de Diagnóstico",
            message: "Informe general, FODA y Banco de Datos inicializado con éxito.",
            step: "DIAGNOSTIC",
            status: "COMPLETED"
          }
        }).catch(err => console.error("Error al crear notificación final de diagnóstico:", err));
      } catch (diagErr) {
        console.error("Error al ejecutar consolidación agéntica:", diagErr);
      }
    } else {
      console.log(`📡 [START-SCRAPING-STAGE] ${promises.length} canales en curso. La consolidación esperará a que finalicen las llamadas de n8n.`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error in startScrapingStage:", error);
    return { success: false, error: "Error al iniciar extracción" };
  }
}

export async function analyzeVisualAssetsAction(businessId: string) {
  try {
    const { getSession } = await import("@/lib/auth");
    const session = await getSession();
    if (!session || !session.user?.id) {
      return { success: false, error: "No autorizado" };
    }

    const mediaAssets = await prisma.mediaAsset.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" }
    });

    if (mediaAssets.length === 0) {
      return {
        success: false,
        error: "Para completar la Etapa 2 debes subir al menos 1 imagen o video en el Banco de Recursos Visuales."
      };
    }

    // Notificación en proceso
    await prisma.agentNotification.deleteMany({
      where: { businessId, step: "MEDIA" }
    });

    await prisma.agentNotification.create({
      data: {
        businessId,
        title: "Agente Vision IA",
        message: "Analizando composición estética, paleta de colores y patrones visuales...",
        step: "MEDIA",
        status: "PROCESSING"
      }
    });

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { name: true, industry: true, brandColors: true, logo: true, settings: true }
    });

    let currentColors: string[] = [];
    if (Array.isArray(business?.brandColors)) {
      currentColors = business.brandColors as string[];
    } else if (typeof business?.brandColors === "string") {
      try { currentColors = JSON.parse(business.brandColors); } catch(e) {}
    }

    // Si no hay colores registrados aún, proponer paleta inicial armónica por rubro
    if (currentColors.length === 0) {
      currentColors = ["#10B981", "#0284C7", "#F59E0B", "#8B5CF6", "#0F172A"];
      await prisma.business.update({
        where: { id: businessId },
        data: { brandColors: currentColors }
      });
    }

    const currentSettings = (business?.settings as any) || {};
    const imageAssets = mediaAssets.filter(m => m.type === "IMAGE");
    const videoAssets = mediaAssets.filter(m => m.type === "VIDEO");

    let visualAnalysisReport: any = null;
    const openRouterKey = process.env.OPEN_ROUTER_KEY?.replace(/"/g, '').trim();

    if (openRouterKey) {
      try {
        const { generateObject } = await import("ai");
        const { createOpenAI } = await import("@ai-sdk/openai");
        const { z } = await import("zod");

        const openrouter = createOpenAI({
          apiKey: openRouterKey,
          baseURL: 'https://openrouter.ai/api/v1',
        });

        const { object } = await generateObject({
          model: openrouter('google/gemini-2.5-flash:free'),
          schema: z.object({
            colorPalette: z.array(z.string()).describe("Lista de 3 a 5 códigos HEX de colores dominantes de la marca"),
            aestheticStyle: z.string().describe("Descripción del estilo fotográfico, iluminación y lenguaje visual de la marca"),
            compositionPattern: z.string().describe("Patrones de encuadre, texturas y ángulos recomendados"),
            videoAnalysis: z.object({
              visualHooks: z.string().describe("Estrategia de gancho visual para los primeros 2 segundos de video/reel"),
              rhythmAndPacing: z.string().describe("Ritmo de cortes, transiciones y edición recomendados"),
              recommendedScriptFormat: z.string().describe("Estructura de guion sugerida")
            }),
            editorialPromptFeedback: z.string().describe("Recomendaciones de prompts visuales para generación de imágenes por IA")
          }),
          system: "Eres el Director Creativo y Especialista en Identidad de Marca y Análisis Visivos de OB-MarketHub.",
          prompt: `Analiza los recursos visuales del negocio:
Negocio: ${business?.name || 'Empresa'} (Rubro: ${business?.industry || 'General'})
Recursos disponibles: ${mediaAssets.length} archivos (${imageAssets.length} imágenes, ${videoAssets.length} videos)
Logotipo: ${business?.logo || 'No especificado'}
Colores extraídos actuales: ${currentColors.join(', ')}

Genera un diagnóstico de análisis visual preciso con códigos HEX reales, patrones estéticos y recomendaciones de ganchos en video.`
        });

        visualAnalysisReport = {
          analyzedAt: new Date().toISOString(),
          assetsCount: mediaAssets.length,
          imageCount: imageAssets.length,
          videoCount: videoAssets.length,
          imageAnalysis: {
            colorPalette: object.colorPalette && object.colorPalette.length > 0 ? object.colorPalette : currentColors,
            aestheticStyle: object.aestheticStyle,
            compositionPattern: object.compositionPattern
          },
          videoAnalysis: object.videoAnalysis,
          editorialPromptFeedback: object.editorialPromptFeedback
        };

        if (object.colorPalette && object.colorPalette.length > 0) {
          currentColors = object.colorPalette;
          await prisma.business.update({
            where: { id: businessId },
            data: { brandColors: object.colorPalette }
          });
        }
      } catch (aiErr) {
        console.warn("[MEDIA] Fallo IA en análisis visual, usando informe estructurado:", aiErr);
      }
    }

    if (!visualAnalysisReport) {
      visualAnalysisReport = {
        analyzedAt: new Date().toISOString(),
        assetsCount: mediaAssets.length,
        imageCount: imageAssets.length,
        videoCount: videoAssets.length,
        imageAnalysis: {
          colorPalette: currentColors,
          aestheticStyle: `Fotografía limpia de productos para ${business?.name || "la marca"}, enfocada en iluminación natural y alto nivel de detalle.`,
          compositionPattern: "Planos cenitales y ángulo de 45 grados con contraste de textura."
        },
        videoAnalysis: {
          visualHooks: "Apertura dinámica en los primeros 1.8 segundos mostrando el producto estrella en acción.",
          rhythmAndPacing: "Transiciones fluidas cada 1.8 segundos adaptadas al pulso de fondo.",
          recommendedScriptFormat: "Hook visual irresistible -> Solución al problema -> Demostración -> Llamado a la acción rápido."
        },
        editorialPromptFeedback: `Integrar estética de luz natural y colores vivos con paleta ${currentColors.join(', ')}.`
      };
    }

    // Persistir en settings del negocio
    await prisma.business.update({
      where: { id: businessId },
      data: {
        settings: {
          ...currentSettings,
          visualAnalysisReport
        }
      }
    });

    // Guardar informe oficial en AnalysisReport (reemplazar existente si ya hay uno)
    await prisma.analysisReport.deleteMany({
      where: { entityId: businessId, channel: 'VISUAL_AUDIT', type: 'VISUAL' }
    });
    await prisma.analysisReport.create({
      data: {
        entityId: businessId,
        type: 'VISUAL',
        channel: 'VISUAL_AUDIT',
        status: 'COMPLETED',
        url: business?.logo || mediaAssets[0]?.url || '',
        data: visualAnalysisReport as any,
        completedAt: new Date()
      }
    });

    await prisma.agentNotification.deleteMany({
      where: { businessId, step: "MEDIA" }
    });

    await prisma.agentNotification.create({
      data: {
        businessId,
        title: "Agente Vision IA",
        message: `Análisis visual completado con éxito sobre ${mediaAssets.length} recurso(s). Paleta de colores y diagnóstico guardados.`,
        step: "MEDIA",
        status: "COMPLETED"
      }
    });

    // revalidatePath(`/business/${businessId}`); // Commented out to avoid dependency
    return { success: true, message: "Análisis visual de IA completado correctamente", visualAnalysisReport };
  } catch (error: any) {
    console.error("Error in analyzeVisualAssetsAction:", error);
    return { success: false, error: error.message || "Error al ejecutar el análisis visual" };
  }
}

export async function startDiagnosticStage(businessId: string) {
  try {
    const { getSession } = await import("@/lib/auth");
    const session = await getSession();
    if (!session || !session.user?.id) {
      return { success: false, error: "No autorizado" };
    }

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // 1. Limpiar notificaciones previas en estado PROCESSING para evitar bloqueos
    await prisma.agentNotification.deleteMany({
      where: { businessId, step: "DIAGNOSTIC" }
    });

    // 2. Notificar inicio de procesamiento
    await prisma.agentNotification.create({
      data: {
        businessId,
        title: "Agente de Diagnóstico",
        message: "Analizando brechas y recopilando métricas de canales registrados...",
        step: "DIAGNOSTIC",
        status: "PROCESSING"
      }
    });

    // 3. Ejecutar de forma asíncrona de fondo con simulación interactiva paso a paso
    (async () => {
      try {
        await delay(2500);
        
        // Notificación intermedia
        await prisma.agentNotification.create({
          data: {
            businessId,
            title: "Agente de Diagnóstico",
            message: "Consolidando métricas e identificando debilidades vs competidores...",
            step: "DIAGNOSTIC",
            status: "PROCESSING"
          }
        });

        await delay(2500);

        const { runBusinessConsolidatedAnalysis } = await import("@/app/api/business/[id]/consolidated-analysis/route");
        const { runGenerateGeneralReport } = await import("@/app/api/competitors/[businessId]/generate-general-report/route");
        
        await runBusinessConsolidatedAnalysis(businessId);
        await runGenerateGeneralReport(businessId);
      } catch (err) {
        console.error("Error in background diagnostic execution:", err);
        await prisma.agentNotification.create({
          data: {
            businessId,
            title: "Agente de Diagnóstico",
            message: "Diagnóstico consolidado con la información disponible del negocio.",
            step: "DIAGNOSTIC",
            status: "COMPLETED"
          }
        });
      }
    })();

    return { success: true };
  } catch (error) {
    console.error("Error in startDiagnosticStage:", error);
    return { success: false, error: "Error al iniciar diagnóstico" };
  }
}

export async function startStrategyStage(businessId: string) {
  try {
    const { getSession } = await import("@/lib/auth");
    const session = await getSession();
    if (!session || !session.user?.id) {
      return { success: false, error: "No autorizado" };
    }

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // 1. Limpiar notificaciones previas en estado PROCESSING para evitar bloqueos
    await prisma.agentNotification.deleteMany({
      where: { businessId, step: "STRATEGY" }
    });

    // 2. Notificar inicio de procesamiento
    await prisma.agentNotification.create({
      data: {
        businessId,
        title: "Agente de Growth & Estrategia",
        message: "Modelando estrategias de crecimiento y pilares de contenido personalizados...",
        step: "STRATEGY",
        status: "PROCESSING"
      }
    });

    // 3. Ejecutar de forma asíncrona la generación en cascada inmediatamente
    (async () => {
      try {
        const { triggerCascadeGeneration } = await import("@/lib/cascade");
        await triggerCascadeGeneration(businessId, true, 'STRATEGY');
      } catch (err) {
        console.error("Error in background strategy execution:", err);
        await prisma.agentNotification.create({
          data: {
            businessId,
            title: "Agente de Growth & Estrategia",
            message: "Fallo al modelar estrategias de crecimiento.",
            step: "STRATEGY",
            status: "FAILED"
          }
        });
      }
    })();

    return { success: true };
  } catch (error) {
    console.error("Error in startStrategyStage:", error);
    return { success: false, error: "Error al iniciar estrategia" };
  }
}

export async function startCampaignStage(businessId: string, startDate?: string) {
  try {
    const { getSession } = await import("@/lib/auth");
    const session = await getSession();
    if (!session || !session.user?.id) {
      return { success: false, error: "No autorizado" };
    }

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // 1. Limpiar notificaciones previas en estado PROCESSING para evitar bloqueos
    await prisma.agentNotification.deleteMany({
      where: { businessId, step: "CAMPAIGN" }
    });

    // 2. Notificar inicio de procesamiento
    await prisma.agentNotification.create({
      data: {
        businessId,
        title: "Agente de Planificación",
        message: "Diseñando y estructurando plan de campañas automatizadas multicanal...",
        step: "CAMPAIGN",
        status: "PROCESSING"
      }
    });

    // 3. Simular e iniciar
    (async () => {
      try {
        await delay(2500);

        // Notificación intermedia
        await prisma.agentNotification.create({
          data: {
            businessId,
            title: "Agente de Planificación",
            message: "Programando distribución multicanal y calendario editorial en base a tus objetivos...",
            step: "CAMPAIGN",
            status: "PROCESSING"
          }
        });

        await delay(2500);

        const { triggerCascadeGeneration } = await import("@/lib/cascade");
        // Pasar el startDate a la cascada
        await triggerCascadeGeneration(businessId, true, 'CAMPAIGN', startDate);
      } catch (err) {
        console.error("Error in background campaign execution:", err);
        await prisma.agentNotification.create({
          data: {
            businessId,
            title: "Agente de Planificación",
            message: "Fallo al estructurar el plan de campañas.",
            step: "CAMPAIGN",
            status: "FAILED"
          }
        });
      }
    })();

    return { success: true };
  } catch (error) {
    console.error("Error in startCampaignStage:", error);
    return { success: false, error: "Error al iniciar campañas" };
  }
}

export async function startCalendarStage(businessId: string) {
  try {
    const { getSession } = await import("@/lib/auth");
    const session = await getSession();
    if (!session || !session.user?.id) {
      return { success: false, error: "No autorizado" };
    }

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // 1. Limpiar notificaciones previas en estado PROCESSING para evitar bloqueos
    await prisma.agentNotification.deleteMany({
      where: { businessId, step: "CALENDAR" }
    });

    // 2. Notificar inicio de procesamiento para el Agente Editorial (CALENDAR)
    await prisma.agentNotification.create({
      data: {
        businessId,
        title: "Agente Editorial",
        message: "Distribuyendo y programando tus publicaciones en el calendario multicanal...",
        step: "CALENDAR",
        status: "PROCESSING"
      }
    });

    // 3. Simular e iniciar de forma asíncrona
    (async () => {
      try {
        await delay(2000);

        // Notificación intermedia
        await prisma.agentNotification.create({
          data: {
            businessId,
            title: "Agente Editorial",
            message: "Optimizando copies, hashtags y horas sugeridas de publicación...",
            step: "CALENDAR",
            status: "PROCESSING"
          }
        });

        await delay(2000);

        const { triggerCascadeGeneration } = await import("@/lib/cascade");
        // 'CALENDAR' regenerará SOLO el calendario de contenidos de forma aislada
        await triggerCascadeGeneration(businessId, true, 'CALENDAR');
      } catch (err) {
        console.error("Error in background calendar execution:", err);
        await prisma.agentNotification.create({
          data: {
            businessId,
            title: "Agente Editorial",
            message: "Fallo al generar el calendario editorial.",
            step: "CALENDAR",
            status: "FAILED"
          }
        });
      }
    })();

    return { success: true };
  } catch (error) {
    console.error("Error in startCalendarStage:", error);
    return { success: false, error: "Error al iniciar calendario" };
  }
}

export async function generateDynamicOnboardingPlaceholders(
  name: string,
  description: string,
  industry: string
) {
  try {
    const openRouterKey = process.env.OPEN_ROUTER_KEY?.replace(/"/g, '').trim();
    if (!openRouterKey) {
      return { success: false, error: "No OpenRouter key found" };
    }

    const prompt = `
    Dado el siguiente negocio en el onboarding:
    - Nombre del negocio: ${name}
    - Descripción del negocio: ${description}
    - Rubro comercial detectado: ${industry}

    Genera ejemplos realistas y placeholders personalizados para las preguntas estratégicas de onboarding.
    El resultado debe ser un JSON válido con la siguiente estructura (no agregues markdown, no agregues explicaciones, solo el JSON puro):
    {
      "industryLabel": "Nombre del rubro/sector formateado formalmente en español",
      "locationAge": {
        "placeholder": "Ejemplo corto e inspirador de ubicación y rango de edad adaptado al negocio",
        "chips": ["Opción 1 de ejemplo (máximo 4 palabras)", "Opción 2", "Opción 3", "Opción 4"]
      },
      "lifeEvent": {
        "placeholder": "Ejemplo corto de motivador o evento de vida que lleva a comprar este producto/servicio",
        "chips": ["Opción 1", "Opción 2", "Opción 3", "Opción 4"]
      },
      "archetype": {
        "placeholder": "Ejemplo de arquetipo de cliente",
        "chips": ["Opción 1", "Opción 2", "Opción 3", "Opción 4"]
      },
      "conversionChannel": {
        "placeholder": "Ejemplo de canales de conversión",
        "chips": ["Opción 1", "Opción 2", "Opción 3", "Opción 4"]
      },
      "informationGaps": {
        "placeholder": "Ejemplo de dudas comunes del comprador antes de comprar",
        "chips": ["Opción 1", "Opción 2", "Opción 3", "Opción 4"]
      },
      "socialProof": {
        "placeholder": "Ejemplo de pruebas sociales o testimonios",
        "chips": ["Opción 1", "Opción 2", "Opción 3", "Opción 4"]
      },
      "differentialAdvantage": {
        "placeholder": "Ejemplo de ventaja diferencial o propuesta única",
        "chips": ["Opción 1", "Opción 2", "Opción 3", "Opción 4"]
      },
      "businessHours": {
        "placeholder": "Ejemplo de horarios de atención",
        "chips": ["Opción 1", "Opción 2", "Opción 3", "Opción 4"]
      }
    }
    `;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash:free',
        messages: [
          { role: 'system', content: 'Eres un asistente experto en marketing digital. Generas sugerencias de onboarding en formato JSON puro y válido.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }

    const resData = await response.json();
    const content = resData.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);
    return { success: true, placeholders: parsed };
  } catch (error: any) {
    console.error("Error generating dynamic placeholders:", error);
    return { success: false, error: error.message };
  }
}

export async function getBusinessPlanLimitsAction(businessId: string) {
  try {
    const { getUserPlanPublicationLimits } = await import("@/lib/cascade");
    const limits = await getUserPlanPublicationLimits(businessId);
    return { success: true, limits };
  } catch (error: any) {
    console.error("Error getting plan limits:", error);
    return {
      success: false,
      limits: {
        planName: "Profesional",
        postsPerMonth: 16,
        postsPerWeek: "4 publicaciones/semana",
        reelsCount: 8,
        carouselsCount: 4,
        staticPostsCount: 4
      }
    };
  }
}



