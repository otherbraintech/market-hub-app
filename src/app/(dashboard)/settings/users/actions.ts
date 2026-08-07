'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

/**
 * Actualiza límites, rol y datos de un usuario existente.
 */
/**
 * Actualiza límites, rol, plan y datos de un usuario existente.
 */
export async function updateUserLimitAction(
  userId: string, 
  maxBusinesses: number,
  maxCompetitors: number,
  role?: string,
  name?: string,
  plan?: string
) {
  try {
    const session = await getSession();
    if (!session || (session.user?.role !== "SUPER_ADMIN" && session.user?.role !== "ADMIN")) {
      return { success: false, error: 'No tienes permisos de Administrador para realizar esta acción.' };
    }

    const dataToUpdate: any = { maxBusinesses, maxCompetitors };
    if (role) dataToUpdate.role = role;
    if (name) dataToUpdate.name = name;
    if (plan) dataToUpdate.plan = plan;

    await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate
    });

    // Si el usuario editado es el que tiene la sesión activa, actualizar su cookie de sesión
    const currentUserId = session.userId || session.user?.id;
    if (currentUserId === userId) {
      const { cookies } = await import("next/headers");
      const { encrypt } = await import("@/lib/auth");
      const newSessionPayload = {
        ...session,
        user: {
          ...session.user,
          name: name || session.user.name,
          role: role || session.user.role,
          plan: plan || session.user.plan || "FREE",
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

    revalidatePath('/settings/users');
    revalidatePath('/settings');
    revalidatePath('/business');
    return { success: true };
  } catch (error: any) {
    console.error('Error updating user limit:', error);
    return { success: false, error: error?.message || 'Error al actualizar el usuario' };
  }
}

/**
 * Crea un nuevo usuario en el sistema.
 */
export async function createUserAction(data: {
  username: string;
  name: string;
  password: string;
  role: string;
  plan?: string;
  maxBusinesses?: number;
  maxCompetitors?: number;
}) {
  try {
    const session = await getSession();
    if (!session || (session.user?.role !== "SUPER_ADMIN" && session.user?.role !== "ADMIN")) {
      return { success: false, error: 'No autorizado para crear usuarios.' };
    }

    const cleanUsername = data.username.trim().toLowerCase();
    if (cleanUsername.length < 3) {
      return { success: false, error: 'El nombre de usuario debe tener al menos 3 caracteres.' };
    }

    if (data.password.length < 6) {
      return { success: false, error: 'La contraseña debe tener al menos 6 caracteres.' };
    }

    const existingUser = await prisma.user.findUnique({
      where: { username: cleanUsername }
    });

    if (existingUser) {
      return { success: false, error: `El nombre de usuario '${cleanUsername}' ya está registrado.` };
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const newUser = await prisma.user.create({
      data: {
        username: cleanUsername,
        name: data.name.trim(),
        password: hashedPassword,
        role: data.role || "USER",
        plan: data.plan || "FREE",
        maxBusinesses: data.maxBusinesses ?? 1,
        maxCompetitors: data.maxCompetitors ?? 3
      }
    });

    revalidatePath('/settings/users');
    revalidatePath('/settings');
    return { success: true, user: newUser };
  } catch (error: any) {
    console.error("Error in createUserAction:", error);
    return { success: false, error: error?.message || "Error al crear el usuario." };
  }
}

/**
 * Restablece la contraseña de un usuario.
 */
export async function resetUserPasswordAction(userId: string, newPassword: string) {
  try {
    const session = await getSession();
    if (!session || (session.user?.role !== "SUPER_ADMIN" && session.user?.role !== "ADMIN")) {
      return { success: false, error: 'No autorizado para restablecer contraseñas.' };
    }

    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'La nueva contraseña debe tener al menos 6 caracteres.' };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    revalidatePath('/settings/users');
    return { success: true };
  } catch (error: any) {
    console.error("Error in resetUserPasswordAction:", error);
    return { success: false, error: error?.message || "Error al restablecer la contraseña." };
  }
}

/**
 * Elimina un usuario del sistema.
 */
export async function deleteUserAction(userId: string) {
  try {
    const session = await getSession();
    if (!session || (session.user?.role !== "SUPER_ADMIN" && session.user?.role !== "ADMIN")) {
      return { success: false, error: 'No autorizado para eliminar usuarios.' };
    }

    const currentUserId = session.userId || session.user?.id;
    if (currentUserId === userId) {
      return { success: false, error: 'No puedes eliminar tu propia cuenta de usuario en uso.' };
    }

    await prisma.user.delete({
      where: { id: userId }
    });

    revalidatePath('/settings/users');
    return { success: true };
  } catch (error: any) {
    console.error("Error in deleteUserAction:", error);
    return { success: false, error: error?.message || "Error al eliminar el usuario." };
  }
}
