import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Plus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

import { getSelectedBusinessId } from "@/actions/business";

import { Edit } from "lucide-react";

export default async function StrategiesPage() {
  const selectedBusinessId = await getSelectedBusinessId();

  if (!selectedBusinessId) {
    return (
      <div className="p-8 h-[calc(100vh-100px)] flex flex-col items-center justify-center text-center">
        <Lightbulb className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-bold">Selecciona un negocio</h2>
        <p className="text-muted-foreground mt-2 max-w-sm">
          Por favor, selecciona un negocio en la barra lateral para ver sus estrategias de marketing.
        </p>
      </div>
    );
  }

  const strategies = await prisma.marketingStrategy.findMany({
    where: { businessId: selectedBusinessId },
    include: {
      business: { select: { name: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  const business = await prisma.business.findUnique({
    where: { id: selectedBusinessId },
    select: { name: true }
  });
  const businessName = business?.name || "";

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Estrategias de Marketing: {businessName}</h1>
          <p className="text-muted-foreground">Gestiona las estrategias maestras de tus negocios.</p>
        </div>
        <Link href="/strategies/new">
          <Button className="gradient-primary">
            <Plus className="mr-2 h-4 w-4" /> Nueva Estrategia
          </Button>
        </Link>
      </div>

      {strategies.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Lightbulb className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">No hay estrategias aún</h2>
          <p className="text-muted-foreground max-w-sm mt-2">
            Crea una estrategia para un negocio para empezar a generar contenido inteligente.
          </p>
          <Link href="/strategies/new">
            <Button variant="outline" className="mt-6">
              Crea tu primera estrategia ahora
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {strategies.map((strategy) => (
            <Card key={strategy.id} className="group hover:shadow-lg transition-all duration-300 flex flex-col">
              <CardHeader className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant={strategy.isActive ? "default" : "secondary"}>
                    {strategy.isActive ? "Activa" : "Inactiva"}
                  </Badge>
                  <div className="flex gap-2">
                    <Link href={`/strategies/${strategy.id}/edit`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                  {strategy.name}
                </CardTitle>
                <CardDescription className="line-clamp-3 mt-2">
                  {strategy.description || "Sin descripción disponible."}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-xs text-muted-foreground font-medium">
                    {strategy.business.name}
                  </div>
                  <Link href={`/business/${strategy.businessId}`}>
                    <Button variant="ghost" size="sm" className="group/btn h-8 px-2 text-xs">
                      Ver Negocio <ArrowRight className="ml-1 h-3 w-3 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
