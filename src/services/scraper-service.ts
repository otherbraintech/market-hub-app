import { sanitizeSocialUrl } from "@/lib/url";

export interface ScrapeOptions {
  url: string;
  channel: string; // "FACEBOOK" | "INSTAGRAM" | "TIKTOK" | "WEBSITE" | "WEB"
  maxPosts?: number;
}

export interface ScrapedPost {
  id?: string;
  author_name?: string;
  post_text?: string;
  likes_count?: number | string;
  comments_count?: number | string;
  shares_count?: number | string;
  saved_count?: number | string;
  screenshot_url?: string;
  post_url?: string;
  scraped_at?: string;
}

export interface ScrapedProfileResult {
  platform: string;
  author_name?: string;
  user_handle?: string;
  profile_url?: string;
  avatar_url?: string;
  followers_count?: string | number;
  following_count?: string | number;
  posts_count?: string | number;
  likes_count?: string | number;
  description?: string;
  category_type?: string;
  scraped_posts?: ScrapedPost[];
  scraped_at: string;
  source: "OB_SCRAP" | "APIFY" | "N8N_WEBHOOK" | "FALLBACK";
}

const OB_SCRAPER_API_URL = process.env.OB_SCRAPER_API_URL || "https://obmonitoreo-backend.ddt6vc.easypanel.host";
const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN || "";

/**
 * Extrae el nombre de usuario o handle a partir de una URL de red social.
 */
export function extractSocialUsername(urlString: string): string {
  if (!urlString) return "";
  const sanitized = sanitizeSocialUrl(urlString);
  try {
    const parsed = new URL(sanitized);
    const pathParts = parsed.pathname.split("/").filter(Boolean);
    if (pathParts.length > 0) {
      let handle = pathParts[0];
      if (["share", "profile.php", "p", "pages", "people"].includes(handle)) {
        if (pathParts.length > 1) handle = pathParts[1];
      }
      return handle.replace(/^@/, "");
    }
  } catch (e) {}
  return "";
}

/**
 * Normaliza el nombre de la plataforma para la API OB Farmer (OB-Scrap).
 */
function normalizeObPlatform(channel: string): "facebook" | "instagram" | "tiktok" | null {
  const c = channel.toUpperCase();
  if (c.includes("FACEBOOK") || c === "FB") return "facebook";
  if (c.includes("INSTAGRAM") || c === "IG") return "instagram";
  if (c.includes("TIKTOK") || c === "TT") return "tiktok";
  return null;
}

/**
 * Realiza el scraping de un perfil social usando la API OBFarmer (OB-Scrap).
 * 1. Envía la solicitud POST /api/monitoring/perfiles
 * 2. Consulta de forma periódica GET /api/monitoring/job/{job_id} hasta completar o fallar.
 */
