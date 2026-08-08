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

import https from "https";
import http from "http";

function fetchHtmlInsecure(url: string, redirectsRemaining = 3): Promise<string> {
  return new Promise((resolve, reject) => {
    if (redirectsRemaining < 0) {
      return reject(new Error("Too many redirects"));
    }
    try {
      const parsed = new URL(url);
      const client = parsed.protocol === "https:" ? https : http;
      const req = client.get(
        url,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          rejectUnauthorized: false,
          timeout: 10000,
        },
        (res) => {
          if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            const redirectUrl = new URL(res.headers.location, url).toString();
            resolve(fetchHtmlInsecure(redirectUrl, redirectsRemaining - 1));
            return;
          }
          let data = "";
          res.on("data", (chunk) => {
            data += chunk;
          });
          res.on("end", () => {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              resolve(data);
            } else {
              reject(new Error(`Status code: ${res.statusCode}`));
            }
          });
        }
      );
      req.on("error", (err) => reject(err));
      req.on("timeout", () => {
        req.destroy();
        reject(new Error("Timeout"));
      });
      req.end();
    } catch (e) {
      reject(e);
    }
  });
}

export async function analyzeBusiness(name: string, description: string, website?: string): Promise<BusinessAnalysis> {
  let websiteContent = '';
  if (website && (website.startsWith('http://') || website.startsWith('https://'))) {
    try {
      const html = await fetchHtmlInsecure(website);
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
    } catch (error) {
      console.error('Error fetching website:', error);
    }
  }

  const { object } = await generateObject({
    model: openrouter('google/gemini-2.5-flash'),
    schema: businessAnalysisSchema,
    system: `Eres un experto en estrategia de marca y análisis de mercado comercial. 
    Tu tarea es analizar estrictamente el Nombre, Descripción y Contenido web de un negocio para identificar su industria comercial real.

    REGLA CRÍTICA DE VALIDACIÓN DE RUBRO / INDUSTRIA:
    1. Si el Nombre y la Descripción contienen texto aleatorio, incoherente, letras al azar (ej: "asdfghjk", "test 123", "qwerty"), o si la información es insuficiente para determinar objetivamente un sector comercial real:
       - El campo 'industry' DEBE SER EXACTAMENTE: "Error al identificar rubro (Descripción o datos insuficientes)".
    2. Si el Nombre o la Descripción indican un sector o actividad económica real:
       - Identifica el rubro híper-específico en español con máxima precisión acorde a la actividad real (ejemplos: "Frigorífico", "Carnicería", "Churrasquería / Parrillada", "Avícola", "Pastelería Artesanal", "Pizzería", "Clínica Odontológica", "Boutique de Calzado", "Taller Automotriz", "Agencia de Marketing Digital", "Software SaaS", etc.). Evita categorías excesivamente genéricas si el negocio es un nicho específico.

    NUNCA inventes o adivines un rubro ficticio si los datos ingresados por el usuario son texto aleatorio o insuficiente.`,
    prompt: `
      Analiza el siguiente negocio:
      Nombre del Negocio: ${name}
      Descripción: ${description || 'Sin descripción'}
      ${websiteContent ? `Contenido extraído del sitio web: ${websiteContent}` : 'Sin sitio web disponible.'}

      Genera el objeto JSON con:
      - industry: La industria principal real detectada, o "Error al identificar rubro (Descripción o datos insuficientes)" si la información es incoherente o insuficiente.
      - brandVoice: Un objeto con tone (array), personality (array) y values (array).
      - targetAudience: Un objeto con demographics (string) y psychographics (string).
    `,
  });

  return object;
}
