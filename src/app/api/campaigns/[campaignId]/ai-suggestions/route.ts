import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const { campaignId } = await params;
    const body = await request.json();
    const { useGeneralReport } = body || {};

    // Get campaign details
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            website: true,
            description: true,
            industry: true,
            targetAudience: true,
            brandVoice: true,
          }
        },
        contents: {
          select: {
            id: true,
            type: true,
            status: true,
          }
        }
      }
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Get general competitor report if requested
    let generalReport = null;
    if (useGeneralReport) {
      const reportResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/competitors/${campaign.businessId}/general-report`);
      if (reportResponse.ok) {
        generalReport = await reportResponse.json();
      }
    }

    // Build context for AI
    const context = {
      campaign: {
        name: campaign.name,
        description: campaign.description,
        objective: campaign.objective,
        budget: campaign.budget,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
      },
      business: {
        name: campaign.business.name,
        website: campaign.business.website,
        description: campaign.business.description,
        industry: campaign.business.industry,
        targetAudience: campaign.business.targetAudience,
        brandVoice: campaign.business.brandVoice,
      },
      competitorAnalysis: generalReport ? {
        totalCompetitors: generalReport.metadata.totalCompetitors,
        channelsAnalyzed: generalReport.metadata.channelsAnalyzed,
        competitorCount: generalReport.competitors.length,
      } : null,
    };

    // Generate AI suggestions using OpenRouter
    const suggestions = await generateAISuggestionsWithOpenRouter(context);

    return NextResponse.json({
      campaignId,
      campaignName: campaign.name,
      generatedAt: new Date().toISOString(),
      usedGeneralReport: !!generalReport,
      suggestions,
    });
  } catch (error) {
    console.error('Error generating AI suggestions:', error);
    return NextResponse.json({ error: 'Failed to generate AI suggestions' }, { status: 500 });
  }
}

async function generateAISuggestionsWithOpenRouter(context: any) {
  const openRouterKey = process.env.OPEN_ROUTER_KEY?.replace(/"/g, '').trim();
  
  if (!openRouterKey) {
    // Fallback to placeholder if no API key
    return generatePlaceholderSuggestions(context);
  }

  try {
    const prompt = buildPrompt(context);
    

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'MarketOps',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'Eres un experto en marketing digital y estrategia de campañas. Genera sugerencias prácticas y accionables basadas en el contexto proporcionado. Responde en formato JSON válido.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      })
    });

    if (!response.ok) {
      console.error('OpenRouter API error:', response.status, response.statusText);
      return generatePlaceholderSuggestions(context);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      return generatePlaceholderSuggestions(context);
    }

    // Parse AI response
    try {
      const parsed = JSON.parse(content);
      return parsed;
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      return generatePlaceholderSuggestions(context);
    }
  } catch (error) {
    console.error('Error calling OpenRouter:', error);
    return generatePlaceholderSuggestions(context);
  }
}

function buildPrompt(context: any) {
  const { campaign, business, competitorAnalysis } = context;
  
  let prompt = `Genera sugerencias de marketing para la siguiente campaña:\n\n`;
  prompt += `CAMPAÑA:\n`;
  prompt += `- Nombre: ${campaign.name}\n`;
  prompt += `- Descripción: ${campaign.description || 'No especificada'}\n`;
  prompt += `- Objetivo: ${campaign.objective || 'No especificado'}\n`;
  prompt += `- Presupuesto: $${campaign.budget || 'No definido'}\n\n`;
  
  prompt += `NEGOCIO:\n`;
  prompt += `- Nombre: ${business.name}\n`;
  prompt += `- Industria: ${business.industry || 'No especificada'}\n`;
  prompt += `- Sitio web: ${business.website || 'No especificado'}\n`;
  prompt += `- Audiencia objetivo: ${JSON.stringify(business.targetAudience) || 'No especificada'}\n\n`;
  
  if (competitorAnalysis) {
    prompt += `ANÁLISIS DE COMPETENCIA:\n`;
    prompt += `- Total competidores: ${competitorAnalysis.totalCompetitors}\n`;
    prompt += `- Canales analizados: ${competitorAnalysis.channelsAnalyzed.join(', ') || 'Ninguno'}\n\n`;
  }
  
  prompt += `Genera un JSON con la siguiente estructura:\n`;
  prompt += `{\n`;
  prompt += `  "marketingChannels": [{"channel": string, "priority": "high|medium|low", "reason": string, "tactics": [string]}],\n`;
  prompt += `  "contentIdeas": [{"type": string, "topic": string, "format": string, "frequency": string}],\n`;
  prompt += `  "targeting": [{"segment": string, "strategy": string, "platforms": [string]}],\n`;
  prompt += `  "budgetAllocation": {"total": number, "allocation": {"channel": number}, "reasoning": string},\n`;
  prompt += `  "timing": [{"day": string, "hours": string, "reason": string}]\n`;
  prompt += `}\n\n`;
  prompt += `Responde SOLO con el JSON, sin texto adicional.`;
  
  return prompt;
}

function generatePlaceholderSuggestions(context: any) {
  const { campaign, business, competitorAnalysis } = context;
  
  return {
    marketingChannels: [
      {
        channel: 'Instagram',
        priority: 'high',
        reason: 'Plataforma visual ideal para mostrar productos',
        tactics: ['Stories educativas', 'Reels de producto', 'UGC con clientes']
      },
      {
        channel: 'Facebook',
        priority: 'medium',
        reason: 'Alcance local y grupos de comunidad',
        tactics: ['Grupos de comunidad', 'Eventos', 'Publicaciones de blog']
      }
    ],
    contentIdeas: [
      {
        type: 'Video',
        topic: 'Demostraciones de producto',
        format: 'Reels/Shorts',
        frequency: '2-3 por semana'
      },
      {
        type: 'Imagen',
        topic: 'Fotos de producto con clientes',
        format: 'Posts/Carousels',
        frequency: 'Diario'
      }
    ],
    targeting: [
      {
        segment: 'Local',
        strategy: 'Geotargeting en área de influencia',
        platforms: ['Facebook', 'Instagram', 'Google Ads']
      },
      {
        segment: 'Intereses',
        strategy: 'Audiencias basadas en intereses del sector',
        platforms: ['Facebook', 'Instagram']
      }
    ],
    budgetAllocation: {
      total: campaign.budget || 1000,
      allocation: {
        'Facebook/Instagram': Math.round((campaign.budget || 1000) * 0.4),
        'Google Ads': Math.round((campaign.budget || 1000) * 0.3),
        'Content Creation': Math.round((campaign.budget || 1000) * 0.2),
        'Influencers': Math.round((campaign.budget || 1000) * 0.1),
      },
      reasoning: 'Distribución equilibrada entre adquisición y creación de contenido'
    },
    timing: [
      {
        day: 'Lunes a Viernes',
        hours: '9:00 AM - 11:00 AM y 6:00 PM - 8:00 PM',
        reason: 'Mayor actividad en horarios laborales y post-laboral'
      },
      {
        day: 'Fin de semana',
        hours: '10:00 AM - 2:00 PM',
        reason: 'Momento de mayor consumo de contenido'
      }
    ]
  };
}
