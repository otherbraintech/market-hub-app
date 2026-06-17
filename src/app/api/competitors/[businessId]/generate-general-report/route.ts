import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function cleanJsonString(badJson: string): string {
  let clean = '';
  let inString = false;
  let isEscaped = false;
  
  for (let i = 0; i < badJson.length; i++) {
    const char = badJson[i];
    
    if (!inString) {
      if (char === '"') {
        inString = true;
        isEscaped = false;
        clean += char;
      } else {
        clean += char;
      }
    } else {
      if (isEscaped) {
        if (char === '\n') {
          clean += 'n';
        } else {
          clean += char;
        }
        isEscaped = false;
      } else if (char === '\\') {
        isEscaped = true;
        clean += char;
      } else if (char === '"') {
        let isRealClosing = false;
        let j = i + 1;
        while (j < badJson.length && /\s/.test(badJson[j])) {
          j++;
        }
        if (j === badJson.length) {
          isRealClosing = true;
        } else {
          const nextChar = badJson[j];
          if (nextChar === ',' || nextChar === '}' || nextChar === ']' || nextChar === ':') {
            isRealClosing = true;
          }
        }
        
        if (isRealClosing) {
          inString = false;
          clean += char;
        } else {
          clean += '\\"';
        }
      } else if (char === '\n') {
        clean += '\\n';
      } else if (char === '\r') {
        clean += '\\r';
      } else {
        clean += char;
      }
    }
  }
  return clean;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params;

    // Notificar al monitor del inicio de la etapa de diagnóstico
    await prisma.agentNotification.create({
      data: {
        businessId,
        title: "Agente de Diagnóstico y Estrategia",
        message: "Iniciando consolidación de análisis web y de competencia para formular el diagnóstico.",
        step: "DIAGNOSTIC",
        status: "PROCESSING"
      }
    }).catch(err => console.error("Error al crear la notificación del Agente de Diagnóstico:", err));

    const rawKey = process.env.OPEN_ROUTER_KEY;
    const key = rawKey ? rawKey.replace(/"/g, '').trim() : null;
    const obscuredKey = key ? `${key.substring(0, 12)}...${key.substring(key.length - 8)}` : 'NO CARGADO / INDEFINIDO';

    console.log(`\n======================================================`);
    console.log(`🚀 API POST /generate-general-report DISPARADA`);
    console.log(`📂 businessId: ${businessId}`);
    console.log(`🔑 OPEN_ROUTER_KEY en uso: ${obscuredKey}`);
    console.log(`======================================================\n`);

    // Get business info
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
      }
    });

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Get all competitors for this business
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

    console.log(`👥 Competidores encontrados: ${competitors.length} (${competitors.map(c => c.name).join(', ')})`);

    // Get all analysis reports for competitors
    const competitorReports = await prisma.analysisReport.findMany({
      where: {
        type: 'COMPETITOR',
        entityId: { in: competitors.map(c => c.id) },
        status: 'COMPLETED'
      },
      orderBy: { completedAt: 'desc' }
    });

    console.log(`📊 Reportes con status COMPLETED encontrados: ${competitorReports.length}`);
    if (competitorReports.length === 0) {
      console.warn(`⚠️ ADVERTENCIA: No se encontraron reportes con status COMPLETED para los competidores.`);
    }

    // Group competitor reports by competitorId and normalize data
    const competitorReportsMap = new Map<string, any[]>();
    competitorReports.forEach(report => {
      if (!competitorReportsMap.has(report.entityId)) {
        competitorReportsMap.set(report.entityId, []);
      }
      
      // Normalize data (handle string JSON)
      let dataObj = report.data;
      if (typeof report.data === 'string') {
        try {
          dataObj = JSON.parse(report.data);
        } catch (e) {
          console.error('Error parsing competitor report data:', e);
        }
      }
      
      // Handle new array structure with output field
      if (Array.isArray(dataObj) && dataObj.length > 0 && dataObj[0] && typeof dataObj[0] === 'object' && 'output' in dataObj[0]) {
        dataObj = (dataObj[0] as any).output;
      }
      
      competitorReportsMap.get(report.entityId)!.push({
        ...report,
        data: dataObj
      });
    });

    // Generate AI executive summary
    let executiveSummary: any = null;
    interface CompetitorAnalysisItem {
      id: string;
      strategicAnalysis: {
        desempenoCanales: string[];
        debilidadesGaps: string[];
        planContramedida: string[];
      };
    }
    let competitorAnalyses: CompetitorAnalysisItem[] = [];
    const openRouterKey = process.env.OPEN_ROUTER_KEY?.replace(/"/g, '').trim();
    
    if (!openRouterKey) {
      console.error(`❌ ERROR: OPEN_ROUTER_KEY no está definido en el archivo .env o en las variables de entorno.`);
    }
    if (competitorReports.length === 0) {
      console.warn(`⚠️ ADVERTENCIA: No hay reportes completados disponibles. El análisis se basará en nombres y sitios web.`);
    }

    if (openRouterKey) {
      try {
        // Build a comprehensive prompt for AI with detailed scraped data
        const competitorData = competitors.map(comp => {
          const reports = competitorReportsMap.get(comp.id) || [];
          
          let reportDetailsText = '';
          reports.forEach(report => {
            const data = report.data;
            const channel = report.channel;
            
            reportDetailsText += `\n--- Canal Scrapeado: ${channel} ---\n`;
            if (data) {
              // Serialize the entire raw data object as clean formatted JSON so the AI has 100% of the details
              reportDetailsText += JSON.stringify(data, null, 2) + '\n';
            } else {
              reportDetailsText += `No hay datos adicionales para el canal ${channel}.\n`;
            }
          });

          return `
=============================================
ID DE COMPETIDOR: ${comp.id}
Nombre de Competidor: ${comp.name || 'Sin nombre'}
Website: ${comp.website || 'N/D'}
Facebook: ${comp.facebook || 'N/D'}
Instagram: ${comp.instagram || 'N/D'}
TikTok: ${comp.tiktok || 'N/D'}
DATOS RAW SCRAPEADOS (JSON COMPLETO):
${reportDetailsText}
=============================================
`;
        }).join('\n');

        const prompt = `Actúa como un Director de Marketing y Consultor de Crecimiento de Negocios (Growth Consultant) de nivel Elite.
Analiza minuciosamente los datos reales scrapeados de los competidores de la empresa "${business.name}" para generar un Informe de Competencia Estratégica Premium y exhaustivo.
Este informe es fundamental para el usuario, ya que lo utilizará para estructurar su propuesta de valor, encontrar oportunidades de mercado y planificar estrategias de contenido.
ATENCIÓN: NO generes propuestas de campañas de marketing/publicidad concretas (eso se maneja en otra sección). Concéntrate EXCLUSIVAMENTE en el análisis de la competencia, sus canales, debilidades, posicionamiento, contenidos y conversión.

IMPORTANTE SOBRE LOS CANALES Y DATOS DISPONIBLES:
- El análisis debe ser independiente de qué canales han sido scrapeados.
- Si solo hay datos de un único canal (por ejemplo, únicamente el Sitio Web), el informe debe generarse con base en ese canal.
- Si un canal NO está presente en los datos adjuntos, NO inventes ni alucines información para dicho canal. Concéntrate únicamente en lo que esté disponible.
- Si no hay datos scrapeados en absoluto para ningún competidor (es decir, el JSON está vacío), genera un análisis estratégico preliminar aproximado basándote únicamente en los nombres de los competidores, sus sitios web y tu conocimiento experto general del sector.

Debes analizar en detalle lo que cada competidor hace en sus canales (Sitio Web, Instagram, Facebook, etc.) basándote en los datos específicos de sus reportes si están disponibles. No generalices, menciona datos concretos de los competidores si están en su JSON.

Por favor, genera este análisis profundo, estructurado con respuestas concisas y directas (evitando párrafos de texto largos o aburridos) y devuélvelo exactamente en el siguiente formato JSON:
{
  "executiveSummary": {
    "panoramaGlobal": {
      "resumen": "Resumen ejecutivo corto de 2-3 oraciones sobre el panorama competitivo global.",
      "digitalizacion": "Análisis corto (1-2 oraciones) del nivel de digitalización general del mercado.",
      "branding": "Análisis corto (1-2 oraciones) sobre branding y posicionamiento digital general.",
      "interaccion": "Análisis corto (1-2 oraciones) de interacción y engagement general en redes sociales.",
      "observacionesClave": [
        "Punto clave de observación 1 (máximo 15 palabras).",
        "Punto clave de observación 2 (máximo 15 palabras).",
        "Punto clave de observación 3 (máximo 15 palabras)."
      ]
    },
    "analisisCanales": [
      {
        "canal": "Sitio Web | Instagram | Facebook | TikTok | YouTube | SEO",
        "dominio": "Alto | Medio | Bajo",
        "tacticasConversion": [
          "Táctica de conversión detectada 1 (máximo 15 palabras).",
          "Táctica de conversión detectada 2 (máximo 15 palabras)."
        ],
        "enfoqueContenido": "Fórmula/enfoque principal del contenido (ej. 80% educativo, 20% comercial) de forma muy concisa."
      }
    ],
    "oportunidadesGaps": {
      "necesidadesNoResueltas": "Dolores o vacíos de los clientes no atendidos por competidores (máximo 30 palabras).",
      "formatosDesatendidos": "Canales o formatos desatendidos o mal ejecutados por competidores (máximo 30 palabras).",
      "oportunidadesCrecimiento": [
        {
          "titulo": "Título de la oportunidad de crecimiento (ej: Videos cortos educativos)",
          "impacto": "Alto | Medio | Bajo",
          "accion": "Acción inmediata sugerida para ${business.name} (máximo 20 palabras)."
        }
      ]
    },
    "estrategiaPosicionamiento": {
      "propuestaValor": "Propuesta de valor diferenciada sugerida frente a competidores (máximo 30 palabras).",
      "anguloComunicacion": "Ángulo de comunicación clave recomendado (máximo 20 palabras).",
      "guiaVozTono": [
        "Directriz de tono/voz de marca 1 (ej: Amigable pero profesional)",
        "Directriz de tono/voz de marca 2 (ej: Explicativo y educativo)"
      ],
      "pilaresStorytelling": [
        "Pilar o gancho de storytelling 1 (ej: Origen artesanal de la masa)",
        "Pilar o gancho de storytelling 2 (ej: El momento del antojo de media tarde)"
      ]
    },
    "estrategiaContenidos": {
      "pilaresContenido": [
        "Pilar de contenido recomendado 1 (ej: Recetas e ideas de maridaje)",
        "Pilar de contenido recomendado 2 (ej: Detrás de cámaras de horneado)"
      ],
      "frecuenciaCanal": [
        "Frecuencia por canal (ej: Instagram: 3 reels/semana)",
        "Frecuencia por canal (ej: Facebook: 2 posts/semana)"
      ],
      "formatosClave": [
        {
          "formato": "Formato estrella (ej: Carruseles educativos con tips de conservación)",
          "descripcion": "Descripción de ejecución concisa (máximo 20 palabras)."
        }
      ]
    },
    "tacticasConversionPrecios": {
      "estrategiaPrecios": "Directriz sugerida de precios competitivos y su porqué (máximo 30 palabras).",
      "incentivosVenta": [
        "Incentivo de venta recomendado 1 (ej: Envío gratis en primera compra)",
        "Incentivo de venta recomendado 2 (ej: Regalo de un mini producto en compras mayores a $X)"
      ]
    }
  },
  "competitors": [
    {
      "id": "[ID de cada competidor enviado]",
      "strategicAnalysis": {
        "desempenoCanales": [
          "Observación corta sobre canales 1 (máximo 20 palabras).",
          "Observación corta sobre canales 2 (máximo 20 palabras)."
        ],
        "debilidadesGaps": [
          "Debilidad o gap identificado 1 (máximo 20 palabras).",
          "Debilidad o gap identificado 2 (máximo 20 palabras)."
        ],
        "planContramedida": [
          "Acción táctica 1 para ganarle a este competidor (máximo 20 palabras).",
          "Acción táctica 2 para ganarles a este competidor (máximo 20 palabras)."
        ]
      }
    }
  ]
}

REGLAS CRÍTICAS:
1. NO incluyas ninguna sección de Campañas de Marketing o Propuestas de Campañas. Eso está estrictamente fuera del alcance de este informe.
2. Todo el texto de los valores del JSON debe ser en español.
3. No incluyas explicaciones previas ni posteriores, devuelve únicamente el JSON válido. Evita usar placeholders genéricos; personaliza todo para el negocio del cliente (${business.name}) y el contexto de sus competidores.
4. En la sección "analisisCanales", incluye ÚNICAMENTE los canales que efectivamente se hayan scrapeado y tengan datos reales en el JSON. Por ejemplo, si solo hay datos del Sitio Web, solo debes incluir un elemento en "analisisCanales" correspondiente a "Sitio Web". No asumas frecuencias ni tácticas de redes sociales si no hay datos de las mismas.
5. En "estrategiaContenidos.frecuenciaCanal", recomienda frecuencias únicamente para los canales reales analizados. Si no hay datos de redes sociales, sugiere optimizar el sitio web o blog y su frecuencia de publicación.`;
        console.log(`\n======================================================`);
        console.log(`🤖 INICIANDO ANÁLISIS DE IA PARA NEGOCIO: "${business.name}"`);
        console.log(`📊 Competidores detectados: ${competitors.map(c => c.name).join(', ')}`);
        console.log(`📡 Enviando datos del scraping consolidado a OpenRouter...`);
        console.log(`📝 PROMPT COMPLETO Y DATOS ENVIADOS:\n`, prompt);
        console.log(`======================================================\n`);

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openRouterKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: 'Eres un consultor senior de marketing digital que entrega reportes y planes estratégicos estructurados en formato JSON.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.2,
            max_tokens: 8000,
          }),
        });

        if (response.ok) {
          const resData = await response.json();
          const content = resData.choices[0]?.message?.content || '';
          
          console.log(`\n======================================================`);
          console.log(`📥 RESPUESTA RAW DE LA IA RECIBIDA:`);
          console.log(`------------------------------------------------------`);
          console.log(content);
          console.log(`======================================================\n`);
          
          try {
            let jsonText = content.trim();
            
            // Extract the outermost JSON object using regex to ignore code fence wrapping or conversational filler
            const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              jsonText = jsonMatch[0];
            } else if (jsonText.startsWith('```')) {
              jsonText = jsonText.replace(/^```(?:json)?\s*/i, '');
              jsonText = jsonText.replace(/\s*```$/, '');
              jsonText = jsonText.trim();
            }
            
            let parsed;
            try {
              parsed = JSON.parse(jsonText);
            } catch (innerErr) {
              console.warn("Standard JSON.parse failed on AI response, trying cleanJsonString...", innerErr);
              const cleaned = cleanJsonString(jsonText);
              parsed = JSON.parse(cleaned);
            }

            executiveSummary = parsed.executiveSummary || '';
            competitorAnalyses = parsed.competitors || [];
            console.log(`✅ Parseo JSON de IA exitoso! Resumen ejecutivo y perfiles de competidores listos.`);
          } catch (e) {
            console.error('❌ Error parseando respuesta JSON de la IA. Usando fallback de contenido crudo:', e);
            executiveSummary = content;
          }
        } else {
          console.error(`❌ Error en respuesta de OpenRouter. Status: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.error('Error generating AI summary:', error);
        executiveSummary = 'No se pudo generar el resumen ejecutivo con IA.';
      }
    }

    // Build the consolidated report with enhanced competitor data
    const generalReport = {
      businessId: business.id,
      businessName: business.name,
      generatedAt: new Date().toISOString(),
      executiveSummary: executiveSummary,
      
      // Competitors with enhanced extracted data
      competitors: competitors.map(competitor => {
        const competitorReports = competitorReportsMap.get(competitor.id) || [];
        
        // Extract key insights from all reports
        const allInsights = {
          totalFollowers: 0,
          totalPosts: 0,
          avgEngagement: 0,
          strengths: [] as string[],
          weaknesses: [] as string[],
          recommendations: [] as string[],
          contentThemes: [] as string[],
          postingFrequency: '',
          audienceDemographics: {} as any,
          topPerformingContent: [] as any[],
          contentStrategy: {} as any,
          brandVoice: [] as string[],
          marketingTactics: [] as string[],
          customerEngagement: {} as any,
          competitiveAdvantages: [] as string[],
          marketPositioning: '',
          pricingStrategy: '',
          uniqueSellingPoints: [] as string[],
          // Additional fields
          websiteAnalysis: {} as any,
          seoStrategy: [] as string[],
          advertisingApproach: [] as string[],
          customerService: [] as string[],
          productOfferings: [] as string[],
          promotions: [] as string[],
          partnerships: [] as string[],
          communityBuilding: [] as string[],
          brandConsistency: [] as string[],
          visualIdentity: [] as string[],
          storytellingApproach: [] as string[],
          contentFormats: [] as string[],
          engagementTactics: [] as string[],
          growthStrategy: [] as string[],
          targetAudience: [] as string[],
          valueProposition: [] as string[],
          differentiation: [] as string[],
          strategicAnalysis: '' as any,
        };
        
        // Process each report to extract insights
        competitorReports.forEach(report => {
          const data = report.data;
          const channel = report.channel;
          
          // Extract Instagram-specific data
          if (data?.instagram_presence) {
            const audienceSize = data.instagram_presence.audience_size || {};
            allInsights.totalFollowers += parseInt(audienceSize.followers || '0');
            allInsights.totalPosts += parseInt(audienceSize.posts_count || '0');
            
            if (data.instagram_presence.brand_summary) {
              allInsights.marketPositioning = data.instagram_presence.brand_summary;
            }
            if (data.instagram_presence.username) {
              allInsights.targetAudience.push(`Instagram: @${data.instagram_presence.username}`);
            }
          }
          
          // Extract engagement data
          if (data?.engagement_analysis) {
            const engagement = data.engagement_analysis;
            if (engagement.engagement_level) {
              allInsights.avgEngagement = engagement.engagement_level;
            }
            if (engagement.content_themes) {
              allInsights.contentThemes.push(...engagement.content_themes);
            }
            if (engagement.posting_frequency) {
              allInsights.postingFrequency = engagement.posting_frequency;
            }
            if (engagement.engagement_tactics) {
              allInsights.engagementTactics.push(...engagement.engagement_tactics);
            }
          }
          
          // Extract competitive observations
          if (data?.competitive_observations) {
            const compObs = data.competitive_observations;
            if (compObs.main_strengths) {
              allInsights.strengths.push(...compObs.main_strengths);
            }
            if (compObs.main_weaknesses) {
              allInsights.weaknesses.push(...compObs.main_weaknesses);
            }
            if (compObs.strategic_recommendations) {
              allInsights.recommendations.push(...compObs.strategic_recommendations);
            }
            if (compObs.competitive_advantages) {
              allInsights.competitiveAdvantages.push(...compObs.competitive_advantages);
            }
            if (compObs.market_positioning) {
              allInsights.marketPositioning = compObs.market_positioning;
            }
            if (compObs.differentiation) {
              allInsights.differentiation.push(...compObs.differentiation);
            }
          }
          
          // Extract branding analysis
          if (data?.branding_analysis) {
            const branding = data.branding_analysis;
            if (branding.brand_personality) {
              allInsights.brandVoice.push(...branding.brand_personality);
            }
            if (branding.communication_style) {
              allInsights.brandVoice.push(...branding.communication_style);
            }
            if (branding.visual_identity) {
              allInsights.visualIdentity.push(...branding.visual_identity);
            }
            if (branding.brand_consistency) {
              allInsights.brandConsistency.push(...branding.brand_consistency);
            }
          }
          
          // Extract content analysis
          if (data?.content_analysis) {
            const content = data.content_analysis;
            if (content.top_performing_content) {
              allInsights.topPerformingContent.push(...content.top_performing_content);
            }
            if (content.content_strategy) {
              allInsights.contentStrategy = { ...allInsights.contentStrategy, ...content.content_strategy };
            }
            if (content.content_formats) {
              allInsights.contentFormats.push(...content.content_formats);
            }
            if (content.storytelling_approach) {
              allInsights.storytellingApproach.push(...content.storytelling_approach);
            }
          }
          
          // Extract business intelligence
          if (data?.business_intelligence) {
            const bizIntel = data.business_intelligence;
            if (bizIntel.marketing_tactics) {
              allInsights.marketingTactics.push(...bizIntel.marketing_tactics);
            }
            if (bizIntel.pricing_strategy) {
              allInsights.pricingStrategy = bizIntel.pricing_strategy;
            }
            if (bizIntel.unique_selling_points) {
              allInsights.uniqueSellingPoints.push(...bizIntel.unique_selling_points);
            }
            if (bizIntel.value_proposition) {
              allInsights.valueProposition.push(...bizIntel.value_proposition);
            }
            if (bizIntel.product_offerings) {
              allInsights.productOfferings.push(...bizIntel.product_offerings);
            }
            if (bizIntel.promotions) {
              allInsights.promotions.push(...bizIntel.promotions);
            }
            if (bizIntel.partnerships) {
              allInsights.partnerships.push(...bizIntel.partnerships);
            }
          }
          
          // Extract website analysis
          if (data?.website_analysis) {
            const website = data.website_analysis;
            allInsights.websiteAnalysis = { ...allInsights.websiteAnalysis, ...website };
          }
          
          // Extract SEO strategy
          if (data?.seo_strategy) {
            allInsights.seoStrategy.push(...data.seo_strategy);
          }
          
          // Extract advertising approach
          if (data?.advertising_approach) {
            allInsights.advertisingApproach.push(...data.advertising_approach);
          }
          
          // Extract customer service
          if (data?.customer_service) {
            allInsights.customerService.push(...data.customer_service);
          }
          
          // Extract community building
          if (data?.community_building) {
            allInsights.communityBuilding.push(...data.community_building);
          }
          
          // Extract growth strategy
          if (data?.growth_strategy) {
            allInsights.growthStrategy.push(...data.growth_strategy);
          }
        });
        
        // Remove duplicates
        allInsights.strengths = [...new Set(allInsights.strengths)];
        allInsights.weaknesses = [...new Set(allInsights.weaknesses)];
        allInsights.recommendations = [...new Set(allInsights.recommendations)];
        allInsights.contentThemes = [...new Set(allInsights.contentThemes)];
        allInsights.brandVoice = [...new Set(allInsights.brandVoice)];
        allInsights.marketingTactics = [...new Set(allInsights.marketingTactics)];
        allInsights.competitiveAdvantages = [...new Set(allInsights.competitiveAdvantages)];
        allInsights.uniqueSellingPoints = [...new Set(allInsights.uniqueSellingPoints)];
        allInsights.seoStrategy = [...new Set(allInsights.seoStrategy)];
        allInsights.advertisingApproach = [...new Set(allInsights.advertisingApproach)];
        allInsights.customerService = [...new Set(allInsights.customerService)];
        allInsights.productOfferings = [...new Set(allInsights.productOfferings)];
        allInsights.promotions = [...new Set(allInsights.promotions)];
        allInsights.partnerships = [...new Set(allInsights.partnerships)];
        allInsights.communityBuilding = [...new Set(allInsights.communityBuilding)];
        allInsights.brandConsistency = [...new Set(allInsights.brandConsistency)];
        allInsights.visualIdentity = [...new Set(allInsights.visualIdentity)];
        allInsights.storytellingApproach = [...new Set(allInsights.storytellingApproach)];
        allInsights.contentFormats = [...new Set(allInsights.contentFormats)];
        allInsights.engagementTactics = [...new Set(allInsights.engagementTactics)];
        allInsights.growthStrategy = [...new Set(allInsights.growthStrategy)];
        allInsights.targetAudience = [...new Set(allInsights.targetAudience)];
        allInsights.valueProposition = [...new Set(allInsights.valueProposition)];
        allInsights.differentiation = [...new Set(allInsights.differentiation)];
        // Assign strategic analysis if available
        const compAnalysis = competitorAnalyses.find((ca) => ca.id === competitor.id);
        if (compAnalysis) {
          allInsights.strategicAnalysis = compAnalysis.strategicAnalysis;
        }
        
        return {
          ...competitor,
          reports: competitorReports,
          insights: allInsights
        };
      }),
      
      // Metadata
      metadata: {
        totalCompetitors: competitors.length,
        totalCompetitorReports: competitorReports.length,
        channelsAnalyzed: Array.from(new Set(competitorReports.map(r => r.channel)))
      }
    };

    // Save the report to the business record
    await prisma.business.update({
      where: { id: businessId },
      data: {
        competitorGeneralReport: generalReport,
        competitorGeneralReportGeneratedAt: new Date()
      }
    });

    // Notificar al monitor del éxito de la etapa de diagnóstico
    await prisma.agentNotification.create({
      data: {
        businessId,
        title: "Agente de Diagnóstico y Estrategia",
        message: `¡Diagnóstico consolidado con éxito! Se analizó la presencia de ${competitors.length} competidores.`,
        step: "DIAGNOSTIC",
        status: "COMPLETED"
      }
    }).catch(err => console.error("Error al crear la notificación del Agente de Diagnóstico (Éxito):", err));

    return NextResponse.json({
      success: true,
      report: generalReport,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating competitor general report:', error);
    try {
      const { businessId } = await params;
      await prisma.agentNotification.create({
        data: {
          businessId,
          title: "Agente de Diagnóstico y Estrategia",
          message: `Error al consolidar el diagnóstico de competencia: ${error instanceof Error ? error.message : String(error)}`,
          step: "DIAGNOSTIC",
          status: "FAILED"
        }
      });
    } catch (e) {
      console.error("Error al crear notificación de error del Agente de Diagnóstico:", e);
    }
    return NextResponse.json({ error: 'Failed to generate general report' }, { status: 500 });
  }
}
