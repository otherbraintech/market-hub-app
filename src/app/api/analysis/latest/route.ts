import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const entityId = searchParams.get("entityId");
    const channel = searchParams.get("channel");

    if (!type || !entityId) {
      return NextResponse.json(
        { error: "Faltan parámetros: type, entityId" },
        { status: 400 }
      );
    }

    const whereClause: any = {
      type,
      entityId,
    };

    if (channel) {
      whereClause.channel = channel;
    }

    const report = await prisma.analysisReport.findFirst({
      where: whereClause,
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!report) {
      return NextResponse.json({ report: null });
    }

    return NextResponse.json({ report });
  } catch (error) {
    console.error("Error en /api/analysis/latest:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
