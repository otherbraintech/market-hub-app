"use server";

import { revalidatePath } from "next/cache";
import { campaignSchema } from "@/lib/schemas/campaign";
import { createCampaign, updateCampaign, deleteCampaign, CreateCampaignInput } from "@/modules/campaigns";
import { z } from "zod";

export async function createCampaignAction(businessId: string, data: z.infer<typeof campaignSchema>) {
  try {
    const validated = campaignSchema.parse(data);
    
    const normalizedChannels = (validated.channels || []).map(ch => {
      if (typeof ch === "string") {
        return { platform: ch, isActive: true };
      }
      return ch;
    });

    const input: CreateCampaignInput = {
      businessId,
      strategyId: validated.strategyId,
      name: validated.name,
      description: validated.description,
      objective: validated.objective as any,
      startDate: validated.startDate,
      endDate: validated.endDate,
      budget: validated.budget,
      channels: normalizedChannels,
      targeting: validated.targeting,
    };

    await createCampaign(input);
    revalidatePath(`/business/${businessId}`);
    return { success: true, message: "Campaña creada exitosamente" };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Error al crear la campaña" };
  }
}

export async function updateCampaignAction(id: string, businessId: string, data: z.infer<typeof campaignSchema>) {
  try {
    const validated = campaignSchema.parse(data);
    
    const normalizedChannels = (validated.channels || []).map(ch => {
      if (typeof ch === "string") {
        return { platform: ch, isActive: true };
      }
      return ch;
    });

    await updateCampaign(id, {
      name: validated.name,
      description: validated.description,
      objective: validated.objective as any,
      startDate: validated.startDate,
      endDate: validated.endDate,
      budget: validated.budget,
      channels: normalizedChannels,
      targeting: validated.targeting,
      status: validated.status as any,
    });

    revalidatePath(`/business/${businessId}`);
    return { success: true, message: "Campaña actualizada" };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Error al actualizar la campaña" };
  }
}

export async function deleteCampaignAction(id: string, businessId: string) {
  try {
    await deleteCampaign(id);
    revalidatePath(`/business/${businessId}`);
    return { success: true, message: "Campaña eliminada" };
  } catch (error) {
    return { success: false, error: "Error al eliminar la campaña" };
  }
}

export async function deleteCampaignsAction(ids: string[], businessId: string) {
  try {
    const { prisma } = await import("@/lib/prisma");
    await prisma.campaign.deleteMany({
      where: {
        id: { in: ids }
      }
    });
    revalidatePath(`/business/${businessId}`);
    return { success: true, message: `${ids.length} campañas eliminadas con éxito` };
  } catch (error: any) {
    console.error("Error al eliminar campañas:", error);
    return { success: false, error: error.message || "Error al eliminar las campañas" };
  }
}

export async function importCampaignAction(businessId: string, camp: any) {
  try {
    const { prisma } = await import("@/lib/prisma");
    
    // Buscar estrategia que coincida con strategyKeyword o usar la primera activa o cualquiera
    const strategies = await prisma.marketingStrategy.findMany({
      where: { businessId }
    });
    const matchedStrategy = strategies.find(s => 
      s.name.toLowerCase().includes((camp.strategyKeyword || '').toLowerCase())
    );
    const strategyId = matchedStrategy ? matchedStrategy.id : (strategies[0]?.id || null);

    const createdCampaign = await prisma.campaign.create({
      data: {
        businessId,
        strategyId,
        name: camp.name,
        slug: camp.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        description: camp.description,
        objective: (camp.objective as any) || "AWARENESS",
        startDate: new Date(camp.startDate),
        endDate: camp.endDate ? new Date(camp.endDate) : null,
        status: "ACTIVE",
        channels: camp.channels || ['INSTAGRAM'],
        budget: camp.budget || 100,
      }
    });

    // Crear planificación de publicaciones (Content)
    if (camp.contents && Array.isArray(camp.contents)) {
      for (const post of camp.contents) {
        await prisma.content.create({
          data: {
            campaignId: createdCampaign.id,
            type: (post.type as any) || "POST",
            title: post.title,
            body: post.body || '',
            caption: post.caption || '',
            channel: (post.channel as any) || "INSTAGRAM",
            status: "SCHEDULED",
            scheduledAt: new Date(post.scheduledAt),
          }
        });
      }
    }

    revalidatePath(`/business/${businessId}`);
    revalidatePath(`/campaigns`);
    return { success: true, message: `Campaña "${camp.name}" importada con éxito` };
  } catch (error: any) {
    console.error("Error al importar campaña:", error);
    return { success: false, error: error.message || "Error al importar la campaña" };
  }
}
