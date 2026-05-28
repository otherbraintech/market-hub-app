"use client";

import { useState } from "react";
import { ProductWithTypes } from "@/modules/products";
import { deleteProductAction } from "@/actions/product";
import { ProductForm } from "./product-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Package, MoreHorizontal, Trash, Edit, Plus, Check } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

// Adaptamos el tipo para el formulario, ya convertiremos de vuelta al enviar
import { ProductFormValues } from "@/lib/schemas/product";

interface ProductsListProps {
  businessId: string;
  products: ProductWithTypes[];
}

export function ProductsList({ businessId, products }: ProductsListProps) {
  const [editingProduct, setEditingProduct] = useState<ProductWithTypes | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  async function handleDelete(id: string) {
    if (confirm("¿Estás seguro de eliminar este producto?")) {
      const result = await deleteProductAction(id, businessId);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.error);
      }
    }
  }

  // Helper para convertir el tipo de Prisma al tipo del formulario
  const mapProductToForm = (product: ProductWithTypes): ProductFormValues & { id: string } => {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      shortDesc: product.shortDesc || undefined,
      imageUrl: product.images && (product.images as string[]).length > 0 ? (product.images as string[])[0] : "",
      features: product.features.map(f => ({
        id: f.id,
        name: f.name,
        description: f.description,
        icon: f.icon
      })),
      benefits: product.benefits.map(b => ({
        id: b.id,
        title: b.title,
        description: b.description,
        forPersona: b.forPersona
      })),
      pricing: product.pricing ? {
        currency: product.pricing.currency,
        basePrice: product.pricing.basePrice,
        discountPrice: product.pricing.discountPrice,
        period: product.pricing.period
      } : undefined,
      keywords: product.keywords ? (product.keywords as string[]).join(", ") : "",
      isActive: product.isActive
    };
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Inventario de Productos</h3>
        <Button onClick={() => {
          setEditingProduct(null);
          setIsDialogOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" /> Nuevo Producto
        </Button>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] border rounded-lg bg-muted/20 border-dashed p-8 text-center">
          <div className="p-4 rounded-full bg-background mb-4 shadow-sm">
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">No hay productos registrados</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Los productos son la base para que la IA genere contenido relevante. Agrega tu primer producto.
          </p>
          <Button onClick={() => setIsDialogOpen(true)}>
             <Plus className="mr-2 h-4 w-4" /> Crear Producto
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => {
            const hasImage = product.images && (product.images as string[]).length > 0;
            const imageUrl = hasImage ? (product.images as string[])[0] : null;

            return (
              <Card key={product.id} className="overflow-hidden hover:shadow-md transition-all duration-350 group flex flex-col justify-between">
                <div>
                  <div className="h-32 bg-muted relative overflow-hidden flex items-center justify-center border-b">
                    {imageUrl ? (
                      <img 
                        src={imageUrl} 
                        alt={product.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                    ) : (
                      <div className="p-3 rounded-full bg-background/60 shadow-sm">
                        <Package className="h-6 w-6 text-muted-foreground/45 group-hover:scale-110 transition-transform duration-500" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex gap-1">
                      {product.isActive ? (
                        <Badge className="text-[9px] h-5 bg-green-500/10 text-green-700 hover:bg-green-500/20 border-green-500/20 font-bold">
                          Activo
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[9px] h-5 text-muted-foreground bg-background font-bold">Inactivo</Badge>
                      )}
                    </div>
                  </div>

                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 p-4">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base font-bold truncate" title={product.name}>
                        {product.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {product.pricing && (
                          <span className="text-xs font-semibold text-blue-600">
                            {product.pricing.basePrice} {product.pricing.currency} {product.pricing.period && product.pricing.period !== 'one-time' ? `/ ${product.pricing.period}` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => {
                          setEditingProduct(product);
                          setIsDialogOpen(true);
                        }}>
                          <Edit className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash className="mr-2 h-4 w-4" /> Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-xs text-muted-foreground line-clamp-3 min-h-[50px] leading-relaxed">
                      {product.shortDesc || product.description}
                    </p>
                  </CardContent>
                </div>
                <CardFooter className="p-4 pt-0 flex items-center justify-between border-t border-muted/10 mt-2 bg-muted/5">
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground/90 font-medium">
                    <div className="flex items-center gap-1" title="Características">
                      <Check className="h-3.5 w-3.5 text-blue-600" />
                      {product.features.length} Features
                    </div>
                    <div className="flex items-center gap-1" title="Beneficios">
                      <Check className="h-3.5 w-3.5 text-blue-600" />
                      {product.benefits.length} Beneficios
                    </div>
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) setEditingProduct(null);
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
            <DialogDescription>
              Configura los detalles del producto para la generación de contenido.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
             <ProductForm 
                businessId={businessId}
                defaultValues={editingProduct ? mapProductToForm(editingProduct) : undefined} 
                onSuccess={() => setIsDialogOpen(false)} 
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
