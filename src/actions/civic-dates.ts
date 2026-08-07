"use server";

import { prisma } from "@/lib/prisma";
import { CivicDateCategory } from "@prisma/client";
import { CIVIC_DATES_DATA, CivicDateItemData } from "@/data/civic-dates-data";

export interface CivicDateFilterOptions {
  category?: string;
  region?: string;
  search?: string;
  month?: string; // "01", "02", etc.
}

export async function getCivicDatesAction(options: CivicDateFilterOptions = {}) {
  try {
    const where: any = {};

    if (options.category && options.category !== "ALL") {
      where.category = options.category as CivicDateCategory;
    }

    if (options.region && options.region !== "ALL") {
      where.region = options.region;
    }

    if (options.month && options.month !== "ALL") {
      where.date = {
        startsWith: `${options.month}-`,
      };
    }

    if (options.search && options.search.trim() !== "") {
      where.OR = [
        { name: { contains: options.search, mode: "insensitive" } },
        { description: { contains: options.search, mode: "insensitive" } },
        { region: { contains: options.search, mode: "insensitive" } },
      ];
    }

    let civicDates = await prisma.civicDate.findMany({
      where,
      orderBy: [
        { date: "asc" },
        { importance: "desc" },
      ],
    });

    // Si la BD no tiene registros (o aún no se ha ejecutado el seed), auto-sembrar en background
    if (civicDates.length === 0 && !options.category && !options.search && !options.region && !options.month) {
      console.log("🇧🇴 Seeding civic dates automatically into DB...");
      try {
        await prisma.civicDate.createMany({
          data: CIVIC_DATES_DATA.map((item) => ({
            name: item.name,
            date: item.date,
            fixedYear: item.fixedYear ?? null,
            category: item.category as CivicDateCategory,
            region: item.region,
            description: item.description ?? null,
            importance: item.importance,
            hashtags: item.hashtags ?? undefined,
            industries: item.industries ?? undefined,
            isActive: true,
          })),
          skipDuplicates: true,
        });

        // Re-query from DB
        civicDates = await prisma.civicDate.findMany({
          where,
          orderBy: [
            { date: "asc" },
            { importance: "desc" },
          ],
        });
      } catch (seedErr) {
        console.error("Auto-seed warning:", seedErr);
      }
    }

    // Si aún está vacío o falló la BD, retornar el dataset estático formateado
    if (civicDates.length === 0) {
      let fallbackData = CIVIC_DATES_DATA;

      if (options.category && options.category !== "ALL") {
        fallbackData = fallbackData.filter((d) => d.category === options.category);
      }
      if (options.region && options.region !== "ALL") {
        fallbackData = fallbackData.filter((d) => d.region.toUpperCase() === options.region?.toUpperCase());
      }
      if (options.month && options.month !== "ALL") {
        fallbackData = fallbackData.filter((d) => d.date.startsWith(`${options.month}-`));
      }
      if (options.search && options.search.trim() !== "") {
        const q = options.search.toLowerCase();
        fallbackData = fallbackData.filter((d) =>
          d.name.toLowerCase().includes(q) || (d.description || "").toLowerCase().includes(q) || d.region.toLowerCase().includes(q)
        );
      }

      return {
        success: true,
        data: fallbackData,
      };
    }

    // Deduplicar automáticamente por nombre y fecha si existen registros duplicados en la BD
    const uniqueMap = new Map<string, any>();
    const idsToDelete: string[] = [];

    for (const item of civicDates) {
      const key = `${item.name.toLowerCase().trim()}_${item.date}`;
      if (uniqueMap.has(key)) {
        idsToDelete.push(item.id);
      } else {
        uniqueMap.set(key, item);
      }
    }

    if (idsToDelete.length > 0) {
      prisma.civicDate.deleteMany({
        where: { id: { in: idsToDelete } }
      }).catch(err => console.error("Error deduplicating DB records:", err));
    }

    const deduplicatedList = Array.from(uniqueMap.values());

    const serialized = deduplicatedList.map((item: any) => ({
      ...item,
      createdAt: item.createdAt?.toISOString ? item.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: item.updatedAt?.toISOString ? item.updatedAt.toISOString() : new Date().toISOString(),
    }));

    return {
      success: true,
      data: serialized,
    };
  } catch (error: any) {
    console.error("Error fetching civic dates, using fallback:", error);
    return {
      success: true,
      data: CIVIC_DATES_DATA,
    };
  }
}

import { getSession } from "@/lib/auth";

