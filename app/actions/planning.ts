"use server"

import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { z } from "zod"

import { PlanningObjective, PlanningStatus, AssetSource } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { planningOrderSchema, type PlanningOrderInput } from "@/lib/schemas/planning"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function createPlanningOrder(data: PlanningOrderInput) {
  const cookieStore = await cookies()
  const businessId = cookieStore.get("activeBusinessId")?.value

  if (!businessId) {
      return { error: "No active business selected" }
  }

  // Fetch business to get the creator or owner
  const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: { createdBy: true }
  })

  if (!business) return { error: "Business not found" }
  
  const userId = business.createdById 
  
  if (!userId) {
      return { error: "User context not found" }
  }

  try {
      const { dateRange, ...rest } = data
      
      if (!dateRange) {
        return { error: "El rango de fechas es obligatorio" }
      }
      
      const newOrder = await prisma.planningOrder.create({
          data: {
              businessId,
              createdByUserId: userId,
              name: rest.name,
              startDate: dateRange.from,
              endDate: dateRange.to,
              excludedDates: rest.excludedDates,
              objective: rest.objective,
              priorityProductIds: rest.priorityProductIds,
              additionalFocus: rest.additionalFocus,
              references: rest.references,
              frequencyBase: rest.frequencyBase,
              channelRules: rest.channelRules,
              assetSource: rest.assetSource,
              productionNotes: rest.productionNotes,
              status: PlanningStatus.ORDER_CREATED,
              contentStrategy: rest.contentStrategy,
              emotionalTone: rest.emotionalTone,
              contentPillars: rest.contentPillars,
              campaignAudience: rest.campaignAudience,
              callToAction: rest.callToAction,
              keywords: rest.keywords,
              visualStyleOverride: rest.visualStyleOverride,
              offerDetail: rest.offerDetail,
              primaryChannel: rest.primaryChannel,
              focusOnBuyerPains: rest.focusOnBuyerPains,
          }
      })
      
      revalidatePath("/planificacion")
      return { success: true, orderId: newOrder.id }
  } catch (error) {
      console.error("Error creating planning order:", error)
      return { error: "Failed to create planning order" }
  }
}

export async function updatePlanningOrder(orderId: string, data: PlanningOrderInput, options?: { saveAsDraft?: boolean }) {
    try {
        const { dateRange, ...rest } = data
        
        if (!orderId) return { error: "Order ID is required" }

        // Remove strict date check to allow partial updates (Drafts)
        // if (!dateRange) return { error: "El rango de fechas es obligatorio" }

        // Determine status update: if saving as draft, do not change status (keep current). 
        // If submitting (final update), set to ORDER_CREATED.
        const statusUpdate = options?.saveAsDraft ? {} : { status: PlanningStatus.ORDER_CREATED }

        await prisma.planningOrder.update({
            where: { id: orderId },
            data: {
                name: rest.name,
                startDate: dateRange?.from,
                endDate: dateRange?.to,
                excludedDates: rest.excludedDates,
                objective: rest.objective,
                priorityProductIds: rest.priorityProductIds,
                additionalFocus: rest.additionalFocus,
                references: rest.references,
                frequencyBase: rest.frequencyBase,
                channelRules: rest.channelRules,
                assetSource: rest.assetSource,
                productionNotes: rest.productionNotes,
                ...statusUpdate,
                contentStrategy: rest.contentStrategy,
                emotionalTone: rest.emotionalTone,
                contentPillars: rest.contentPillars,
                campaignAudience: rest.campaignAudience,
                callToAction: rest.callToAction,
                keywords: rest.keywords,
                visualStyleOverride: rest.visualStyleOverride,
                offerDetail: rest.offerDetail,
                primaryChannel: rest.primaryChannel,
                focusOnBuyerPains: rest.focusOnBuyerPains,
            }
        })
        
        revalidatePath("/planificacion")
        revalidatePath(`/planificacion/${orderId}`)
        return { success: true, orderId }
    } catch (error) {
        console.error("Error updating planning order:", error)
        return { error: "Failed to update planning order" }
    }
}

