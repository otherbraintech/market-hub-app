import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: businessId } = await params;

    // Obtener competidores del negocio
    const competitors = await prisma.competitor.findMany({
      where: { businessId },
      select: { id: true }
    });

    const competitorIds = competitors.map((c: { id: string }) => c.id);

    // Obtener los reportes de análisis para estos competidores
    const reports = await prisma.analysisReport.findMany({
      where: {
        type: 'COMPETITOR',
        entityId: { in: competitorIds }
      },
      select: {
        entityId: true,
        channel: true,
        status: true,
        error: true,
        completedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Agrupar los reportes más recientes por competidor y canal
    const statusMap: Record<string, Record<string, { status: string; error?: string | null }>> = {};

    competitorIds.forEach((id: string) => {
      statusMap[id] = {};
    });

    reports.forEach((report: any) => {
      // Como ordenamos desc por fecha, el primero que encontremos por canal es el más reciente
      if (!statusMap[report.entityId][report.channel]) {
        statusMap[report.entityId][report.channel] = {
          status: report.status,
          error: report.error
        };
      }
    });

    return NextResponse.json({ statusMap });
  } catch (error) {
    console.error('Error fetching competitor scraping status:', error);
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
  }
}