export async function upsertCivicDateAction(data: {
  id?: string;
  name: string;
  date: string;
  category: CivicDateCategory;
  region: string;
  description?: string;
  importance: number;
  hashtags?: string[];
}) {
  try {
    const session = await getSession();
    const userRole = session?.user?.role || "USER";
    const isAdmin = userRole === "ADMIN" || userRole === "SUPERADMIN";

    if (!isAdmin) {
      return { success: false, error: "No tienes permisos de administrador para realizar esta acción." };
    }

    if (data.id) {
      const updated = await prisma.civicDate.update({
        where: { id: data.id },
        data: {
          name: data.name,
          date: data.date,
          category: data.category,
          region: data.region,
          description: data.description || null,
          importance: Number(data.importance) || 5,
          hashtags: data.hashtags || [],
        },
      });
      return { success: true, data: updated };
    } else {
      const created = await prisma.civicDate.create({
        data: {
          name: data.name,
          date: data.date,
          category: data.category,
          region: data.region,
          description: data.description || null,
          importance: Number(data.importance) || 5,
          hashtags: data.hashtags || [],
          isActive: true,
        },
      });
      return { success: true, data: created };
    }
  } catch (error: any) {
    console.error("Error upserting civic date:", error);
    return { success: false, error: "No se pudo guardar la fecha cívica." };
  }
}

export async function toggleCivicDateActiveAction(id: string, isActive: boolean) {
  try {
    const session = await getSession();
    const userRole = session?.user?.role || "USER";
    const isAdmin = userRole === "ADMIN" || userRole === "SUPERADMIN";

    if (!isAdmin) {
      return { success: false, error: "No tienes permisos de administrador para realizar esta acción." };
    }

    const updated = await prisma.civicDate.update({
      where: { id },
      data: { isActive },
    });
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Error toggling civic date status:", error);
    return { success: false, error: "No se pudo cambiar el estado de la fecha cívica." };
  }
}

export async function resetCivicDatesSeedAction() {
  try {
    const session = await getSession();
    const userRole = session?.user?.role || "USER";
    const isAdmin = userRole === "ADMIN" || userRole === "SUPERADMIN";

    if (!isAdmin) {
      return { success: false, error: "No tienes permisos de administrador para realizar esta acción." };
    }

    for (const item of CIVIC_DATES_DATA) {
      const existing = await prisma.civicDate.findFirst({
        where: { name: item.name },
      });

      if (existing) {
        await prisma.civicDate.update({
          where: { id: existing.id },
          data: {
            date: item.date,
            fixedYear: item.fixedYear ?? null,
            category: item.category as CivicDateCategory,
            region: item.region,
            description: item.description ?? null,
            importance: item.importance,
            hashtags: item.hashtags ?? [],
            industries: item.industries ?? [],
            isActive: true,
          },
        });
      } else {
        await prisma.civicDate.create({
          data: {
            name: item.name,
            date: item.date,
            fixedYear: item.fixedYear ?? null,
            category: item.category as CivicDateCategory,
            region: item.region,
            description: item.description ?? null,
            importance: item.importance,
            hashtags: item.hashtags ?? [],
            industries: item.industries ?? [],
            isActive: true,
          },
        });
      }
    }

    const allDbDates = await prisma.civicDate.findMany({
      orderBy: { createdAt: "desc" },
    });

    const seenKeys = new Set<string>();
    const duplicateIdsToDelete: string[] = [];

    for (const d of allDbDates) {
      const key = `${d.name.toLowerCase().trim()}_${d.date}`;
      if (seenKeys.has(key)) {
        duplicateIdsToDelete.push(d.id);
      } else {
        seenKeys.add(key);
      }
    }

    if (duplicateIdsToDelete.length > 0) {
      await prisma.civicDate.deleteMany({
        where: { id: { in: duplicateIdsToDelete } },
      });
    }

    const finalDates = await prisma.civicDate.findMany({
      orderBy: [{ date: "asc" }, { importance: "desc" }],
    });

    const serialized = finalDates.map((item: any) => ({
      ...item,
      createdAt: item.createdAt?.toISOString ? item.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: item.updatedAt?.toISOString ? item.updatedAt.toISOString() : new Date().toISOString(),
    }));

    return { success: true, data: serialized };
  } catch (error: any) {
    console.error("Error resetting civic dates:", error);
    return { success: false, error: "No se pudo re-sembrar el catálogo de fechas." };
  }
}

export async function deleteCivicDateAction(id: string) {
  try {
    const session = await getSession();
    const userRole = session?.user?.role || "USER";
    const isAdmin = userRole === "ADMIN" || userRole === "SUPERADMIN";

    if (!isAdmin) {
      return { success: false, error: "No tienes permisos de administrador para realizar esta acción." };
    }

    await prisma.civicDate.delete({
      where: { id },
    });
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting civic date:", error);
    return { success: false, error: "No se pudo eliminar la fecha cívica." };
  }
}
