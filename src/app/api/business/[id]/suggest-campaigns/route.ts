import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateCampaignsCascade } from '@/lib/cascade';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const business = await prisma.business.findUnique({
      where: { id },
      select: { settings: true }
    });
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }
    const settings = (business.settings as Record<string, any>) || {};
    const campaigns = settings.aiCampaignProposals || [];
    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error('Error fetching campaign suggestions:', error);
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Obtener información del negocio
    const business = await prisma.business.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        settings: true,
      }
    });

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Obtener las estrategias del negocio para asociarlas
    const strategies = await prisma.marketingStrategy.findMany({
      where: { businessId: id },
      select: {
        id: true,
        name: true,
        description: true,
      }
    });

    if (strategies.length === 0) {
      return NextResponse.json({ 
        error: 'No marketing strategies found. Please create at least one strategy first.' 
      }, { status: 400 });
    }

    // Generar 3 propuestas de campañas
    const campaigns = await generateCampaignsCascade(business, strategies, 3);

    // Guardar en settings para persistencia
    if (campaigns && campaigns.length > 0) {
      const currentSettings = (business.settings as Record<string, any>) || {};
      await prisma.business.update({
        where: { id },
        data: {
          settings: {
            ...currentSettings,
            aiCampaignProposals: campaigns
          }
        }
      });
    }

    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error('Error generating campaigns:', error);
    return NextResponse.json({ error: 'Failed to generate campaigns' }, { status: 500 });
  }
}
