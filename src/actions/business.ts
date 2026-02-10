"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { businessSchema } from "@/lib/schemas/business";
import { z } from "zod";
import { slugify } from "@/lib/utils";

export async function createBusiness(data: z.infer<typeof businessSchema>) {
  try {
    const validated = businessSchema.parse(data);
    const slug = slugify(validated.name);

    await prisma.business.create({
      data: {
        ...validated,
        slug,
        // TODO: Asignar usuario cuando tengamos auth completa vinculada a business
      },
    });

    revalidatePath("/business");
    return { success: true, message: "Negocio creado exitosamente" };
  } catch (error) {
    return { success: false, error: "Error al crear el negocio" };
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
