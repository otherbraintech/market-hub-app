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
        description: true,
        industry: true,
        website: true,
        socialLinks: true,
        targetAudience: true,
        brandVoice: true,
        location: true,
        competitorGeneralReport: true,
      }
    });

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Get all scraped analysis reports for the business (excluding CONSOLIDATED)
    const businessReports = await prisma.analysisReport.findMany({
      where: {
        type: 'MY_BUSINESS',
        entityId: business.id,
        status: 'COMPLETED',
        NOT: {
          channel: 'CONSOLIDATED'
        }
      },
      orderBy: { completedAt: 'desc' }
    });

    // Group and normalize business reports
    const businessReportsMap = new Map<string, any>();
    businessReports.forEach(report => {
      const existing = businessReportsMap.get(report.channel);
      if (!existing || (report.completedAt && existing.completedAt && existing.completedAt < report.completedAt)) {
        businessReportsMap.set(report.channel, report);
      }
    });

    const body = await request.json().catch(() => ({}));
    const { selectedChannels, selectedPillars, selectedTone, name, description } = body;

    // Build AI context
    const context = {
      business: {
        name: business.name,
        description: business.description,
        industry: business.industry,
        website: business.website,
        location: business.location,
        targetAudience: business.targetAudience,
        brandVoice: business.brandVoice,
        socialLinks: business.socialLinks,
      },
      myScrapedChannels: Array.from(businessReportsMap.entries()).map(([channel, report]) => {
        let dataObj = report.data;
        if (typeof report.data === 'string') {
          try {
            dataObj = JSON.parse(report.data);
          } catch (e) {
            console.error('Error parsing report data:', e);
          }
        }
        return {
          channel,
          data: dataObj
        };
      }),
      competitorAnalysis: business.competitorGeneralReport,
      selectedFocusName: name || '',
      selectedFocusDescription: description || '',
      selectedChannels: selectedChannels || [],
      selectedPillars: selectedPillars || [],
      selectedTone: selectedTone || '',
    };

    // Generate strategy with AI
    const strategy = await generateMarketingStrategyWithAI(context);

    return NextResponse.json(strategy);
  } catch (error) {
    console.error('Error generating strategy:', error);
    return NextResponse.json({ error: 'Failed to generate strategy' }, { status: 500 });
  }
}

async function generateMarketingStrategyWithAI(context: any) {
  const openRouterKey = process.env.OPEN_ROUTER_KEY?.replace(/"/g, '').trim();
  
  if (!openRouterKey) {
    return generatePlaceholderStrategy(context);
  }

  try {
    const prompt = buildStrategyPrompt(context);
    
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
            content: 'Eres un estratega jefe de marketing digital y growth hacker experto. Generas planes de marketing hiper-personalizados y accionables. Tu objetivo es proponer objetivos SMART realistas, buyer personas detalladas, embudos de conversión y canales basados en los datos del negocio y sus competidores. Responde únicamente con un JSON estructurado y válido.'
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
      console.error('OpenRouter API error status:', response.status);
      return generatePlaceholderStrategy(context);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.warn('No content returned from OpenRouter choices, using placeholder strategy.');
      return generatePlaceholderStrategy(context);
    }

    try {
      const parsed = JSON.parse(content.trim());
      return parsed;
    } catch (parseError) {
      console.error('Error parsing strategy JSON response:', parseError);
      return generatePlaceholderStrategy(context);
    }
  } catch (error) {
    console.error('Error in AI strategy execution:', error);
    return generatePlaceholderStrategy(context);
  }
}

