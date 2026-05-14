'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function upsertCompetitorAction(
  businessId: string,
  competitorId: string | undefined,
  data: {
    name: string
    website?: string
    facebook?: string
    instagram?: string
    tiktok?: string
  }
) {
  try {
    if (competitorId) {
      await prisma.competitor.update({
        where: { id: competitorId },
        data
      })
    } else {
      // Check limit
      const user = await prisma.user.findFirst({
        where: { businesses: { some: { id: businessId } } },
        select: { maxCompetitors: true }
      })

      const count = await prisma.competitor.count({ where: { businessId } })
      
      if (user && count >= user.maxCompetitors) {
        return { success: false, error: `Límite alcanzado (${user.maxCompetitors})` }
      }

      await prisma.competitor.create({
        data: { ...data, businessId }
      })
    }

    revalidatePath(`/business/${businessId}`)
    return { success: true }
  } catch (error) {
    console.error('Competitor Action Error:', error)
    return { success: false, error: 'Error al procesar competidor' }
  }
}

export async function deleteCompetitorAction(businessId: string, competitorId: string) {
  try {
    await prisma.competitor.delete({ where: { id: competitorId } })
    revalidatePath(`/business/${businessId}`)
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Error al eliminar competidor' }
  }
}
