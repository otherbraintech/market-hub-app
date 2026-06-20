import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
        url,
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
    }).catch((err: any) => console.error("Error al crear notificación de extracción manual de negocio:", err));

    // Trigger external webhook (n8n) for business scraping
    const n8nWebhookUrl = "https://otherbrain-n8n.c1hohn.easypanel.host/webhook/scrap-negocio";
    
    try {
      await fetch(n8nWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: report.id,
          type: "MY_BUSINESS",
          channel: reportChannel,
          url,
          businessId,
          businessName: business.name,
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
      return NextResponse.json(
        { error: "Error al iniciar el análisis", details: error?.message || String(error) }, 
        { status: 500 }
      );
    }

    return NextResponse.json({ reportId: report.id, status: report.status });
  } catch (error: any) {
    console.error("CRITICAL ERROR IN BUSINESS SCRAP ROUTE:", error);
    return NextResponse.json(
      { error: "Error interno del servidor", details: error?.message || String(error) }, 
      { status: 500 }
    );
  }
}
