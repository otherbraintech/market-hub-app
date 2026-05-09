
import { cookies } from "next/headers"
import { notFound, redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { EnhancedPlanningOrderForm } from "../crear/PlanningOrderForm"
import { PlanningOrderInput, PlanningObjective, AssetSource, ContentStrategy, EmotionalTone, ContentPillar } from "@/lib/schemas/planning"

export default async function PlanningOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const cookieStore = await cookies()
    const businessId = cookieStore.get("activeBusinessId")?.value

    if (!businessId) {
        return <div>Seleccione un negocio primero.</div>
    }

    const order = await prisma.planningOrder.findUnique({
        where: { id },
        include: {
            business: { select: { name: true } }
        }
    })

    if (!order) {
        notFound()
    }

    // Check if it's draft. If so, show form.
    if (order.status === "DRAFT" || order.status === "ORDER_CREATED") {
        const [baseConfig, products] = await Promise.all([
            prisma.businessBaseConfig.findUnique({
                where: { businessId: order.businessId },
                include: { business: { select: { name: true } } },
            }),
            prisma.product.findMany({
                where: { businessId: order.businessId },
                select: { id: true, name: true },
                orderBy: { name: "asc" },
            }),
        ])

        // Map Prisma Order to Form Input
        const initialData: Partial<PlanningOrderInput> = {
            name: order.name ?? undefined,
            dateRange: {
                from: order.startDate,
                to: order.endDate
            },
            objective: order.objective as PlanningObjective,
            priorityProductIds: order.priorityProductIds,
            additionalFocus: order.additionalFocus || "",
            references: order.references || "",
            frequencyBase: order.frequencyBase,
            channelRules: order.channelRules as any,
            assetSource: order.assetSource as AssetSource,
            productionNotes: order.productionNotes || "",
            excludedDates: (order.excludedDates as Date[]) || [],
            contentStrategy: (order.contentStrategy as ContentStrategy) || undefined,
            contentPillars: (order.contentPillars as ContentPillar[]) || [],
            emotionalTone: (order.emotionalTone as EmotionalTone) || undefined,
            campaignAudience: order.campaignAudience || "",
            callToAction: order.callToAction || "",
            keywords: order.keywords || [],
            visualStyleOverride: order.visualStyleOverride || "",
            offerDetail: order.offerDetail || "",
            primaryChannel: order.primaryChannel || "",
            focusOnBuyerPains: order.focusOnBuyerPains,
        }

        const activeChannels = baseConfig?.activeChannels
            ? baseConfig.activeChannels.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
            : []

        return (
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">
                        {order.status === 'DRAFT' ? 'Crear Orden de Generación de Ideas para Planificación de Calendario de Contenido' : 'Editar Planificación'}
                    </h2>
                </div>
                <div className="border-t pt-4">
                    <EnhancedPlanningOrderForm
                        products={products}
                        businessConfig={{
                            id: order.businessId,
                            name: baseConfig?.business.name ?? "Tu Negocio",
                            tone: baseConfig?.brandTone ?? "Profesional",
                            channels: activeChannels,
                            buyerPersona: {
                                ageRange: baseConfig?.targetAudienceAllAges ? "Todas las edades" : (baseConfig?.targetAudienceAgeRanges?.join(", ") || "No definido"),
                                pains: baseConfig?.mainPainPoint ? [baseConfig.mainPainPoint] : [],
                                desires: baseConfig?.mainDesire ? [baseConfig.mainDesire] : []
                            }
                        }}
                        orderId={order.id}
                        initialData={initialData}
                    />
                </div>
            </div>
        )
    }

    // If generic view (not implemented yet requested by user flow, but fallback to prevent error)
    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold">{order.name}</h1>
            <p className="text-muted-foreground">{order.status}</p>
            {/* We could reuse PlanningList details dialog content here or redirect back with a query param to open dialog */}
        </div>
    )
}
