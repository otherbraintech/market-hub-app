import { prisma } from "@/lib/prisma";
import { Package } from "lucide-react";
import { getSelectedBusinessId } from "@/actions/business";
import { ProductsList } from "@/components/products/products-list";

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

  const business = await prisma.business.findUnique({
    where: { id: selectedBusinessId },
    select: { name: true }
  });

  const businessName = business?.name || "";

  const products = await prisma.product.findMany({
    where: { businessId: selectedBusinessId },
    include: {
      business: { select: { name: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-end border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Catálogo de Productos: {businessName}</h1>
          <p className="text-muted-foreground text-sm">Gestiona e ilustra el inventario de {businessName} para la asistencia inteligente.</p>
        </div>
      </div>

      <div className="space-y-6">
        <ProductsList 
          businessId={selectedBusinessId} 
          products={products as any} 
        />
      </div>
    </div>
  );
}
