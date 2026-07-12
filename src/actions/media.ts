"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { MediaType } from "@prisma/client";

export async function listMediaAssetsAction(
  businessId: string,
  options?: {
    type?: MediaType;
    skip?: number;
    take?: number;
  }
) {
  try {
    const { type, skip = 0, take = 50 } = options ?? {};
    const where = {
      businessId,
      ...(type && { type }),
    };

    const [assets, total] = await Promise.all([
      prisma.mediaAsset.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      prisma.mediaAsset.count({ where }),
    ]);

    const videoCount = await prisma.mediaAsset.count({
      where: { businessId, type: "VIDEO" },
    });
    const imageCount = await prisma.mediaAsset.count({
      where: { businessId, type: "IMAGE" },
    });

    return { 
      success: true, 
      assets: JSON.parse(JSON.stringify(assets)), 
      total,
      videoCount,
      imageCount,
      limits: {
        maxVideos: 5,
        maxImages: 50
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al listar assets" };
  }
}

export async function createMediaAssetAction(data: {
  businessId: string;
  type: MediaType;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
}) {
  try {
    // Verificar límites
    if (data.type === "VIDEO") {
      const count = await prisma.mediaAsset.count({
        where: { businessId: data.businessId, type: "VIDEO" },
      });
      if (count >= 5) {
        return { 
          success: false, 
          error: "Límite alcanzado: Tu plan solo permite hasta 5 videos en el catálogo multimedia privado." 
        };
      }
    } else if (data.type === "IMAGE") {
      const count = await prisma.mediaAsset.count({
        where: { businessId: data.businessId, type: "IMAGE" },
      });
      if (count >= 50) {
        return { 
          success: false, 
          error: "Límite alcanzado: Tu plan solo permite hasta 50 imágenes en el catálogo multimedia privado." 
        };
      }
    }

    const asset = await prisma.mediaAsset.create({
      data: {
        businessId: data.businessId,
        type: data.type,
        filename: data.filename,
        url: data.url,
        mimeType: data.mimeType,
        size: data.size,
      },
    });

    revalidatePath("/media");
    return { success: true, message: "Archivo subido correctamente", asset };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al registrar el asset" };
  }
}

export async function deleteMediaAssetAction(id: string, businessId: string) {
  try {
    await prisma.mediaAsset.delete({
      where: { id },
    });
    revalidatePath("/media");
    return { success: true, message: "Asset eliminado correctamente" };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al eliminar el asset" };
  }
}
