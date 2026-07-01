import { prisma } from "@/lib/prisma";
import { Lightbulb } from "lucide-react";
import { getSelectedBusinessId } from "@/actions/business";
import { StrategiesClientPage } from "./client-page";

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

  // Normalizar para eliminar fechas complejas antes de pasar al componente cliente
  const serializedStrategies = strategies.map((s: any) => ({
    id: s.id,
    businessId: s.businessId,
    name: s.name,
    description: s.description,
    isActive: s.isActive,
    objectives: s.objectives,
    personas: s.personas,
    funnelStages: s.funnelStages,
    channels: s.channels,
    contentPillars: s.contentPillars,
    postingSchedule: s.postingSchedule,
    business: {
      name: s.business.name
    }
  }));

  return (
    <StrategiesClientPage
      initialStrategies={serializedStrategies}
      selectedBusinessId={selectedBusinessId}
      businessName={businessName}
    />
  );
}
