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
    const where: any = {
      isActive: true,
    };

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

    const serialized = civicDates.map((item: any) => ({
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
