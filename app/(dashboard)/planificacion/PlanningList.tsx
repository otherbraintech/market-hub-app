"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar, Eye, FileText, Target, Clock, CheckCircle2, XCircle, Trash, Copy, Loader2, MoreVertical } from "lucide-react"
import { PlanningOrder, PlanningStatus } from "@prisma/client"

import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { duplicatePlanningOrder, deletePlanningOrder, sendPlanningToWebhook } from "@/app/actions/planning"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { PlanningCard } from "./PlanningCard"

interface PlanningListProps {
    orders: PlanningOrder[]
}

export const STATUS_CONFIG: Record<PlanningStatus, { label: string; color: string; icon: React.ComponentType<any> }> = {
    DRAFT: { label: "Borrador", color: "bg-gray-100 text-gray-700", icon: Clock },
    ORDER_CREATED: { label: "Orden Creada", color: "bg-blue-100 text-blue-700", icon: CheckCircle2 },
    IDEAS_GENERATED: { label: "Ideas Listas", color: "bg-purple-100 text-purple-700", icon: CustomSparklesIcon },
    IDEAS_APPROVED: { label: "Aprobado", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
    COMPLETED: { label: "Completado", color: "bg-slate-100 text-slate-700", icon: CheckCircle2 },
    CANCELLED: { label: "Cancelado", color: "bg-red-100 text-red-700", icon: XCircle },
    DELETED: { label: "Eliminado", color: "bg-red-100 text-red-700", icon: Trash },
}

function CustomSparklesIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .962 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.582a.5.5 0 0 1 0 .962L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.962 0z" />
        </svg>
    )
}

export function PlanningList({ orders }: PlanningListProps) {
    const [localOrders, setLocalOrders] = useState<PlanningOrder[]>(orders)
    const [selectedOrder, setSelectedOrder] = useState<PlanningOrder | null>(null)
    const { toast } = useToast()
    const [pendingId, setPendingId] = useState<string | null>(null)

    useEffect(() => {
        setLocalOrders(orders)
    }, [orders])

    const handleDuplicate = async (id: string, name: string) => {
        setPendingId(id)
        const result = await duplicatePlanningOrder(id)
        if (result.success) {
            toast({ title: "Plan duplicado", description: `Se ha creado una copia de ${name}` })
        } else {
            toast({ title: "Error", description: "No se pudo duplicar el plan", variant: "destructive" })
        }
        setPendingId(null)
    }

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de que quieres eliminar este plan?")) return
        setPendingId(id)
        const result = await deletePlanningOrder(id)
        if (result.success) {
            setLocalOrders((prev) => prev.filter((order: any) => order.id !== id))
            toast({ title: "Plan eliminado", description: "El plan ha sido eliminado correctamente" })
        } else {
            toast({ title: "Error", description: "No se pudo eliminar el plan", variant: "destructive" })
        }
        setPendingId(null)
    }

    const handleSendOrder = async (id: string, name: string) => {
        setPendingId(id)
        const result = await sendPlanningToWebhook(id)
        if (result.success) {
            toast({ title: "Orden enviada", description: `La orden ${name} ha sido enviada correctamente.` })
        } else {
            toast({ title: "Error", description: result.error || "No se pudo enviar la orden", variant: "destructive" })
        }
        setPendingId(null)
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {localOrders.map((order) => (
                    <PlanningCard
                        key={order.id}
                        order={order}
                        isPending={pendingId}
                        onDuplicate={handleDuplicate}
                        onDelete={handleDelete}
                        onSend={handleSendOrder}
                        onView={setSelectedOrder}
                    />
                ))}
            </div>

            <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
                <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="text-xl">{selectedOrder?.name}</DialogTitle>
                        <DialogDescription>
                            Creada el {selectedOrder && format(new Date(selectedOrder.createdAt), "PPP p", { locale: es })}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedOrder && (
                        <ScrollArea className="flex-1 pr-4 -mr-4">
                            <div className="space-y-6 py-4">
                                {/* Estado y Fechas */}
                                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/20 rounded-lg border">
                                    <div>
                                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Estado</h4>
                                        <Badge variant="outline" className={STATUS_CONFIG[selectedOrder.status].color}>
                                            {STATUS_CONFIG[selectedOrder.status].label}
                                        </Badge>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Período</h4>
                                        <p className="text-sm font-medium">
                                            {format(new Date(selectedOrder.startDate), "PPP", { locale: es })} <br />
                                            <span className="text-muted-foreground text-xs">hasta</span> <br />
                                            {format(new Date(selectedOrder.endDate), "PPP", { locale: es })}
                                        </p>
                                    </div>
                                </div>

                                {/* Estrategia */}
                                <div>
                                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                        <Target className="w-5 h-5" /> Estrategia
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <DetailItem label="Objetivo" value={selectedOrder.objective.replace(/_/g, " ")} />
                                        <DetailItem label="Estrategia Narrativa" value={selectedOrder.contentStrategy || "N/A"} />
                                        <DetailItem label="Tono Emocional" value={selectedOrder.emotionalTone || "N/A"} />
                                        <DetailItem label="Frecuencia Base" value={`${selectedOrder.frequencyBase || 1} posts/día`} />
                                    </div>

                                    {selectedOrder.contentPillars && selectedOrder.contentPillars.length > 0 && (
                                        <div className="mt-4">
                                            <h4 className="text-sm font-medium text-muted-foreground mb-2">Pilares Temáticos</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedOrder.contentPillars.map((pillar: string) => (
                                                    <Badge key={pillar} variant="secondary">{pillar.replace(/_/g, " ")}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <Separator />

                                {/* Detalles Adicionales */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                        <FileText className="w-5 h-5" /> Detalles de Producción
                                    </h3>
                                    {selectedOrder.additionalFocus && (
                                        <div className="bg-yellow-50 p-3 rounded-md border border-yellow-100 dark:bg-yellow-900/20 dark:border-yellow-900/50">
                                            <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-500 mb-1">Eje Temático Adicional</h4>
                                            <p className="text-sm text-yellow-900/80 dark:text-yellow-200/80">{selectedOrder.additionalFocus}</p>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 gap-4">
                                        <DetailItem label="Fuente de Material" value={selectedOrder.assetSource.replace(/_/g, " ")} />
                                        {selectedOrder.references && (
                                            <div>
                                                <h4 className="text-sm font-medium text-muted-foreground">Referencias</h4>
                                                <p className="text-sm mt-1 whitespace-pre-wrap">{selectedOrder.references}</p>
                                            </div>
                                        )}
                                        {selectedOrder.productionNotes && (
                                            <div>
                                                <h4 className="text-sm font-medium text-muted-foreground">Notas de Producción</h4>
                                                <p className="text-sm mt-1 italic text-muted-foreground">{selectedOrder.productionNotes}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </ScrollArea>
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}

function DetailItem({ label, value }: { label: string, value: string }) {
    return (
        <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{label}</h4>
            <p className="text-sm font-medium capitalize">{value.toLowerCase()}</p>
        </div>
    )
}
