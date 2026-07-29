"use server";

import { revalidatePath } from "next/cache";
import { 
  createContent, 
  updateContent, 
  deleteContent, 
  updateContentStatus,
  requestContentIdeas,
  requestCopyGeneration,
  requestMediaGeneration
} from "@/modules/content-planning";
import { ContentFormValues } from "@/lib/schemas/content";

export async function createContentAction(data: ContentFormValues & { businessId: string; channels?: string[] }) {
  try {
    const channels = data.channels && data.channels.length > 0 ? data.channels : [data.channel || "INSTAGRAM"];
    const firstChannel = channels[0];

    const content = await createContent({
      ...data,
      channel: firstChannel as any,
      campaignId: data.campaignId || undefined,
      productId: data.productId || undefined,
      socialAccountId: data.socialAccountId || undefined,
      scheduledAt: data.scheduledAt || undefined,
      mediaUrl: data.mediaUrl || undefined,
    });

    // Duplicar para los canales restantes si hay múltiples seleccionados
    if (channels.length > 1) {
      const otherChannels = channels.slice(1);
      await prisma.$transaction(
        otherChannels.map((ch: string) => {
          return prisma.content.create({
            data: {
              campaignId: content.campaignId,
              productId: content.productId,
              socialAccountId: content.socialAccountId,
              title: content.title,
              type: content.type,
              format: content.format,
              channel: ch as any,
              body: content.body,
              caption: content.caption,
              promptUsed: content.promptUsed,
              scheduledAt: content.scheduledAt,
              status: content.status,
              metadata: content.metadata || undefined,
            }
          });
        })
      );
    }

    revalidatePath(`/business/${data.businessId}`);
    revalidatePath("/calendar");
    return { success: true, message: "Contenido creado correctamente", content };
  } catch (error: any) {
    console.error("Error creating content:", error);
    return { success: false, error: error.message || "Error al crear el contenido" };
  }
}

export async function updateContentAction(id: string, data: ContentFormValues, businessId: string) {
  try {
    const content = await updateContent(id, {
      ...data,
      campaignId: data.campaignId || undefined,
      productId: data.productId || undefined,
      socialAccountId: data.socialAccountId || undefined,
      scheduledAt: data.scheduledAt || undefined,
      mediaUrl: data.mediaUrl || undefined,
    });
    revalidatePath(`/business/${businessId}`);
    return { success: true, message: "Contenido actualizado correctamente", content };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al actualizar el contenido" };
  }
}

export async function deleteContentAction(id: string, businessId: string) {
  try {
    await deleteContent(id);
    revalidatePath(`/business/${businessId}`);
    return { success: true, message: "Contenido eliminado correctamente" };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al eliminar el contenido" };
  }
}

export async function updateContentStatusAction(id: string, status: any, businessId: string) {
  try {
    await updateContentStatus(id, status);
    revalidatePath(`/business/${businessId}`);
    return { success: true, message: "Estado actualizado correctamente" };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al actualizar el estado" };
  }
}

export async function generateContentIdeasAction(
  businessId: string,
  strategyId: string | null,
  parameters: {
    quantity: number
    contentTypes: string[]
    channels: string[]
    tone?: string
  }
) {
  try {
    await requestContentIdeas(businessId, strategyId, parameters);
    revalidatePath(`/business/${businessId}`);
    return { success: true, message: "Generación de ideas iniciada" };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al solicitar ideas" };
  }
}

export async function generateCopyAction(
  contentId: string,
  businessId: string,
  parameters: {
    type: string
    tone: string
    length?: string
    keywords?: string[]
  }
) {
  try {
    await requestCopyGeneration(contentId, parameters);
    revalidatePath(`/business/${businessId}`);
    return { success: true, message: "Generación de copy iniciada" };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al solicitar copy" };
  }
}

export async function generateMediaAction(
  contentId: string,
  businessId: string,
  parameters: {
    type: 'image' | 'video'
    style?: string
    dimensions?: { width: number; height: number }
    prompt?: string
  }
) {
  try {
    await requestMediaGeneration(contentId, parameters);
    revalidatePath(`/business/${businessId}`);
    return { success: true, message: "Generación de media iniciada" };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al solicitar media" };
  }
}

// ============================================
// CALENDARIO EDITORIAL E IA
// ============================================

import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { addDays, format } from "date-fns";
import { prisma } from "@/lib/prisma";

