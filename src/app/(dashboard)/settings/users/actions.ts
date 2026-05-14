'use server'

import { updateUserLimit } from "@/modules/users/services"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getSession } from "@/lib/auth"

export async function updateUserLimitAction(
  userId: string, 
  maxBusinesses: number,
  maxCompetitors: number
) {
  try {
    const session = await getSession();
    // ... logic ...
    await prisma.user.update({
      where: { id: userId },
      data: { maxBusinesses, maxCompetitors }
    })
    revalidatePath('/settings/users')
    return { success: true }
  } catch (error) {
    console.error('Error updating user limit:', error)
    return { success: false, error: 'Error al actualizar el límite' }
  }
}
