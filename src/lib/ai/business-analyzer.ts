import { createOpenAI } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

const openrouter = createOpenAI({
  apiKey: process.env.OPEN_ROUTER_KEY?.replace(/\"/g, '').trim(),
  baseURL: 'https://openrouter.ai/api/v1',
});

export const businessAnalysisSchema = z.object({
  industry: z.string(),
  brandVoice: z.object({
    tone: z.array(z.string()),
    personality: z.array(z.string()),
    values: z.array(z.string()),
  }),
  targetAudience: z.object({
    demographics: z.string(),
    psychographics: z.string(),
  }),
});

export type BusinessAnalysis = z.infer<typeof businessAnalysisSchema>;

export async function analyzeBusiness(name: string, description: string, website?: string): Promise<BusinessAnalysis> {
  let websiteContent = '';
  if (website && (website.startsWith('http://') || website.startsWith('https://'))) {
    try {
      const response = await fetch(website, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        next: { revalidate: 3600 } // Cache for 1 hour
      });
      if (response.ok) {
        const html = await response.text();
        // Basic extraction: get text between body tags if possible, or just strip all tags
        const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        const contentToProcess = bodyMatch ? bodyMatch[1] : html;
        websiteContent = contentToProcess
          .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gmi, "")
          .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gmi, "")
          .replace(/<[^>]*>?/gm, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 6000); 
      }
    } catch (error) {
      console.error('Error fetching website:', error);
    }
  }

  const { object } = await generateObject({
    model: openrouter('google/gemini-2.5-flash'),
    schema: businessAnalysisSchema,
    system: `Eres un experto en estrategia de marca y marketing digital. 
    Tu tarea es analizar la información de un negocio y extraer/generar su perfil estratégico.
    Si se proporciona contenido de la web, úsalo para ser más preciso.
    Sé creativo pero realista. Los tonos, personalidad y valores deben ser una lista de palabras o frases cortas.`,
    prompt: `
      Analiza el siguiente negocio:
      Nombre: ${name}
      Descripción: ${description}
      ${websiteContent ? `Contenido del sitio web: ${websiteContent}` : 'No se pudo obtener contenido del sitio web.'}

      Genera el objeto JSON con:
      - industry: La industria principal.
      - brandVoice: Un objeto con tone (array), personality (array) y values (array).
      - targetAudience: Un objeto con demographics (string) y psychographics (string).
    `,
  });

  return object;
}
