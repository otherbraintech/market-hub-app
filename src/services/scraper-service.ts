import { sanitizeSocialUrl } from "@/lib/url";

export interface ScrapeOptions {
  url: string;
  channel: string; // "FACEBOOK" | "INSTAGRAM" | "TIKTOK" | "WEBSITE" | "WEB"
  maxPosts?: number;
  reportId?: string;
  type?: "MY_BUSINESS" | "COMPETITOR";
  businessId?: string;
  businessName?: string;
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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7000); // 7s timeout para verificar conexión con OB-Scrap API

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profile_url: sanitizedUrl,
        platform,
        max_posts: options.maxPosts || 5,
      }),
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
  } catch (fetchErr: any) {
    clearTimeout(timeoutId);
    if (fetchErr.name === "AbortError") {
      throw new Error(`Servicio OB-Scrap offline o no respondió dentro del tiempo límite de conexión (7s).`);
    }
    throw new Error(`No se pudo conectar con el servicio OB-Scrap (${OB_SCRAPER_API_URL}): ${fetchErr.message}`);
  }

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
 * Realiza el scraping usando Apify API directo.
 * Soporta Instagram, TikTok, Facebook y Sitios Web.
 */
export async function scrapeWithApify(options: ScrapeOptions): Promise<ScrapedProfileResult> {
  const channel = options.channel.toUpperCase();
  const sanitizedUrl = sanitizeSocialUrl(options.url);
  const username = extractSocialUsername(sanitizedUrl);

  console.log(`🚀 [APIFY] Iniciando extracción vía Apify para ${channel} (${sanitizedUrl})`);

  if (!APIFY_API_TOKEN) {
    console.warn(`⚠️ [APIFY] APIFY_API_TOKEN no configurado en variables de entorno. Activando n8n fallback.`);
    return await scrapeWithN8nWebhook(options);
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
    console.error(`❌ [APIFY] Error durante el scraping directo de ${channel}: ${err.message}. Probando respaldo vía n8n webhook...`);
    return await scrapeWithN8nWebhook(options);
  }
}

/**
 * Realiza el scraping respaldado mediante el webhook de n8n.
 */
export async function scrapeWithN8nWebhook(options: ScrapeOptions): Promise<ScrapedProfileResult> {
  const channel = options.channel.toUpperCase();
  const sanitizedUrl = sanitizeSocialUrl(options.url);
  const username = extractSocialUsername(sanitizedUrl);

  const n8nWebhookUrl = options.type === "COMPETITOR"
    ? "https://n8n-n8n-start.ddt6vc.easypanel.host/webhook/scrap-negocio"
    : "https://n8n-n8n-start.ddt6vc.easypanel.host/webhook/sitioweb-scrap";

  console.log(`⚡ [N8N] Disparando webhook en n8n: ${n8nWebhookUrl} (${channel} - ${options.type || "MY_BUSINESS"}: ${sanitizedUrl})`);

  const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const callbackUrl = `${appUrl}/api/webhook/callback`;

  const payload = {
    reportId: options.reportId || "",
    type: options.type || "MY_BUSINESS",
    channel,
    redSocial: channel,
    url: sanitizedUrl,
    link: sanitizedUrl,
    businessId: options.businessId || "",
    entityId: options.businessId || "",
    businessName: options.businessName || "",
    competitorName: options.businessName || "",
    callbackUrl,
    platform: channel.toLowerCase(),
    maxPosts: options.maxPosts || 5,
  };

  try {
    const res = await fetch(n8nWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      if (data && (data.scraped_posts || data.author_name || data.description)) {
        return {
          platform: channel.toLowerCase(),
          author_name: data.author_name || username || `Perfil ${channel}`,
          user_handle: `@${username || "perfil"}`,
          profile_url: sanitizedUrl,
          avatar_url: data.avatar_url || "",
          followers_count: data.followers_count || "N/A",
          following_count: data.following_count || "N/A",
          posts_count: data.posts_count || (data.scraped_posts ? data.scraped_posts.length : 0),
          description: data.description || "",
          scraped_posts: data.scraped_posts || [],
          scraped_at: new Date().toISOString(),
          source: "N8N_WEBHOOK",
        };
      }
    } else {
      const errText = await res.text().catch(() => "");
      console.error(`❌ [N8N] Webhook respondió con estado HTTP ${res.status}: ${errText}`);
    }
  } catch (err: any) {
    console.warn(`⚠️ [N8N] Advertencia en webhook n8n (${channel}): ${err.message}`);
  }

  return buildFallbackProfile(sanitizedUrl, channel, username, "Extracción vía Apify/n8n activada");
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

export async function unifiedScrapeChannel(options: ScrapeOptions): Promise<ScrapedProfileResult> {
  const channelUpper = (options.channel || "").toUpperCase();

  // Para redes sociales (Facebook, Instagram, TikTok), invocar primariamente OBFarmer (Pool de Teléfonos ADB)
  if (["FACEBOOK", "INSTAGRAM", "TIKTOK", "FB", "IG", "TT"].includes(channelUpper)) {
    try {
      console.log(`🚀 [SCRAPER] Disparando extracción primaria vía OBFarmer (ADB Phones) para ${options.channel}: ${options.url}`);
      return await scrapeWithObScrap(options);
    } catch (obErr: any) {
      console.warn(`⚠️ [OB-SCRAP] Falló OBFarmer (${obErr.message}). Probando respaldo vía n8n webhook...`);
    }
  }

  // Para sitios web o como respaldo de redes sociales, usar n8n webhook / Apify
  console.log(`🚀 [SCRAPER] Disparando extracción vía n8n webhook / Apify para ${options.channel} (${options.type || "MY_BUSINESS"}): ${options.url}`);
  return await scrapeWithN8nWebhook(options);
}