const openrouter = createOpenAI({
  apiKey: process.env.OPEN_ROUTER_KEY?.replace(/"/g, "").trim(),
  baseURL: "https://openrouter.ai/api/v1",
});

const calendarPostSchema = z.object({
  title: z.string(),
  type: z.enum(["POST", "STORY", "REEL", "VIDEO", "CAROUSEL"]),
  channel: z.enum(["FACEBOOK", "INSTAGRAM", "TIKTOK", "LINKEDIN", "YOUTUBE"]),
  format: z.enum(["IMAGE", "VIDEO"]),
  body: z.string().describe("Storyboard visual, script o guion del contenido"),
  caption: z.string().describe("Copy o descripción final para la red social"),
  promptUsed: z.string().describe("AI image generator prompt en INGLÉS detallado para la imagen de diseño o la portada/miniatura del video (por ejemplo, Midjourney o DALL-E). NUNCA uses 'N/A', 'None' ni vacío."),
  suggestedOffsetDays: z.number().describe("Días transcurridos desde el inicio de la campaña")
});

const calendarPlanSchema = z.object({
  posts: z.array(calendarPostSchema)
});

export async function updateCalendarContentAction(
  id: string,
  data: {
    title?: string;
    type?: any;
    format?: any;
    channel?: any;
    channels?: string[];
    body?: string;
    caption?: string;
    promptUsed?: string;
    scheduledAt?: Date | null;
    campaignId?: string | null;
    mediaUrl?: string | null;
  },
  businessId: string
) {
  try {
    const channels = data.channels || (data.channel ? [data.channel] : ["INSTAGRAM"]);
    const firstChannel = channels[0];

    // Obtener la publicación original antes de actualizar para buscar publicaciones hermanas del mismo día y campaña
    const original = await prisma.content.findUnique({
      where: { id }
    });

    // 1. Actualizar la publicación original
    const content = await prisma.content.update({
      where: { id },
      data: {
        title: data.title,
        type: data.type,
        format: data.format,
        channel: firstChannel as any,
        body: data.body,
        caption: data.caption,
        promptUsed: data.promptUsed,
        scheduledAt: data.scheduledAt === null ? null : (data.scheduledAt || undefined),
        campaignId: data.campaignId === null ? null : (data.campaignId || undefined),
        mediaUrl: data.mediaUrl === null ? null : (data.mediaUrl || undefined),
      }
    });

    // 2. Si tiene campaña y fecha, sincronizar los cambios con los posts hermanos del mismo día y campaña
    if (original && original.campaignId && original.scheduledAt && data.scheduledAt !== null) {
      const origDate = new Date(original.scheduledAt);
      const startOfDay = new Date(origDate.getFullYear(), origDate.getMonth(), origDate.getDate(), 0, 0, 0);
      const endOfDay = new Date(origDate.getFullYear(), origDate.getMonth(), origDate.getDate(), 23, 59, 59);

      // Buscar posts hermanos
      const siblingPosts = await prisma.content.findMany({
        where: {
          campaignId: original.campaignId,
          scheduledAt: {
            gte: startOfDay,
            lte: endOfDay
          },
          id: { not: id } // Excluir la que acabamos de actualizar
        }
      });

      // Actualizar los posts hermanos en lote
      if (siblingPosts.length > 0) {
        await prisma.content.updateMany({
          where: {
            id: { in: siblingPosts.map(p => p.id) }
          },
          data: {
            title: data.title !== undefined ? data.title : undefined,
            type: data.type !== undefined ? data.type : undefined,
            format: data.format !== undefined ? data.format : undefined,
            body: data.body !== undefined ? data.body : undefined,
            caption: data.caption !== undefined ? data.caption : undefined,
            promptUsed: data.promptUsed !== undefined ? data.promptUsed : undefined,
            scheduledAt: data.scheduledAt !== undefined ? (data.scheduledAt === null ? null : data.scheduledAt) : undefined,
          }
        });
      }
    }

    // 3. Para canales adicionales explícitos en data.channels, duplicar el contenido
    if (channels.length > 1 && original) {
      const otherChannels = channels.slice(1);
      await prisma.$transaction(
        otherChannels.map((ch: string) => {
          return prisma.content.create({
            data: {
              campaignId: original.campaignId,
              productId: original.productId,
              socialAccountId: original.socialAccountId,
              title: data.title || original.title,
              type: (data.type || original.type) as any,
              format: (data.format || original.format) as any,
              channel: ch as any,
              body: data.body ?? original.body,
              caption: data.caption ?? original.caption,
              promptUsed: data.promptUsed ?? original.promptUsed,
              scheduledAt: data.scheduledAt === null ? null : (data.scheduledAt || original.scheduledAt),
              status: original.status,
              metadata: original.metadata || undefined,
            }
          });
        })
      );
    }

    revalidatePath(`/business/${businessId}`);
    revalidatePath("/calendar");
    return { success: true, message: "Publicaciones actualizadas y sincronizadas correctamente", content };
  } catch (error: any) {
    console.error("Error al actualizar contenido:", error);
    return { success: false, error: error.message || "Error al actualizar la publicación" };
  }
}

export async function generateCampaignCalendarAction(
  campaignId: string,
  options: {
    quantity: number;
    businessId: string;
    startDate?: string;
    endDate?: string;
  }
) {
  try {
    if (!campaignId) {
      return { success: false, error: "ID de campaña no proporcionado" };
    }

    // 1. Obtener la campaña
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        business: true
      }
    });

    if (!campaign) {
      return { success: false, error: "Campaña no encontrada" };
    }

    // 2. Obtener informes propios del negocio
    const businessReports = await prisma.analysisReport.findMany({
      where: {
        entityId: options.businessId,
        type: "MY_BUSINESS",
        status: "COMPLETED",
      },
      select: {
        channel: true,
        data: true,
      },
      take: 3
    });

    const reportsSummary = businessReports.map((r: { channel: string; data: any }) => {
      const dataObj = typeof r.data === "string" ? JSON.parse(r.data) : r.data;
      return {
        canal: r.channel,
        resumen: dataObj?.brand_summary || dataObj?.executiveSummary || "Informe de presencia"
      };
    });

    // Determinar los canales activos de la campaña
    const campaignChannels = campaign.channels as Array<{ platform: string; isActive: boolean; budget?: number }>;
    const activeChannels = campaignChannels
      ? campaignChannels.filter((c: any) => c.isActive).map((c: any) => c.platform)
      : [];

    const allowedChannelsStr = activeChannels.length > 0 
      ? activeChannels.join(", ") 
      : "FACEBOOK, INSTAGRAM, TIKTOK, LINKEDIN, YOUTUBE";

    // Asignación proporcional exacta de formatos siguiendo la Regla 60-25-15
    let numVideos = 0;
    let numCarousels = 0;
    let numImages = 0;

    for (let i = 0; i < options.quantity; i++) {
      const total = numVideos + numCarousels + numImages;
      if (total === 0) {
        numVideos++; // El primero es video
      } else {
        const videoRatio = numVideos / total;
        const carouselRatio = numCarousels / total;
        if (videoRatio < 0.60) {
          numVideos++;
        } else if (carouselRatio < 0.25) {
          numCarousels++;
        } else {
          numImages++;
        }
      }
    }

    const industry = campaign.business.industry || "No especificada";
    const objective = campaign.objective;
    const hasWebsite = !!campaign.business.website && campaign.business.website.trim() !== "";

    // Fetch niche trends dynamically
    let nicheTrends = "";
    try {
      const { object: trendsObj } = await generateObject({
        model: openrouter("google/gemini-2.5-flash"),
        schema: z.object({
          trends: z.array(z.string()),
          hashtags: z.array(z.string())
        }),
        system: "Eres un analista de tendencias digitales y de marketing digital. Proporciona 3 tendencias clave del nicho y 3 hashtags populares en auge.",
        prompt: `Genera tendencias clave de marketing digital y hashtags para el rubro/nicho: "${industry}"`,
        temperature: 0.7
      });
      
      nicheTrends = `TENDENCIAS DE MERCADO ACTUALES PARA ${industry.toUpperCase()}:\n` + 
        trendsObj.trends.map(t => `- ${t}`).join("\n") + 
        `\n\nHASHTAGS POPULARES DEL NICHO:\n` + trendsObj.hashtags.join(", ") + "\n\n";
    } catch (err) {
      console.error("Error fetching dynamic trends:", err);
    }

    let customizationGuidelines = nicheTrends;
    // Reglas de Rubro (Industry)
    if (industry.toLowerCase().includes("restaurante") || industry.toLowerCase().includes("comida") || industry.toLowerCase().includes("gastronomia")) {
      customizationGuidelines += `- Como el rubro es de alimentación/restaurantes, enfócate en contenidos altamente visuales, apetitosos, que muestren platos reales, ingredientes frescos y promociones o ganchos de antojo inmediatos.\n`;
    } else if (industry.toLowerCase().includes("clinica") || industry.toLowerCase().includes("salud") || industry.toLowerCase().includes("medicina") || industry.toLowerCase().includes("consultorio")) {
      customizationGuidelines += `- Como el rubro es de salud/clínicas, enfócate en la generación de confianza y credibilidad. Ofrece tips de prevención, explicaciones médicas claras de forma empática y muestra autoridad y profesionalismo.\n`;
    } else if (industry.toLowerCase().includes("retail") || industry.toLowerCase().includes("tienda") || industry.toLowerCase().includes("commerce") || industry.toLowerCase().includes("ropa")) {
      customizationGuidelines += `- Como el rubro es de retail/comercio, enfócate en la presentación clara de productos, sus beneficios, ofertas directas y demostraciones de uso del producto.\n`;
    } else {
      customizationGuidelines += `- Adapta el contenido al rubro de "${industry}", usando ejemplos y analogías relevantes para su sector.\n`;
    }

    // Reglas de Objetivo (Objective)
    if (objective === "SALES" || objective === "LEADS") {
      customizationGuidelines += `- El objetivo principal es Ventas/Conversión. Genera ganchos de venta directa más claros y llamados a la acción (CTAs) directos al grano (enfoque en concretar compras o enviar mensajes).\n`;
    } else if (objective === "ENGAGEMENT") {
      customizationGuidelines += `- El objetivo principal es Crecimiento y Comunidad. Diseña ganchos participativos, preguntas abiertas, o temáticas humorísticas/tendencias del sector para fomentar comentarios y compartidos.\n`;
    } else if (objective === "AWARENESS") {
      customizationGuidelines += `- El objetivo principal es Posicionamiento de Marca (Awareness). Genera contenido educativo de alto valor, infografías y tips prácticos que posicionen al negocio como experto.\n`;
    }

    // Regla de Sitio Web (Has Website)
    if (!hasWebsite) {
      customizationGuidelines += `- IMPORTANTE: El negocio NO cuenta con un sitio web. Omite por completo cualquier táctica, KPI o sugerencia de tráfico web, y redirige todos los llamados a la acción (CTAs) de forma manual y directa hacia WhatsApp o mensajes directos (DMs).\n`;
    } else {
      customizationGuidelines += `- El negocio tiene sitio web (${campaign.business.website}). Puedes incluirlo de forma natural en algunos llamados a la acción si es relevante.\n`;
    }

    // 3. Llamar a Gemini para planificar las publicaciones
    const startDateStr = format(new Date(campaign.startDate), "yyyy-MM-dd");
    const durationDays = campaign.endDate 
      ? Math.max(1, Math.round((new Date(campaign.endDate).getTime() - new Date(campaign.startDate).getTime()) / (1000 * 60 * 60 * 24)))
      : 30;

    const systemPrompt = `Eres un estratega de marketing y creador de contenidos experto.
Tu tarea es generar un calendario editorial estructurado de exactamente ${options.quantity} publicaciones en formato JSON para una campaña de marketing específica.
Cada publicación debe ser relevante para los objetivos de la campaña, y contar con canales y formatos definidos.`;

    const userPrompt = `
Genera un calendario editorial de exactamente ${options.quantity} publicaciones para la siguiente campaña de marketing:

DATOS DEL NEGOCIO:
- Nombre: ${campaign.business.name}
- Descripción: ${campaign.business.description || "No especificada"}
- Rubro/Industria: ${industry}

INFORMES DE RENDIMIENTO DE NUESTRO NEGOCIO:
${JSON.stringify(reportsSummary, null, 2)}

DATOS DE LA CAMPAÑA:
- Nombre de la Campaña: ${campaign.name}
- Descripción: ${campaign.description || "No especificada"}
- Objetivo de la campaña: ${campaign.objective}
- Fecha de inicio: ${startDateStr}
- Duración estimada de la campaña: ${durationDays} días
- Canales autorizados para esta campaña: ${allowedChannelsStr}

REGLAS ADICIONALES DE PERSONALIZACIÓN Y NEGOCIO:
${customizationGuidelines}

REGLAS DE FORMATOS Y DISTRIBUCIÓN (Regla 60-25-15):
Para mantener el estándar técnico de calidad en esta campaña de ${options.quantity} publicaciones, debes generar EXACTAMENTE:
- ${numVideos} publicación(es) de tipo VIDEO/REEL (formato VIDEO) para alto alcance orgánico.
- ${numCarousels} publicación(es) de tipo CAROUSEL (formato IMAGE) para retención y educación.
- ${numImages} publicación(es) de tipo POST (formato IMAGE) para ofertas o avisos directos.

INSTRUCCIONES DE PLANIFICACIÓN:
1. Genera exactamente las ${options.quantity} publicaciones especificadas en la regla de formatos.
2. Distribuye las publicaciones a lo largo de la campaña usando "suggestedOffsetDays". El offset debe ser un número entero entre 0 y ${durationDays}.
3. Los canales sugeridos deben ser uno de los canales autorizados para esta campaña: ${allowedChannelsStr}.
4. El tipo de contenido debe corresponder exactamente al desglose de formatos (POST, REEL, VIDEO o CAROUSEL).
5. El formato debe ser: IMAGE o VIDEO.
6. El "body" debe contener el storyboard visual de lo que se mostrará o el guion de video detallado.
7. El "caption" debe contener el texto del post final, incluyendo un llamado a la acción y un tono alinedo con la marca.
8. El "promptUsed" debe ser un prompt altamente creativo y detallado escrito en INGLÉS optimizado para generadores de imágenes por IA (Midjourney, DALL-E, etc.). Si la publicación es un video, describe la portada/miniatura en el prompt.
IMPORTANTE: El prompt debe ser DESCRIPITIVO y VISUAL, nunca solo números o etiquetas.
Si el tipo de publicación (type) es CAROUSEL, el "promptUsed" DEBE contener múltiples prompts detallados en inglés (uno para cada slide o diapositiva del carrusel, entre 3 y 8 slides), numerados exactamente de la siguiente forma:
Slide 1: A delicious chocolate cake with ganache dripping down the sides, placed on a rustic wooden table with soft natural lighting, cinematic food photography style, 8k resolution
Slide 2: Close-up of a fork cutting into the moist chocolate cake layers revealing the rich texture, warm golden lighting, depth of field
Slide 3: The cake being served on a white ceramic plate with a dusting of cocoa powder and fresh mint leaves, elegant presentation
Cada slide debe tener un prompt COMPLETO y DESCRIPITIVO en inglés, no solo números o etiquetas.
Bajo ninguna circunstancia uses "N/A", "None", vacío ni "no aplica".

Por favor, genera la lista de publicaciones de forma creativa e inteligente.`;

    const { object } = await generateObject({
      model: openrouter("google/gemini-2.5-flash"),
      schema: calendarPlanSchema,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.75,
      maxOutputTokens: 8192
    });

    const posts = object.posts;

    // 4. Crear las publicaciones en la base de datos de Prisma
    const createdContents = await prisma.$transaction(
      posts.map((post: any) => {
        const scheduledDate = addDays(new Date(campaign.startDate), post.suggestedOffsetDays);
        // Ajustar la hora a las 10:00 AM para que sea una hora de publicación por defecto coherente
        scheduledDate.setHours(10, 0, 0, 0);

        return prisma.content.create({
          data: {
            campaignId: campaign.id,
            title: post.title,
            type: post.type as any,
            format: post.format as any,
            channel: post.channel as any,
            body: post.body,
            caption: post.caption,
            promptUsed: post.promptUsed,
            scheduledAt: scheduledDate,
            status: "DRAFT",
            metadata: { source: "ai_generated" },
          }
        });
      })
    );

    revalidatePath(`/business/${options.businessId}`);
    revalidatePath("/calendar");

    return {
      success: true,
      message: `¡Se han generado y planificado ${createdContents.length} publicaciones con éxito!`,
      contentsCount: createdContents.length
    };

  } catch (error: any) {
    console.error("Error al planificar calendario con IA:", error);
    return {
      success: false,
      error: error.message || "Error al planificar el calendario con IA"
    };
  }
}