export async function getBusinessProducts(businessId: string) {
    return await prisma.product.findMany({
        where: { businessId },
        orderBy: { name: 'asc' }
    })
}

export async function createDraftPlanningOrder(businessId: string) {
    const business = await prisma.business.findUnique({
        where: { id: businessId },
    })

    if (!business || !business.createdById) {
        throw new Error("Business or Creator not found")
    }

    const count = await prisma.planningOrder.count({
        where: { businessId }
    })
    
    // Generate a simple code: PLAN-{Year}-{Count+1}
    const code = `PLAN-${new Date().getFullYear().toString().slice(-2)}${(count + 1).toString().padStart(3, '0')}`

    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    return await prisma.planningOrder.create({
        data: {
            businessId,
            createdByUserId: business.createdById,
            name: code,
            status: PlanningStatus.DRAFT,
            startDate: now,
            endDate: tomorrow,
            objective: PlanningObjective.GENERAR_AWARENESS,
            channelRules: {}, 
            assetSource: AssetSource.MIXED,
            frequencyBase: 1,
            priorityProductIds: [],
        }
    })
}

export async function duplicatePlanningOrder(orderId: string) {
    const order = await prisma.planningOrder.findUnique({
        where: { id: orderId }
    })

    if (!order) return { error: "Order not found" }

    try {
        const { id, createdAt, updatedAt, ...rest } = order
        
        const newOrder = await prisma.planningOrder.create({
            data: {
                ...rest,
                channelRules: rest.channelRules as any, // Fix JSON type mismatch
                name: `Copia de ${order.name}`,
                status: PlanningStatus.DRAFT,
            }
        })
        
        revalidatePath("/planificacion")
        return { success: true, orderId: newOrder.id }
    } catch (error) {
        console.error("Error duplicating order:", error)
        return { error: "Failed to duplicate order" }
    }
}

export async function deletePlanningOrder(orderId: string) {
    try {
        console.log("Attempting to delete order:", orderId)
        console.log("PlanningStatus enum:", PlanningStatus)
        console.log("Setting status to:", PlanningStatus.DELETED)

        const result = await prisma.planningOrder.update({
            where: { id: orderId },
            data: { status: PlanningStatus.DELETED }
        })
        console.log("Update result:", result)
        
        revalidatePath("/planificacion")
        return { success: true }
    } catch (error) {
        console.error("Error deleting order:", error)
        return { error: "Failed to delete order" }
    }
}
export async function sendPlanningToWebhook(orderId: string) {
    try {
        const session = await getServerSession(authOptions())
        const userId = (session?.user as any)?.id

        if (!userId) return { error: "No autorizado" }

        const order = await prisma.planningOrder.findUnique({
            where: { id: orderId },
            include: {
                business: {
                    include: {
                        baseConfig: true
                    }
                }
            }
        })

        if (!order) return { error: "Orden no encontrada" }

        const payload = {
            userId: userId,
            businessId: order.businessId,
            baseConfigId: order.business.baseConfig?.id || null,
            planningOrderId: order.id,
            timestamp: new Date().toISOString()
        }

        const response = await fetch("https://intelexia-labs-n8n.af9gwe.easypanel.host/webhook/planningOrder", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        })

        if (!response.ok) {
            console.error("Webhook failed:", await response.text())
            return { error: "Error al enviar al webhook" }
        }

        // Optional: Update status to indicate it was sent
        // await prisma.planningOrder.update({
        //     where: { id: orderId },
        //     data: { status: PlanningStatus.ORDER_CREATED }
        // })

        revalidatePath("/planificacion")
        return { success: true }
    } catch (error) {
        console.error("Error in sendPlanningToWebhook:", error)
        return { error: "Error interno del servidor" }
    }
}
