"use server";

import { prisma } from "@/lib/prisma";
import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { revalidatePath } from "next/cache";

// Configuración de OpenRouter
const openrouter = createOpenAI({
  apiKey: process.env.OPEN_ROUTER_KEY?.replace(/"/g, "").trim(),
  baseURL: "https://openrouter.ai/api/v1",
});

// Zod Schema para la generación estructurada de publicaciones
const publicationSchema = z.object({
  title: z.string().describe("Título corto e interno de la publicación"),
  channel: z.enum(["FACEBOOK", "INSTAGRAM", "TIKTOK", "LINKEDIN", "YOUTUBE"]).describe("Red social de destino"),
  type: z.enum(["POST", "STORY", "REEL", "VIDEO", "CAROUSEL"]).describe("Tipo de publicación en la plataforma"),
  format: z.enum(["IMAGE", "VIDEO"]).describe("Formato de multimedia principal"),
  scheduledAt: z.string().describe("Fecha y hora optimizada en formato ISO 8601 (YYYY-MM-DDTHH:mm:ssZ) dentro del rango de la campaña"),
  caption: z.string().describe("Copy/Texto persuasivo final para la red social, con ganchos, cuerpo, CTA y hashtags integrados"),
  body: z.string().describe("Si el formato es VIDEO, el guion detallado (Gancho, Contenido, CTA, Indicaciones Visuales). Si es IMAGE, la descripción detallada del concepto visual a diseñar"),
  promptUsed: z.string().describe("Prompt en INGLÉS altamente detallado y optimizado para generadores de imágenes por IA (Midjourney, DALL-E, etc.) para la imagen de diseño o la miniatura/portada del video. ¡Nunca debe ser vacío, 'N/A' ni 'None'!"),
  hashtags: z.array(z.string()).describe("Lista de hashtags sugeridos")
});

const contentPlannerSchema = z.object({
  publications: z.array(publicationSchema)
});

/**
 * Server Action para planificar y estructurar el contenido de una campaña usando IA.
 */
export async function generateCampaignContentAction(campaignId: string) {
  try {
    if (!campaignId) {
      return { success: false, error: "ID de campaña no proporcionado." };
    }

    // 1. Obtener la campaña
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        business: true,
        strategy: true,
      }
    });

    if (!campaign) {
      return { success: false, error: "La campaña no existe." };
    }

    const { business, strategy } = campaign;

    // 2. Obtener productos del negocio
    const products = await prisma.product.findMany({
      where: { businessId: campaign.businessId, isActive: true },
      select: {
        name: true,
        description: true,
        features: true,
        benefits: true,
      }
    });

    // 3. Determinar los canales activos de la campaña
    const campaignChannels = campaign.channels as Array<{ platform: string; isActive: boolean; budget?: number }>;
    let activeChannels = campaignChannels
      ? campaignChannels.filter(c => c.isActive).map(c => c.platform)
      : [];

    if (activeChannels.length === 0) {
      activeChannels = ["INSTAGRAM", "FACEBOOK", "TIKTOK"];
    }

    // 4. Calcular el rango de fechas para el calendario
    const start = new Date(campaign.startDate);
    // Si no tiene fecha de fin, planificar para 14 días
    const end = campaign.endDate ? new Date(campaign.endDate) : new Date(start.getTime() + 14 * 24 * 60 * 60 * 1000);

    const startISO = start.toISOString();
    const endISO = end.toISOString();

    // 5. Preparar la información contextual de marca
    const brandVoice = business.brandVoice ? JSON.stringify(business.brandVoice) : "No especificado";
    const targetAudience = business.targetAudience ? JSON.stringify(business.targetAudience) : "No especificado";

    const strategyContext = strategy
      ? `
ESTRATEGIA GENERAL VINCULADA:
- Nombre: ${strategy.name}
- Objetivos: ${JSON.stringify(strategy.objectives)}
- Buyer Personas: ${JSON.stringify(strategy.personas)}
- Pilares de Contenido: ${JSON.stringify(strategy.contentPillars)}
- Tono: Tono general del negocio.
`
      : "No hay una estrategia global vinculada.";

    const productsContext = products.length > 0
      ? `
PRODUCTOS DISPONIBLES DE LA MARCA (Promociona o haz referencia a estos productos en algunas publicaciones de manera natural):
${products.map(p => `- ${p.name}: ${p.description}. Beneficios: ${JSON.stringify(p.benefits)}`).join("\n")}
`
      : "No hay productos específicos cargados.";

    // 6. Construir prompt para Gemini
    const systemPrompt = `Eres un estratega de contenido, copywriter senior y planificador de redes sociales experto.
Tu objetivo es diseñar un calendario editorial de marketing altamente efectivo y estratégico de exactamente 8 publicaciones.
Debes distribuir estas 8 publicaciones de forma uniforme y estratégica en el tiempo entre la fecha de inicio y la fecha de fin de la campaña.
Asigna las publicaciones únicamente a los canales activos configurados.
Define horas de publicación optimizadas para el rendimiento (ej. horas de almuerzo 12:30-13:30, tarde 18:30-20:00, mañana 09:00).
Tu respuesta debe ser estrictamente un objeto JSON que coincida con el esquema indicado.`;

    const userPrompt = `
Planifica el calendario de contenidos para la siguiente campaña de marketing:

DATOS DE LA CAMPAÑA:
- Nombre de la campaña: ${campaign.name}
- Descripción: ${campaign.description || "Sin descripción"}
- Objetivo de Campaña: ${campaign.objective} (Alinea los copys y enfoques a este objetivo: ventas, reconocimiento, interacción, etc.)
- Rango de fechas: Desde ${startISO} hasta ${endISO} (¡Todas las fechas de publicación generadas DEBEN estar estrictamente dentro de este rango!)
- Canales Activos autorizados para esta campaña: ${JSON.stringify(activeChannels)} (Solo genera publicaciones para estos canales).

CONTEXTO DEL NEGOCIO:
- Nombre del negocio: ${business.name}
- Industria: ${business.industry || "Servicios"}
- Descripción: ${business.description || "No especificada"}
- Identidad de Marca (Voz/Valores): ${brandVoice}
- Audiencia Objetivo: ${targetAudience}

${strategyContext}

${productsContext}

REQUERIMIENTOS DETALLADOS POR FORMATO:
- Si el formato es VIDEO (por ejemplo, REEL, TIKTOK o VIDEO de YouTube):
  - En la propiedad "body" proporciona un guion de video estratégico y profesional que contenga:
    1. GANCHO (Hook): Los primeros 3 segundos para capturar la atención del espectador.
    2. DESARROLLO (Body): El valor o contenido principal de la publicación.
    3. CTA (Llamada a la Acción): Qué debe hacer el usuario (comentar, compartir, ir al enlace).
    4. INDICACIONES VISUALES: Indicaciones breves de qué grabar o mostrar en pantalla en cada fase.
  - En la propiedad "promptUsed" proporciona un prompt en INGLÉS detallado y sumamente visual para generar la portada o miniatura de este video (ej. "A dramatic cinematic thumbnail representing [video concept], highly descriptive, photorealistic, 8k"). ¡Nunca lo dejes vacío ni uses "N/A"!

- Si el formato es IMAGE (por ejemplo, POST, STORY, CAROUSEL):
  - En la propiedad "body" describe detalladamente la composición de la imagen: qué elementos visuales debe tener, la paleta de colores sugerida, el enfoque artístico y el estilo de diseño de marca.
  - En la propiedad "promptUsed" crea un prompt profesional, técnico y detallado escrito en INGLÉS optimizado para generadores de imágenes por IA (Midjourney, DALL-E, etc.). Ejemplo: "A premium close-up photo of artisan gourmet chocolate cupcakes on a rustic wooden table, soft warm lighting, cinematic depth of field, 8k resolution, photorealistic --ar 4:5". ¡Nunca uses "N/A" ni lo dejes vacío!

GENERA EXACTAMENTE 8 PUBLICACIONES DISTRIBUIDAS DE MANERA ESTRATÉGICA EN EL TIEMPO.
`;

    // 7. Llamar a OpenRouter / Gemini
    const { object } = await generateObject({
      model: openrouter("google/gemini-2.5-flash"),
      schema: contentPlannerSchema,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.7,
      maxOutputTokens: 8192,
    });

    // 8. Iniciar transacción en la base de datos
    await prisma.$transaction(async (tx) => {
      // Borrar contenido anterior de esta campaña
      await tx.content.deleteMany({
        where: { campaignId: campaign.id }
      });

      // Insertar las nuevas publicaciones planificadas
      for (const pub of object.publications) {
        await tx.content.create({
          data: {
            campaignId: campaign.id,
            title: pub.title,
            type: pub.type,
            format: pub.format,
            channel: pub.channel,
            caption: pub.caption,
            body: pub.body,
            promptUsed: pub.promptUsed || null,
            hashtags: pub.hashtags,
            scheduledAt: new Date(pub.scheduledAt),
            status: "SCHEDULED"
          }
        });
      }

      // Actualizar el estado de la campaña si está en DRAFT a SCHEDULED para reflejar que ya está planificada
      if (campaign.status === "DRAFT") {
        await tx.campaign.update({
          where: { id: campaign.id },
          data: { status: "SCHEDULED" }
        });
      }
    });

    revalidatePath("/calendar");
    revalidatePath("/campaigns");

    return { success: true, message: "Planificación de contenido generada exitosamente." };
  } catch (error) {
    console.error("Error generating campaign content plan:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido al planificar el contenido."
    };
  }
}