export async function generateSingleContentIdeaAction(
  campaignId: string,
  businessId: string,
  targetChannel?: string,
  targetType?: string,
  targetFormat?: string
) {
  try {
    if (!campaignId) {
      return { success: false, error: "ID de campaña no proporcionado" };
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { business: true }
    });

    if (!campaign) {
      return { success: false, error: "Campaña no encontrada" };
    }

    const systemPrompt = `Eres un Director Editorial y Estratega de Redes Sociales de élite.
Tu tarea es generar una idea de publicación completa, persuasiva e hiper-detallada en formato JSON para la campaña.

REGLAS DE CALIDAD:
1. CANALES PERMITIDOS: El canal sugerido (channel) DEBE ser exclusivamente uno de: 'FACEBOOK', 'INSTAGRAM' o 'TIKTOK'.
2. COPY COMPLETO Y LISTO PARA PUBLICAR ('caption'):
   - El copy debe estar 100% redactado en español.
   - Debe iniciar con un GANCHO PERSUASIVO en la primera línea.
   - Incluir viñetas explicativas con emojis contextuales.
   - Incluir un Llamado a la Acción (CTA) directo (ej. escribir por WhatsApp).
   - Incluir de 5 a 8 hashtags de tendencia relevantes.
3. GUION O ESTRUCTURA TÉCNICA ('body'):
   - Para REEL o VIDEO: Escribe el guion detallado (0-3s Hook, 3-15s Demostración, 15-30s Cierre) + sugerencia de estilo de audio.
   - Para CAROUSEL: Detalla el concepto visual diapositiva por diapositiva (Slide 1 a 5).
   - Para POST: Describe la intención de marketing y composición gráfica recomendada.
4. PROMPT VISUAL EN INGLÉS ('promptUsed'):
   - Debe ser un prompt en INGLÉS detallado (mínimo 25 palabras) optimizado para Midjourney v6 o DALL-E 3.
   - Especifica sujeto principal, estilo fotográfico realista (ej: 8k resolution, cinematic lighting, commercial product design, vibrant colors).
5. REGLA ESTRICTA DE NO INVENTAR PRODUCTOS: Promociona única y exclusivamente los productos reales descritos.`;

    const typeClause = targetType 
      ? `El tipo de contenido (type) DEBE ser estrictamente: ${targetType}.` 
      : "El tipo de contenido debe ser uno de: POST, STORY, REEL, VIDEO o CAROUSEL.";

    const formatClause = targetFormat 
      ? `El formato (format) DEBE ser estrictamente: ${targetFormat}.` 
      : "El formato debe ser: IMAGE o VIDEO.";

    const carouselInstructions = (targetType === "CAROUSEL") 
      ? `Dado que el tipo de contenido es CAROUSEL (carrusel), el campo "promptUsed" DEBE contener múltiples prompts detallados en inglés (uno para cada slide o diapositiva del carrusel, entre 3 y 8 slides), numerados exactamente de la siguiente forma:
Slide 1: [Prompt en inglés para el primer slide]
Slide 2: [Prompt en inglés para el segundo slide]
Slide 3: [Prompt en inglés para el tercer slide]
...
Asegúrate de describir visualmente cada diapositiva para mantener la coherencia estética del carrusel.`
      : `El "promptUsed" debe ser un prompt altamente creativo y detallado escrito en INGLÉS optimizado para generadores de imágenes por IA (Midjourney, DALL-E, etc.). Si el tipo de contenido generado resulta ser CAROUSEL, el campo "promptUsed" DEBE contener múltiples prompts detallados en inglés numerados:
Slide 1: [Prompt en inglés para el primer slide]
Slide 2: [Prompt en inglés para el segundo slide]
...`;

    const userPrompt = `
Genera una idea de publicación innovadora para la siguiente campaña de marketing:

DATOS DEL NEGOCIO:
- Nombre: ${campaign.business.name}
- Descripción: ${campaign.business.description || "No especificada"}

DATOS DE LA CAMPAÑA:
- Nombre de la Campaña: ${campaign.name}
- Descripción: ${campaign.description || "No especificada"}
- Objetivo de la campaña: ${campaign.objective}
${targetChannel ? `- Canal preferido de destino: ${targetChannel}` : ""}

INSTRUCCIONES DE PLANIFICACIÓN:
1. El canal sugerido (channel) debe ser estrictamente uno de los tres permitidos: ${targetChannel || "FACEBOOK, INSTAGRAM o TIKTOK"}.
2. ${typeClause}
3. ${formatClause}
4. El "body" debe contener el storyboard visual de lo que se mostrará o el guion de video detallado.
5. ${carouselInstructions}
6. NUNCA uses "N/A", "None", vacío ni "no aplica".`;

    const { object } = await generateObject({
      model: openrouter("google/gemini-2.5-flash"),
      schema: z.object({
        title: z.string(),
        type: z.enum(["POST", "STORY", "REEL", "VIDEO", "CAROUSEL"]),
        channel: z.enum(["FACEBOOK", "INSTAGRAM", "TIKTOK"]),
        format: z.enum(["IMAGE", "VIDEO"]),
        body: z.string().describe("Guion estructurado paso a paso del contenido, desglose por slides o storyboard visual"),
        caption: z.string().describe("Copy completo e íntegro para redes sociales en español con gancho inicial, viñetas con emojis, CTA claro y hashtags"),
        promptUsed: z.string().describe("AI image generator prompt en INGLÉS hiper-detallado de al menos 25 palabras para Midjourney o Flux")
      }),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.8,
      maxOutputTokens: 2500,
    });

    return {
      success: true,
      idea: object
    };
  } catch (error: any) {
    console.error("Error al generar idea de contenido individual con IA:", error);
    return {
      success: false,
      error: error.message || "Error al generar la idea con IA"
    };
  }
}

