import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get business info
    const business = await prisma.business.findUnique({
      where: { id },
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
        socialLinks: true,
      }
    });

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Get all analysis reports for the business
    const businessReports = await prisma.analysisReport.findMany({
      where: {
        type: 'MY_BUSINESS',
        entityId: business.id,
        status: 'COMPLETED'
      },
      orderBy: { completedAt: 'desc' }
    });

    // Normalize all data
    const normalizedBusinessReports = businessReports.map((report: any) => {
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
        socialLinks: business.socialLinks,
      },
      businessAnalysis: normalizedBusinessReports.map((r: any) => ({
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
        entityId: business.id,
        url: business.website || '',
        status: 'COMPLETED',
        data: analysis,
        completedAt: new Date()
      }
    });

    // Disparar generación en cascada asíncrona en background
    // (no se espera con await para no retrasar el request)
    import('@/lib/cascade').then(({ triggerCascadeGeneration }) => {
      triggerCascadeGeneration(business.id).catch(err => {
        console.error('Error in triggerCascadeGeneration background process:', err);
      });
    });

    // Disparar regeneración del informe de competidores general por si acaso faltaba
    const host = request.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const generateReportUrl = `${protocol}://${host}/api/competitors/${business.id}/generate-general-report`;
    fetch(generateReportUrl, { method: "POST" }).catch((err) => {
      console.error("Error en regeneración de informe de competidores desde análisis propio:", err);
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
            content: 'Eres un experto en análisis de negocio y estrategia digital. Genera un análisis consolidado detallado y accionable basado en los datos proporcionados sobre el negocio. El análisis debe ser en español, profesional y proporcionar insights específicos y recomendaciones prácticas para mejorar la presencia digital del negocio. Responde en formato JSON válido.'
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
  const { business, businessAnalysis } = context;
  
  let prompt = `Genera un análisis consolidado para el siguiente negocio:\n\n`;
  
  prompt += `NEGOCIO:\n`;
  prompt += `- Nombre: ${business.name}\n`;
  prompt += `- Industria: ${business.industry || 'No especificada'}\n`;
  prompt += `- Ubicación: ${business.location || 'No especificada'}\n`;
  prompt += `- Sitio web: ${business.website || 'No especificado'}\n`;
  prompt += `- Descripción: ${business.description || 'No especificada'}\n`;
  prompt += `- Audiencia objetivo: ${JSON.stringify(business.targetAudience) || 'No especificada'}\n\n`;
  
  if (businessAnalysis.length > 0) {
    prompt += `ANÁLISIS DE CANALES DIGITALES:\n`;
    businessAnalysis.forEach((a: any) => {
      prompt += `- Canal: ${a.channel}\n`;
      prompt += `  URL: ${a.url}\n`;
      if (a.data) {
        if (a.data.market_positioning) prompt += `  Posicionamiento: ${a.data.market_positioning}\n`;
        if (a.data.strengths?.length) prompt += `  Fortalezas: ${a.data.strengths.join(', ')}\n`;
        if (a.data.weaknesses?.length) prompt += `  Debilidades: ${a.data.weaknesses.join(', ')}\n`;
        if (a.data.strategic_recommendations?.length) prompt += `  Recomendaciones: ${a.data.strategic_recommendations.slice(0, 2).join(', ')}\n`;
        if (a.data.instagram_presence) {
          prompt += `  Instagram: ${a.data.instagram_presence.audience_size?.followers || 'N/D'} seguidores\n`;
        }
      }
    });
    prompt += `\n`;
  }
  
  prompt += `Genera un JSON con la siguiente estructura:\n`;
  prompt += `{\n`;
  prompt += `  "executiveSummary": "Resumen ejecutivo de 2-3 párrafos sobre la situación digital actual del negocio",\n`;
  prompt += `  "marketPosition": {\n`;
  prompt += `    "currentPosition": "Descripción de la posición digital actual",\n`;
  prompt += `    "competitiveAdvantage": "Ventaja competitiva identificada",\n`;
  prompt += `    "marketGap": "Oportunidad de mejora digital no explotada"\n`;
  prompt += `  },\n`;
  prompt += `  "strengths": ["lista de fortalezas digitales del negocio"],\n`;
  prompt += `  "weaknesses": ["lista de debilidades digitales del negocio"],\n`;
  prompt += `  "opportunities": ["lista de oportunidades de mejora digital"],\n`;
  prompt += `  "threats": ["lista de amenazas digitales"],\n`;
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
  const { business, businessAnalysis } = context;
  
  return {
    executiveSummary: `${business.name} tiene presencia digital en ${businessAnalysis.length} canales. El negocio tiene oportunidad de mejorar su estrategia digital mediante un enfoque más consistente en contenido de valor y engagement con la audiencia. Se recomienda fortalecer la presencia en los canales existentes y expandir a nuevos canales según el sector.`,
    marketPosition: {
      currentPosition: "Presencia digital básica con potencial de expansión",
      competitiveAdvantage: "Enfoque en calidad y servicio al cliente",
      marketGap: "Oportunidad en contenido digital y engagement"
    },
    strengths: [
      "Presencia en múltiples canales digitales",
      "Contenido de calidad en canales activos",
      "Atención personalizada al cliente"
    ],
    weaknesses: [
      "Falta de consistencia en publicación",
      "Bajo engagement en algunos canales",
      "Estrategia de contenido no definida"
    ],
    opportunities: [
      "Implementar calendario de contenido consistente",
      "Expandir presencia en canales emergentes",
      "Crear contenido educativo del sector"
    ],
    threats: [
      "Competidores con mayor presupuesto de marketing",
      "Cambios en algoritmos de plataformas",
      "Saturación de contenido en redes sociales"
    ],
    strategicRecommendations: [
      {
        priority: "alta",
        category: "marketing",
        action: "Desarrollar calendario de contenido para todos los canales activos",
        expectedImpact: "Aumento del 40% en engagement y visibilidad",
        timeline: "1-2 meses"
      },
      {
        priority: "alta",
        category: "cliente",
        action: "Implementar sistema de reseñas y testimonios en canales digitales",
        expectedImpact: "Mejora de reputación online",
        timeline: "2-3 meses"
      },
      {
        priority: "media",
        category: "producto",
        action: "Crear promociones exclusivas para seguidores digitales",
        expectedImpact: "Aumento de conversión",
        timeline: "1 mes"
      }
    ],
    channelStrategy: {
      recommendedChannels: businessAnalysis.map((a: any) => a.channel),
      channelPriorities: businessAnalysis.reduce((acc: any, a: any) => {
        acc[a.channel] = "alta";
        return acc;
      }, {}),
      contentStrategy: "Enfocarse en contenido visual de producto, testimonios de clientes, contenido educativo del sector y promociones exclusivas"
    },
    nextSteps: [
      "Auditar presencia digital actual",
      "Definir calendario de contenido para 3 meses",
      "Establecer KPIs de medición digital",
      "Crear perfil de cliente digital ideal"
    ]
  };
}
