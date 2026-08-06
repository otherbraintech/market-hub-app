/**
 * Servicio de Integración Oficial con OB-Tendencias API Engine (2026.4)
 * Base URL: https://n8n-ob-tendencias.ddt6vc.easypanel.host
 * 
 * Este servicio extrae tendencias de nicho, ganchos virales, audios en auge,
 * hashtags 30/70, noticias RSS y métricas reina para alimentar internamente
 * a los agentes de Auditoría (Etapa 1), Estrategia (Etapa 3), Campañas (Etapa 4) y Calendario (Etapa 5).
 * 
 * REGLAS CUMPLIDAS DE REUNIÓN Y ESPECIFICACIÓN:
 * 1. Uso interno por agentes IA — NO crea pantallas ni módulos nuevos en la UI.
 * 2. Sanitización de países — Reemplaza referencias a países limítrofes por "Tendencias Globales" o "Mercados de Referencia".
 * 3. Graceful Fallback — Si la API está indisponible o excede timeout, retorna estructura enriquecida por defecto sin romper el flujo.
 */

const OB_TENDENCIAS_BASE_URL = process.env.OB_TENDENCIAS_API_URL || "https://n8n-ob-tendencias.ddt6vc.easypanel.host";

export interface OBTrendHook {
  text: string;
  pattern_interrupt?: string;
  category?: string;
  execution_tips?: string;
  suggested_cta?: string;
  cta_type?: string;
  lifecycle_status?: string;
  lifecycle_note?: string;
}

export interface OBTrendMusic {
  name: string;
  artist?: string;
  trend_audio_title?: string;
  search_keyword?: string;
  category?: string;
  is_trending?: boolean;
  audio_phase?: string;
}

export interface OBTrendHashtag {
  tag: string;
  category?: string;
  volume_metrics?: string;
}

export interface OBTrendsPayload {
  platform: string;
  niche: string;
  region: string;
  is_cached?: boolean;
  data?: {
    hooks?: OBTrendHook[];
    music?: OBTrendMusic[];
    general_music?: OBTrendMusic[];
    short_viral_audios?: any[];
    hashtags?: OBTrendHashtag[];
    algorithmic_recommendations?: {
      queen_metric?: { name: string; target: string; strategy: string };
      optimal_posting_window?: string;
      optimal_video_length?: { duration_brackets?: any[] };
      edit_pacing?: string;
      interaction_strategy?: string;
    };
    viral_video_concept?: any;
    content_formats?: any[];
    content_pillars?: any[];
    news?: any[];
    social_seo?: any;
  };
}

/**
 * Sanitiza menciones directas a países limítrofes (Brasil, Paraguay, Perú)
 * para cumplir estrictamente con los acuerdos de reunión.
 */
export function sanitizeCountryNames(text: string): string {
  if (!text) return "";
  return text
    .replace(/\b(Brasil|Brazil|Brasilera|Brasileño)\b/gi, "Tendencias Globales")
    .replace(/\b(Paraguay|Paraguaya|Paraguayo)\b/gi, "Mercados Regionales")
    .replace(/\b(Perú|Peru|Peruana|Peruano)\b/gi, "Mercados de Referencia");
}

/**
 * Consulta tendencias en la API pública de OB-Tendencias con timeout y fallback seguro.
 */
export async function fetchNicheTrends(
  niche: string,
  platform: "tiktok" | "instagram" | "facebook" = "tiktok",
  region = "BO",
  timeoutMs = 5000
): Promise<OBTrendsPayload | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const cleanNiche = encodeURIComponent(niche.trim().toLowerCase() || "general");
    const url = `${OB_TENDENCIAS_BASE_URL}/api/public/trends/${platform}/${cleanNiche}?region=${region}`;

    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      next: { revalidate: 3600 } // Cache en Next.js por 1 hora
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`[OB-Tendencias] API returned status ${res.status} for ${niche}/${platform}`);
      return null;
    }

    const json = await res.json();
    
    // Sanitizar cualquier texto devuelto
    if (json?.data) {
      const sanitizedString = sanitizeCountryNames(JSON.stringify(json.data));
      json.data = JSON.parse(sanitizedString);
    }

    return json;
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.warn(`[OB-Tendencias] Fallback activo para ${niche}/${platform}:`, error?.message || error);
    return null;
  }
}

/**
 * Consulta las métricas reina y reglas del algoritmo para una plataforma.
 */
