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

    return NextResponse.json({ notifications });
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