function buildStrategyPrompt(context: any) {
  const { business, myScrapedChannels, competitorAnalysis } = context;
  
  let prompt = `Crea una estrategia de marketing detallada para el siguiente negocio basándote en sus datos, el análisis de su competencia y las elecciones específicas del usuario.\n\n`;
  prompt += `DATOS DEL NEGOCIO:\n`;
  prompt += `- Nombre: ${business.name}\n`;
  prompt += `- Descripción: ${business.description || 'No especificada'}\n`;
  prompt += `- Industria: ${business.industry || 'No especificada'}\n`;
  prompt += `- Ubicación: ${business.location || 'No especificada'}\n`;
  if (business.brandVoice) prompt += `- Tono de Marca sugerido: ${JSON.stringify(business.brandVoice)}\n`;
  prompt += `\n`;

  if (context.selectedFocusName) {
    prompt += `ENFOQUE ESTRATÉGICO SELECCIONADO POR EL USUARIO (la estrategia y objetivos deben alinearse en torno a esta visión):\n`;
    prompt += `- Nombre: ${context.selectedFocusName}\n`;
    prompt += `- Visión: ${context.selectedFocusDescription}\n\n`;
  }

  if (context.selectedChannels && context.selectedChannels.length > 0) {
    prompt += `CANALES SELECCIONADOS POR EL USUARIO PARA ACTIVAR (debes enfocar la estrategia y los objetivos en estos canales):\n`;
    prompt += `- ${context.selectedChannels.join(', ')}\n\n`;
  }

  if (context.selectedPillars && context.selectedPillars.length > 0) {
    prompt += `PILARES TEMÁTICOS DE CONTENIDO SELECCIONADOS (estos deben influir en las temáticas de las buyer personas y los objetivos):\n`;
    context.selectedPillars.forEach((pillar: string) => {
      prompt += `- ${pillar}\n`;
    });
    prompt += `\n`;
  }

  if (context.selectedTone) {
    prompt += `TONO DE COMUNICACIÓN SELECCIONADO POR EL USUARIO:\n`;
    prompt += `- ${context.selectedTone}\n\n`;
  }

  if (myScrapedChannels.length > 0) {
    prompt += `ANÁLISIS DE NUESTROS CANALES (datos reales extraídos):\n`;
    myScrapedChannels.forEach((chan: any) => {
      prompt += `- Canal: ${chan.channel}\n`;
      if (chan.data) {
        if (chan.data.instagram_presence) {
          prompt += `  * Instagram: ${chan.data.instagram_presence.audience_size?.followers || 'N/D'} seguidores, username: ${chan.data.instagram_presence.username || 'N/D'}\n`;
        }
        if (chan.data.social_intelligence) {
          prompt += `  * Métricas: ${chan.data.social_intelligence.audience_size || 'N/D'} likes/seguidores, Engagement: ${chan.data.social_intelligence.engagement_level || 'N/D'}\n`;
        }
        if (chan.data.strategic_diagnostics) {
          prompt += `  * Fortalezas: ${(chan.data.strategic_diagnostics.strengths || []).join(', ')}\n`;
          prompt += `  * Debilidades: ${(chan.data.strategic_diagnostics.weaknesses || []).join(', ')}\n`;
        }
      }
    });
    prompt += `\n`;
  }

  if (competitorAnalysis) {
    prompt += `ANÁLISIS DE LA COMPETENCIA (oportunidades y debilidades identificadas):\n`;
    if (typeof competitorAnalysis === 'string') {
      prompt += `${competitorAnalysis}\n`;
    } else {
      prompt += `${JSON.stringify(competitorAnalysis)}\n`;
    }
    prompt += `\n`;
  }

  prompt += `Genera la respuesta como un objeto JSON estructurado exactamente según el siguiente esquema (asegúrate de que los campos específicos de cada sección se cumplan y sean ricos en detalles en español):\n\n`;
  prompt += `{\n`;
  prompt += `  "name": "${(context.selectedFocusName || 'Estrategia de Crecimiento para ' + business.name).replace(/"/g, '\\"')}",\n`;
  prompt += `  "description": "${(context.selectedFocusDescription || 'Breve resumen estratégico').replace(/"/g, '\\"')}",\n`;
  prompt += `  "isActive": true,\n`;
  prompt += `  "objectives": [\n`;
  prompt += `    {\n`;
  prompt += `      "name": "Nombre corto del objetivo (Ej. Aumentar Seguidores Instagram)",\n`;
  prompt += `      "specific": "Qué se logrará específicamente (mínimo 5 palabras)",\n`;
  prompt += `      "measurable": "Cómo se medirá cuantitativamente (mínimo 5 palabras)",\n`;
  prompt += `      "achievable": "Cómo se logrará de forma realista (mínimo 5 palabras)",\n`;
  prompt += `      "relevant": "Por qué es relevante para el negocio ahora (mínimo 5 palabras)",\n`;
  prompt += `      "timeBound": "Plazo definido (mínimo 5 palabras)",\n`;
  prompt += `      "targetValue": 1000,\n`;
  prompt += `      "currentValue": 100,\n`;
  prompt += `      "unit": "Unidad de medida (ej: seguidores, leads, ventas, visitas)",\n`;
  prompt += `      "deadline": "2026-08-31",\n`;
  prompt += `      "status": "PENDING"\n`;
  prompt += `    }\n`;
  prompt += `  ],\n`;
  prompt += `  "personas": [\n`;
  prompt += `    {\n`;
  prompt += `      "name": "Nombre ficticio (Ej. María la Repostera Casual)",\n`;
  prompt += `      "demographics": "Resumen demográfico (edad, ubicación, ocupación, estado familiar, ej: Mujer, 25-35 años, profesional independiente, interesada en pastelería fina, Santa Cruz)",\n`;
  prompt += `      "painPoints": "Puntos de dolor y retos del cliente (Frase concisa, ej: Falta de tiempo para cocinar, busca opciones listas para eventos, desconfía de la calidad de ingredientes)",\n`;
  prompt += `      "goals": "Objetivos y motivaciones (ej: Celebrar fechas especiales con postres de alta calidad, sorprender a invitados, encontrar postres sin gluten)",\n`;
  prompt += `      "communication": {\n`;
  prompt += `        "tone": "Tono de comunicación sugerido (ej: Amistoso, dulce, inspiracional)",\n`;
  prompt += `        "topics": "Temas de interés para crear contenido (ej: Recetas rápidas, decoración de tortas, detrás de escenas de repostería)",\n`;
  prompt += `        "triggers": "Motivadores clave de compra (ej: Promociones exclusivas de último minuto, fotos de alta calidad que despierten antojo)"\n`;
  prompt += `      }\n`;
  prompt += `    }\n`;
  prompt += `  ],\n`;
  prompt += `  "funnelStages": [\n`;
  prompt += `    {\n`;
  prompt += `      "name": "Nombre de la etapa (ej: Conciencia, Consideración, Decisión)",\n`;
  prompt += `      "description": "Objetivo de esta etapa del embudo para el cliente",\n`;
  prompt += `      "contentTypes": ["Tipos de contenido recomendados (ej. Reels, Carruseles, Stories)"],\n`;
  prompt += `      "channels": ["Canales recomendados (ej. INSTAGRAM, FACEBOOK, WEBSITE)"],\n`;
  prompt += `      "goals": ["Objetivos específicos de la etapa (ej. Aumentar alcance, generar confianza)"],\n`;
  prompt += `      "kpis": ["Indicadores clave (ej. Impresiones, Clics, Mensajes privados)"],\n`;
  prompt += `      "ctas": ["Llamados a la acción sugeridos (ej. 'Escríbenos al WhatsApp', 'Visita nuestra tienda')"]\n`;
  prompt += `    }\n`;
  prompt += `  ],\n`;
  prompt += `  "channels": [\n`;
  prompt += `    {\n`;
  prompt += `      "name": "Nombre del canal (ej: INSTAGRAM o FACEBOOK o WEBSITE o BLOG o EMAIL o GOOGLE ADS)",\n`;
  prompt += `      "type": "SOCIAL" o "EMAIL" o "BLOG" o "ADS" o "OTHER" (debe ser uno de estos 5 valores exactos en mayúsculas),\n`;
  prompt += `      "isActive": true,\n`;
  prompt += `      "frequency": "Frecuencia de publicación (ej: 3 veces por semana o Diario o Semanal)",\n`;
  prompt += `      "audienceSize": 1000\n`;
  prompt += `    }\n`;
  prompt += `  ]\n`;
  prompt += `}\n\n`;
  prompt += `Responde únicamente con el JSON estructurado, sin introducción ni comentarios explicativos. Asegúrate de generar al menos 2 objetivos SMART bien definidos, 2 buyer personas diferenciadas, 3 etapas del embudo de conversión y todos los canales configurados activos.`;

  return prompt;
}

