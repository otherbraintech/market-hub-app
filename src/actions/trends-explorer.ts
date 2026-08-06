"use server";

import { prisma } from "@/lib/prisma";
import { 
  fetchNicheTrends, 
  fetchPlatformBenchmarks, 
  sanitizeCountryNames 
} from "@/lib/services/ob-tendencias";

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

        if (cachedDbRecord && cachedDbRecord.data) {
          const cachedData = cachedDbRecord.data as any;
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
              hashtags: cachedData.hashtags || [],
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
    const sanitizedData = JSON.parse(sanitizeCountryNames(JSON.stringify(rawData)));

    const generatedPrompt = `Eres un Copywriter experto en ${platform.toUpperCase()} y especialista en el nicho de ${niche.toUpperCase()} para ${region}.

REGLAS DE ALGORITMO Y MÉTRICA REINA:
- Plataforma Objetivo: ${platform.toUpperCase()}
- Métrica Reina a Maximizar: ${benchmarks?.queen_metric?.name || "Rewatch Rate / Retention"} (${benchmarks?.queen_metric?.target || ">2 loops"})
- Ventana de Publicación Sugerida: ${benchmarks?.optimal_posting_window || "18:00 - 21:00"}

GANCHOS VIRALES PROBADOS:
${(sanitizedData.hooks || []).slice(0, 3).map((h: any) => `- "${h.text}"`).join("\n") || "- Dato chocante con estadística visual"}

HASHTAGS RECOMENDADOS (30% NICHO / 70% VIRAL):
${(sanitizedData.hashtags || []).map((h: any) => `#${h.tag}`).join(" ") || `#${niche.replace(/\s+/g, '')} #viral #fyp`}

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
