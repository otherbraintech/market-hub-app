'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { triggerAnalysis } from "@/lib/analysis-service"

import { sanitizeSocialUrl } from "@/lib/url"

export async function upsertCompetitorAction(
  businessId: string,
  competitorId: string | undefined,
  data: {
    name: string
    website?: string | null
    facebook?: string | null
    instagram?: string | null
    tiktok?: string | null
    linkedin?: string | null
    youtube?: string | null
    seoGoogle?: string | null
  }
) {
  try {
    // Sanitizar URLs antes de guardar o actualizar
    const sanitizedData = {
      name: data.name,
      website: data.website ? sanitizeSocialUrl(data.website) : data.website,
      facebook: data.facebook ? sanitizeSocialUrl(data.facebook) : data.facebook,
      instagram: data.instagram ? sanitizeSocialUrl(data.instagram) : data.instagram,
      tiktok: data.tiktok ? sanitizeSocialUrl(data.tiktok) : data.tiktok,
      linkedin: data.linkedin ? sanitizeSocialUrl(data.linkedin) : data.linkedin,
      youtube: data.youtube ? sanitizeSocialUrl(data.youtube) : data.youtube,
      seoGoogle: data.seoGoogle ? sanitizeSocialUrl(data.seoGoogle) : data.seoGoogle,
    };

    let dbCompetitor;

    if (competitorId) {
      dbCompetitor = await prisma.competitor.update({
        where: { id: competitorId },
        data: sanitizedData
      })
    } else {
      // Check limit
      const user = await prisma.user.findFirst({
        where: { businesses: { some: { id: businessId } } },
        select: { maxCompetitors: true }
      })

      const count = await prisma.competitor.count({ where: { businessId } })
      
      const maxCompetitors = user?.maxCompetitors ?? 3
      if (user && count >= maxCompetitors) {
        return { success: false, error: `Límite alcanzado (${maxCompetitors})` }
      }

      dbCompetitor = await prisma.competitor.create({
        data: { ...sanitizedData, businessId }
      })

      // Notificar al usuario sobre el inicio del scraping
      await prisma.agentNotification.create({
        data: {
          businessId,
          title: "Agente de Scraping y Auditoría",
          message: `Iniciando extracción y auditoría digital para el nuevo competidor: "${data.name}".`,
          step: "SCRAPING",
          status: "PROCESSING"
        }
      }).catch((err: unknown) => console.error("Error creating competitor scraping notification:", err))
    }

    // Disparar scraping automático para todos los canales que tengan URL y no estén analizados o haya cambiado la URL
    if (dbCompetitor) {
      const channelUrls = [
        { name: "WEBSITE", url: dbCompetitor.website },
        { name: "FACEBOOK", url: dbCompetitor.facebook },
        { name: "INSTAGRAM", url: dbCompetitor.instagram },
        { name: "TIKTOK", url: dbCompetitor.tiktok },
        { name: "LINKEDIN", url: dbCompetitor.linkedin },
        { name: "YOUTUBE", url: dbCompetitor.youtube },
        { name: "SEO_GOOGLE", url: dbCompetitor.seoGoogle },
      ];

      const promises = channelUrls
        .filter((ch) => ch.url && ch.url.trim() !== "")
        .map(async (ch) => {
          // Evitar re-analizar si ya existe un reporte con la misma URL y canal para este competidor,
          // a menos que el reporte lleve más de 5 minutos en estado PENDING (lo que indica que se quedó atascado)
          const existing = await prisma.analysisReport.findFirst({
            where: {
              entityId: dbCompetitor.id,
              type: "COMPETITOR",
              channel: ch.name,
              url: ch.url!,
            },
            orderBy: { createdAt: "desc" }
          });

          const isStuck = existing && 
            existing.status === "PENDING" && 
            (Date.now() - new Date(existing.createdAt).getTime() > 5 * 60 * 1000);

          if (!existing || isStuck) {
            return triggerAnalysis({
              type: "COMPETITOR",
              entityId: dbCompetitor.id,
              channel: ch.name,
              url: ch.url!,
            }).catch((err) => {
              console.error(`Error al disparar scraping automático de competidor para canal ${ch.name}:`, err);
            });
          }
        });

      await Promise.allSettled(promises);
    }

    // Trigger automatic consolidated analysis if conditions are met
    await triggerAutomaticConsolidatedAnalysis(businessId);

    revalidatePath(`/business/${businessId}`)
    return { success: true, competitor: dbCompetitor }
  } catch (error) {
    console.error('Competitor Action Error:', error)
    return { success: false, error: 'Error al procesar competidor' }
  }
}