export async function scrapeWithObScrap(options: ScrapeOptions): Promise<ScrapedProfileResult> {
  const platform = normalizeObPlatform(options.channel);
  if (!platform) {
    throw new Error(`Canal no soportado por OB-Scrap: ${options.channel}`);
  }

  const sanitizedUrl = sanitizeSocialUrl(options.url);
  const endpoint = `${OB_SCRAPER_API_URL}/api/monitoring/perfiles`;

  console.log(`📡 [OB-SCRAP] Enviando solicitud a OBFarmer API: ${endpoint} (${platform}: ${sanitizedUrl})`);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      profile_url: sanitizedUrl,
      platform,
      max_posts: options.maxPosts || 5,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`OB-Scrap HTTP ${response.status}: ${errorText || response.statusText}`);
  }

  const initData = await response.json();
  if (!initData.job_id) {
    throw new Error(`OB-Scrap no devolvió job_id: ${JSON.stringify(initData)}`);
  }

  const jobId = initData.job_id;
  console.log(`⏱️ [OB-SCRAP] Trabajo en cola recibido (job_id: ${jobId}). Iniciando sondeo (polling)...`);

  // Sondeo continuo (polling) cada 3.5 segundos hasta un máximo de 10 intentos (~35 segundos)
  const maxAttempts = 10;
  const pollIntervalMs = 3500;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));

    const pollUrl = `${OB_SCRAPER_API_URL}/api/monitoring/job/${jobId}`;
    try {
      const pollRes = await fetch(pollUrl, { cache: "no-store" });
      if (!pollRes.ok) continue;

      const pollData = await pollRes.json();
      const jobStatus = pollData.job_status || pollData.status;

      console.log(`🔍 [OB-SCRAP] Sondeo #${attempt}/${maxAttempts} para job_id ${jobId} -> Estado: ${jobStatus}`);

      if (jobStatus === "completed" && pollData.data) {
        return {
          ...pollData.data,
          source: "OB_SCRAP",
          scraped_at: pollData.data.scraped_at || new Date().toISOString(),
        };
      }

      if (jobStatus === "failed" || jobStatus === "error") {
        throw new Error(`OB-Scrap finalizó con estado de error: ${pollData.message || "Scraping fallido en teléfono"}`);
      }
    } catch (err: any) {
      if (err.message?.includes("OB-Scrap finalizó")) {
        throw err;
      }
      console.warn(`[OB-SCRAP] Advertencia en intento #${attempt} de sondeo:`, err.message);
    }
  }

  throw new Error(`OB-Scrap tiempo de espera agotado (Timeout) tras ${maxAttempts * 3.5}s para job_id ${jobId}`);
}

/**
 * Realiza el scraping usando Apify API o Fallback.
 * Soporta Instagram, TikTok, Facebook y Sitios Web.
 */
export async function scrapeWithApify(options: ScrapeOptions): Promise<ScrapedProfileResult> {
  const channel = options.channel.toUpperCase();
  const sanitizedUrl = sanitizeSocialUrl(options.url);
  const username = extractSocialUsername(sanitizedUrl);

  console.log(`🚀 [APIFY] Iniciando extracción vía Apify para ${channel} (${sanitizedUrl})`);

  if (!APIFY_API_TOKEN) {
    console.warn(`⚠️ [APIFY] APIFY_API_TOKEN no configurado en variables de entorno. Usando mock/n8n fallback.`);
    return buildFallbackProfile(sanitizedUrl, channel, username, "APIFY_NO_TOKEN");
  }

  try {
    let actorId = "";
    let runInput: Record<string, any> = {};

    if (channel.includes("INSTAGRAM") || channel === "IG") {
      actorId = "apify~instagram-profile-scraper";
      runInput = { usernames: [username || sanitizedUrl], resultsLimit: options.maxPosts || 5 };
    } else if (channel.includes("TIKTOK") || channel === "TT") {
      actorId = "clockworks~tiktok-profile-scraper";
      runInput = { profiles: [username || sanitizedUrl], resultsPerPage: options.maxPosts || 5 };
    } else if (channel.includes("FACEBOOK") || channel === "FB") {
      actorId = "apify~facebook-pages-scraper";
      runInput = { startUrls: [{ url: sanitizedUrl }], maxPosts: options.maxPosts || 5 };
    } else {
      // WEBSITE / WEB
      actorId = "apify~website-content-crawler";
      runInput = { startUrls: [{ url: sanitizedUrl }], maxCrawlPages: 3 };
    }

    const apifyUrl = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${APIFY_API_TOKEN}&timeout=60`;
    const res = await fetch(apifyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(runInput),
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Apify Actor HTTP ${res.status}: ${await res.text().catch(() => "")}`);
    }

    const items = await res.json();
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error(`Apify no devolvió resultados para ${sanitizedUrl}`);
    }

    const firstItem = items[0] || {};
    const scrapedPosts: ScrapedPost[] = items.slice(0, options.maxPosts || 5).map((item: any, idx: number) => ({
      id: item.id || `apify_post_${idx + 1}`,
      author_name: item.authorName || item.ownerUsername || firstItem.name || username,
      post_text: item.caption || item.text || item.text_content || item.description || "",
      likes_count: item.likesCount || item.diggCount || item.likes || 0,
      comments_count: item.commentsCount || item.commentCount || item.comments || 0,
      shares_count: item.sharesCount || item.shareCount || item.repostCount || 0,
      screenshot_url: item.displayUrl || item.imageUrl || item.videoUrl || item.thumbnailUrl || "",
      post_url: item.url || item.postUrl || sanitizedUrl,
      scraped_at: new Date().toISOString(),
    }));

    return {
      platform: channel.toLowerCase(),
      author_name: firstItem.fullName || firstItem.name || username || "Perfil Scrapeado",
      user_handle: `@${username || "perfil"}`,
      profile_url: sanitizedUrl,
      avatar_url: firstItem.profilePicUrl || firstItem.avatar || "",
      followers_count: firstItem.followersCount || firstItem.followers || "N/A",
      following_count: firstItem.followsCount || firstItem.following || "N/A",
      posts_count: firstItem.postsCount || scrapedPosts.length,
      description: firstItem.biography || firstItem.description || "",
      scraped_posts: scrapedPosts,
      scraped_at: new Date().toISOString(),
      source: "APIFY",
    };
  } catch (err: any) {
    console.error(`❌ [APIFY] Error durante el scraping de ${channel}:`, err.message);
    return buildFallbackProfile(sanitizedUrl, channel, username, err.message);
  }
}