export async function previewCampaignCalendarAction(
  campaignId: string,
  options: {
    quantity: number;
    businessId: string;
    startDate?: string;
    endDate?: string;
  }
) {
  try {
    if (!campaignId) {
      return { success: false, error: "ID de campaña no proporcionado" };
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { business: true }
    });

    if (!campaign) {
      return { success: false, error: "Campaña no encontrada" };
    }

    const businessReports = await prisma.analysisReport.findMany({
      where: {
        entityId: options.businessId,
        type: "MY_BUSINESS",
        status: "COMPLETED",
      },
      select: {
        channel: true,
        data: true,
      },
      take: 3
    });

    const reportsSummary = businessReports.map((r: { channel: string; data: any }) => {
      const dataObj = typeof r.data === "string" ? JSON.parse(r.data) : r.data;
      return {
        canal: r.channel,
        resumen: dataObj?.brand_summary || dataObj?.executiveSummary || "Informe de presencia"
      };
    });

    const socialAccounts = await prisma.socialAccount.findMany({
      where: { businessId: options.businessId, isActive: true },
      select: { channel: true }
    });
    const registeredChannels = socialAccounts.map((sa: { channel: string }) => sa.channel.toUpperCase());

    const campaignChannels = campaign.channels as Array<{ platform: string; isActive: boolean; budget?: number }>;
    const campaignActiveChannels = campaignChannels
      ? campaignChannels.filter((c: any) => c.isActive).map((c: any) => c.platform.toUpperCase())
      : [];

    let activeChannels = campaignActiveChannels;
    if (registeredChannels.length > 0) {
      activeChannels = campaignActiveChannels.filter((ch: string) => registeredChannels.includes(ch));
      if (activeChannels.length === 0) {
        activeChannels = registeredChannels;
      }
    }

    activeChannels = activeChannels.filter((ch: string) => ["FACEBOOK", "INSTAGRAM", "TIKTOK", "LINKEDIN", "YOUTUBE"].includes(ch));

    if (activeChannels.length === 0) {
      activeChannels = ["INSTAGRAM", "FACEBOOK", "TIKTOK"];
    }

    const allowedChannelsStr = activeChannels.join(", ");

    const startDateStr = options.startDate || format(new Date(campaign.startDate), "yyyy-MM-dd");
    const endDateStr = options.endDate || (campaign.endDate ? format(new Date(campaign.endDate), "yyyy-MM-dd") : null);

    const durationDays = endDateStr 
      ? Math.max(1, Math.round((new Date(endDateStr).getTime() - new Date(startDateStr).getTime()) / (1000 * 60 * 60 * 24)))
      : 30;

    const systemPrompt = `Eres un estratega de marketing y creador de contenidos experto.
Tu tarea es generar un calendario editorial estructurado de exactamente ${options.quantity} publicaciones en formato JSON para una campaña de marketing específica.
Cada publicación debe ser accionable, relevante para los objetivos de la campaña, y contar con canales y formatos definidos.
REGLA ESTRICTA DE NO INVENTAR/ALUCINAR PRODUCTOS: Bajo ningún concepto inventes, agregues, combines, asumas o sugieras productos, platos, servicios o variaciones de los mismos que no estén expresamente citados en la descripción del negocio o la campaña. Promociona única y exclusivamente los productos descritos (por ejemplo, si el negocio menciona 'panqueques de camote' o 'panqueques de banana', bajo ninguna circunstancia inventes 'panqueque de chuño').`;

    const userPrompt = `
Genera un calendario editorial de exactamente ${options.quantity} publicaciones para la siguiente campaña de marketing:

DATOS DEL NEGOCIO:
- Nombre: ${campaign.business.name}
- Descripción: ${campaign.business.description || "No especificada"}

INFORMES DE RENDIMIENTO DE NUESTRO NEGOCIO:
${JSON.stringify(reportsSummary, null, 2)}

DATOS DE LA CAMPAÑA:
- Nombre de la Campaña: ${campaign.name}
- Descripción: ${campaign.description || "No especificada"}
- Objetivo de la campaña: ${campaign.objective}
- Fecha de inicio: ${startDateStr}
- Duración estimada de la campaña: ${durationDays} días
- Canales autorizados para esta campaña: ${allowedChannelsStr}

INSTRUCCIONES DE PLANIFICACIÓN:
1. Genera exactamente ${options.quantity} publicaciones.
2. Distribuye las publicaciones a lo largo de la campaña usando "suggestedOffsetDays". El offset debe ser un número entero entre 0 y ${durationDays}.
3. Los canales sugeridos deben ser uno de los canales autorizados para esta campaña: ${allowedChannelsStr}.
4. El tipo de contenido debe ser uno de: POST, STORY, REEL, VIDEO o CAROUSEL.
5. El formato debe ser: IMAGE o VIDEO.
6. El "body" debe contener el storyboard visual de lo que se mostrará o el guion de video detallado.
7. El "caption" debe contener el texto del post final, incluyendo un llamado a la acción y un tono alinedo con la marca.
8. El "promptUsed" debe ser un prompt altamente creativo y detallado escrito en INGLÉS optimizado para generadores de imágenes por IA (Midjourney, DALL-E, etc.). Si la publicación es un video, describe la portada/miniatura en el prompt.
IMPORTANTE: El prompt debe ser DESCRIPITIVO y VISUAL, nunca solo números o etiquetas.
Si el tipo de publicación (type) es CAROUSEL, el "promptUsed" DEBE contener múltiples prompts detallados en inglés (uno para cada slide o diapositiva del carrusel, entre 3 y 8 slides), numerados exactamente de la siguiente forma:
Slide 1: A delicious chocolate cake with ganache dripping down the sides, placed on a rustic wooden table with soft natural lighting, cinematic food photography style, 8k resolution
Slide 2: Close-up of a fork cutting into the moist chocolate cake layers revealing the rich texture, warm golden lighting, depth of field
Slide 3: The cake being served on a white ceramic plate with a dusting of cocoa powder and fresh mint leaves, elegant presentation
Cada slide debe tener un prompt COMPLETO y DESCRIPITIVO en inglés, no solo números o etiquetas.
Bajo ninguna circunstancia uses "N/A", "None", vacío ni "no aplica".

Por favor, genera la lista de publicaciones de forma creativa e inteligente.`;

    const { object } = await generateObject({
      model: openrouter("google/gemini-2.5-flash"),
      schema: calendarPlanSchema,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.75,
      maxOutputTokens: 8192
    });

    const posts = object.posts.map((post: any) => {
      const scheduledDate = addDays(new Date(startDateStr), post.suggestedOffsetDays);
      scheduledDate.setHours(10, 0, 0, 0);
      return {
        title: post.title,
        type: post.type,
        format: post.format,
        channel: post.channel,
        body: post.body,
        caption: post.caption,
        promptUsed: post.promptUsed,
        scheduledAt: scheduledDate.toISOString()
      };
    });

    return {
      success: true,
      posts
    };
  } catch (error: any) {
    console.error("Error al previsualizar planificador:", error);
    return { success: false, error: error.message || "Error al previsualizar planificación" };
  }
}

