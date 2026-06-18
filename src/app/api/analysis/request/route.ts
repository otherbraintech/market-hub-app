import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, entityId, url, channel } = body;

    if (!type || !entityId || !url) {
      return NextResponse.json(
        { error: "Faltan parámetros requeridos: type, entityId, url" },
        { status: 400 }
      );
    }

    // Default channel to WEBSITE if not provided
    const reportChannel = channel || "WEBSITE";

    // Fetch competitor info to enrich the webhook payload
    let competitorName = "";
    let businessId = "";
    if (type === "COMPETITOR") {
      const competitor = await prisma.competitor.findUnique({
        where: { id: entityId },
      });
      if (competitor) {
        competitorName = competitor.name || "";
        businessId = competitor.businessId;
      }
    }

    // Create the PENDING record with the channel
    const report = await prisma.analysisReport.create({
      data: {
        type,
        entityId,
        url,
        channel: reportChannel,
        status: "PENDING",
      },
    });

    // Notify the user about the start of scraping
    let resolvedBusinessId = "";
    if (type === "COMPETITOR") {
      const competitor = await prisma.competitor.findUnique({
        where: { id: entityId },
        select: { businessId: true, name: true }
      });
      if (competitor) {
        competitorName = competitor.name || "";
        businessId = competitor.businessId;
        resolvedBusinessId = competitor.businessId;
      }
    } else if (type === "MY_BUSINESS") {
      resolvedBusinessId = entityId;
      businessId = entityId;
    }

    if (resolvedBusinessId) {
      const targetName = type === "COMPETITOR" ? `competidor "${competitorName}"` : "propio negocio";
      await prisma.agentNotification.create({
        data: {
          businessId: resolvedBusinessId,
          title: "Agente de Extracción",
          message: `Iniciando reanálisis y extracción del canal ${reportChannel} para el ${targetName}.`,
          step: "SCRAPING",
          status: "PROCESSING"
        }
      }).catch((err: any) => console.error("Error creating agent notification for analysis request:", err));
    }

    // Trigger external webhook (n8n) - using scrap-negocio for all analysis types
    const n8nWebhookUrl = "https://otherbrain-n8n.c1hohn.easypanel.host/webhook/scrap-negocio";
    
    try {
      await fetch(n8nWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: report.id,
          type,
          channel: reportChannel,
          url,
          businessId,
          competitorName,
          callbackUrl: `${process.env.APP_URL || "http://localhost:3000"}/api/webhook/callback`,
        }),
      });
    } catch (error: any) {
      console.error("Error triggering external webhook:", error);
      // We'll update to ERROR if it completely fails to send
      await prisma.analysisReport.update({
        where: { id: report.id },
        data: { status: "ERROR", error: `Error al conectar con n8n: ${error?.message || error}` },
      });
      if (resolvedBusinessId) {
        await prisma.agentNotification.create({
          data: {
            businessId: resolvedBusinessId,
            title: "Agente de Extracción",
            message: `Fallo al iniciar extracción de ${reportChannel} para el ${type === "COMPETITOR" ? `competidor "${competitorName}"` : "propio negocio"}.`,
            step: "SCRAPING",
            status: "FAILED"
          }
        }).catch(err => console.error(err));
      }
      return NextResponse.json(
        { error: "Error al iniciar el análisis", details: error?.message || String(error) }, 
        { status: 500 }
      );
    }

    return NextResponse.json({ reportId: report.id, status: report.status });
  } catch (error: any) {
    console.error("CRITICAL ERROR IN REQUEST ROUTE:", error);
    return NextResponse.json(
      { error: "Error interno del servidor", details: error?.message || String(error) }, 
      { status: 500 }
    );
  }
}
