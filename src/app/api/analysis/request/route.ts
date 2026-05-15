import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, entityId, url } = body;

    if (!type || !entityId || !url) {
      return NextResponse.json(
        { error: "Faltan parámetros requeridos: type, entityId, url" },
        { status: 400 }
      );
    }

    // Create the PENDING record
    const report = await prisma.analysisReport.create({
      data: {
        type,
        entityId,
        url,
        status: "PENDING",
      },
    });

    // Trigger external webhook (n8n)
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
    if (n8nWebhookUrl) {
      // In a real scenario, you'd send this to n8n asynchronously.
      // We don't wait for the final processing, just the acknowledgment.
      try {
        await fetch(n8nWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reportId: report.id,
            type,
            url,
            callbackUrl: `${process.env.APP_URL || "http://localhost:3000"}/api/webhook/callback`,
          }),
        });
      } catch (error) {
        console.error("Error triggering external webhook:", error);
        // We'll update to ERROR if it completely fails to send
        await prisma.analysisReport.update({
          where: { id: report.id },
          data: { status: "ERROR", error: "Error al conectar con n8n" },
        });
        return NextResponse.json({ error: "Error al iniciar el análisis" }, { status: 500 });
      }
    } else {
      console.warn("N8N_WEBHOOK_URL no está configurado.");
    }

    return NextResponse.json({ reportId: report.id, status: report.status });
  } catch (error) {
    console.error("Error en /api/analysis/request:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
