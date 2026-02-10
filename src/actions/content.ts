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
