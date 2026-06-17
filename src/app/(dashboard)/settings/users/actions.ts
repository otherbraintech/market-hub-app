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
    if (!session) {
      return { success: false, error: 'No autorizado' }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { maxBusinesses, maxCompetitors }
    })

    // Si el usuario editado es el que tiene la sesión activa, actualizamos la cookie de sesión
    const currentUserId = session.userId || session.user?.id;
    if (currentUserId === userId) {
      const { cookies } = await import("next/headers");
      const { encrypt } = await import("@/lib/auth");
      const newSessionPayload = {
        ...session,
        user: {
          ...session.user,
          maxBusinesses,
          maxCompetitors
        }
      };
      const expires = new Date(Date.now() + 120 * 60 * 1000); // 2 hours
      const encryptedSession = await encrypt(newSessionPayload);
      (await cookies()).set("session", encryptedSession, {
        expires,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/"
      });
    }

    revalidatePath('/settings/users')
    revalidatePath('/business')
    return { success: true }
  } catch (error) {
    console.error('Error updating user limit:', error)
    return { success: false, error: 'Error al actualizar el límite' }
  }
}
