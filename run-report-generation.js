const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

// Manually parse .env
const envFile = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');

const dbUrlMatch = envFile.match(/DATABASE_URL="?([^"\n]+)"?/);
const databaseUrl = dbUrlMatch ? dbUrlMatch[1] : null;

const keyMatch = envFile.match(/OPEN_ROUTER_KEY="?([^"\n]+)"?/);
const openRouterKey = keyMatch ? keyMatch[1] : null;

if (!databaseUrl) {
  console.error('No DATABASE_URL found in .env!');
  process.exit(1);
}

if (!openRouterKey) {
  console.error('No OPEN_ROUTER_KEY found in .env!');
  process.exit(1);
}

// Clean openRouterKey
const cleanOpenRouterKey = openRouterKey.replace(/"/g, '').trim();
const obscuredKey = `${cleanOpenRouterKey.substring(0, 12)}...${cleanOpenRouterKey.substring(cleanOpenRouterKey.length - 8)}`;

console.log(`\n======================================================`);
console.log(`🚀 STANDALONE GENERAL REPORT GENERATOR STARTING`);
console.log(`🔑 OPEN_ROUTER_KEY: ${obscuredKey}`);
console.log(`======================================================\n`);

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const businessId = 'cmp31dubn0000xklh3gwdxaiw';

async function main() {
  try {
    // Get business info
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
      }
    });

    if (!business) {
      console.error(`❌ Business with ID ${businessId} not found`);
      process.exit(1);
    }

    console.log(`📂 Business Name: ${business.name}`);

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

    // Group competitor reports by competitorId and normalize data
    const competitorReportsMap = new Map();
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
        dataObj = dataObj[0].output;
      }
      
      competitorReportsMap.get(report.entityId).push({
        ...report,
        data: dataObj
      });
    });

    // Generate AI executive summary
    let executiveSummary = '';
    let competitorAnalyses = [];

    if (competitorReports.length > 0) {
      // Build a comprehensive prompt for AI with detailed scraped data
      const competitorData = competitors.map(comp => {
        const reports = competitorReportsMap.get(comp.id) || [];
        
        let reportDetailsText = '';
        reports.forEach(report => {
          const data = report.data;
          const channel = report.channel;
          
          reportDetailsText += `\n--- Canal Scrapeado: ${channel} ---\n`;
          if (data) {
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
Este informe es fundamental para el usuario, ya que lo utilizará para crear campañas publicitarias, estructurar su propuesta de valor, encontrar oportunidades de mercado y planificar estrategias de contenido.

Debes analizar en detalle lo que cada competidor hace en sus canales (Sitio Web, Instagram, Facebook, etc.) basándote en los datos específicos de sus reportes. No generalices, menciona datos concretos de los competidores si están disponibles en su JSON (ej. si ofrecen programas de lealtad, concursos, tipos de copys, tonos que usan, enfoques de conversión, etc.).

Escribe un informe extenso, rico en texto, sumamente detallado y de nivel profesional. El informe total debe leerse como un análisis exhaustivo y profundo de consultoría de marketing.

Por favor, genera este análisis profundo y devuélvelo estructurado exactamente en el siguiente formato JSON:
{
  "executiveSummary": "# INFORME DE INTELIGENCIA COMPETITIVA Y PLAN DE CAMPAÑAS\\n\\n## 1. Panorama Competitivo Global\\n[Escribe un análisis exhaustivo de al menos 4 párrafos largos sobre el mercado de repostería/pastelería local basándote en la presencia digital de los competidores analizados. Analiza el nivel de digitalización general, la madurez en la creación de marca (branding), el tipo de interacción que logran en redes sociales, y la sofisticación técnica de sus sitios web en comparación con la media del mercado.]\\n\\n## 2. Análisis Detallado de Canales de la Competencia\\n[Escribe al menos 3 párrafos analizando qué canales (Sitio Web, Instagram, Facebook, TikTok) están dominando la competencia y cómo los usan. ¿Qué tácticas de conversión aplican en sus webs? ¿Cómo interactúan con su comunidad en Facebook? ¿Qué frecuencia y tipo de contenido (educativo vs comercial) priorizan en Instagram? Utiliza los datos específicos recopilados en los JSON.]\\n\\n## 3. Matriz de Oportunidades y Gaps en el Mercado\\n[Identifica vacíos críticos y áreas descuidadas en la estrategia de la competencia. ¿Qué dolores del cliente o temas no están resolviendo? ¿Qué canales o formatos están ignorando o usando mal? Define al menos 3 nichos u oportunidades de oro que ${business.name} puede capitalizar de inmediato para posicionarse por encima de ellos. Sé sumamente descriptivo y de tono analítico.]\\n\\n## 4. Estrategia de Ataque y Posicionamiento para ${business.name}\\n[Define la estrategia de posicionamiento diferenciado para ${business.name} para contrastar fuertemente con la competencia. Incluye el ángulo de comunicación recomendado, propuesta de valor diferenciada, y pautas detalladas sobre el tono de comunicación, voz de marca y elementos de storytelling que se deben emplear.]\\n\\n## 5. Propuestas de Campañas de Marketing Concretas (Estrategias de Growth)\\nGenera propuestas de campañas detalladas y listas para ejecutar (mínimo 3 campañas):\\n\\n### Campaña 1: [Nombre de la Campaña]\\n- **Objetivo Estratégico:** [Explicación detallada del objetivo: conversión, tráfico, engagement, leads, etc.]\\n- **Ángulo de Comunicación y Gancho:** [El gancho creativo y gancho emocional/racional exacto para captar la atención.]\\n- **Conceptos de Contenido y Ejemplos de Copys:** [Describe las piezas de contenido recomendadas (ej. carrusel, reel, post) y escribe un ejemplo real de copy publicitario redactado listo para usar.]\\n- **Canales y Plan de Distribución:** [Plan de publicación detallado en los canales correspondientes (Instagram, Meta Ads, etc.).]\\n\\n### Campaña 2: [Nombre de la Campaña]\\n- **Objetivo Estratégico:** ...\\n- **Ángulo de Comunicación y Gancho:** ...\\n- **Conceptos de Contenido y Ejemplos de Copys:** ...\\n- **Canales y Plan de Distribución:** ...\\n\\n### Campaña 3: [Nombre de la Campaña]\\n- **Objetivo Estratégico:** ...\\n- **Ángulo de Comunicación y Gancho:** ...\\n- **Conceptos de Contenido y Ejemplos de Copys:** ...\\n- **Canales y Plan de Distribución:** ...\\n\\n## 6. Estrategia de Contenidos y Guía de Formatos de Alto Rendimiento\\n[Recomendaciones detalladas sobre los pilares de contenido, frecuencias de publicación ideales por canal, y formatos clave (ej. reels interactivos, carruseles educativos de conservación, videos tras bambalinas, etc.) que ${business.name} debe implementar para superar la calidad de contenido de los competidores.]\\n\\n## 7. Tácticas de Conversión, Precios e Incentivos de Venta\\n[Estrategias de pricing, promociones activas, programas de lealtad o lead magnets que se recomiendan para contrarrestar e incentivar a los clientes a elegir a ${business.name} frente a las ofertas de los competidores analizados.]",
  "competitors": [
    {
      "id": "[ID de cada competidor enviado]",
      "strategicAnalysis": "### Perfil Estratégico: [Nombre del Competidor]\\n\\n#### Análisis por Canal y Desempeño\\n[Escribe un párrafo largo analizando detalladamente su desempeño en sus canales activos: qué hacen bien en su sitio web, en Instagram o Facebook, y qué volumen de interacción/comunidad tienen basándote en sus métricas y datos de presencia.]\\n\\n#### Debilidades Críticas y Gaps\\n[Escribe un párrafo analizando sus puntos débiles: fallas de consistencia de marca, falta de dinamismo en redes, debilidades en su propuesta de conversión, o ausencia de contenidos clave (ej. educativos, interactivos).]\\n\\n#### Plan Táctico de Contramedida (Cómo Ganarles)\\n[Escribe un plan de acción estratégico paso a paso de 2 párrafos para que ${business.name} le robe cuota de mercado directamente a este competidor, detallando promociones, formatos de contenidos y ganchos de posicionamiento específicos contra él.]"
    }
  ]
}

REGLAS CRÍTICAS:
1. El campo "executiveSummary" y "strategicAnalysis" DEBEN estar en formato Markdown enriquecido con subtítulos (ej. ### y ####), negritas y listas.
2. Todo el texto debe estar en español, redactado con un tono altamente analítico, profesional, directo y orientado al growth marketing.
3. No incluyas explicaciones previas ni posteriores, devuelve únicamente el JSON válido. Evita usar placeholders genéricos; personaliza todo para el negocio del cliente (${business.name}) y el contexto de sus competidores.`;

      console.log(`\n======================================================`);
      console.log(`🤖 ENVIANDO PROMPT A OPENROUTER (claude-sonnet-4.5)`);
      console.log(`======================================================\n`);

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cleanOpenRouterKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'MarketOps'
        },
        body: JSON.stringify({
          model: 'anthropic/claude-sonnet-4.5',
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
          if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/^```(?:json)?\s*/i, '');
            jsonText = jsonText.replace(/\s*```$/, '');
          }
          
          const parsed = JSON.parse(jsonText);
          executiveSummary = parsed.executiveSummary || '';
          competitorAnalyses = parsed.competitors || [];
          console.log(`✅ Parseo JSON de IA exitoso!`);
        } catch (e) {
          console.error('❌ Error parseando respuesta JSON de la IA:', e);
          executiveSummary = content;
        }
      } else {
        console.error(`❌ Error en respuesta de OpenRouter. Status: ${response.status} ${response.statusText}`);
        const text = await response.text();
        console.error('Body error:', text);
        process.exit(1);
      }
    }

    // Build the consolidated report
    const generalReport = {
      businessId: business.id,
      businessName: business.name,
      generatedAt: new Date().toISOString(),
      executiveSummary: executiveSummary,
      
      competitors: competitors.map(competitor => {
        const competitorReports = competitorReportsMap.get(competitor.id) || [];
        const allInsights = {
          totalFollowers: 0,
          totalPosts: 0,
          avgEngagement: 0,
          strengths: [],
          weaknesses: [],
          recommendations: [],
          contentThemes: [],
          postingFrequency: '',
          audienceDemographics: {},
          topPerformingContent: [],
          contentStrategy: {},
          brandVoice: [],
          marketingTactics: [],
          customerEngagement: {},
          competitiveAdvantages: [],
          marketPositioning: '',
          pricingStrategy: '',
          uniqueSellingPoints: [],
          websiteAnalysis: {},
          seoStrategy: [],
          advertisingApproach: [],
          customerService: [],
          productOfferings: [],
          promotions: [],
          partnerships: [],
          communityBuilding: [],
          brandConsistency: [],
          visualIdentity: [],
          storytellingApproach: [],
          contentFormats: [],
          engagementTactics: [],
          growthStrategy: [],
          targetAudience: [],
          valueProposition: [],
          differentiation: [],
          strategicAnalysis: '',
        };
        
        competitorReports.forEach(report => {
          const data = report.data;
          
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
          
          if (data?.engagement_analysis) {
            const engagement = data.engagement_analysis;
            if (engagement.engagement_level) allInsights.avgEngagement = engagement.engagement_level;
            if (engagement.content_themes) allInsights.contentThemes.push(...engagement.content_themes);
            if (engagement.posting_frequency) allInsights.postingFrequency = engagement.posting_frequency;
            if (engagement.engagement_tactics) allInsights.engagementTactics.push(...engagement.engagement_tactics);
          }
          
          if (data?.competitive_observations) {
            const compObs = data.competitive_observations;
            if (compObs.main_strengths) allInsights.strengths.push(...compObs.main_strengths);
            if (compObs.main_weaknesses) allInsights.weaknesses.push(...compObs.main_weaknesses);
            if (compObs.strategic_recommendations) allInsights.recommendations.push(...compObs.strategic_recommendations);
            if (compObs.competitive_advantages) allInsights.competitiveAdvantages.push(...compObs.competitive_advantages);
            if (compObs.market_positioning) allInsights.marketPositioning = compObs.market_positioning;
            if (compObs.differentiation) allInsights.differentiation.push(...compObs.differentiation);
          }
          
          if (data?.branding_analysis) {
            const branding = data.branding_analysis;
            if (branding.brand_personality) allInsights.brandVoice.push(...branding.brand_personality);
            if (branding.communication_style) allInsights.brandVoice.push(...branding.communication_style);
            if (branding.visual_identity) allInsights.visualIdentity.push(...branding.visual_identity);
            if (branding.brand_consistency) allInsights.brandConsistency.push(...branding.brand_consistency);
          }
          
          if (data?.content_analysis) {
            const content = data.content_analysis;
            if (content.top_performing_content) allInsights.topPerformingContent.push(...content.top_performing_content);
            if (content.content_strategy) allInsights.contentStrategy = { ...allInsights.contentStrategy, ...content.content_strategy };
            if (content.content_formats) allInsights.contentFormats.push(...content.content_formats);
            if (content.storytelling_approach) allInsights.storytellingApproach.push(...content.storytelling_approach);
          }
          
          if (data?.business_intelligence) {
            const bizIntel = data.business_intelligence;
            if (bizIntel.marketing_tactics) allInsights.marketingTactics.push(...bizIntel.marketing_tactics);
            if (bizIntel.pricing_strategy) allInsights.pricingStrategy = bizIntel.pricing_strategy;
            if (bizIntel.unique_selling_points) allInsights.uniqueSellingPoints.push(...bizIntel.unique_selling_points);
            if (bizIntel.value_proposition) allInsights.valueProposition.push(...bizIntel.value_proposition);
            if (bizIntel.product_offerings) allInsights.productOfferings.push(...bizIntel.product_offerings);
            if (bizIntel.promotions) allInsights.promotions.push(...bizIntel.promotions);
            if (bizIntel.partnerships) allInsights.partnerships.push(...bizIntel.partnerships);
          }
          
          if (data?.website_analysis) {
            allInsights.websiteAnalysis = { ...allInsights.websiteAnalysis, ...data.website_analysis };
          }
          if (data?.seo_strategy) allInsights.seoStrategy.push(...data.seo_strategy);
          if (data?.advertising_approach) allInsights.advertisingApproach.push(...data.advertising_approach);
          if (data?.customer_service) allInsights.customerService.push(...data.customer_service);
          if (data?.community_building) allInsights.communityBuilding.push(...data.community_building);
          if (data?.growth_strategy) allInsights.growthStrategy.push(...data.growth_strategy);
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
        
        const compAnalysis = competitorAnalyses.find(ca => ca.id === competitor.id);
        if (compAnalysis) {
          allInsights.strategicAnalysis = compAnalysis.strategicAnalysis;
        }
        
        return {
          ...competitor,
          reports: competitorReports,
          insights: allInsights
        };
      }),
      
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

    console.log(`\n======================================================`);
    console.log(`✅ GENERAL REPORT GENERATED AND SAVED TO DB SUCCESSFULLY!`);
    console.log(`======================================================\n`);

  } catch (error) {
    console.error('Error generating report:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