export async function savePlannedCampaignCalendarAction(
  businessId: string,
  campaignId: string,
  posts: Array<{
    title: string;
    type: string;
    format: string;
    channel: string;
    body: string;
    caption: string;
    promptUsed: string;
    scheduledAt: string;
  }>
) {
  try {
    const createdContents = await prisma.$transaction(
      posts.map((post: any) => {
        return prisma.content.create({
          data: {
            campaignId: campaignId || null,
            title: post.title,
            type: post.type as any,
            format: post.format as any,
            channel: post.channel as any,
            body: post.body,
            caption: post.caption,
            promptUsed: post.promptUsed,
            scheduledAt: post.scheduledAt ? new Date(post.scheduledAt) : null,
            status: "DRAFT",
            metadata: { source: "ai_generated_preview" },
          }
        });
      })
    );

    revalidatePath(`/business/${businessId}`);
    revalidatePath("/calendar");

    return {
      success: true,
      message: `¡Se han guardado y planificado ${createdContents.length} publicaciones con éxito!`,
      contentsCount: createdContents.length
    };
  } catch (error: any) {
    console.error("Error al guardar planificación:", error);
    return { success: false, error: error.message || "Error al guardar el plan de publicaciones" };
  }
}

export async function publishContentAction(contentId: string, businessId: string) {
  try {
    const content = await prisma.content.findUnique({
      where: { id: contentId }
    });
    if (!content) {
      return { success: false, error: "Publicación no encontrada" };
    }

    const { listSocialAccounts, createSocialAccount, publishContent } = await import("@/modules/publishing");

    // Buscar cuenta social activa
    const accounts = await listSocialAccounts(businessId, { channel: content.channel || undefined });
    let account = accounts[0];

    if (!account) {
      account = await createSocialAccount({
        businessId,
        channel: content.channel || "INSTAGRAM",
        accountId: "mock_" + Date.now(),
        accountName: "Mi Cuenta de " + (content.channel || "Instagram"),
        isActive: true
      } as any);
    }

    const res = await publishContent(contentId, account.id);

    // Simulación del callback del autoposteador
    setTimeout(async () => {
      try {
        await prisma.content.update({
          where: { id: contentId },
          data: { status: "PUBLISHED" }
        });
      } catch (e) {
        console.error(e);
      }
    }, 2000);

    revalidatePath(`/business/${businessId}`);
    revalidatePath("/calendar");
    return { success: true, message: "¡Publicación enviada al autoposteador de Maycol!", jobId: res.jobId };
  } catch (error: any) {
    console.error("Error al autopostear:", error);
    return { success: false, error: error.message || "Error al autopostear" };
  }
}
