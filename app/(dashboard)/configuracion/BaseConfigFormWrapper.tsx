"use client"

import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"
import { type BaseConfigFormState } from "./BaseConfigForm"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProductManagement } from "./components/ProductManagement"
import { Settings2, ShoppingBag } from "lucide-react"

const BaseConfigForm = dynamic(
    () => import("./BaseConfigForm").then((mod) => mod.BaseConfigForm),
    {
        ssr: false,
        loading: () => (
            <div className="flex h-[50vh] w-full items-center justify-center">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p>Cargando formulario...</p>
                </div>
            </div>
        ),
    }
)

export function BaseConfigFormWrapper({ initialForm }: { initialForm: BaseConfigFormState }) {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Configuración de Negocio</h2>
            </div>

            <Tabs defaultValue="base" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="base" className="flex items-center gap-2">
                        <Settings2 className="w-4 h-4" />
                        Configuración Base
                    </TabsTrigger>
                    <TabsTrigger value="productos" className="flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4" />
                        Productos y Servicios
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="base" className="space-y-4">
                    <BaseConfigForm initialForm={initialForm} />
                </TabsContent>
                <TabsContent value="productos" className="space-y-4">
                    <ProductManagement />
                </TabsContent>
            </Tabs>
        </div>
    )
}
