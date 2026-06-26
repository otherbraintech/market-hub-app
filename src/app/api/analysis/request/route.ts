import { NextResponse } from "next/server";
import { triggerAnalysis } from "@/lib/analysis-service";

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

    const report = await triggerAnalysis({
      type,
      entityId,
      url,
      channel,
    });

    return NextResponse.json({ reportId: report.id, status: report.status });
  } catch (error) {
    console.error("CRITICAL ERROR IN REQUEST ROUTE:", error);
    return NextResponse.json(
      { error: "Error al procesar el análisis", details: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    );
  }
}

