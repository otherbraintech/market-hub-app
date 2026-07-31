import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

import { runGenerateGeneralReport } from '../../../competitors/[businessId]/generate-general-report/route';

export async function runBusinessConsolidatedAnalysis(id: string) {
  try {

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
        onboardingStrategy: true,
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
        onboardingStrategy: business.onboardingStrategy,
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

    // Registrar notificación en la consola del monitor
    await prisma.agentNotification.create({
      data: {
        businessId: business.id,
        title: "Agente de Diagnóstico",
        message: "¡Diagnóstico consolidado con éxito! Se analizó la presencia y brechas del negocio.",
        step: "DIAGNOSTIC",
        status: "COMPLETED"
      }
    }).catch(e => console.error("Error creating diagnostic completed notification:", e));

    // Generación en cascada desacoplada: solo se ejecuta por solicitud explícita del usuario haciendo clic en 'Generar Plan'.

    // Disparar regeneración del informe de competidores general directamente en código
    runGenerateGeneralReport(business.id).catch((err) => {
      console.error("Error en regeneración de informe de competidores desde análisis propio:", err);
    });

    return {
      analysisId: storedAnalysis.id,
      analysis,
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error generating consolidated analysis:', error);
    throw error;
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await runBusinessConsolidatedAnalysis(id);
    return NextResponse.json(result);
  } catch (error) {
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
  
  if (business.onboardingStrategy) {
    prompt += `ESTRATEGIA DIRECTA DEL CLIENTE (PRIORIDAD ALTA):\n`;
    prompt += `Utiliza estos datos clave provistos por el usuario como pilar fundamental para formular tus conclusiones y alinear el reporte:\n`;
    const st = business.onboardingStrategy;
    if (st.locationAge) prompt += `- Perfil Demográfico Clave: ${st.locationAge}\n`;
    if (st.lifeEvent) prompt += `- Evento de Vida / Dolor Principal: ${st.lifeEvent}\n`;
    if (st.archetype) prompt += `- Arquetipo de Marca / Tono: ${st.archetype}\n`;
    if (st.conversionChannel) {
      prompt += `- Canal de Conversión Principal: ${st.conversionChannel}\n`;
      prompt += `  (Guía: Canal Moderno = Grandes cadenas con autoservicio/supermercados/tiendas de conveniencia; Canal Tradicional = Tiendas de barrio, carnicerías, fruterías, panaderías locales; PDV = Espacio físico exacto: góndola, mostrador, caja de cobro, islas promocionales; Retail = Venta al detalle B2C)\n`;
    }
    if (st.informationGaps) prompt += `- Vacío de Información detectado en el mercado: ${st.informationGaps}\n`;
    if (st.socialProof) prompt += `- Elemento de Prueba Social: ${st.socialProof}\n`;
    if (st.differentialAdvantage) prompt += `- Ventaja Diferencial Única: ${st.differentialAdvantage}\n\n`;
  }
  
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
  prompt += `  "buyerPersonas": [\n`;
  prompt += `    {\n`;
  prompt += `      "name": "Título profesional y representativo del segmento de Buyer Persona (ej: Consumidor Habitual B2C / Cliente Corporativo B2B). PROHIBIDO usar nombres personales como María, Carlos, etc.",\n`;
  prompt += `      "demographics": "Edad, género, nivel de ingresos estimado, ocupación, ubicación en ${business.location || 'la ciudad local'}",\n`;
  prompt += `      "goals": "Objetivos y deseos de compra principales del perfil respecto al negocio",\n`;
  prompt += `      "painPoints": "Puntos de dolor socioculturales cotidianos, hábitos locales de consumo y objeciones de compra",\n`;
  prompt += `      "communication": {\n`;
  prompt += `        "tone": "Tono de comunicación recomendado (ej: Cálido, Profesional, Entusiasta)",\n`;
  prompt += `        "triggers": "Momento desencadenante o evento de vida detonador local (ej: antojos de fin de semana, festejos locales, cumpleaños)",\n`;
  prompt += `        "topics": "Temas clave de interés del contenido que resuenan con este perfil"\n`;
  prompt += `      }\n`;
  prompt += `    }\n`;
  prompt += `  ],\n`;
  prompt += `  "nextSteps": ["pasos inmediatos a seguir"]\n`;
  prompt += `}\n\n`;
  prompt += `PROMPT DE ANÁLISIS DE OPORTUNIDADES Y ENFOQUE SOCIOCULTURAL (MANDATORIO PARA GENERAR LAS BUYER PERSONAS):\n`;
  prompt += `Analiza el contexto del negocio, descripción y catálogo de productos, en conjunto con las variables demográficas, nivel adquisitivo e idiosincrasia cultural de la ciudad de ${business.location || 'operación'}.\n`;
  prompt += `Identifica patrones socioculturales específicos (hábitos de fin de semana, micro-dolores cotidianos de la población local, festividades tradicionales relevantes y modismos de consumo).\n`;
  prompt += `Con esta base de oportunidades sociológicas, modela exactamente 4 Buyer Personas de alta fidelidad psicográfica en el array 'buyerPersonas'. Usa únicamente títulos profesionales y representativos de la audiencia objetiva del negocio (Ej. Consumidor Habitual B2C, Comprador Corporativo, etc.). Queda estrictamente prohibido usar nombres personales ficticios como "María" o "Carlos".\n\n`;
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
    buyerPersonas: [
      {
        "name": "Carlos",
        "demographics": "Varón, 25-40 años, trabajador activo, compras por WhatsApp",
        "goals": "Obtener rapidez en la atención y entregas confiables.",
        "painPoints": "Poco tiempo de cocina, valora la rapidez de compra a través de WhatsApp, prefiere delivery rápido.",
        "communication": {
          "tone": "Moderno, directo y entusiasta",
          "triggers": "Salida de la oficina, antojos de media tarde, fines de semana con amigos",
          "topics": "Combos rápidos, promociones del día, facilidad de pedido"
        }
      },
      {
        "name": "Sofía",
        "demographics": "Mujer, 18-24 años, estudiante o joven trabajadora, activa en TikTok e Instagram",
        "goals": "Probar sabores únicos, productos estéticamente atractivos para compartir en sus redes sociales.",
        "painPoints": "Aburrimiento con productos comunes, busca experiencias visuales y sabores exóticos o tradicionales innovadores.",
        "communication": {
          "tone": "Alegre y dinámico",
          "triggers": "Tendencias en redes, juntadas de tarde con amigas, eventos de vida estudiantiles",
          "topics": "Detrás de escena (UGC), lanzamientos de productos nuevos, sorteos e interacción"
        }
      },
      {
        "name": "Roberto",
        "demographics": "Varón, 40-55 años, administrador o dueño de negocio, compras de volumen",
        "goals": "Abastecer eventos corporativos y reuniones con productos confiables y de excelente presentación.",
        "painPoints": "Exigencia de puntualidad extrema, requiere facturación y cotizaciones rápidas, teme fallas en el stock.",
        "communication": {
          "tone": "Profesional y seguro",
          "triggers": "Reuniones de oficina, festejos de fin de año, catering para seminarios",
          "topics": "Descuentos por volumen, testimonios corporativos, catálogo de catering especial"
        }
      }
    ],
    nextSteps: [
      "Auditar presencia digital actual",
      "Definir calendario de contenido para 3 meses",
      "Establecer KPIs de medición digital",
      "Crear perfil de cliente digital ideal"
    ]
  };
}
