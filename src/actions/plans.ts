"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getUserSessionAction() {
  return await getSession();
}

const DEFAULT_PLANS = [
  {
    slug: "profesional",
    name: "Profesional",
    tagline: "Para pymes y emprendimientos",
    price: 200,
    currency: "USD",
    billingPeriod: "mes",
    postsPerMonth: 16,
    postsPerWeek: "4 publicaciones/semana",
    maxBusinesses: 1,
    maxCompetitors: 3,
    badge: null,
    isPopular: false,
    color: "blue",
    features: [
      "8 videos cortos verticales",
      "4 carruseles (5+ slides)",
      "4 artes estáticos",
      "FB, IG y TikTok",
      "Auditoría digital mensual",
      "Dashboard de analítica"
    ],
    order: 1
  },
  {
    slug: "premium",
    name: "Premium",
    tagline: "Para marcas en crecimiento",
    price: 300,
    currency: "USD",
    billingPeriod: "mes",
    postsPerMonth: 22,
    postsPerWeek: "5-6 publicaciones/semana",
    maxBusinesses: 1,
    maxCompetitors: 5,
    badge: "Más popular",
    isPopular: true,
    color: "purple",
    features: [
      "12 videos cortos verticales",
      "6 carruseles (5+ slides)",
      "4 artes estáticos",
      "FB, IG y TikTok",
      "Auditoría digital quincenal",
      "Matriz de mejora continua",
      "Prioridad en generación IA"
    ],
    order: 2
  },
  {
    slug: "agencia",
    name: "Agencia",
    tagline: "Para agencias y múltiples negocios",
    price: 1000,
    currency: "USD",
    billingPeriod: "mes",
    postsPerMonth: 22,
    postsPerWeek: "5-6 publicaciones/semana",
    maxBusinesses: 10,
    maxCompetitors: 20,
    badge: null,
    isPopular: false,
    color: "indigo",
    features: [
      "Hasta 10 negocios incluidos",
      "+$150 por cuenta extra",
      "22 posteos por cada cuenta",
      "Distribución del Plan Premium",
      "FB, IG y TikTok por negocio",
      "Dashboard consolidado",
      "Gestor de cuenta dedicado"
    ],
    order: 3
  }
];

function getSubscriptionPlanModel() {
  const p = prisma as any;
  if (p.subscriptionPlan) return p.subscriptionPlan;

  try {
    const { PrismaClient } = require("@prisma/client");
    const { PrismaPg } = require("@prisma/adapter-pg");
    const { Pool } = require("pg");
    const pool = new Pool({ 
      connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@72.61.53.4:5455/markethub", 
      max: 5 
    });
    const adapter = new PrismaPg(pool);
    const freshClient = new PrismaClient({ adapter });
    (globalThis as any).prisma_db = freshClient;
    return freshClient.subscriptionPlan;
  } catch (err) {
    console.error("Error initializing fresh PrismaClient:", err);
    return null;
  }
}

export async function getSubscriptionPlansAction() {
  try {
    const model = getSubscriptionPlanModel();
    if (!model) {
      return { success: true, plans: DEFAULT_PLANS as any };
    }

    let plans = await model.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" }
    });

    // Si la tabla está vacía o faltan planes, sembrar/actualizar en PostgreSQL
    if (!plans || plans.length === 0) {
      console.log("Sembrando planes de suscripción por defecto en PostgreSQL...");
      try {
        for (const p of DEFAULT_PLANS) {
          await model.upsert({
            where: { slug: p.slug },
            create: p,
            update: {}
          });
        }
        plans = await model.findMany({
          where: { isActive: true },
          orderBy: { order: "asc" }
        });
      } catch (seedErr) {
        console.error("Error seeding plans:", seedErr);
      }
    }

    if (!plans || plans.length === 0) {
      plans = DEFAULT_PLANS as any;
    }

    return { success: true, plans };
  } catch (error: any) {
    console.error("Error in getSubscriptionPlansAction:", error);
    return { success: true, plans: DEFAULT_PLANS as any };
  }
}

export async function updateSubscriptionPlanAction(planId: string, data: {
  name: string;
  tagline?: string;
  price: number;
  postsPerMonth: number;
  postsPerWeek?: string;
  maxBusinesses: number;
  maxCompetitors: number;
  badge?: string | null;
  isPopular?: boolean;
  features: string[];
}) {
  try {
    const session = await getSession();
    const userRole = session?.user?.role || session?.role;
    if (!session || (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN")) {
      return { success: false, error: "No tienes permisos de Administrador para modificar los planes de suscripción." };
    }

    const model = getSubscriptionPlanModel();
    if (!model) {
      return { success: false, error: "No se pudo acceder al cliente de Base de Datos." };
    }

    // Buscar por ID o por Slug
    let target = await model.findFirst({
      where: {
        OR: [
          { id: planId },
          { slug: planId }
        ]
      }
    });

    let updated;
    if (target) {
      updated = await model.update({
        where: { id: target.id },
        data: {
          name: data.name,
          tagline: data.tagline,
          price: data.price,
          postsPerMonth: data.postsPerMonth,
          postsPerWeek: data.postsPerWeek,
          maxBusinesses: data.maxBusinesses,
          maxCompetitors: data.maxCompetitors,
          badge: data.badge || null,
          isPopular: !!data.isPopular,
          features: data.features,
          updatedAt: new Date()
        }
      });
    } else {
      updated = await model.create({
        data: {
          slug: planId,
          name: data.name,
          tagline: data.tagline,
          price: data.price,
          postsPerMonth: data.postsPerMonth,
          postsPerWeek: data.postsPerWeek,
          maxBusinesses: data.maxBusinesses,
          maxCompetitors: data.maxCompetitors,
          badge: data.badge || null,
          isPopular: !!data.isPopular,
          features: data.features
        }
      });
    }

    revalidatePath("/plans");
    revalidatePath("/settings/plans");
    return { success: true, plan: updated };
  } catch (error: any) {
    console.error("Error in updateSubscriptionPlanAction:", error);
    return { success: false, error: error?.message || "Error al actualizar el plan." };
  }
}
