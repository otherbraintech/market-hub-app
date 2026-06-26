"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { businessSchema } from "@/lib/schemas/business";
import { z } from "zod";
import { triggerAnalysis } from "@/lib/analysis-service";

import { analyzeBusiness } from "@/lib/ai/business-analyzer";
import type { CreateBusinessInput, UpdateBusinessInput } from "@/modules/business/types";

export async function createBusiness(data: z.infer<typeof businessSchema>) {
  try {
    const { getSession } = await import("@/lib/auth");
    const { createBusiness: createBusinessService } = await import("@/modules/business/services");
    
    const session = await getSession();
    if (!session || !session.user?.id) {
      return { success: false, error: "No autorizado" };
    }

    const validated = businessSchema.parse(data);
    const business = await createBusinessService({
      ...validated,
      userId: session.user.id,
    } as unknown as CreateBusinessInput);

    // Contar negocios del usuario
    const businessCount = await prisma.business.count({
      where: { userId: session.user.id }
    });

    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const currentSelected = cookieStore.get("selectedBusinessId")?.value;

    // Si es su primer negocio o no tiene ninguno seleccionado actualmente
    if (businessCount === 1 || !currentSelected) {
      cookieStore.set("selectedBusinessId", business.id, { 
        path: "/",
        maxAge: 60 * 60 * 24 * 30 // 30 días
      });
    }

    // Disparar scraping automático para todos los canales que tengan URL en el nuevo negocio
    const socialLinks = (business.socialLinks as Record<string, string | undefined>) || {};
    const channelUrls = [
      { name: "WEBSITE", url: business.website },
      { name: "FACEBOOK", url: socialLinks.facebook },
      { name: "INSTAGRAM", url: socialLinks.instagram },
      { name: "TIKTOK", url: socialLinks.tiktok },
      { name: "LINKEDIN", url: socialLinks.linkedin },
      { name: "YOUTUBE", url: socialLinks.youtube },
    ];

    const promises = channelUrls
      .filter((ch) => ch.url && ch.url.trim() !== "")
      .map((ch) =>
        triggerAnalysis({
          type: "MY_BUSINESS",
          entityId: business.id,
          channel: ch.name,
          url: ch.url!,
        }).catch((err) => {
          console.error(`Error al disparar scraping automático de negocio para canal ${ch.name}:`, err);
        })
      );

    if (promises.length > 0) {
      await Promise.allSettled(promises);
    }

    revalidatePath("/business");
    revalidatePath("/");
    return { success: true, message: "Negocio creado exitosamente", data: business };
  } catch (error) {
    console.error("Create Business Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Error al crear el negocio";
    return { success: false, error: errorMessage };
  }
}

export async function createBusinessWithAI(data: { 
  name: string; 
  description: string; 
  website?: string;
  phoneNumbers?: string;
  location?: string;
  socialLinks?: Record<string, string | undefined>;
}) {
  try {
    // 1. Analizar con IA con fallback si falla
    let analysis;
    try {
      analysis = await analyzeBusiness(data.name, data.description, data.website);
    } catch (aiError) {
      console.error("AI analysis failed, falling back to empty profile:", aiError);
      analysis = {
        industry: "",
        brandVoice: { tone: [], personality: [], values: [] },
        targetAudience: { demographics: "", psychographics: "" }
      };
    }
    
    // 2. Preparar datos completos
    const fullData = {
      name: data.name,
      description: data.description || "",
      website: data.website || "",
      industry: analysis.industry || "",
      brandVoice: analysis.brandVoice || { tone: [], personality: [], values: [] },
      targetAudience: analysis.targetAudience || { demographics: "", psychographics: "" },
      phoneNumbers: data.phoneNumbers || "",
      location: data.location || "",
      socialLinks: data.socialLinks || { facebook: "", instagram: "", tiktok: "" },
    };

    // 3. Crear el negocio
    return await createBusiness(fullData as z.infer<typeof businessSchema>);
  } catch (error) {
    console.error("AI Creation Error:", error);
    return { success: false, error: "Error al registrar el negocio" };
  }
}


export async function updateBusiness(id: string, data: z.infer<typeof businessSchema>) {
  try {
    const { getSession } = await import("@/lib/auth");
    const session = await getSession();
    if (!session || !session.user?.id) {
      return { success: false, error: "No autorizado" };
    }

    const oldBusiness = await prisma.business.findFirst({
      where: { id, userId: session.user.id }
    });
    if (!oldBusiness) {
      return { success: false, error: "Negocio no encontrado o no autorizado" };
    }

    const { updateBusiness: updateBusinessService } = await import("@/modules/business/services");
    const validated = businessSchema.parse(data);
    
    await updateBusinessService(id, validated as unknown as UpdateBusinessInput);

    // Disparar scraping automático si cambiaron o se agregaron URLs
    const oldLinks = (oldBusiness.socialLinks as Record<string, string | undefined>) || {};
    const newLinks = (validated.socialLinks as Record<string, string | undefined>) || {};
    const channelsToCheck = [
      { name: "WEBSITE", oldUrl: oldBusiness.website, newUrl: validated.website },
      { name: "FACEBOOK", oldUrl: oldLinks.facebook, newUrl: newLinks.facebook },
      { name: "INSTAGRAM", oldUrl: oldLinks.instagram, newUrl: newLinks.instagram },
      { name: "TIKTOK", oldUrl: oldLinks.tiktok, newUrl: newLinks.tiktok },
      { name: "LINKEDIN", oldUrl: oldLinks.linkedin, newUrl: newLinks.linkedin },
      { name: "YOUTUBE", oldUrl: oldLinks.youtube, newUrl: newLinks.youtube },
    ];

    const promises = channelsToCheck
      .filter((ch) => ch.newUrl && ch.newUrl.trim() !== "" && ch.newUrl !== ch.oldUrl)
      .map((ch) =>
        triggerAnalysis({
          type: "MY_BUSINESS",
          entityId: id,
          channel: ch.name,
          url: ch.newUrl!,
        }).catch((err) => {
          console.error(`Error al disparar scraping automático tras editar negocio para canal ${ch.name}:`, err);
        })
      );

    if (promises.length > 0) {
      await Promise.allSettled(promises);
    }

    revalidatePath("/business");
    return { success: true, message: "Negocio actualizado" };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Error al actualizar";
    return { success: false, error: errorMessage };
  }
}

export async function deleteBusiness(id: string) {
  try {
    const { getSession } = await import("@/lib/auth");
    const session = await getSession();
    if (!session || !session.user?.id) {
      return { success: false, error: "No autorizado" };
    }

    const business = await prisma.business.findFirst({
      where: { id, userId: session.user.id }
    });
    if (!business) {
      return { success: false, error: "Negocio no encontrado o no autorizado" };
    }

    await prisma.business.delete({
      where: { id },
    });
    revalidatePath("/business");
    return { success: true };
  } catch {
    return { success: false, error: "Error al eliminar" };
  }
}
export async function getBusinesses() {
  const { getSession } = await import("@/lib/auth");
  const session = await getSession();
  if (!session || !session.user?.id) {
    return [];
  }
  return prisma.business.findMany({
    where: { userId: session.user.id },
    orderBy: { name: "asc" },
  });
}

export async function setSelectedBusinessAction(id: string) {
  const { cookies } = await import("next/headers");
  (await cookies()).set("selectedBusinessId", id, { 
    path: "/",
    maxAge: 60 * 60 * 24 * 30 // 30 days
  });
  revalidatePath("/");
  return { success: true };
}

export async function getSelectedBusinessId() {
  const { getSession } = await import("@/lib/auth");
  const session = await getSession();
  if (!session || !session.user?.id) {
    return undefined;
  }

  const { cookies } = await import("next/headers");
  const selectedId = (await cookies()).get("selectedBusinessId")?.value;

  if (selectedId) {
    const business = await prisma.business.findFirst({
      where: { id: selectedId, userId: session.user.id }
    });
    if (business) {
      return selectedId;
    }
  }

  // Fallback to the first business if user has one
  const firstBusiness = await prisma.business.findFirst({
    where: { userId: session.user.id },
    orderBy: { name: "asc" }
  });

  if (firstBusiness) {
    return firstBusiness.id;
  }

  return undefined;
}

export async function getBusinessAction(id: string) {
  const { getSession } = await import("@/lib/auth");
  const session = await getSession();
  if (!session || !session.user?.id) {
    return null;
  }
  const business = await prisma.business.findFirst({
    where: { id, userId: session.user.id },
  });
  
  if (!business) {
    return null;
  }
  
  return business;
}
