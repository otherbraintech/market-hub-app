"use server";

import { revalidatePath } from "next/cache";
import { productSchema } from "@/lib/schemas/product";
import { createProduct, updateProduct, deleteProduct, CreateProductInput } from "@/modules/products";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";

const openrouter = createOpenAI({
  apiKey: process.env.OPEN_ROUTER_KEY?.replace(/"/g, "").trim(),
  baseURL: "https://openrouter.ai/api/v1",
});

export async function suggestProductDetailsAction(name: string, description: string, businessId: string) {
  try {
    if (!name || !description) {
      return { success: false, error: "Se requiere nombre y descripción detallada." };
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { name: true, industry: true, description: true }
    });

    const systemPrompt = `Eres un especialista en marketing de productos (Product Marketing Manager) senior.
Analiza el nombre y la descripción de un producto o servicio de un negocio y genera detalles estructurados para marketing.
Debes responder estrictamente con un objeto JSON según el esquema indicado.`;

    const userPrompt = `
NEGOCIO:
- Nombre: ${business?.name || "Desconocido"}
- Industria: ${business?.industry || "General"}
- Descripción: ${business?.description || "No disponible"}

PRODUCTO A ANALIZAR:
- Nombre: ${name}
- Descripción del usuario: ${description}

Por favor, genera:
1. "shortDesc": Una descripción corta tipo gancho para anuncios y tarjetas de catálogo (máximo 120 caracteres).
2. "features": Una lista de exactamente 3 características clave. Cada característica debe tener "name" (nombre corto y técnico) y "description" (detalle técnico).
3. "benefits": Una lista de exactamente 3 beneficios de valor para el cliente. Cada beneficio debe tener "title" (título del beneficio, ej. "Ahorro de Tiempo") y "description" (por qué es de valor para el cliente).
4. "keywords": 5 palabras clave de marketing separadas por comas (ej. "diseño, automatización, eficiencia").
`;

    const { object } = await generateObject({
      model: openrouter("google/gemini-2.5-flash"),
      schema: z.object({
        shortDesc: z.string(),
        features: z.array(z.object({
          name: z.string(),
          description: z.string()
        })),
        benefits: z.array(z.object({
          title: z.string(),
          description: z.string()
        })),
        keywords: z.string()
      }),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.75
    });

    return { success: true, details: object };
  } catch (error: any) {
    console.error("Error al sugerir detalles con IA:", error);
    return { success: false, error: error.message || "Error al sugerir detalles con IA" };
  }
}

export async function createProductAction(businessId: string, data: z.infer<typeof productSchema>) {
  try {
    const validated = productSchema.parse(data);
    
    // Transformar keywords de string a array
    const keywordsArray = validated.keywords 
      ? validated.keywords.split(',').map((k: string) => k.trim()).filter((k: string) => k.length > 0)
      : [];

    const input: CreateProductInput = {
      businessId,
      name: validated.name,
      description: validated.description,
      shortDesc: validated.shortDesc,
      features: validated.features.map((f: any) => ({ ...f, id: f.id || crypto.randomUUID() })),
      benefits: validated.benefits.map((b: any) => ({ ...b, id: b.id || crypto.randomUUID() })),
      pricing: validated.pricing,
      images: validated.imageUrl ? [validated.imageUrl] : [],
      keywords: keywordsArray,
      isActive: validated.isActive
    };

    await createProduct(input);
    revalidatePath(`/business/${businessId}`);
    revalidatePath(`/products`);
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
      ? validated.keywords.split(',').map((k: string) => k.trim()).filter((k: string) => k.length > 0)
      : [];

    await updateProduct(id, {
      name: validated.name,
      description: validated.description,
      shortDesc: validated.shortDesc,
      features: validated.features.map((f: any) => ({ ...f, id: f.id || crypto.randomUUID() })),
      benefits: validated.benefits.map((b: any) => ({ ...b, id: b.id || crypto.randomUUID() })),
      pricing: validated.pricing ? validated.pricing : undefined,
      images: validated.imageUrl ? [validated.imageUrl] : [],
      keywords: keywordsArray,
      isActive: validated.isActive
    });

    revalidatePath(`/business/${businessId}`);
    revalidatePath(`/products`);
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

export async function parseMultimodalCatalogAction(catalogData: string, businessId: string, fileDataUrl?: string) {
  try {
    if (!catalogData && !fileDataUrl) {
      return { success: false, error: "El contenido o archivo del catálogo no puede estar vacío." };
    }

    const systemPrompt = `Eres un agente de IA experto en extracción de catálogos y digitalización de inventarios.
Analiza el texto o la imagen de catálogo proporcionada y extrae un listado estructurado de productos o servicios para digitalizarlos.
Genera exactamente entre 3 y 6 productos. Para cada producto, debes extraer de forma precisa:
- name: Nombre del producto
- description: Descripción detallada orientada a marketing
- basePrice: Precio base (número decimal o entero)
- currency: Moneda (ej. "USD", "MXN", "CLP", "EUR")
- features: Lista de 2-3 características técnicas clave (ej. "Vegano", "Sin azúcar", "100% Algodón")`;

    const userPrompt = catalogData 
      ? `Analiza el siguiente catálogo/menú y extrae sus productos:\n\n${catalogData}`
      : `Analiza la imagen adjunta del catálogo y extrae sus productos y precios de forma detallada.`;

    let aiOptions: any = {
      model: openrouter("google/gemini-2.5-flash"),
      schema: z.object({
        products: z.array(z.object({
          name: z.string(),
          description: z.string(),
          basePrice: z.number().default(0),
          currency: z.string().default("USD"),
          features: z.array(z.string()).default([])
        }))
      }),
      system: systemPrompt,
      temperature: 0.2
    };

    if (fileDataUrl && fileDataUrl.startsWith("data:")) {
      const matches = fileDataUrl.match(/^data:(.+);base64,(.+)$/);
      const mimeType = matches ? matches[1] : "image/jpeg";
      const base64Data = matches ? matches[2] : fileDataUrl;
      
      aiOptions.messages = [
        {
          role: "user",
          content: [
            { type: "text", text: userPrompt },
            { 
              type: "image", 
              image: Buffer.from(base64Data, "base64"), 
              mimeType: mimeType 
            }
          ]
        }
      ];
    } else {
      aiOptions.prompt = userPrompt;
    }

    const { object } = await generateObject(aiOptions) as { object: { products: any[] } | null };
    if (!object) {
      return { success: false, error: "No se pudieron extraer productos del catálogo." };
    }

    return { success: true, products: object.products };
  } catch (error: any) {
    console.error("Error al procesar catálogo multimodal:", error);
    return { success: false, error: error.message || "Error al procesar el catálogo con IA" };
  }
}
