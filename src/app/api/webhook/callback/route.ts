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

    if (!data) {
      return NextResponse.json({ error: "Falta el payload: data" }, { status: 400 });
    }

    const report = await prisma.analysisReport.update({
      where: { id: reportId },
      data: {
        status: "COMPLETED",
        data,
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

    // Si el reporte completado es de tipo COMPETITOR, actualizar automáticamente el Diagnóstico y el Informe General del Negocio
    if (report.type === "COMPETITOR") {
      try {
        const competitor = await prisma.competitor.findUnique({
          where: { id: report.entityId },
          select: { businessId: true }
        });

        if (competitor?.businessId) {
          const businessId = competitor.businessId;
          const host = request.headers.get("host") || "localhost:3000";
          const protocol = host.includes("localhost") ? "http" : "https";
          const generateUrl = `${protocol}://${host}/api/competitors/${businessId}/generate-general-report`;
          
          console.log(`🤖 Disparando regeneración automática de Informe General para negocio: ${businessId}`);
          
          // Hacemos el fetch de forma asíncrona (no bloqueante) para no demorar la respuesta al webhook
          fetch(generateUrl, { method: "POST" }).catch((err) => {
            console.error("Error en regeneración automática de informe general de competidores:", err);
          });
        }
      } catch (err) {
        console.error("Error al procesar disparador automático de informe general de competidores:", err);
      }
    }

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error("Error en /api/webhook/callback:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
