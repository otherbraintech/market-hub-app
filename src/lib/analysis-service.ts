import { prisma } from "@/lib/prisma";
import { sanitizeSocialUrl } from "@/lib/url";

export interface TriggerAnalysisParams {
  type: "COMPETITOR" | "MY_BUSINESS";
  entityId: string;
  url: string;
  channel?: string;
}

export async function triggerAnalysis({
  type,
  entityId,
  url,
  channel,
}: TriggerAnalysisParams) {
  const sanitizedUrl = sanitizeSocialUrl(url);
  const reportChannel = channel || "WEBSITE";

  // Enriquecer datos con info de competidor o negocio
  let competitorName = "";
  let businessId = "";
  let businessName = "";

  if (type === "COMPETITOR") {
    const competitor = await prisma.competitor.findUnique({
      where: { id: entityId },
      select: { businessId: true, name: true }
    });
    if (competitor) {
      competitorName = competitor.name || "";
      businessId = competitor.businessId;
    }
  } else if (type === "MY_BUSINESS") {
    const business = await prisma.business.findUnique({
      where: { id: entityId },
      select: { name: true }
    });
    businessId = entityId;
    if (business) {
      businessName = business.name;
    }
  }

  // Crear el registro de reporte PENDING en la BD
  const report = await prisma.analysisReport.create({
    data: {
      type,
      entityId,
      url: sanitizedUrl,
      channel: reportChannel,
      status: "PENDING",
    },
  });

  // Crear la notificación del agente
  const targetName = type === "COMPETITOR" ? `competidor "${competitorName}"` : "propio negocio";
  if (businessId) {
    await prisma.agentNotification.create({
      data: {
        businessId,
        title: "Agente de Extracción",
        message: `Iniciando extracción del canal ${reportChannel} para el ${targetName}.`,
        step: "SCRAPING",
        status: "PROCESSING"
      }
    }).catch((err: unknown) => console.error("Error al crear notificación de agente de análisis:", err));
  }

  // Ejecutar scraping unificado (OB-Scrap con fallback automático a Apify y n8n)
  (async () => {
    try {
      const { unifiedScrapeChannel } = await import("@/services/scraper-service");
      console.log(`📡 [ANALYSIS-SERVICE] Ejecutando extracción unificada para ${reportChannel} (${sanitizedUrl})...`);

      const scrapeResult = await unifiedScrapeChannel({
        url: sanitizedUrl,
        channel: reportChannel,
        maxPosts: 5,
        reportId: report.id,
        type,
        businessId,
        businessName,
      });

      // Actualizar el reporte a COMPLETED en PostgreSQL
      await prisma.analysisReport.update({
        where: { id: report.id },
        data: {
          status: "COMPLETED",
          data: scrapeResult as any,
          completedAt: new Date(),
        },
      });

      if (businessId) {
        const sourceLabel = scrapeResult.source === "OB_SCRAP" ? "OB-Scrap (Teléfonos ADB)" : scrapeResult.source === "APIFY" ? "Apify" : "Sistema de Respaldo";
        await prisma.agentNotification.create({
          data: {
            businessId,
            title: "Agente de Extracción",
            message: `Extracción del canal ${reportChannel} completada para el ${targetName} (Vía ${sourceLabel}).`,
            step: "SCRAPING",
            status: "COMPLETED"
          }
        }).catch((err) => console.error(err));

        // Trigger automático de análisis consolidado
        try {
          if (type === "COMPETITOR") {
            const { runGenerateGeneralReport } = await import("@/app/api/competitors/[businessId]/generate-general-report/route");
            const { runCompetitorConsolidatedAnalysis } = await import("@/app/api/competitors/[businessId]/consolidated-analysis/route");
            runGenerateGeneralReport(businessId).catch(e => console.error(e));
            runCompetitorConsolidatedAnalysis(businessId).catch(e => console.error(e));
          } else if (type === "MY_BUSINESS") {
            const { runBusinessConsolidatedAnalysis } = await import("@/app/api/business/[id]/consolidated-analysis/route");
            runBusinessConsolidatedAnalysis(businessId).catch(e => console.error(e));
          }
        } catch (e) {
          console.error("Error al gatillar análisis consolidado post-scraping:", e);
        }
      }
    } catch (error: any) {
      console.warn(`[ANALYSIS-SERVICE] Fallback secundario a n8n para ${reportChannel}:`, error.message);

      // Disparar n8n como respaldo final si falla la extracción directa
      const n8nWebhookUrl = type === "COMPETITOR"
        ? "https://n8n-n8n-start.ddt6vc.easypanel.host/webhook/scrap-negocio"
        : "https://n8n-n8n-start.ddt6vc.easypanel.host/webhook/sitioweb-scrap";
      const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

      try {
        await fetch(n8nWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reportId: report.id,
            type,
            channel: reportChannel,
            redSocial: reportChannel,
            url: sanitizedUrl,
            link: sanitizedUrl,
            businessId,
            entityId: entityId || businessId,
            competitorName,
            businessName,
            callbackUrl: `${appUrl}/api/webhook/callback`,
          }),
        });
      } catch (n8nErr: any) {
        console.error(`Error al enviar webhook de respaldo a n8n:`, n8nErr);
        await prisma.analysisReport.update({
          where: { id: report.id },
          data: { status: "ERROR", error: `Error en extracción: ${error.message}` },
        });
      }
    }
  })();

  return report;
}
