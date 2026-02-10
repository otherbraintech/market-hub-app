import { prisma } from "@/lib/prisma";
import { BusinessList } from "@/components/business/business-list";
import { CreateBusinessDialog } from "@/components/business/create-business-dialog";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BusinessPage() {
  const businesses = await prisma.business.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Negocios</h2>
          <p className="text-muted-foreground">
            Gestiona tus marcas y perfiles de negocio aquí.
          </p>
        </div>
        <CreateBusinessDialog />
      </div>

      {businesses.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] border rounded-lg bg-muted/20 border-dashed text-center p-8">
          <div className="p-4 rounded-full bg-background mb-4 shadow-sm">
            <Plus className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">No hay negocios creados</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Empieza creando tu primer perfil de negocio para organizar tus campañas y productos.
          </p>
          <CreateBusinessDialog />
        </div>
      ) : (
        <BusinessList businesses={businesses} />
      )}
    </div>
  );
}

