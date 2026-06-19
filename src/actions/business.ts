"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { businessSchema } from "@/lib/schemas/business";
import { z } from "zod";
import { slugify } from "@/lib/utils";

import { analyzeBusiness } from "@/lib/ai/business-analyzer";

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
    } as any);

    revalidatePath("/business");
    return { success: true, message: "Negocio creado exitosamente", data: business };
  } catch (error: any) {
    console.error("Create Business Error:", error);
    return { success: false, error: error.message || "Error al crear el negocio" };
  }
}

export async function createBusinessWithAI(data: { 
  name: string; 
  description: string; 
  website?: string;
  phoneNumbers?: string;
  location?: string;
  socialLinks?: any;
}) {
  try {
    // 1. Analizar con IA
    const analysis = await analyzeBusiness(data.name, data.description, data.website);
    
    // 2. Preparar datos completos
    const fullData = {
      name: data.name,
      description: data.description,
      website: data.website || "",
      industry: analysis.industry,
      brandVoice: analysis.brandVoice,
      targetAudience: analysis.targetAudience,
      phoneNumbers: data.phoneNumbers || "",
      location: data.location || "",
      socialLinks: data.socialLinks || { facebook: "", instagram: "", tiktok: "" },
    };

    // 3. Crear el negocio
    return await createBusiness(fullData as any);
  } catch (error) {
    console.error("AI Creation Error:", error);
    return { success: false, error: "Error al generar datos con IA" };
  }
}


export async function updateBusiness(id: string, data: z.infer<typeof businessSchema>) {
  try {
    const { getSession } = await import("@/lib/auth");
    const session = await getSession();
<<<<<<< HEAD
    if (!session || !session.user?.id) {
      return { success: false, error: "No autorizado" };
    }

    const business = await prisma.business.findFirst({
      where: { id, userId: session.user.id }
    });
    if (!business) {
      return { success: false, error: "Negocio no encontrado o no autorizado" };
    }

=======
    
    if (!session || !session.userId) {
      return { success: false, error: "No autorizado" };
    }
    
    const business = await prisma.business.findUnique({
      where: { id },
    });
    
    if (!business || business.userId !== session.userId) {
      return { success: false, error: "No autorizado" };
    }
    
>>>>>>> 01692c68f53b9f0892cfe23c4fd243cef4190616
    const { updateBusiness: updateBusinessService } = await import("@/modules/business/services");
    const validated = businessSchema.parse(data);
    
    await updateBusinessService(id, validated as any);

    revalidatePath("/business");
    return { success: true, message: "Negocio actualizado" };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al actualizar" };
  }
}

export async function deleteBusiness(id: string) {
  try {
    const { getSession } = await import("@/lib/auth");
    const session = await getSession();
<<<<<<< HEAD
    if (!session || !session.user?.id) {
      return { success: false, error: "No autorizado" };
    }

    const business = await prisma.business.findFirst({
      where: { id, userId: session.user.id }
    });
    if (!business) {
      return { success: false, error: "Negocio no encontrado o no autorizado" };
    }

=======
    
    if (!session || !session.userId) {
      return { success: false, error: "No autorizado" };
    }
    
    const business = await prisma.business.findUnique({
      where: { id },
    });
    
    if (!business || business.userId !== session.userId) {
      return { success: false, error: "No autorizado" };
    }
    
>>>>>>> 01692c68f53b9f0892cfe23c4fd243cef4190616
    await prisma.business.delete({
      where: { id },
    });
    revalidatePath("/business");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Error al eliminar" };
  }
}
export async function getBusinesses() {
  const { getSession } = await import("@/lib/auth");
  const session = await getSession();
<<<<<<< HEAD
  if (!session || !session.user?.id) {
    return [];
  }
  return prisma.business.findMany({
    where: { userId: session.user.id },
=======
  
  if (!session || !session.userId) {
    return [];
  }
  
  return prisma.business.findMany({
    where: { userId: session.userId },
>>>>>>> 01692c68f53b9f0892cfe23c4fd243cef4190616
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
  const { cookies } = await import("next/headers");
<<<<<<< HEAD
  const selectedId = (await cookies()).get("selectedBusinessId")?.value;
  if (!selectedId) return undefined;

  const { getSession } = await import("@/lib/auth");
  const session = await getSession();
  if (!session || !session.user?.id) {
    return undefined;
  }

  const business = await prisma.business.findFirst({
    where: { id: selectedId, userId: session.user.id }
  });

  if (!business) {
    return undefined;
  }

=======
  const { getSession } = await import("@/lib/auth");
  
  const session = await getSession();
  const selectedId = (await cookies()).get("selectedBusinessId")?.value;
  
  if (!selectedId || !session || !session.userId) {
    return undefined;
  }
  
  // Verify that the selected business belongs to the current user
  const business = await prisma.business.findUnique({
    where: { id: selectedId },
  });
  
  if (!business || business.userId !== session.userId) {
    // Clear the invalid cookie
    (await cookies()).delete("selectedBusinessId");
    return undefined;
  }
  
>>>>>>> 01692c68f53b9f0892cfe23c4fd243cef4190616
  return selectedId;
}

export async function getBusinessAction(id: string) {
  const { getSession } = await import("@/lib/auth");
  const session = await getSession();
<<<<<<< HEAD
  if (!session || !session.user?.id) {
    return null;
  }
  return prisma.business.findFirst({
    where: { id, userId: session.user.id },
=======
  
  if (!session || !session.userId) {
    return null;
  }
  
  const business = await prisma.business.findUnique({
    where: { id },
>>>>>>> 01692c68f53b9f0892cfe23c4fd243cef4190616
  });
  
  if (!business || business.userId !== session.userId) {
    return null;
  }
  
  return business;
}
