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

export async function createContentAction(data: ContentFormValues & { businessId: string }) {
  try {
    const content = await createContent({
      ...data,
      campaignId: data.campaignId || undefined,
      productId: data.productId || undefined,
      socialAccountId: data.socialAccountId || undefined,
      scheduledAt: data.scheduledAt || undefined,
      mediaUrl: data.mediaUrl || undefined,
    });
    revalidatePath(`/business/${data.businessId}`);
    return { success: true, message: "Contenido creado correctamente", content };
  } catch (error: any) {
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
import { ContentStatus, ContentType, ContentFormat, SocialChannel } from "@prisma/client";
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
    body?: string;
    caption?: string;
    promptUsed?: string;
    scheduledAt?: Date | null;
  },
  businessId: string
) {
  try {
    const content = await updateContent(id, {
      ...data,
      scheduledAt: data.scheduledAt === null ? undefined : data.scheduledAt,
    } as any);
    revalidatePath(`/business/${businessId}`);
    revalidatePath("/calendar");
    return { success: true, message: "Publicación actualizada correctamente", content };
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
8. El "promptUsed" debe ser un prompt altamente creativo y detallado escrito en INGLÉS optimizado para generadores de imágenes por IA (Midjourney, DALL-E, etc.) para la imagen de diseño o la miniatura/portada del video. Bajo ninguna circunstancia uses "N/A", "None", vacío ni "no aplica". Si la publicación es un video (Reel, TikTok, etc.), diseña y describe un prompt para la portada o miniatura del video de manera sumamente atractiva y fotorrealista.

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
            type: post.type as ContentType,
            format: post.format as ContentFormat,
            channel: post.channel as SocialChannel,
            body: post.body,
            caption: post.caption,
            promptUsed: post.promptUsed,
            scheduledAt: scheduledDate,
            status: ContentStatus.DRAFT,
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