function generatePlaceholderStrategy(context: any) {
  const { business } = context;
  return {
    name: `Estrategia de Crecimiento para ${business.name}`,
    description: `Estrategia digital recomendada para consolidar el posicionamiento de ${business.name} en su sector local, optimizando canales sociales mediante contenido de alto engagement y captación de clientes.`,
    isActive: true,
    objectives: [
      {
        name: "Crecer comunidad en Instagram",
        specific: "Incrementar la base de seguidores calificados en la cuenta oficial de Instagram",
        measurable: "Lograr un aumento neto de 1,500 nuevos seguidores interactivos",
        achievable: "Mediante publicación de Reels diarios y concursos de fechas especiales",
        relevant: "Permitirá mayor visibilidad orgánica y potenciales clientes recurrentes",
        timeBound: "Plazo límite de 90 días a partir de la fecha de inicio",
        targetValue: 1500,
        currentValue: 0,
        unit: "seguidores",
        deadline: "2026-08-31",
        status: "PENDING"
      },
      {
        name: "Optimizar conversión en WhatsApp",
        specific: "Reducir la fricción y tiempo de respuesta en solicitudes de compra por WhatsApp",
        measurable: "Lograr una tasa de conversión de conversación a pedido del 25%",
        achievable: "Mediante respuestas rápidas pre-guardadas y menús claros de productos",
        relevant: "Es el canal directo de ventas y atención preferido por los clientes",
        timeBound: "Plazo límite de 60 días para la implementación inicial",
        targetValue: 25,
        currentValue: 10,
        unit: "porcentaje",
        deadline: "2026-07-31",
        status: "PENDING"
      }
    ],
    personas: [
      {
        name: "Sofía la Organizadora Familiar",
        demographics: "Mujer de 30-45 años, casada con hijos, residente en zona urbana de nivel socioeconómico medio-alto, profesional ocupada.",
        painPoints: "Falta de tiempo para preparar postres caseros, busca asombrar a sus invitados y requiere productos confiables con entrega a tiempo.",
        goals: "Lograr celebraciones memorables sin estrés, postres con excelente presentación estética y alta calidad de sabor.",
        communication: {
          tone: "Cálido, familiar, servicial y amigable",
          topics: "Postres premium para eventos, recetas de temporada y detrás de escena de preparaciones especiales.",
          triggers: "Imágenes provocativas de producto en primer plano, recomendaciones y facilidad de pedido vía enlace directo."
        }
      },
      {
        name: "Alejandro el Joven Tecnológico",
        demographics: "Hombre de 22-30 años, soltero, profesional en tecnología, usuario móvil intensivo de redes sociales, busca conveniencia.",
        painPoints: "Suele olvidar fechas de cumpleaños y eventos de último momento, necesita comprar de forma rápida y sin complicaciones.",
        goals: "Soluciones de postres listas en menos de 2 horas, alta calidad estética para compartir fotos en redes y proceso de pago simple.",
        communication: {
          tone: "Directo, dinámico, moderno y con humor ligero",
          topics: "Antojos rápidos del día, ofertas relámpago e historias con humor sobre olvidos de cumpleaños.",
          triggers: "Llamados a la acción de urgencia, combos rápidos y envío a domicilio express."
        }
      }
    ],
    funnelStages: [
      {
        name: "Descubrimiento",
        description: "Llamar la atención de audiencias locales que aún no conocen el negocio",
        contentTypes: ["Reels dinámicos", "Publicaciones pagadas de alcance", "Sorteos locales"],
        channels: ["INSTAGRAM", "FACEBOOK"],
        goals: ["Aumentar impresiones locales", "Crecer seguidores"],
        kpis: ["Impresiones", "Alcance", "Nuevos Seguidores"],
        ctas: ["¡Síguenos para endulzar tu día!", "Ver catálogo"]
      },
      {
        name: "Consideración",
        description: "Demostrar la calidad, frescura y sabor para generar antojo y confianza",
        contentTypes: ["Testimonios de clientes", "Detrás de cámaras de la cocina", "Carruseles de ingredientes"],
        channels: ["INSTAGRAM", "FACEBOOK"],
        goals: ["Incrementar interacciones y preguntas directas", "Generar guardados de posts"],
        kpis: ["Comentarios", "Mensajes recibidos", "Guardados"],
        ctas: ["¿Cuál es tu sabor favorito? Coméntanos", "Preguntar precios por inbox"]
      },
      {
        name: "Conversión",
        description: "Facilitar el cierre rápido de la compra y asegurar el pedido",
        contentTypes: ["Stories con links directos", "Catálogo digital actualizado", "Promociones con límite de tiempo"],
        channels: ["INSTAGRAM", "FACEBOOK", "WEBSITE"],
        goals: ["Cerrar pedidos directos", "Reducir fricción de conversión"],
        kpis: ["Pedidos completados", "Clics en link de compra"],
        ctas: ["¡Haz tu pedido hoy mismo por WhatsApp!", "Comprar ahora"]
      }
    ],
    channels: [
      {
        name: "INSTAGRAM",
        type: "SOCIAL",
        isActive: true,
        frequency: "3 veces por semana (Reels y Stories diarios)",
        audienceSize: 0
      },
      {
        name: "FACEBOOK",
        type: "SOCIAL",
        isActive: true,
        frequency: "2 publicaciones por semana",
        audienceSize: 0
      }
    ]
  };
}
