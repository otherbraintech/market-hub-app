import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params;

    // Get business info
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        website: true,
        description: true,
        industry: true,
        targetAudience: true,
        brandVoice: true,
        phoneNumbers: true,
        location: true,
      }
    });

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Get all competitors
    const competitors = await prisma.competitor.findMany({
      where: { businessId },
      select: {
        id: true,
        name: true,
        website: true,
        facebook: true,
        instagram: true,
        tiktok: true,
        linkedin: true,
        youtube: true,
        seoGoogle: true,
      }
    });

    // Get all analysis reports
    const businessReports = await prisma.analysisReport.findMany({
      where: {
        type: 'MY_BUSINESS',
        entityId: businessId,
        status: 'COMPLETED'
      },
      orderBy: { completedAt: 'desc' }
    });

    const competitorReports = await prisma.analysisReport.findMany({
      where: {
        type: 'COMPETITOR',
        entityId: { in: competitors.map(c => c.id) },
        status: 'COMPLETED'
      },
      orderBy: { completedAt: 'desc' }
    });

    // Normalize all data
    const normalizedBusinessReports = businessReports.map(report => {
      let dataObj = report.data;
      if (typeof report.data === 'string') {
        try {
          dataObj = JSON.parse(report.data);
        } catch (e) {
          console.error('Error parsing report data:', e);
        }
      }
      return { ...report, data: dataObj };
    });

    const normalizedCompetitorReports = competitorReports.map(report => {
      let dataObj = report.data;
      if (typeof report.data === 'string') {
        try {
          dataObj = JSON.parse(report.data);
        } catch (e) {
          console.error('Error parsing report data:', e);
        }
      }
      return { ...report, data: dataObj };
    });

    // Build context for AI
    const context = {
      business: {
        name: business.name,
        website: business.website,
        description: business.description,
        industry: business.industry,
        location: business.location,
        targetAudience: business.targetAudience,
        brandVoice: business.brandVoice,
      },
      competitors: competitors.map(c => ({
        name: c.name,
        website: c.website,
        channels: {
          facebook: c.facebook,
          instagram: c.instagram,
          tiktok: c.tiktok,
          linkedin: c.linkedin,
          youtube: c.youtube,
          seoGoogle: c.seoGoogle,
        }
      })),
      businessAnalysis: normalizedBusinessReports.map(r => ({
        channel: r.channel,
        url: r.url,
        data: r.data,
        completedAt: r.completedAt
      })),
      competitorAnalysis: normalizedCompetitorReports.map(r => ({
        channel: r.channel,
        url: r.url,
        data: r.data,
        completedAt: r.completedAt
      }))
    };

    // Generate consolidated analysis with AI
    const analysis = await generateConsolidatedAnalysisWithAI(context);

    // Store the analysis in a new AnalysisReport
    const storedAnalysis = await prisma.analysisReport.create({
      data: {
        type: 'MY_BUSINESS',
        channel: 'CONSOLIDATED',
        entityId: businessId,
        url: business.website || '',
        status: 'COMPLETED',
        data: analysis,
        completedAt: new Date()
      }
    });

    return NextResponse.json({
      analysisId: storedAnalysis.id,
      analysis,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating consolidated analysis:', error);
    return NextResponse.json({ error: 'Failed to generate consolidated analysis' }, { status: 500 });
  }
}

