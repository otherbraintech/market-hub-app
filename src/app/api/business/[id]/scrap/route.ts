import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sanitizeSocialUrl } from "@/lib/url";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { channel, url } = body;
    const businessId = id;

    if (!businessId) {
      return NextResponse.json(
        { error: "Falta el parámetro: businessId" },
        { status: 400 }
      );
    }

    if (!url) {
      return NextResponse.json(
        { error: "Falta el parámetro: url" },
        { status: 400 }
      );
    }

    const sanitizedUrl = sanitizeSocialUrl(url);

    // Default channel to WEBSITE if not provided
    const reportChannel = channel || "WEBSITE";

    // Verify business exists
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Negocio no encontrado" },
        { status: 404 }
      );
    }

    // Create the PENDING record with the channel
    const report = await prisma.analysisReport.create({
      data: {
        type: "MY_BUSINESS",
        entityId: businessId,
        url: sanitizedUrl,
        channel: reportChannel,
        status: "PENDING",
      },
    });

    // Registrar notificación en la consola del monitor
    await prisma.agentNotification.create({
      data: {
        businessId,
        title: "Agente de Extracción",
        message: `Iniciando reanálisis y extracción del canal ${reportChannel} para el propio negocio.`,
        step: "SCRAPING",
        status: "PROCESSING"
      }
    }).catch((err: unknown) => console.error("Error al crear notificación de extracción manual de negocio:", err));

    // Disparar la extracción unificada (OB-Scrap con fallback automático a Apify y n8n)
    (async () => {
      try {
        const { unifiedScrapeChannel } = await import("@/services/scraper-service");
        const scrapeResult = await unifiedScrapeChannel({
          url: sanitizedUrl,
          channel: reportChannel,
          maxPosts: 5,
        });

        await prisma.analysisReport.update({
          where: { id: report.id },
          data: {
            status: "COMPLETED",
            data: scrapeResult as any,
            completedAt: new Date(),
          },
        });

        const sourceLabel = scrapeResult.source === "OB_SCRAP" ? "OB-Scrap (Teléfonos ADB)" : scrapeResult.source === "APIFY" ? "Apify" : "Sistema de Respaldo";
        await prisma.agentNotification.create({
          data: {
            businessId,
            title: "Agente de Extracción",
            message: `Extracción del canal ${reportChannel} completada para el propio negocio (Vía ${sourceLabel}).`,
            step: "SCRAPING",
            status: "COMPLETED"
          }
        }).catch((err) => console.error(err));

        // Trigger consolidado propio
        const { runBusinessConsolidatedAnalysis } = await import("@/app/api/business/[id]/consolidated-analysis/route");
        runBusinessConsolidatedAnalysis(businessId).catch((err) => console.error(err));
      } catch (error: any) {
        console.warn(`[BUSINESS-SCRAP-ROUTE] Fallback a n8n para ${reportChannel}:`, error.message);
        const n8nWebhookUrl = "https://n8n-n8n-start.ddt6vc.easypanel.host/webhook/scrap-negocio";
        try {
          await fetch(n8nWebhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              reportId: report.id,
              type: "MY_BUSINESS",
              channel: reportChannel,
              url: sanitizedUrl,
              businessId,
              businessName: business.name,
              callbackUrl: `${process.env.APP_URL || "http://localhost:3000"}/api/webhook/callback`,
            }),
          });
        } catch (n8nErr: any) {
          await prisma.analysisReport.update({
            where: { id: report.id },
            data: { status: "ERROR", error: `Error en extracción: ${error.message}` },
          });
        }
      }
    })();

    return NextResponse.json({ reportId: report.id, status: report.status });
  } catch (error: unknown) {
    console.error("CRITICAL ERROR IN BUSINESS SCRAP ROUTE:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Error interno del servidor", details: errorMessage }, 
      { status: 500 }
    );
  }
}
