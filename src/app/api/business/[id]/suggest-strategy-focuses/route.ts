import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createOpenAI } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

const openrouter = createOpenAI({
  apiKey: process.env.OPEN_ROUTER_KEY?.replace(/"/g, '').trim(),
  baseURL: 'https://openrouter.ai/api/v1',
});

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
        competitorGeneralReport: true,
      }
    });

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Get products
    const products = await prisma.product.findMany({
      where: { businessId: id, isActive: true },
      select: {
        name: true,
        description: true,
      }
    });

    // Get scraped reports
    const businessReports = await prisma.analysisReport.findMany({
      where: {
        type: 'MY_BUSINESS',
        entityId: id,
        status: 'COMPLETED',
        NOT: {
          channel: 'CONSOLIDATED'
        }
      },
      orderBy: { completedAt: 'desc' }
    });

    // Group and normalize business reports - query already ordered by completedAt DESC so first wins
    const businessReportsMap = new Map<string, any>();
    businessReports.forEach((report: typeof businessReports[number]) => {
      if (!businessReportsMap.has(report.channel)) {
        let dataObj = report.data;
        if (typeof report.data === 'string') {
          try {
            dataObj = JSON.parse(report.data);
          } catch (e) {
            console.error('Error parsing report data:', e);
          }
        }
        businessReportsMap.set(report.channel, dataObj);
      }
    });

    const url = new URL(request.url);
    const isRefresh = url.searchParams.get('refresh') === 'true';

    // Build context
    const context = {
      business: {
        name: business.name,
        description: business.description,
        industry: business.industry,
        website: business.website,
        socialLinks: business.socialLinks,
      },
      products: products,
      myScrapedChannels: Array.from(businessReportsMap.entries()).map(([channel, data]) => ({
        channel,
        data
      })),
      competitorAnalysis: business.competitorGeneralReport,
      isRefresh,
    };

    // Generate 3 strategic focuses with AI
    const focuses = await generateStrategicFocusesWithAI(context);

    return NextResponse.json({ focuses });
  } catch (error) {
    console.error('Error generating strategy focuses:', error);
    return NextResponse.json({ error: 'Failed to suggest focuses' }, { status: 500 });
  }
}