/**
 * Genera un perfil formateado de respaldo cuando un scraper externo no devuelve datos.
 */
function buildFallbackProfile(url: string, channel: string, username: string, reason: string): ScrapedProfileResult {
  return {
    platform: channel.toLowerCase(),
    author_name: username ? `@${username}` : `Canal ${channel}`,
    user_handle: `@${username || "canal"}`,
    profile_url: url,
    description: `Perfil monitoreado en ${channel}. (${reason})`,
    followers_count: "En actualización",
    following_count: "En actualización",
    posts_count: 0,
    scraped_posts: [],
    scraped_at: new Date().toISOString(),
    source: "FALLBACK",
  };
}

/**
 * Orquestador Unificado de Scraping con Estrategia de Fallback Automática:
 * 1. WEBSITE -> Siempre usa Apify / Web Scraper.
 * 2. TIKTOK, INSTAGRAM, FACEBOOK:
 *    a) Intenta primero OB-Scrap (OBFarmer API con teléfonos ADB).
 *    b) Si OB-Scrap falla (HTTP 503, queue timeout, error de Facebook):
 *       -> Activa automáticamente el Fallback con Apify.
 */
export async function unifiedScrapeChannel(options: ScrapeOptions): Promise<ScrapedProfileResult> {
  const channel = options.channel.toUpperCase();
  const isWebsite = channel === "WEBSITE" || channel === "WEB" || channel.includes("SITE");

  // 1. Si es Sitio Web -> Directo a Apify / Web Crawler
  if (isWebsite) {
    console.log(`🌐 [SCRAPER] Canal es Sitio Web (${options.url}). Ejecutando extracción vía Apify...`);
    return await scrapeWithApify(options);
  }

  // 2. Si es Red Social (FB, IG, TikTok) -> Intentar OB-Scrap primero
  try {
    console.log(`📱 [SCRAPER] Intentando extracción primaria con OB-Scrap (OBFarmer API) para ${channel}...`);
    const obResult = await scrapeWithObScrap(options);
    return obResult;
  } catch (obError: any) {
    console.warn(
      `⚠️ [SCRAPER] OB-Scrap no disponible o falló para ${channel} (${options.url}): ${obError.message}. Actividad de respaldo enviada a APIFY...`
    );

    // Fallback automático a Apify
    try {
      const apifyResult = await scrapeWithApify(options);
      return apifyResult;
    } catch (apifyError: any) {
      console.error(`❌ [SCRAPER] Apify también falló para ${channel}:`, apifyError.message);
      const username = extractSocialUsername(options.url);
      return buildFallbackProfile(options.url, channel, username, `OB-Scrap: ${obError.message} | Apify: ${apifyError.message}`);
    }
  }
}
