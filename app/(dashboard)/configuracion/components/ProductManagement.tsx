"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Image as ImageIcon, Loader2, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { uploadMedia } from "@/lib/upload"
import { createProduct, updateProduct, deleteProduct, getProducts } from "@/app/actions/products"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

export function ProductManagement() {
    const [products, setProducts] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [uploadingId, setUploadingId] = useState<string | null>(null)
    const { toast } = useToast()

    const [newProduct, setNewProduct] = useState({
        name: "",
        description: "",
        imageUrl: ""
    })

    useEffect(() => {
        loadProducts()
    }, [])

    async function loadProducts() {
        setIsLoading(true)
        const data = await getProducts()
        setProducts(data)
        setIsLoading(false)
    }

    async function handleAddProduct() {
        if (!newProduct.name) return
        setIsSaving(true)
        const res = await createProduct(newProduct)
        if (res.success) {
            toast({ title: "Producto creado", description: "El producto se ha añadido correctamente." })
            setNewProduct({ name: "", description: "", imageUrl: "" })
            loadProducts()
        } else {
            toast({ title: "Error", description: res.error, variant: "destructive" })
        }
        setIsSaving(false)
    }

    async function handleDeleteProduct(id: string) {
        if (!confirm("¿Estás seguro de eliminar este producto?")) return
        const res = await deleteProduct(id)
        if (res.success) {
            toast({ title: "Producto eliminado" })
            loadProducts()
        }
    }

    async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>, productId?: string) {
        const file = e.target.files?.[0]
        if (!file) return

        const targetId = productId || "new"
        setUploadingId(targetId)

        const url = await uploadMedia(file)
        if (url) {
            if (productId) {
                // Update existing product
                await updateProduct(productId, { imageUrl: url, name: products.find(p => p.id === productId).name })
                loadProducts()
            } else {
                setNewProduct(prev => ({ ...prev, imageUrl: url }))
            }
            toast({ title: "Imagen subida", description: "La imagen se ha cargado correctamente." })
        } else {
            toast({ title: "Error", description: "No se pudo subir la imagen", variant: "destructive" })
        }
        setUploadingId(null)
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Package className="w-5 h-5 text-primary" />
                        Gestionar Productos y Servicios
                    </CardTitle>
                    <CardDescription>
                        Añade los productos o servicios que ofreces para usarlos en tus planificaciones.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {/* New Product Form */}
                        <Card className="border-dashed border-2">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm">Nuevo Producto/Servicio</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Nombre</Label>
                                    <Input
                                        placeholder="Nombre del producto"
                                        value={newProduct.name}
                                        onChange={e => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Descripción</Label>
                                    <Textarea
                                        placeholder="Breve descripción..."
                                        value={newProduct.description}
                                        onChange={e => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                                        className="h-20 resize-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Imagen</Label>
                                    <div className="flex items-center gap-4">
                                        <div className="relative w-16 h-16 rounded-md border bg-muted flex items-center justify-center overflow-hidden">
                                            {newProduct.imageUrl ? (
                                                <Image src={newProduct.imageUrl} alt="Preview" fill className="object-cover" />
                                            ) : (
                                                <ImageIcon className="text-muted-foreground w-6 h-6" />
                                            )}
                                            {uploadingId === "new" && (
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                                                </div>
                                            )}
                                        </div>
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            onChange={e => handleImageUpload(e)}
                                            className="text-xs"
                                        />
                                    </div>
                                </div>
                                <Button
                                    className="w-full"
                                    onClick={handleAddProduct}
                                    disabled={isSaving || !newProduct.name}
                                >
                                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                                    Agregar Producto
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Existing Products List */}
                        {isLoading ? (
                            <div className="col-span-full flex justify-center py-10">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            products.map(product => (
                                <Card key={product.id} className="overflow-hidden group">
                                    <div className="relative aspect-video bg-muted border-b">
                                        {product.imageUrl ? (
                                            <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
                                        ) : (
                                            <div className="flex items-center justify-center h-full">
                                                <Package className="w-10 h-10 text-muted-foreground/30" />
                                            </div>
                                        )}
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => handleDeleteProduct(product.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <CardHeader className="p-3">
                                        <CardTitle className="text-base truncate">{product.name}</CardTitle>
                                        <CardDescription className="line-clamp-2 text-xs h-8">
                                            {product.description || "Sin descripción"}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-3 pt-0 flex gap-2">
                                        <div className="relative flex-1">
                                            <input
                                                type="file"
                                                id={`upload-${product.id}`}
                                                className="hidden"
                                                accept="image/*"
                                                onChange={e => handleImageUpload(e, product.id)}
                                            />
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full text-xs h-7"
                                                asChild
                                            >
                                                <label htmlFor={`upload-${product.id}`} className="cursor-pointer">
                                                    {uploadingId === product.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <ImageIcon className="w-3 h-3 mr-1" />}
                                                    {product.imageUrl ? "Cambiar Imagen" : "Subir Imagen"}
                                                </label>
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
