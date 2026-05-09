"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

export async function getProducts() {
    const cookieStore = await cookies()
    const businessId = cookieStore.get("activeBusinessId")?.value

    if (!businessId) return []

    return await prisma.product.findMany({
        where: { businessId },
        orderBy: { createdAt: "desc" }
    })
}

export async function createProduct(data: { name: string, description?: string, imageUrl?: string }) {
    const cookieStore = await cookies()
    const businessId = cookieStore.get("activeBusinessId")?.value

    if (!businessId) return { error: "No hay un negocio seleccionado" }

    try {
        const product = await prisma.product.create({
            data: {
                ...data,
                businessId
            }
        })
        revalidatePath("/configuracion")
        return { success: true, product }
    } catch (error) {
        console.error("Error creating product:", error)
        return { error: "No se pudo crear el producto" }
    }
}

export async function updateProduct(id: string, data: { name: string, description?: string, imageUrl?: string }) {
    try {
        const product = await prisma.product.update({
            where: { id },
            data
        })
        revalidatePath("/configuracion")
        return { success: true, product }
    } catch (error) {
        console.error("Error updating product:", error)
        return { error: "No se pudo actualizar el producto" }
    }
}

export async function deleteProduct(id: string) {
    try {
        await prisma.product.delete({
            where: { id }
        })
        revalidatePath("/configuracion")
        return { success: true }
    } catch (error) {
        console.error("Error deleting product:", error)
        return { error: "No se pudo eliminar el producto" }
    }
}