async function generateStrategicFocusesWithAI(context: any) {
  const openRouterKey = process.env.OPEN_ROUTER_KEY?.replace(/"/g, '').trim();
  
  if (!openRouterKey) {
    return generatePlaceholderFocuses(context);
  }

  try {
    const prompt = buildFocusPrompt(context);
    
    const { object } = await generateObject({
      model: openrouter('google/gemini-2.5-flash'),
      schema: z.object({
        focuses: z.array(z.object({
          name: z.string(),
          description: z.string(),
          icon: z.enum(['TrendingUp', 'Target', 'Sparkles']),
          suggestedPillars: z.array(z.string()),
          suggestedChannels: z.array(z.string()),
          suggestedTones: z.array(z.string())
        }))
      }),
      system: 'Eres un estratega jefe de marketing digital y growth hacker experto. Generas opciones de enfoques estratégicos altamente diferenciadores y específicos basados en el perfil del negocio, sus productos y reportes de competencia.',
      prompt: prompt,
      temperature: context.isRefresh ? 0.9 : 0.7,
    });

    if (object && Array.isArray(object.focuses) && object.focuses.length > 0) {
      return object.focuses;
    }

    return generatePlaceholderFocuses(context);
  } catch (error) {
    console.error('Error in AI focuses execution:', error);
    return generatePlaceholderFocuses(context);
  }
}

function buildFocusPrompt(context: any) {
  const { business, products, myScrapedChannels, competitorAnalysis } = context;
  
  let prompt = `Genera exactamente 3 enfoques estratégicos recomendados para el siguiente negocio basándote en su perfil, productos y competencia.\n\n`;
  if (context.isRefresh) {
    prompt += `IMPORTANTE: El usuario ha solicitado regenerar opciones alternativas. Por favor, sé más creativo y genera enfoques distintos a los habituales o generales, buscando ángulos innovadores de diferenciación.\n\n`;
  }
  prompt += `NEGOCIO:\n`;
  prompt += `- Nombre: ${business.name}\n`;
  prompt += `- Descripción: ${business.description || 'No especificada'}\n`;
  prompt += `- Industria: ${business.industry || 'No especificada'}\n\n`;
  
  if (products.length > 0) {
    prompt += `PRODUCTOS REGISTRADOS:\n`;
    products.forEach((p: any) => {
      prompt += `- ${p.name}: ${p.description}\n`;
    });
    prompt += `\n`;
  }

  if (myScrapedChannels.length > 0) {
    prompt += `NUESTROS CANALES SCRAPEADOS:\n`;
    myScrapedChannels.forEach((chan: any) => {
      prompt += `- Canal: ${chan.channel}\n`;
      if (chan.data?.strategic_diagnostics) {
        prompt += `  * Fortalezas: ${(chan.data.strategic_diagnostics.strengths || []).slice(0, 2).join(', ')}\n`;
        prompt += `  * Debilidades: ${(chan.data.strategic_diagnostics.weaknesses || []).slice(0, 2).join(', ')}\n`;
      }
    });
    prompt += `\n`;
  }

  if (competitorAnalysis) {
    prompt += `ANÁLISIS DE LA COMPETENCIA:\n`;
    if (typeof competitorAnalysis === 'string') {
      prompt += `${competitorAnalysis.substring(0, 500)}...\n`;
    } else {
      prompt += `${JSON.stringify(competitorAnalysis).substring(0, 500)}...\n`;
    }
    prompt += `\n`;
  }

  prompt += `Genera un array JSON con exactamente 3 opciones estructuradas de la siguiente manera (en español):\n\n`;
  prompt += `[\n`;
  prompt += `  {\n`;
  prompt += `    "name": "Nombre de la opción (ej: Crecimiento Orgánico en Redes)",\n`;
  prompt += `    "description": "Una descripción detallada de 1 a 2 frases explicando qué se logrará específicamente y cómo nos diferenciaremos.",\n`;
  prompt += `    "icon": "TrendingUp" o "Target" o "Sparkles" (debe ser uno de estos tres exactos),\n`;
  prompt += `    "suggestedPillars": ["Lista de 3 pilares temáticos de contenido específicos para este negocio (ej. 'Detrás de Escena y Procesos', 'Lanzamientos y Antojos', 'Educación Dulce')"],\n`;
  prompt += `    "suggestedChannels": ["Lista de canales digitales a recomendar restringida ÚNICAMENTE a opciones dentro de: 'INSTAGRAM', 'FACEBOOK', 'TIKTOK' (ej. ['INSTAGRAM', 'FACEBOOK', 'TIKTOK'])"],\n`;
  prompt += `    "suggestedTones": ["Lista de 3 tonos de comunicación sugeridos (ej. 'Amistoso y Dulce', 'Elegante y Profesional', 'Divertido y Dinámico')"]\n`;
  prompt += `  }\n`;
  prompt += `]\n\n`;
  prompt += `Responde únicamente con el JSON estructurado, sin texto introductorio ni explicaciones adicionales.`;

  return prompt;
}

function generatePlaceholderFocuses(context: any) {
  const { business } = context;
  return [
    {
      name: "Dominio de Audiencia Local y Engagement",
      description: `Enfocarnos en optimizar los canales sociales (Instagram/Facebook) mediante contenido visual e interactivo de los productos de ${business.name}, impulsando las conversiones directas por mensajería.`,
      icon: "TrendingUp",
      suggestedPillars: ["Detrás de Escena y Recetas", "Promociones del Día", "Testimonios de Clientes"],
      suggestedChannels: ["INSTAGRAM", "FACEBOOK", "TIKTOK"],
      suggestedTones: ["Cálido y Amistoso", "Divertido y Cercano", "Inspiracional"]
    },
    {
      name: "Lanzamiento y Venta por Redes Sociales",
      description: `Estrategia de conversión enfocada en la creación de promociones exclusivas para tus productos estrella e interacciones rápidas y dinámicas en reels y publicaciones.`,
      icon: "Target",
      suggestedPillars: ["Combos Especiales", "Catálogo de Temporada", "Preguntas Frecuentes de Pedidos"],
      suggestedChannels: ["INSTAGRAM", "FACEBOOK", "TIKTOK"],
      suggestedTones: ["Directo y Claro", "Urgente e Invitador", "Profesional"]
    },
    {
      name: "Autoridad y Diferenciación Competitiva",
      description: `Aprovechar las debilidades de la competencia en el nicho de repostería para educar a la audiencia sobre la calidad premium, procesos y testimonios de satisfacción de ${business.name}.`,
      icon: "Sparkles",
      suggestedPillars: ["Ingredientes Premium", "Historias de Éxito", "Comparativas de Calidad"],
      suggestedChannels: ["INSTAGRAM", "FACEBOOK", "TIKTOK"],
      suggestedTones: ["Elegante y Profesional", "Informativo y Detallado", "Confiable"]
    }
  ];
}
