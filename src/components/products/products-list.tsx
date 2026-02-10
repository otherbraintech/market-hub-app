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
      keywords: product.keywords ? product.keywords.join(", ") : "",
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
          {products.map((product) => (
            <Card key={product.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Package className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold line-clamp-1" title={product.name}>
                        {product.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                        {product.isActive ? (
                             <Badge variant="secondary" className="text-[10px] h-5 px-1 bg-green-500/10 text-green-700 hover:bg-green-500/20">
                                Activo
                             </Badge>
                        ) : (
                             <Badge variant="outline" className="text-[10px] h-5 px-1 text-muted-foreground">Inactivo</Badge>
                        )}
                        {product.pricing && (
                            <span className="text-xs font-medium text-muted-foreground">
                                {product.pricing.basePrice} {product.pricing.currency}
                            </span>
                        )}
                    </div>
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
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3 min-h-[60px]">
                  {product.shortDesc || product.description}
                </p>
                <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1" title="Características">
                        <Check className="h-3 w-3" />
                        {product.features.length} Features
                    </div>
                     <div className="flex items-center gap-1" title="Beneficios">
                        <Check className="h-3 w-3" />
                         {product.benefits.length} Beneficios
                    </div>
                </div>
              </CardContent>
            </Card>
          ))}
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