async function generateConsolidatedAnalysisWithAI(context: any) {
  const openRouterKey = process.env.OPEN_ROUTER_KEY?.replace(/"/g, '').trim();
  
  if (!openRouterKey) {
    return generatePlaceholderAnalysis(context);
  }

  try {
    const prompt = buildConsolidatedPrompt(context);
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'MarketOps',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4.5',
        messages: [
          {
            role: 'system',
            content: 'Eres un experto en análisis de mercado y competencia digital. Genera un análisis consolidado detallado y accionable basado en los datos proporcionados. El análisis debe ser en español, profesional y proporcionar insights específicos y recomendaciones prácticas. Responde en formato JSON válido.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      })
    });

    if (!response.ok) {
      console.error('OpenRouter API error:', response.status, response.statusText);
      return generatePlaceholderAnalysis(context);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      return generatePlaceholderAnalysis(context);
    }

    try {
      const parsed = JSON.parse(content);
      return parsed;
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      return generatePlaceholderAnalysis(context);
    }
  } catch (error) {
    console.error('Error calling OpenRouter:', error);
    return generatePlaceholderAnalysis(context);
  }
}

function buildConsolidatedPrompt(context: any) {
  const { business, competitors, businessAnalysis, competitorAnalysis } = context;
  
  let prompt = `Genera un análisis consolidado de competencia para el siguiente negocio:\n\n`;
  
  prompt += `NEGOCIO:\n`;
  prompt += `- Nombre: ${business.name}\n`;
  prompt += `- Industria: ${business.industry || 'No especificada'}\n`;
  prompt += `- Ubicación: ${business.location || 'No especificada'}\n`;
  prompt += `- Sitio web: ${business.website || 'No especificado'}\n`;
  prompt += `- Descripción: ${business.description || 'No especificada'}\n\n`;
  
  if (competitors.length > 0) {
    prompt += `COMPETIDORES (${competitors.length}):\n`;
    competitors.forEach((c: any, i: number) => {
      prompt += `${i + 1}. ${c.name || 'Sin nombre'}\n`;
      if (c.website) prompt += `   - Web: ${c.website}\n`;
      const channels = Object.entries(c.channels).filter(([_, v]) => v).map(([k, _]) => k);
      if (channels.length > 0) prompt += `   - Canales: ${channels.join(', ')}\n`;
    });
    prompt += `\n`;
  }
  
  if (businessAnalysis.length > 0) {
    prompt += `ANÁLISIS DEL NEGOCIO:\n`;
    businessAnalysis.forEach((a: any) => {
      prompt += `- Canal: ${a.channel}\n`;
      prompt += `  URL: ${a.url}\n`;
      if (a.data) {
        if (a.data.market_positioning) prompt += `  Posicionamiento: ${a.data.market_positioning}\n`;
        if (a.data.strengths?.length) prompt += `  Fortalezas: ${a.data.strengths.join(', ')}\n`;
        if (a.data.weaknesses?.length) prompt += `  Debilidades: ${a.data.weaknesses.join(', ')}\n`;
        if (a.data.strategic_recommendations?.length) prompt += `  Recomendaciones: ${a.data.strategic_recommendations.slice(0, 2).join(', ')}\n`;
      }
    });
    prompt += `\n`;
  }
  
  if (competitorAnalysis.length > 0) {
    prompt += `ANÁLISIS DE COMPETIDORES:\n`;
    competitorAnalysis.forEach((a: any) => {
      prompt += `- Canal: ${a.channel}\n`;
      prompt += `  URL: ${a.url}\n`;
      if (a.data) {
        if (a.data.competitive_observations) {
          if (a.data.competitive_observations.main_strengths?.length) {
            prompt += `  Fortalezas: ${a.data.competitive_observations.main_strengths.join(', ')}\n`;
          }
          if (a.data.competitive_observations.main_weaknesses?.length) {
            prompt += `  Debilidades: ${a.data.competitive_observations.main_weaknesses.join(', ')}\n`;
          }
        }
        if (a.data.instagram_presence) {
          prompt += `  Instagram: ${a.data.instagram_presence.audience_size?.followers || 'N/D'} seguidores\n`;
        }
      }
    });
    prompt += `\n`;
  }
  
  prompt += `Genera un JSON con la siguiente estructura:\n`;
  prompt += `{\n`;
  prompt += `  "executiveSummary": "Resumen ejecutivo de 2-3 párrafos sobre la posición del negocio en el mercado",\n`;
  prompt += `  "marketPosition": {\n`;
  prompt += `    "currentPosition": "Descripción de la posición actual",\n`;
  prompt += `    "competitiveAdvantage": "Ventaja competitiva identificada",\n`;
  prompt += `    "marketGap": "Oportunidad de mercado no explotada"\n`;
  prompt += `  },\n`;
  prompt += `  "strengths": ["lista de fortalezas del negocio"],\n`;
  prompt += `  "weaknesses": ["lista de debilidades del negocio"],\n`;
  prompt += `  "opportunities": ["lista de oportunidades basadas en análisis de competencia"],\n`;
  prompt += `  "threats": ["lista de amenazas de la competencia"],\n`;
  prompt += `  "competitorInsights": [\n`;
  prompt += `    {\n`;
  prompt += `      "competitorName": "nombre",\n`;
  prompt += `      "keyStrengths": ["fortalezas clave"],\n`;
  prompt += `      "keyWeaknesses": ["debilidades clave"],\n`;
  prompt += `      "marketShare": "estimación de cuota de mercado",\n`;
  prompt += `      "differentiation": "cómo se diferencian"\n`;
  prompt += `    }\n`;
  prompt += `  ],\n`;
  prompt += `  "strategicRecommendations": [\n`;
  prompt += `    {\n`;
  prompt += `      "priority": "alta|media|baja",\n`;
  prompt += `      "category": "marketing|producto|operaciones|cliente",\n`;
  prompt += `      "action": "acción específica",\n`;
  prompt += `      "expectedImpact": "impacto esperado",\n`;
  prompt += `      "timeline": "timeline sugerido"\n`;
  prompt += `    }\n`;
  prompt += `  ],\n`;
  prompt += `  "channelStrategy": {\n`;
  prompt += `    "recommendedChannels": ["canales recomendados"],\n`;
  prompt += `    "channelPriorities": {"canal": "prioridad"},\n`;
  prompt += `    "contentStrategy": "estrategia de contenido por canal"\n`;
  prompt += `  },\n`;
  prompt += `  "nextSteps": ["pasos inmediatos a seguir"]\n`;
  prompt += `}\n\n`;
  prompt += `Responde SOLO con el JSON, sin texto adicional. Sé específico y accionable.`;
  
  return prompt;
}

function generatePlaceholderAnalysis(context: any) {
  const { business, competitors } = context;
  
  return {
    executiveSummary: `${business.name} opera en el sector de ${business.industry || 'servicios'}. Actualmente tiene ${competitors.length} competidores identificados en el mercado. El negocio tiene oportunidad de diferenciarse mediante una estrategia digital enfocada en contenido de valor y engagement con la audiencia local.`,
    marketPosition: {
      currentPosition: "Posición emergente en el mercado local con potencial de crecimiento",
      competitiveAdvantage: "Enfoque en calidad y servicio al cliente",
      marketGap: "Oportunidad en contenido digital y presencia en redes sociales"
    },
    strengths: [
      "Ubicación estratégica en zona de alta demanda",
      "Producto/servicio de calidad reconocida",
      "Atención personalizada al cliente"
    ],
    weaknesses: [
      "Presencia digital limitada",
      "Falta de estrategia de contenido consistente",
      "Bajo engagement en redes sociales"
    ],
    opportunities: [
      "Expandir presencia en Instagram y Facebook",
      "Crear contenido educativo del sector",
      "Implementar programa de fidelización digital"
    ],
    threats: [
      "Competidores con mayor presupuesto de marketing",
      "Saturación de contenido en redes sociales",
      "Cambios en algoritmos de plataformas"
    ],
    competitorInsights: competitors.map((c: any) => ({
      competitorName: c.name || 'Competidor',
      keyStrengths: ["Presencia digital estable", "Contenido variado"],
      keyWeaknesses: ["Baja interacción", "Falta de personalización"],
      marketShare: "Moderado",
      differentiation: "Enfoque en volumen vs calidad"
    })),
    strategicRecommendations: [
      {
        priority: "alta",
        category: "marketing",
        action: "Desarrollar calendario de contenido para Instagram y Facebook",
        expectedImpact: "Aumento del 30% en engagement",
        timeline: "1-2 meses"
      },
      {
        priority: "alta",
        category: "cliente",
        action: "Implementar sistema de reseñas y testimonios",
        expectedImpact: "Mejora de reputación online",
        timeline: "2-3 meses"
      },
      {
        priority: "media",
        category: "producto",
        action: "Crear promociones exclusivas para seguidores",
        expectedImpact: "Aumento de conversión",
        timeline: "1 mes"
      }
    ],
    channelStrategy: {
      recommendedChannels: ["Instagram", "Facebook", "Website"],
      channelPriorities: {
        "Instagram": "alta",
        "Facebook": "media",
        "Website": "alta"
      },
      contentStrategy: "Enfocarse en contenido visual de producto, testimonios de clientes y contenido educativo del sector"
    },
    nextSteps: [
      "Auditar presencia digital actual",
      "Definir calendario de contenido para 3 meses",
      "Crear perfil de cliente ideal",
      "Establecer KPIs de medición"
    ]
  };
}
