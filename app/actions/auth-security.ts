"use server"

import { prisma } from "@/lib/prisma"
import { randomBytes, scryptSync } from "crypto"
import { revalidatePath } from "next/cache"
import { sendPasswordResetEmail } from "@/lib/email"

// Helper to hash passwords (reused from auth/signup logic)
function hashPassword(password: string): string {
    const salt = randomBytes(16).toString("hex")
    const derived = scryptSync(password, salt, 64)
    return `${salt}:${derived.toString("hex")}`
}

export async function updatePassword(userId: string, newPass: string) {
    if (!newPass || newPass.length < 6) {
        return { error: "La contraseña debe tener al menos 6 caracteres" }
    }

    try {
        const hashedPassword = hashPassword(newPass)
        await prisma.user.update({
            where: { id: userId },
            data: { passwordHash: hashedPassword }
        })
        revalidatePath("/cuenta")
        return { success: true }
    } catch (e) {
        return { error: "Error al actualizar la contraseña" }
    }
}

export async function requestPasswordReset(email: string) {
    try {
        const user = await prisma.user.findUnique({ where: { email } })
        if (!user) {
            // Return success even if not found to prevent enumeration
            return { success: true, message: "Si el correo existe, recibirás un código." }
        }

        // Generate a simple 6-digit code for the simulation
        const code = Math.floor(100000 + Math.random() * 900000).toString()
        
        // Set expiry to 1 hour from now
        const expiry = new Date(Date.now() + 60 * 60 * 1000)

        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken: code,
                resetTokenExpiry: expiry
            } as any
        })

        // Send email via Resend
        const emailResult = await sendPasswordResetEmail(email, code)
        
        if (emailResult.error) {
            console.error("Error sending email:", emailResult.error)
            return { success: false, message: "Error al enviar el correo. Intenta de nuevo." }
        }

        return { 
            success: true, 
            message: "Código enviado a tu correo.",
        }
    } catch (error) {
        console.error("Error in requestPasswordReset:", error)
        return { success: false, message: "Error interno: " + (error as Error).message }
    }
}

export async function resetPasswordWithCode(email: string, code: string, newPass: string) {
    if (!code) return { error: "Código requerido" }
    if (!newPass || newPass.length < 6) return { error: "La contraseña debe tener al menos 6 caracteres" }

    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const user = await prisma.user.findUnique({ where: { email } }) as any
        if (!user || !user.resetToken || !user.resetTokenExpiry) {
            return { error: "Código inválido o expirado" }
        }

        if (user.resetToken !== code) {
            return { error: "Código incorrecto" }
        }

        if (new Date() > user.resetTokenExpiry) {
            return { error: "El código ha expirado" }
        }

        const hashedPassword = hashPassword(newPass)

        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null
            } as any
        })

        return { success: true }
    } catch (error) {
        console.error("Error in resetPasswordWithCode:", error)
        return { error: "Error interno: " + (error as Error).message }
    }
}

export async function validateResetCode(email: string, code: string) {
    if (!code) return { error: "Código requerido" }

    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const user = await prisma.user.findUnique({ where: { email } }) as any
        if (!user || !user.resetToken || !user.resetTokenExpiry) {
            return { error: "Código inválido o expirado" }
        }

        if (user.resetToken !== code) {
            return { error: "Código incorrecto" }
        }

        if (new Date() > user.resetTokenExpiry) {
            return { error: "El código ha expirado" }
        }

        return { success: true }
    } catch (error) {
        console.error("Error in validateResetCode:", error)
        return { error: "Error interno: " + (error as Error).message }
    }
}