export async function triggerMissingCompetitorAnalyses(businessId: string) {
  try {
    const competitors = await prisma.competitor.findMany({
      where: { businessId }
    });

    for (const comp of competitors) {
      const channelUrls = [
        { name: "WEBSITE", url: comp.website },
        { name: "FACEBOOK", url: comp.facebook },
        { name: "INSTAGRAM", url: comp.instagram },
        { name: "TIKTOK", url: comp.tiktok },
        { name: "LINKEDIN", url: comp.linkedin },
        { name: "YOUTUBE", url: comp.youtube },
        { name: "SEO_GOOGLE", url: comp.seoGoogle },
      ];

      for (const ch of channelUrls) {
        if (ch.url && ch.url.trim() !== "") {
          const existingReport = await prisma.analysisReport.findFirst({
            where: {
              entityId: comp.id,
              type: "COMPETITOR",
              channel: ch.name,
              url: ch.url,
            },
            orderBy: { createdAt: "desc" }
          });

          const isStuck = existingReport && 
            existingReport.status === "PENDING" && 
            (Date.now() - new Date(existingReport.createdAt).getTime() > 5 * 60 * 1000);

          if (!existingReport || isStuck) {
            console.log(`[AUTO-SCRAP] No report found or report is stuck for competitor ${comp.name} on channel ${ch.name}. Triggering analysis...`);
            // Disparar análisis en segundo plano
            triggerAnalysis({
              type: "COMPETITOR",
              entityId: comp.id,
              channel: ch.name,
              url: ch.url,
            }).catch((err) => {
              console.error(`[AUTO-SCRAP] Error triggering automatic analysis for competitor ${comp.name} on channel ${ch.name}:`, err);
            });
          }
        }
      }
    }
  } catch (error) {
    console.error("Error checking/triggering missing competitor analyses:", error);
  }
}

async function triggerAutomaticConsolidatedAnalysis(businessId: string) {
  try {
    // Check if business has enough data to trigger analysis
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        socialAccounts: true,
        competitors: true
      }
    });

    if (!business) return;

    // Check if there's at least 1 competitor
    if (business.competitors.length >= 1) {
      // Check if consolidated analysis already exists
      const existingConsolidated = await prisma.analysisReport.findFirst({
        where: {
          type: 'MY_BUSINESS',
          channel: 'CONSOLIDATED',
          entityId: businessId,
          status: 'COMPLETED'
        }
      });

      if (!existingConsolidated) {
        // Trigger consolidated analysis API in background
        const appUrl = process.env.APP_URL || "http://localhost:3000";
        
        // Trigger business consolidated analysis
        fetch(`${appUrl}/api/business/${businessId}/consolidated-analysis`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }).catch((err) => {
          console.error('Error triggering business consolidated analysis:', err);
        });

        // Trigger competitor consolidated analysis
        fetch(`${appUrl}/api/competitors/${businessId}/consolidated-analysis`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }).catch((err) => {
          console.error('Error triggering competitor consolidated analysis:', err);
        });
      }
    }
  } catch (error) {
    console.error('Error in triggerAutomaticConsolidatedAnalysis:', error);
  }
}

export async function deleteCompetitorAction(businessId: string, competitorId: string) {
  try {
    await prisma.competitor.delete({ where: { id: competitorId } })
    revalidatePath(`/business/${businessId}`)
    return { success: true }
  } catch {
    return { success: false, error: 'Error al eliminar competidor' }
  }
}
