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
        message: `Iniciando reanálisis y extracción del canal ${reportChannel} para el ${targetName}.`,
        step: "SCRAPING",
        status: "PROCESSING"
      }
    }).catch((err: unknown) => console.error("Error al crear la notificación del agente de análisis:", err));
  }

  // Disparar el webhook externo (n8n)
  const n8nWebhookUrl = type === "COMPETITOR" 
    ? "https://n8n-n8n-start.ddt6vc.easypanel.host/webhook/sitioweb-scrap"
    : "https://n8n-n8n-start.ddt6vc.easypanel.host/webhook/scrap-negocio";
  const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    const response = await fetch(n8nWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reportId: report.id,
        type,
        channel: reportChannel,
        url: sanitizedUrl,
        businessId,
        competitorName,
        businessName, // Para MY_BUSINESS
        callbackUrl: `${appUrl}/api/webhook/callback`,
      }),
    });

    if (!response.ok) {
      throw new Error(`n8n webhook returned status: ${response.status}`);
    }
  } catch (error) {
    console.error(`Error al enviar el webhook a n8n para el canal ${reportChannel}:`, error);

    const errorMessage = error instanceof Error ? error.message : String(error);

    // Actualizar el reporte a ERROR
    await prisma.analysisReport.update({
      where: { id: report.id },
      data: { status: "ERROR", error: `Error al conectar con n8n: ${errorMessage}` },
    });

    // Registrar evento de canal omitido en las notificaciones sin bloquear la canalización
    if (businessId) {
      await prisma.agentNotification.create({
        data: {
          businessId,
          title: "Agente de Extracción",
          message: `Canal ${reportChannel} de ${targetName} omitido (continuando diagnóstico con datos disponibles).`,
          step: "SCRAPING",
          status: "COMPLETED"
        }
      }).catch((err) => console.error(err));
    }

    throw error;
  }

  return report;
}
