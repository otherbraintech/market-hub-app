import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { reportId, data, error } = body;

    if (!reportId) {
      return NextResponse.json({ error: "Falta el parámetro: reportId" }, { status: 400 });
    }

    if (error) {
      const report = await prisma.analysisReport.update({
        where: { id: reportId },
        data: {
          status: "ERROR",
          error: error,
          completedAt: new Date(),
        },
      });

      // Registrar notificación de error en extracción
      let resolvedBusinessId = "";
      let competitorName = "";
      if (report.type === "COMPETITOR") {
        const competitor = await prisma.competitor.findUnique({
          where: { id: report.entityId },
          select: { businessId: true, name: true }
        });
        if (competitor) {
          resolvedBusinessId = competitor.businessId;
          competitorName = competitor.name || "";
        }
      } else if (report.type === "MY_BUSINESS") {
        resolvedBusinessId = report.entityId;
      }

      if (resolvedBusinessId) {
        const targetName = report.type === "COMPETITOR" ? `competidor "${competitorName}"` : "propio negocio";
        await prisma.agentNotification.create({
          data: {
            businessId: resolvedBusinessId,
            title: "Agente de Extracción",
            message: `Fallo en la extracción del canal ${report.channel} para el ${targetName}: ${error}.`,
            step: "SCRAPING",
            status: "FAILED"
          }
        }).catch((err: any) => console.error("Error creating agent notification for callback error:", err));
      }

      return NextResponse.json({ success: true, report });
    }

    // Si no viene "data", pero viene "status" o la respuesta completa, usar el cuerpo entero como data
    let reportData = data;
    if (!reportData) {
      if (body.status === true || body.status === "true") {
        reportData = body;
      } else {
        return NextResponse.json({ error: "Falta el payload: data o status exitoso" }, { status: 400 });
      }
    }

    const report = await prisma.analysisReport.update({
      where: { id: reportId },
      data: {
        status: "COMPLETED",
        data: reportData,
        completedAt: new Date(),
      },
    });

    // Registrar notificación de éxito en extracción
    let resolvedBusinessId = "";
    let competitorName = "";
    if (report.type === "COMPETITOR") {
      const competitor = await prisma.competitor.findUnique({
        where: { id: report.entityId },
        select: { businessId: true, name: true }
      });
      if (competitor) {
        resolvedBusinessId = competitor.businessId;
        competitorName = competitor.name || "";
      }
    } else if (report.type === "MY_BUSINESS") {
      resolvedBusinessId = report.entityId;
    }

    if (resolvedBusinessId) {
      const targetName = report.type === "COMPETITOR" ? `competidor "${competitorName}"` : "propio negocio";
      await prisma.agentNotification.create({
        data: {
          businessId: resolvedBusinessId,
          title: "Agente de Extracción",
          message: `Extracción del canal ${report.channel} finalizada con éxito para el ${targetName}.`,
          step: "SCRAPING",
          status: "COMPLETED"
        }
      }).catch((err: any) => console.error("Error creating agent notification for callback success:", err));
    }

    // Si el reporte es exitoso, actualizar automáticamente el informe consolidado / análisis general del negocio
    try {
      const host = request.headers.get("host") || "localhost:3000";
      const protocol = host.includes("localhost") ? "http" : "https";

      if (report.type === "COMPETITOR" && resolvedBusinessId) {
        // 1. Regenerar el informe general consolidado de competidores de la IA
        const generateReportUrl = `${protocol}://${host}/api/competitors/${resolvedBusinessId}/generate-general-report`;
        console.log(`🤖 Disparando regeneración automática de Informe General de Competidores para negocio: ${resolvedBusinessId}`);
        fetch(generateReportUrl, { method: "POST" }).catch((err) => {
          console.error("Error en regeneración automática de informe general de competidores:", err);
        });

        // 2. Regenerar el análisis consolidado de competidores (la matriz consolidada)
        const competitorConsolidatedUrl = `${protocol}://${host}/api/competitors/${resolvedBusinessId}/consolidated-analysis`;
        console.log(`🤖 Disparando regeneración automática de Análisis Consolidado de Competidores para negocio: ${resolvedBusinessId}`);
        fetch(competitorConsolidatedUrl, { method: "POST" }).catch((err) => {
          console.error("Error en consolidación automática de competidores:", err);
        });
      } else if (report.type === "MY_BUSINESS" && resolvedBusinessId) {
        // Regenerar el análisis consolidado del propio negocio (FODA, etc.)
        const myConsolidatedUrl = `${protocol}://${host}/api/business/${resolvedBusinessId}/consolidated-analysis`;
        console.log(`🤖 Disparando regeneración automática de Análisis Consolidado Propio para negocio: ${resolvedBusinessId}`);
        fetch(myConsolidatedUrl, { method: "POST" }).catch((err) => {
          console.error("Error en consolidación automática propia de negocio:", err);
        });
      }
    } catch (err) {
      console.error("Error al procesar los triggers automáticos de consolidación/informe general:", err);
    }

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error("Error en /api/webhook/callback:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
