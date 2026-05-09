import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { EnhancedPlanningOrderForm } from "../../crear/PlanningOrderForm"
import { cookies } from "next/headers"

interface EditPlanningPageProps {
    params: Promise<{
        id: string
    }>
}

export default async function EditPlanningPage({ params }: EditPlanningPageProps) {
    const { id } = await params
    const cookieStore = await cookies()
    const businessId = cookieStore.get("activeBusinessId")?.value

    if (!businessId) {
        return (
            <div className="flex h-[50vh] w-full items-center justify-center">
                <p className="text-muted-foreground">Por favor, selecciona un negocio para continuar.</p>
            </div>
        )
    }

    const order = await prisma.planningOrder.findUnique({
        where: { id },
    })

    if (!order) {
        notFound()
    }

    // Verify ownership/business match (optional but good practice)
    if (order.businessId !== businessId) {
        redirect("/planificacion")
    }

    const [baseConfig, products] = await Promise.all([
        prisma.businessBaseConfig.findUnique({
            where: { businessId },
            include: { business: { select: { name: true } } },
        }),
        prisma.product.findMany({
            where: { businessId },
            select: { id: true, name: true, imageUrl: true },
            orderBy: { name: "asc" },
        }),
    ])

    const activeChannels = baseConfig?.activeChannels
        ? baseConfig.activeChannels.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
        : []

    // Map Prisma types to Form types if necessary
    // The form expects PlanningOrderInput (partial)
    const initialData = {
        name: order.name ?? "",
        objective: order.objective,
        priorityProductIds: order.priorityProductIds,
        additionalFocus: order.additionalFocus || "",
        references: order.references || "",
        frequencyBase: order.frequencyBase,
        channelRules: order.channelRules as any,
        assetSource: order.assetSource,
        productionNotes: order.productionNotes || "",
        excludedDates: order.excludedDates,
        dateRange: {
            from: order.startDate,
            to: order.endDate
        },
        contentStrategy: order.contentStrategy || undefined,
        contentPillars: order.contentPillars,
        emotionalTone: order.emotionalTone || undefined,
        campaignAudience: order.campaignAudience || "",
        callToAction: order.callToAction || "",
        keywords: order.keywords,
        visualStyleOverride: order.visualStyleOverride || "",
        offerDetail: order.offerDetail || "",
        primaryChannel: order.primaryChannel || "",
        focusOnBuyerPains: order.focusOnBuyerPains,
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Editar Orden de Planificación</h2>
                    <p className="text-muted-foreground">
                        Modifica los parámetros de tu estrategia.
                    </p>
                </div>
            </div>
            <div className="border-t pt-4">
                <EnhancedPlanningOrderForm
                    products={products}
                    businessConfig={{
                        id: businessId,
                        name: baseConfig?.business.name ?? "Tu Negocio",
                        tone: baseConfig?.brandTone ?? "Profesional",
                        channels: activeChannels,
                        buyerPersona: {
                            ageRange: baseConfig?.targetAudienceAllAges ? "Todas las edades" : (baseConfig?.targetAudienceAgeRanges?.join(", ") || "No definido"),
                            pains: baseConfig?.mainPainPoint ? [baseConfig.mainPainPoint] : [],
                            desires: baseConfig?.mainDesire ? [baseConfig.mainDesire] : []
                        }
                    }}
                    orderId={id}
                    initialData={initialData}
                />
            </div>
        </div>
    )
}
