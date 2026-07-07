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
      if (report.type === "COMPETITOR" && resolvedBusinessId) {
        const { runGenerateGeneralReport } = await import("@/app/api/competitors/[businessId]/generate-general-report/route");
        const { runCompetitorConsolidatedAnalysis } = await import("@/app/api/competitors/[businessId]/consolidated-analysis/route");

        console.log(`🤖 Disparando regeneración automática de Informe General y Análisis Consolidado de Competidores para negocio: ${resolvedBusinessId}`);
        runGenerateGeneralReport(resolvedBusinessId).catch((err) => {
          console.error("Error en regeneración de informe de competidores:", err);
        });
        runCompetitorConsolidatedAnalysis(resolvedBusinessId).catch((err) => {
          console.error("Error en consolidación de análisis de competidores:", err);
        });
      } else if (report.type === "MY_BUSINESS" && resolvedBusinessId) {
        const { runBusinessConsolidatedAnalysis } = await import("@/app/api/business/[id]/consolidated-analysis/route");

        console.log(`🤖 Disparando regeneración automática de Análisis Consolidado Propio para negocio: ${resolvedBusinessId}`);
        runBusinessConsolidatedAnalysis(resolvedBusinessId).catch((err) => {
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
