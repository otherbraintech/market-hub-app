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

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error("Error en /api/webhook/callback:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
