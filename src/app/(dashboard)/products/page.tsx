import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

import { getSelectedBusinessId } from "@/actions/business";

export default async function ProductsPage() {
  const selectedBusinessId = await getSelectedBusinessId();

  if (!selectedBusinessId) {
    return (
      <div className="p-8 h-[calc(100vh-100px)] flex flex-col items-center justify-center text-center">
        <Package className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-bold">Selecciona un negocio</h2>
        <p className="text-muted-foreground mt-2 max-w-sm">
          Por favor, selecciona un negocio en la barra lateral para ver su catálogo de productos.
        </p>
      </div>
    );
  }

  const products = await prisma.product.findMany({
    where: { businessId: selectedBusinessId },
    include: {
      business: { select: { name: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Catálogo de Productos</h1>
          <p className="text-muted-foreground">Todos los productos y servicios de tus negocios.</p>
        </div>
        <Button className="gradient-primary">
          <Plus className="mr-2 h-4 w-4" /> Nuevo Producto
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-card p-4 rounded-xl border card-shadow">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar productos..." className="pl-10 bg-muted/50 border-none" />
        </div>
        <div className="h-8 w-[1px] bg-border mx-2" />
        <div className="flex gap-2">
          <Badge variant="outline" className="px-3 py-1 cursor-pointer hover:bg-muted">Servicios</Badge>
          <Badge variant="outline" className="px-3 py-1 cursor-pointer hover:bg-muted">Físicos</Badge>
          <Badge variant="outline" className="px-3 py-1 cursor-pointer hover:bg-muted">Digitales</Badge>
        </div>
      </div>

      {products.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Package className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">No hay productos aún</h2>
          <p className="text-muted-foreground max-w-sm mt-2">
            Registra productos para que la IA sepa qué promocionar en las campañas.
          </p>
          <Button variant="outline" className="mt-6">
            Añadir producto
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden group hover:border-primary/50 transition-all duration-300">
              <div className="h-32 bg-muted relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <Package className="h-12 w-12 text-muted-foreground/20 absolute center pointer-events-none group-hover:scale-110 transition-transform duration-500" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }} />
              </div>
              <CardHeader className="p-4">
                <div className="flex justify-between items-start mb-1">
                   <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{product.business.name}</span>
                   <Badge variant={product.isActive ? "success" : "secondary"} className="h-5 text-[10px]">
                     {product.isActive ? "Activo" : "Pausado"}
                   </Badge>
                </div>
                <CardTitle className="text-lg line-clamp-1">{product.name}</CardTitle>
                <CardDescription className="line-clamp-2 text-xs">
                  {product.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex flex-wrap gap-1 mb-4">
                   {(product.keywords as string[] || []).slice(0, 3).map((kw, i) => (
                     <Badge key={i} variant="secondary" className="text-[9px] font-normal">{kw}</Badge>
                   ))}
                </div>
                <Link href={`/business/${product.businessId}`}>
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    Ver en Negocio
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
