"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { businessSchema } from "@/lib/schemas/business";
import { z } from "zod";
import { slugify } from "@/lib/utils";

import { analyzeBusiness } from "@/lib/ai/business-analyzer";

export async function createBusiness(data: z.infer<typeof businessSchema>) {
  try {
    const validated = businessSchema.parse(data);
    const slug = slugify(validated.name);

    const business = await prisma.business.create({
      data: {
        ...validated,
        slug,
      },
    });

    revalidatePath("/business");
    return { success: true, message: "Negocio creado exitosamente", data: business };
  } catch (error) {
    return { success: false, error: "Error al crear el negocio" };
  }
}

export async function createBusinessWithAI(data: { name: string; description: string; website?: string }) {
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
    const validated = businessSchema.parse(data);
    
    await prisma.business.update({
      where: { id },
      data: validated,
    });

    revalidatePath("/business");
    return { success: true, message: "Negocio actualizado" };
  } catch (error) {
    return { success: false, error: "Error al actualizar" };
  }
}

export async function deleteBusiness(id: string) {
  try {
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
  return prisma.business.findMany({
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
  return (await cookies()).get("selectedBusinessId")?.value;
}

export async function getBusinessAction(id: string) {
  return prisma.business.findUnique({
    where: { id },
  });
}
