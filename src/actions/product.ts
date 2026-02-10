"use server";

import { revalidatePath } from "next/cache";
import { productSchema } from "@/lib/schemas/product";
import { createProduct, updateProduct, deleteProduct, CreateProductInput } from "@/modules/products";
import { z } from "zod";

export async function createProductAction(businessId: string, data: z.infer<typeof productSchema>) {
  try {
    const validated = productSchema.parse(data);
    
    // Transformar keywords de string a array
    const keywordsArray = validated.keywords 
      ? validated.keywords.split(',').map(k => k.trim()).filter(k => k.length > 0)
      : [];

    const input: CreateProductInput = {
      businessId,
      name: validated.name,
      description: validated.description,
      shortDesc: validated.shortDesc,
      features: validated.features.map(f => ({ ...f, id: f.id || crypto.randomUUID() })),
      benefits: validated.benefits.map(b => ({ ...b, id: b.id || crypto.randomUUID() })),
      pricing: validated.pricing,
      keywords: keywordsArray,
      isActive: validated.isActive
    };

    await createProduct(input);
    revalidatePath(`/business/${businessId}`);
    return { success: true, message: "Producto creado exitosamente" };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Error al crear el producto" };
  }
}

export async function updateProductAction(id: string, businessId: string, data: z.infer<typeof productSchema>) {
  try {
    const validated = productSchema.parse(data);
    
     // Transformar keywords de string a array
    const keywordsArray = validated.keywords 
      ? validated.keywords.split(',').map(k => k.trim()).filter(k => k.length > 0)
      : [];

    await updateProduct(id, {
      name: validated.name,
      description: validated.description,
      shortDesc: validated.shortDesc,
      features: validated.features.map(f => ({ ...f, id: f.id || crypto.randomUUID() })),
      benefits: validated.benefits.map(b => ({ ...b, id: b.id || crypto.randomUUID() })),
      pricing: validated.pricing ? validated.pricing : undefined,
      keywords: keywordsArray,
      isActive: validated.isActive
    });

    revalidatePath(`/business/${businessId}`);
    return { success: true, message: "Producto actualizado" };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Error al actualizar el producto" };
  }
}

export async function deleteProductAction(id: string, businessId: string) {
  try {
    await deleteProduct(id);
    revalidatePath(`/business/${businessId}`);
    return { success: true, message: "Producto eliminado" };
  } catch (error) {
    return { success: false, error: "Error al eliminar el producto" };
  }
}
