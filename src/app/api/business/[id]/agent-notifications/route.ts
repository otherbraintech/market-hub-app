import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: businessId } = await params;

    const notifications = await prisma.agentNotification.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      take: 15
    });

    const competitorCount = await prisma.competitor.count({ where: { businessId } });
    const strategyCount = await prisma.marketingStrategy.count({ where: { businessId } });
    const scheduledContentCount = await prisma.content.count({
      where: {
        campaign: { businessId },
        status: "SCHEDULED"
      }
    });

    const isBusinessConfigured = await prisma.business.findUnique({
      where: { id: businessId },
      select: { industry: true }
    }).then(b => !!b?.industry);

    return NextResponse.json({ 
      notifications,
      onboarding: {
        isBusinessConfigured,
        competitorCount,
        strategyCount,
        scheduledContentCount
      }
    });
  } catch (error) {
    console.error('Error fetching agent notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch agent notifications' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: businessId } = await params;

    // Limpiar historial de notificaciones
    await prisma.agentNotification.deleteMany({
      where: { businessId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to clear notifications' }, { status: 500 });
  }
}
