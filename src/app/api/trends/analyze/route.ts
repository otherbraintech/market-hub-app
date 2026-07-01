import { NextResponse } from "next/server";
import { z } from "zod";
import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

const openrouter = createOpenAI({
  apiKey: process.env.OPEN_ROUTER_KEY?.replace(/"/g, "").trim(),
  baseURL: "https://openrouter.ai/api/v1",
});

export async function POST(request: Request) {
  try {
    const { keyword } = await request.json();
    if (!keyword) {
      return NextResponse.json({ error: "Se requiere la palabra clave" }, { status: 400 });
    }

    const systemPrompt = `Eres un detector de tendencias digitales y estratega de growth marketing.
Analiza la palabra clave o nicho provisto por el usuario y genera un informe de tendencia digital estructurado en JSON.
Sé sumamente creativo, preciso y asegúrate de proponer hashtags crecientes e ideas virales de ganchos (hooks) con alto engagement para redes sociales.`;

    const userPrompt = `Analiza la tendencia del nicho o palabra clave: "${keyword}"`;

    const { object } = await generateObject({
      model: openrouter("google/gemini-2.5-flash"),
      schema: z.object({
        query: z.string(),
        summary: z.string().describe("Resumen ejecutivo de lo que es tendencia actual en este nicho (3 frases)"),
        score: z.number().describe("Puntaje de relevancia del 1 al 100"),
        growth: z.string().describe("Porcentaje de crecimiento estimado de búsquedas (ej. +45% esta semana)"),
        hashtags: z.array(z.object({
          tag: z.string().describe("Hashtag con el símbolo # al inicio"),
          growth: z.string().describe("Porcentaje de crecimiento (ej. +62%)"),
          volume: z.enum(["Baja", "Media", "Alta", "Muy Alta"])
        })),
        ideas: z.array(z.object({
          title: z.string().describe("Título corto de la idea de contenido"),
          description: z.string().describe("Descripción de la idea y cómo grabarla/hacerla"),
          hook: z.string().describe("Gancho de texto directo para llamar la atención del espectador")
        })),
        recommendations: z.array(z.string()).describe("Lista de 2 recomendaciones técnicas sobre formatos o canales")
      }),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.8
    });

    return NextResponse.json({ report: object });
  } catch (error: any) {
    console.error("Error al analizar tendencias con IA:", error);
    return NextResponse.json({ error: error.message || "Error al analizar tendencias" }, { status: 500 });
  }
}
