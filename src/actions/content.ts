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
        otherChannels.map(ch => {
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
  },
  businessId: string
) {
  try {
    const channels = data.channels || (data.channel ? [data.channel] : ["INSTAGRAM"]);
    const firstChannel = channels[0];

    // 1. Actualizar la publicación original con el primer canal
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
      }
    });

    // 2. Para canales adicionales, duplicar el contenido
    if (channels.length > 1) {
      const original = await prisma.content.findUnique({
        where: { id }
      });

      if (original) {
        const otherChannels = channels.slice(1);
        await prisma.$transaction(
          otherChannels.map(ch => {
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
    }

    revalidatePath(`/business/${businessId}`);
    revalidatePath("/calendar");
    return { success: true, message: "Publicaciones actualizadas correctamente", content };
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
      ? campaignChannels.filter(c => c.isActive).map(c => c.platform)
      : [];

    const allowedChannelsStr = activeChannels.length > 0 
      ? activeChannels.join(", ") 
      : "FACEBOOK, INSTAGRAM, TIKTOK, LINKEDIN, YOUTUBE";

    // 3. Llamar a Gemini para planificar las publicaciones
    const startDateStr = format(new Date(campaign.startDate), "yyyy-MM-dd");
    const durationDays = campaign.endDate 
      ? Math.max(1, Math.round((new Date(campaign.endDate).getTime() - new Date(campaign.startDate).getTime()) / (1000 * 60 * 60 * 24)))
      : 30;

    const systemPrompt = `Eres un estratega de marketing y creador de contenidos experto.
Tu tarea es generar un calendario editorial estructurado de exactamente ${options.quantity} publicaciones en formato JSON para una campaña de marketing específica.
Cada publicación debe ser accionable, relevante para los objetivos de la campaña, y contar con canales y formatos definidos.`;

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
2. Distribuye las publicaciones a lo largo de la campaña usando "suggestedOffsetDays". Por ejemplo, si son 5 posts en una campaña de 30 días, repártelos en offsets como: 2, 8, 14, 20, 26. El offset debe ser un número entero entre 0 y ${durationDays}.
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

    const posts = object.posts;

    // 4. Crear las publicaciones en la base de datos de Prisma
    const createdContents = await prisma.$transaction(
      posts.map(post => {
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

    const systemPrompt = `Eres un estratega de marketing y creador de contenidos experto.
Tu tarea es generar una única idea detallada de publicación en formato JSON para una campaña de marketing específica.
La publicación debe ser accionable, relevante para los objetivos de la campaña, y contar con un formato y canal definidos.`;

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
1. El canal sugerido (channel) debe ser: ${targetChannel || "Uno adecuado (INSTAGRAM, FACEBOOK, TIKTOK, LINKEDIN o YOUTUBE)"}.
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
        channel: z.enum(["FACEBOOK", "INSTAGRAM", "TIKTOK", "LINKEDIN", "YOUTUBE"]),
        format: z.enum(["IMAGE", "VIDEO"]),
        body: z.string().describe("Storyboard visual, script o guion del contenido"),
        caption: z.string().describe("Copy o descripción final para la red social"),
        promptUsed: z.string().describe("AI image generator prompt en INGLÉS para la imagen de diseño o la miniatura/portada del video")
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
      ? campaignChannels.filter(c => c.isActive).map(c => c.platform.toUpperCase())
      : [];

    let activeChannels = campaignActiveChannels;
    if (registeredChannels.length > 0) {
      activeChannels = campaignActiveChannels.filter(ch => registeredChannels.includes(ch));
      if (activeChannels.length === 0) {
        activeChannels = registeredChannels;
      }
    }

    activeChannels = activeChannels.filter(ch => ["FACEBOOK", "INSTAGRAM", "TIKTOK", "LINKEDIN", "YOUTUBE"].includes(ch));

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
Cada publicación debe ser accionable, relevante para los objetivos de la campaña, y contar con canales y formatos definidos.`;

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

    const posts = object.posts.map(post => {
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
      posts.map(post => {
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
