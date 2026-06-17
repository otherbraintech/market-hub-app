"use server";

import { revalidatePath } from "next/cache";
import { campaignSchema } from "@/lib/schemas/campaign";
import { createCampaign, updateCampaign, deleteCampaign, CreateCampaignInput } from "@/modules/campaigns";
import { z } from "zod";
import { CampaignObjective, CampaignStatus } from "@prisma/client";

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
      objective: validated.objective as CampaignObjective,
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
      objective: validated.objective as CampaignObjective,
      startDate: validated.startDate,
      endDate: validated.endDate,
      budget: validated.budget,
      channels: normalizedChannels,
      targeting: validated.targeting,
      status: validated.status as CampaignStatus,
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
