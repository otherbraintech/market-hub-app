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

    // Trigger external webhook (n8n)
    // Defaulting to the user's easypanel host production webhook url if N8N_WEBHOOK_URL is not set
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || "https://otherbrain-n8n.c1hohn.easypanel.host/webhook/sitioweb-scrap";
    
    try {
      await fetch(n8nWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: report.id,
          type,
          channel: reportChannel,
          url,
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
    console.error("CRITICAL ERROR IN REQUEST ROUTE:", error);
    return NextResponse.json(
      { error: "Error interno del servidor", details: error?.message || String(error) }, 
      { status: 500 }
    );
  }
}
