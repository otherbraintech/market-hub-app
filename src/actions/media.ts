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
  category?: string;
  formatCategory?: string;
}) {
  try {
    const asset = await prisma.mediaAsset.create({
      data: {
        businessId: data.businessId,
        type: data.type,
        filename: data.filename,
        url: data.url,
        mimeType: data.mimeType,
        size: data.size,
        category: data.category || "MANUAL",
        formatCategory: data.formatCategory || (data.type === "VIDEO" ? "VIDEO" : "ART"),
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

export async function purgeOldInspirationAssetsAction(businessId: string) {
  try {
    // Depura automáticamente assets de nicho/terceros antiguos si existen más de 20
    const oldAssets = await prisma.mediaAsset.findMany({
      where: { businessId, category: "NICHO_TERCEROS" },
      orderBy: { createdAt: "asc" },
      take: 10
    });

    if (oldAssets.length > 0) {
      await prisma.mediaAsset.deleteMany({
        where: {
          id: { in: oldAssets.map(a => a.id) }
        }
      });
    }

    revalidatePath("/media");
    return { success: true, message: `Se liberó espacio depurando ${oldAssets.length} archivos antiguos de inspiración.`, count: oldAssets.length };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al depurar assets antiguos" };
  }
}
