"use server";

import { prisma } from "@/lib/prisma";
import { 
  fetchNicheTrends, 
  fetchPlatformBenchmarks, 
  sanitizeCountryNames 
} from "@/lib/services/ob-tendencias";
import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";

const openrouter = createOpenAI({
  apiKey: process.env.OPEN_ROUTER_KEY?.replace(/"/g, "").trim(),
  baseURL: "https://openrouter.ai/api/v1",
});

function cleanHashtagTag(str: string): string {
  if (!str) return "";
  const normalize = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return normalize
    .replace(/&/g, "y")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
}

async function synthesizeTrendsAI(
  niche: string,
  platform: "tiktok" | "instagram" | "facebook",
  region: string
) {
  try {
    const { object } = await generateObject({
      model: openrouter("google/gemini-2.5-flash"),
      schema: z.object({
        hooks: z.array(z.object({
          text: z.string().describe("Gancho inicial en los primeros 1.7 segundos para capturar la atención"),
          pattern_interrupt: z.string().describe("Interrupción visual o de movimiento recomendada"),
          category: z.string().describe("Categoría del gancho (ej: Curiosidad, Polémica, Valor, Antes/Después, Mito/Realidad)"),
          execution_tips: z.string().describe("Consejo de grabación o ángulo de cámara"),
          suggested_cta: z.string().describe("Llamado a la acción específico para este rubro")
        })),
        music: z.array(z.object({
          name: z.string().describe("Nombre de canción o audio viral adecuado para el nicho"),
          artist: z.string().describe("Artista o creador del audio"),
          search_keyword: z.string().describe("Término exacto para buscar en la biblioteca de audios"),
          audio_phase: z.string().describe("Fase de la tendencia (ej: emergente, en auge, pico)")
        })),
        hashtags: z.array(z.object({
          tag: z.string().describe("Hashtag válido sin el símbolo # ni caracteres especiales como &"),
          category: z.string().describe("Tipo: '30% Nicho Específico' o '70% Alcance Viral'"),
          volume_metrics: z.string().describe("Volumen de uso estimado en la plataforma")
        })),
        algorithmic_recommendations: z.object({
          queen_metric: z.object({
            name: z.string().describe("Nombre de la métrica reina (ej: Retención a 3s, Rewatch Rate, Guardados)"),
            target: z.string().describe("Objetivo cuantitativo recomendable"),
            strategy: z.string().describe("Estrategia técnica para maximizar esta métrica")
          }),
          optimal_posting_window: z.string().describe("Horario óptimo de publicación para la región y rubro"),
          edit_pacing: z.string().describe("Ritmo de edición (ej: Cambios de toma cada 1.5s, subtítulos animados)")
        }),
        viral_video_concept: z.object({
          title: z.string().describe("Título conceptual del video viral"),
          storyboard: z.string().describe("Desglose paso a paso de escenas (0-3s Hook, 3-15s Demostración, 15-30s Cierre)"),
          estimated_reach: z.string().describe("Estimación de alcance orgánico potencial")
        }),
        content_pillars: z.array(z.object({
          pillar: z.string().describe("Nombre del pilar de contenido"),
          percentage: z.number().describe("Porcentaje recomendado en la mezcla mensual (ej: 40, 30, 20, 10)"),
          description: z.string().describe("Enfoque estratégico del pilar")
        })),
        news: z.array(z.object({
          title: z.string().describe("Noticia o tendencia emergente del rubro"),
          source: z.string().describe("Fuente o canal de tendencia")
        }))
      }),
      system: `Eres el motor agéntico de inteligencia de mercado y tendencias virales para redes sociales de MarketHub.
Analiza con máxima precisión el rubro/nicho "${niche}" en la plataforma "${platform.toUpperCase()}" para la región de "${region}".
Genera datos de tendencias en tiempo real 100% realistas, hiper-específicos del rubro proveído, actualizados y sumamente atractivos. No dejes campos vacíos ni inventes textos genéricos de otros rubros. Todo debe ser exclusivo y perfectamente alineado con ${niche}.`,
      prompt: `Extrae y sintetiza el paquete completo de tendencias de redes sociales para el nicho "${niche}" en la plataforma "${platform}" para la región "${region}".`,
      temperature: 0.75
    });

    return object;
  } catch (err) {
    console.error("Error en synthesizeTrendsAI:", err);
    return null;
  }
}

export async function exploreTrendsAction(params: {
  niche: string;
  platform?: "tiktok" | "instagram" | "facebook";
  region?: string;
  forceRefresh?: boolean;
}) {
  try {
    const { niche, platform = "tiktok", region = "BO", forceRefresh = false } = params;

    if (!niche || !niche.trim()) {
      return { success: false, error: "Ingresa un nicho o rubro válido para consultar." };
    }

    const cleanNicheStr = niche.trim().toLowerCase();

    // 1. Si no se fuerza refresco, intentar obtener de PostgreSQL (Prisma Cache)
    if (!forceRefresh) {
      try {
        const cachedDbRecord = await prisma.nicheTrend.findUnique({
          where: {
            niche_platform_region: {
              niche: cleanNicheStr,
              platform,
              region
            }
          }
        });

        if (
          cachedDbRecord && 
          cachedDbRecord.data && 
          Array.isArray((cachedDbRecord.data as any).hooks) && 
          (cachedDbRecord.data as any).hooks.length > 0
        ) {
          const cachedData = cachedDbRecord.data as any;
          const cleanHashtags = (cachedData.hashtags || []).map((h: any) => ({
            ...h,
            tag: cleanHashtagTag(h.tag || "")
          }));

          return {
            success: true,
            data: {
              platform,
              niche,
              region,
              isCached: true,
              sourcesUsed: cachedDbRecord.sourcesUsed || "Base de Datos PostgreSQL (MarketHub)",
              hooks: cachedData.hooks || [],
              music: cachedData.music || [],
              generalMusic: cachedData.general_music || [],
              shortViralAudios: cachedData.short_viral_audios || [],
              hashtags: cleanHashtags,
              algorithmicRecommendations: cachedData.algorithmic_recommendations || {},
              viralVideoConcept: cachedData.viral_video_concept || null,
              contentPillars: cachedData.content_pillars || [],
              upcomingEvents: cachedData.upcoming_events || [],
              news: cachedData.news || [],
              socialSeo: cachedData.social_seo || null,
              benchmarks: null,
              systemPrompt: cachedDbRecord.systemPrompt || ""
            }
          };
        }
      } catch (err) {
        console.warn("DB Cache Check warning:", err);
      }
    }

    // 2. Extracción Live desde API OB-Tendencias Engine
    const [trendsPayload, benchmarks] = await Promise.all([
      fetchNicheTrends(niche, platform, region),
      fetchPlatformBenchmarks(platform)
    ]);

    // Sanitizar cualquier dato para respetar los acuerdos de país
    const rawData = trendsPayload?.data || {};
    let sanitizedData = JSON.parse(sanitizeCountryNames(JSON.stringify(rawData)));

    // Si la API externa no contiene ganchos o datos para este nicho específico, sintetizar con IA
    if (!sanitizedData.hooks || !Array.isArray(sanitizedData.hooks) || sanitizedData.hooks.length === 0) {
      const aiSynthesized = await synthesizeTrendsAI(niche, platform, region);
      if (aiSynthesized) {
        sanitizedData = aiSynthesized;
      }
    }

    // Limpiar hashtags eliminando símbolos no alfanuméricos como & o acentos
    if (Array.isArray(sanitizedData.hashtags)) {
      sanitizedData.hashtags = sanitizedData.hashtags.map((h: any) => ({
        ...h,
        tag: cleanHashtagTag(h.tag || "")
      }));
    }

    const cleanNicheTag = cleanHashtagTag(niche);
    const hashtagStr = (sanitizedData.hashtags || []).map((h: any) => `#${cleanHashtagTag(h.tag)}`).join(" ") || `#${cleanNicheTag} #viral #fyp`;

    const generatedPrompt = `Eres un Copywriter experto en ${platform.toUpperCase()} y especialista en el nicho de ${niche.toUpperCase()} para ${region}.

REGLAS DE ALGORITMO Y MÉTRICA REINA:
- Plataforma Objetivo: ${platform.toUpperCase()}
- Métrica Reina a Maximizar: ${benchmarks?.queen_metric?.name || sanitizedData?.algorithmic_recommendations?.queen_metric?.name || "Rewatch Rate / Retention"}
- Ventana de Publicación Sugerida: ${benchmarks?.optimal_posting_window || sanitizedData?.algorithmic_recommendations?.optimal_posting_window || "18:00 - 21:00"}

GANCHOS VIRALES PROBADOS:
${(sanitizedData.hooks || []).slice(0, 3).map((h: any) => `- "${h.text}"`).join("\n") || "- Dato chocante con estadística visual"}

HASHTAGS RECOMENDADOS (30% NICHO / 70% VIRAL):
${hashtagStr}

TÁCTICA DE REDACCIÓN:
Escribe 3 guiones de video cortos (15-30s) que enganchen en los primeros 1.7 segundos con llamada a la acción clara.`;

    // 3. Persistir o actualizar en la tabla NicheTrend de la BDD PostgreSQL vía Prisma
    try {
      await prisma.nicheTrend.upsert({
        where: {
          niche_platform_region: {
            niche: cleanNicheStr,
            platform,
            region
          }
        },
        create: {
          niche: cleanNicheStr,
          platform,
          region,
          data: sanitizedData,
          sourcesUsed: sanitizeCountryNames("Bolivia, Argentina, Chile, Colombia"),
          systemPrompt: generatedPrompt
        },
        update: {
          data: sanitizedData,
          sourcesUsed: sanitizeCountryNames("Bolivia, Argentina, Chile, Colombia"),
          systemPrompt: generatedPrompt,
          updatedAt: new Date()
        }
      });
    } catch (dbSaveErr) {
      console.error("Error guardando consulta de NicheTrend en BDD:", dbSaveErr);
    }

    return {
      success: true,
      data: {
        platform,
        niche,
        region,
        isCached: trendsPayload?.is_cached ?? false,
        sourcesUsed: trendsPayload?.data ? sanitizeCountryNames("Bolivia, Argentina, Chile, Colombia") : "Sintetizado en vivo por IA",
        hooks: sanitizedData.hooks || [],
        music: sanitizedData.music || [],
        generalMusic: sanitizedData.general_music || [],
        shortViralAudios: sanitizedData.short_viral_audios || [],
        hashtags: sanitizedData.hashtags || [],
        algorithmicRecommendations: sanitizedData.algorithmic_recommendations || benchmarks || {},
        viralVideoConcept: sanitizedData.viral_video_concept || null,
        contentPillars: sanitizedData.content_pillars || [],
        upcomingEvents: sanitizedData.upcoming_events || [],
        news: sanitizedData.news || [],
        socialSeo: sanitizedData.social_seo || null,
        benchmarks: benchmarks || null,
        systemPrompt: generatedPrompt
      }
    };
  } catch (error: any) {
    console.error("Error in exploreTrendsAction:", error);
    return { 
      success: false, 
      error: error?.message || "No se pudo conectar con el motor de OB-Tendencias API." 
    };
  }
}
