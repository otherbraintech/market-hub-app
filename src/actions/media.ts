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

    const [assets, total, businessInfo] = await Promise.all([
      prisma.mediaAsset.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      prisma.mediaAsset.count({ where }),
      prisma.business.findUnique({
        where: { id: businessId },
        select: { logo: true, brandColors: true }
      }),
    ]);

    const videoCount = await prisma.mediaAsset.count({
      where: { businessId, type: "VIDEO" },
    });
    const imageCount = await prisma.mediaAsset.count({
      where: { businessId, type: "IMAGE" },
    });

    const parsedAssets = JSON.parse(JSON.stringify(assets));
    const logoAsset = parsedAssets.find((a: any) => a.category === "LOGO");
    const logo = businessInfo?.logo || logoAsset?.url || null;

    let brandColors: string[] = [];
    if (Array.isArray(businessInfo?.brandColors)) {
      brandColors = businessInfo.brandColors as string[];
    } else if (typeof businessInfo?.brandColors === "string") {
      try {
        brandColors = JSON.parse(businessInfo.brandColors);
      } catch (e) {}
    }

    return { 
      success: true, 
      assets: parsedAssets, 
      total,
      videoCount,
      imageCount,
      logo,
      brandColors,
      limits: {
        maxVideos: 5,
        maxImages: 50
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al listar assets" };
  }
}

export async function updateBusinessLogoAction(data: {
  businessId: string;
  logoUrl: string;
  brandColors?: string[];
  filename: string;
  mimeType: string;
  size: number;
}) {
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    cookieStore.set("selectedBusinessId", data.businessId, { path: "/", maxAge: 60 * 60 * 24 * 30 });

    await prisma.business.update({
      where: { id: data.businessId },
      data: {
        logo: data.logoUrl,
        ...(data.brandColors && { brandColors: data.brandColors }),
      },
    });

    const asset = await prisma.mediaAsset.create({
      data: {
        businessId: data.businessId,
        type: "IMAGE",
        filename: data.filename,
        url: data.logoUrl,
        mimeType: data.mimeType,
        size: data.size,
        category: "LOGO",
        formatCategory: "LOGO",
      },
    });

    revalidatePath("/media");
    revalidatePath(`/business/${data.businessId}`);
    revalidatePath("/", "layout");
    return { success: true, message: "Logotipo y paleta de colores guardados correctamente", asset };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al actualizar logotipo" };
  }
}

export async function updateBusinessBrandColorsAction(businessId: string, brandColors: string[]) {
  try {
    await prisma.business.update({
      where: { id: businessId },
      data: { brandColors },
    });
    revalidatePath("/media");
    revalidatePath(`/business/${businessId}`);
    revalidatePath("/", "layout");
    return { success: true, message: "Paleta de colores actualizada" };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al actualizar paleta de colores" };
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
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    cookieStore.set("selectedBusinessId", data.businessId, { path: "/", maxAge: 60 * 60 * 24 * 30 });

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
    revalidatePath("/", "layout");
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