export async function fetchPlatformBenchmarks(
  platform: "tiktok" | "instagram" | "facebook" = "tiktok",
  timeoutMs = 4000
): Promise<any | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = `${OB_TENDENCIAS_BASE_URL}/api/public/rules/${platform}/benchmarks`;
    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      next: { revalidate: 86400 } // Cache 24h
    });

    clearTimeout(timeoutId);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    clearTimeout(timeoutId);
    return null;
  }
}

/**
 * Construye un bloque de contexto formateado en Markdown para inyectar directamente
 * en los prompts de los agentes de IA (Auditoría, Estrategia, Campañas y Calendario).
 */
export async function getUnifiedTrendsContext(
  niche: string,
  platform: "tiktok" | "instagram" | "facebook" = "tiktok",
  region = "BO"
): Promise<string> {
  const [trendsPayload, benchmarks] = await Promise.all([
    fetchNicheTrends(niche, platform, region),
    fetchPlatformBenchmarks(platform)
  ]);

  if (!trendsPayload?.data && !benchmarks) {
    return `TENDENCIAS DE MERCADO Y ALGORITMO (${niche.toUpperCase()} - ${platform.toUpperCase()}):
- Mantener ganchos de alta curiosidad en los primeros 1.7 segundos.
- Publicar en horarios de mayor tráfico (18:00 - 21:00).
- Combinar 30% de hashtags de nicho específico con 70% de hashtags virales de la plataforma.`;
  }

  const data = trendsPayload?.data;
  let context = `INFORMACIÓN DE TENDENCIAS Y ALGORITMOS (${niche.toUpperCase()} - ${platform.toUpperCase()}):\n\n`;

  // 1. Métrica reina y algoritmo
  if (benchmarks?.queen_metric || data?.algorithmic_recommendations?.queen_metric) {
    const qm = benchmarks?.queen_metric || data?.algorithmic_recommendations?.queen_metric;
    context += `🎯 MÉTRICA REINA DEL ALGORITMO (${platform.toUpperCase()}):
- Métrica clave: ${qm.name} (${qm.target || "Máximo rendimiento"})
- Estrategia recomendada: ${qm.strategy}\n`;
  }

  if (benchmarks?.optimal_posting_window || data?.algorithmic_recommendations?.optimal_posting_window) {
    context += `- Horario óptimo de publicación: ${benchmarks?.optimal_posting_window || data?.algorithmic_recommendations?.optimal_posting_window}\n\n`;
  }

  // 2. Ganchos Virales Probados (Hooks)
  if (Array.isArray(data?.hooks) && data.hooks.length > 0) {
    context += `⚡ GANCHOS VIRALES EMERGENTES Y PATRONES DE INTERRUPCIÓN:
` + data.hooks.slice(0, 4).map((h, i) => `${i + 1}. "${h.text}" (Categoría: ${h.category || "General"}) -> CTA sugerido: ${h.suggested_cta || "Comentar"}`).join("\n") + "\n\n";
  }

  // 3. Audios & Música en Auge
  if (Array.isArray(data?.music) && data.music.length > 0) {
    context += `🎵 AUDIOS Y MÚSICA EN AUGE:
` + data.music.slice(0, 3).map(m => `- ${m.name} ${m.artist ? `(${m.artist})` : ''} [Fase: ${m.audio_phase || 'pico'}]`).join("\n") + "\n\n";
  }

  // 4. Hashtags 30% Nicho / 70% Viral
  if (Array.isArray(data?.hashtags) && data.hashtags.length > 0) {
    context += `🏷️ HASHTAGS RECOMENDADOS:
` + data.hashtags.slice(0, 6).map(h => `#${h.tag}`).join(" ") + "\n\n";
  }

  // 5. Pilares de Contenido
  if (Array.isArray(data?.content_pillars) && data.content_pillars.length > 0) {
    context += `📊 PILARES ESTRATÉGICOS DE CONTENIDO:
` + data.content_pillars.map(p => `- ${p.pillar} (${p.percentage}%): ${p.description}`).join("\n") + "\n\n";
  }

  // 6. Noticias del Sector
  if (Array.isArray(data?.news) && data.news.length > 0) {
    context += `📰 TENDENCIAS Y NOTICIAS RECIENTES DEL NICHO:
` + data.news.slice(0, 2).map(n => `- ${n.title} (${n.source})`).join("\n") + "\n\n";
  }

  return context;
}
