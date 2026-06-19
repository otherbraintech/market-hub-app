'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

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
    let dbCompetitor;

    if (competitorId) {
      dbCompetitor = await prisma.competitor.update({
        where: { id: competitorId },
        data
      })
    } else {
      // Check limit
      const user = await prisma.user.findFirst({
        where: { businesses: { some: { id: businessId } } },
        select: { maxCompetitors: true }
      })

      const count = await prisma.competitor.count({ where: { businessId } })
      
      if (user && count >= user.maxCompetitors) {
        return { success: false, error: `Límite alcanzado (${user.maxCompetitors})` }
      }

      dbCompetitor = await prisma.competitor.create({
        data: { ...data, businessId }
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
      }).catch((err: any) => console.error("Error creating competitor scraping notification:", err))
    }

    // Disparar scraping automático para todos los canales que tengan URL
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

      const appUrl = process.env.APP_URL || "http://localhost:3000";

      // Disparar en segundo plano sin bloquear el hilo principal
      channelUrls.forEach((ch) => {
        if (ch.url && ch.url.trim() !== "") {
          fetch(`${appUrl}/api/analysis/request`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "COMPETITOR",
              entityId: dbCompetitor.id,
              channel: ch.name,
              url: ch.url,
            }),
          }).catch((err) => {
            console.error(`Error al disparar scraping automático de competidor para canal ${ch.name}:`, err);
          });
        }
      });
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

    // Check if there's at least 1 social account and 1 competitor
    if (business.socialAccounts.length >= 1 && business.competitors.length >= 1) {
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
  } catch (error) {
    return { success: false, error: 'Error al eliminar competidor' }
  }
}
